/**
 * The routing screen's claims, checked without a browser.
 *
 * Three things could quietly go wrong in there and still look convincing on
 * screen: a frame that does not survive a round trip, a table that sends a
 * packet somewhere it cannot come back from, and a comparison whose direction
 * has inverted because a cost model changed underneath it. Each is checked
 * here, over every pair of sites rather than the one the screenshot used.
 *
 * `npm run check:routing`.
 */

import {
  CIRCUITS, HOP_LIMIT, LINE_BPS, byteOpSeconds, checksum, circuitKey, deliver, explain, frame,
  race, tableFor, unframe, walk,
} from '../src/routing'
import {
  FIELDS, TEMPLATES, asWritten, maxValue, packReadings, packText, unpack,
} from '../src/telegram'
import { SETTLEMENTS } from '../src/world'

let failures = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) return
  failures += 1
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}

const ids = SETTLEMENTS.map((s) => s.id)

// --- the frame ---------------------------------------------------------------

for (const text of ['HELLO', 'A', 'send water to depok', '0123456789']) {
  for (const dest of ids) {
    const bytes = frame(dest, packText(text))
    const read = unframe(bytes)
    check('a frame survives a round trip', read.ok && unpack(read.payload).text === text, `${dest} "${text}"`)
    check('the address rides in front', read.dest === ids.indexOf(dest), dest)
  }
}

const damaged = frame('bekasi', packText('HELLO'))
damaged[5] ^= 0b0000_0100
check('a flipped bit fails the checksum', !unframe(damaged).ok)
check('the checksum is a byte', frame('bogor', packText('x'.repeat(60))).every((b) => b >= 0 && b <= 255))
check('an empty message still frames', unframe(frame('priok', packText(''))).ok)
check('checksum folds to 8 bits', checksum([200, 200]) === 144)

// --- the codebook ------------------------------------------------------------

for (const [name, template] of Object.entries(TEMPLATES)) {
  if (!template.readings.length) continue
  const read = unpack(packReadings(template.readings))
  check(`${name} survives being packed`, JSON.stringify(read.readings) === JSON.stringify(template.readings),
    JSON.stringify(read.readings))
}

// Every field, at both ends of its range and somewhere in the middle: a codec
// that only works on the values the screenshot used is not a codec.
for (const field of FIELDS) {
  const top = maxValue(field)
    const middle = Number((Math.round(top / 2 / field.step) * field.step).toFixed(2))
  for (const value of [0, field.step, top, middle]) {
    const read = unpack(packReadings([{ id: field.id, value }]))
    check('a field round-trips', read.readings[0]?.value === value, `${field.name} ${value} -> ${read.readings[0]?.value}`)
  }
  if (field.signed) {
    const read = unpack(packReadings([{ id: field.id, value: -top }]))
    check('a signed field carries negatives', read.readings[0]?.value === -top, `${field.name} ${read.readings[0]?.value}`)
  }
  // Clamped, never wrapped: a report that has quietly halved itself is worse
  // than one that is obviously at its limit.
  const over = unpack(packReadings([{ id: field.id, value: top * 4 }]))
  check('an over-range value clamps', over.readings[0]?.value === top, `${field.name} ${over.readings[0]?.value}`)
}

check('an unknown id stops the read', unpack([1, 0xfe, 9, 9]).readings.length === 0)

const stock = TEMPLATES.stock.readings
const packedStock = frame('bekasi', packReadings(stock))
const writtenStock = frame('bekasi', packText(asWritten(stock)))
check('packing beats spelling it out', packedStock.length * 2 < writtenStock.length,
  `${packedStock.length} vs ${writtenStock.length}`)
check('the words are not on the wire',
  !String.fromCharCode(...packedStock).includes('RICE'), asWritten(stock))

const roles = explain(packedStock)
check('every byte is accounted for', roles.length === packedStock.length, `${roles.length} of ${packedStock.length}`)
check('the payload is one id and two values per reading',
  roles.filter((r) => r.role === 'id').length === stock.length &&
    roles.filter((r) => r.role === 'value').length === stock.length * 2)

// --- the tables --------------------------------------------------------------

