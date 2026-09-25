/**
 * The chapter-opening errand, checked without a browser.
 *
 * The card makes one claim — this era is quicker than the last — and it makes
 * it nine times. That claim is arithmetic on numbers sitting in a table, so
 * it can rot without anybody noticing, which is exactly what this stops.
 *
 * `npm run check:relay`.
 */

import { FROM, RELAYS, TO, chain, errandFor, span } from '../src/relay'
import { ROADS, SETTLEMENTS } from '../src/world'

let failures = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) return
  failures += 1
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}

const path = chain()
const name = (id: string) => SETTLEMENTS.find((s) => s.id === id)!.name

check('the errand runs the width of the region', path[0] === FROM && path[path.length - 1] === TO, path.join('>'))
check('the chain does not double back', new Set(path).size === path.length, path.join('>'))
for (let i = 0; i < path.length - 1; i++) {
  const real = ROADS.some(([a, b]) => (a === path[i] && b === path[i + 1]) || (b === path[i] && a === path[i + 1]))
  check('every leg is a road people walk', real, `${path[i]} -> ${path[i + 1]}`)
}

check('every era has an errand', RELAYS.length === 9 && RELAYS.every((r, i) => r.era === i))

let last = Infinity
const rows: string[] = []
for (const model of RELAYS) {
  for (const lang of ['en', 'id'] as const) {
    const errand = errandFor(model.era, lang)!
    check('the errand is translated', Boolean(errand.carrier && errand.upshot), `era ${model.era} ${lang}`)
    check('every stop is named', errand.legs.every((_, i) => errand.handoffAt(i).length > 0), `era ${model.era} ${lang}`)
    check('the place name is substituted', !errand.handoffAt(0).includes('%s'), `era ${model.era} ${lang}`)
  }
  const errand = errandFor(model.era)!
  check('a leg per road', errand.legs.length === path.length - 1, `era ${model.era}`)
  check('the last stop is not handed on', errand.legs[errand.legs.length - 1].handoff === 0, `era ${model.era}`)
  check(
    'the total is the legs added up',
    Math.abs(errand.seconds - errand.legs.reduce((n, l) => n + l.travel + l.handoff, 0)) < 1e-9,
  )
  // The whole point of the card, nine times over.
  check('every era beats the one before it', errand.seconds < last, `era ${model.era}: ${errand.seconds}s vs ${last}s`)
  last = errand.seconds

  const said = span(errand.seconds)
  check('the number reads as a number', /^[\d.]+$/.test(said.value), `era ${model.era}: ${said.value}`)
  rows.push(`  era ${model.era}  ${said.value.padStart(6)} ${said.unit.padEnd(4)}  ${errand.carrier}`)
}

check('nine days at the start', span(errandFor(0)!.seconds).unit === 'day')
check('milliseconds at the end', span(errandFor(8)!.seconds).unit === 'ms')
// A single day reads as 24 hours: "1 day" throws away the only digit it had.
check('one day reads as hours', span(86_400).unit === 'hour' && span(86_400).value === '24')
check('ninety seconds reads as minutes', span(90).unit === 'min')
check('half a second reads as milliseconds', span(0.5).value === '500')

console.log(`${name(FROM)} to ${name(TO)}, ${path.length - 1} legs: ${path.map(name).join(' > ')}\n`)
console.log(rows.join('\n'))

if (failures) {
  console.error(`\n${failures} failed.`)
  process.exit(1)
}
console.log('\nAll good.')