for (const from of ids) {
  const table = tableFor(from)
  check('every site is reachable from every site', table.length === ids.length - 1, `${from}: ${table.length}`)
  for (const row of table) {
    const neighbour = CIRCUITS.some((c) => circuitKey(c.a, c.b) === circuitKey(from, row.via))
    check('a table only ever points at a neighbour', neighbour, `${from} -> ${row.dest} via ${row.via}`)
  }
}

for (const from of ids) {
  for (const to of ids) {
    if (from === to) continue
    const path = walk(from, to)
    check('following the tables arrives', path?.[path.length - 1] === to, `${from} -> ${to}`)
    check('a walk does not repeat a site', new Set(path).size === path?.length, `${from} -> ${to}`)
    check('a walk stays inside the hop limit', (path?.length ?? 99) - 1 <= HOP_LIMIT, `${from} -> ${to}`)
  }
}

// A cut line is the reason the table is rebuilt rather than remembered.
const cut = new Set([circuitKey('kemayoran', 'pulogadung')])
const straight = walk('batavia', 'bekasi')!
const detour = walk('batavia', 'bekasi', cut)!
check('cutting a line changes the route', straight.join('>') !== detour.join('>'), detour.join('>'))
check('the detour still arrives', detour[detour.length - 1] === 'bekasi', detour.join('>'))
check('the detour is longer', detour.length >= straight.length, `${straight.length} -> ${detour.length}`)

// Serang hangs off Tangerang alone: cut that and nothing can reach it.
const isolate = new Set([circuitKey('tangerang', 'serang')])
check('an unreachable site has no route', walk('batavia', 'serang', isolate) === null)
check('a delivery to nowhere has no path', deliver('batavia', 'serang', 'i8051', packText('HELLO'), isolate).path === null)

// --- the costs ---------------------------------------------------------------

const ops = byteOpSeconds()
check('every machine was measured', [...ops.values()].every((seconds) => seconds > 0), [...ops.keys()].join(', '))

const stockPayload = packReadings(TEMPLATES.stock.readings)
const run = race('batavia', 'bekasi', stockPayload)
const by = new Map(run.map((one) => [one.arch.id, one]))
const fast = by.get('i8051')!
const slow = by.get('move')!

check('the line costs the same on every machine', new Set(run.map((one) => one.lineSeconds.toFixed(9))).size === 1)
check('the 8051 thinks less than the MOVE machine', fast.machineSeconds < slow.machineSeconds)
check('the 8051 delivers sooner', fast.seconds < slow.seconds)
check('every machine takes the same route', new Set(run.map((one) => one.path!.join('>'))).size === 1)

// The whole argument of the screen: with the chip in the drawer the line is
// the bottleneck; with the machine the project can build, thinking is.
check('with the 8051 the line dominates', fast.lineSeconds > fast.machineSeconds * 10)
check('with the MOVE machine thinking is comparable to talking', slow.machineSeconds > slow.lineSeconds * 0.2)

const one = deliver('batavia', 'bekasi', 'i8051', stockPayload)
const hops = one.path!.length - 1
check('one send per hop', one.steps.filter((s) => s.kind === 'send').length === hops, `${hops}`)
check('one lookup per hop', one.steps.filter((s) => s.kind === 'lookup').length === hops)
check('framed once, read once', one.steps.filter((s) => s.kind === 'encode' || s.kind === 'decode').length === 2)
check('the steps add up to the total', Math.abs(one.steps.reduce((n, s) => n + s.seconds, 0) - one.seconds) < 1e-12)
check(
  'a send costs its bits at the line rate',
  one.steps.every((s) => s.kind !== 'send' || Math.abs(s.seconds - s.bits / LINE_BPS) < 1e-12),
)

console.log(
  `batavia -> bekasi via ${one.path!.join(' > ')}, ${one.bytes.length} bytes\n` +
    run
      .map(
        (r) =>
          `  ${r.arch.id.padEnd(9)} ${r.seconds.toFixed(3)} s ` +
          `(line ${r.lineSeconds.toFixed(3)} s, machine ${r.machineSeconds.toFixed(3)} s)`,
      )
      .join('\n'),
)

if (failures) {
  console.error(`\n${failures} failed.`)
  process.exit(1)
}
console.log('\nAll good.')
