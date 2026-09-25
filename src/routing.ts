/**
 * Packet switching over the New Batavia network: tables, framing, and what the
 * thinking costs.
 *
 * By the routing era a message is no longer a person shouting a callsign at a
 * relay operator. It is bytes with a destination on the front, and every node
 * it lands at has to answer one question — *which of my lines does this go
 * out on?* — before it can pass it along. That question is answered from a
 * table, the table is built from the circuits that are actually standing, and
 * the answer costs the node real time on whatever processor it has in it.
 *
 * That last part is the point. The same delivery is modelled on every machine
 * in `machines.ts`, and the cost of a machine is not asserted here: one
 * byte-wide operation is measured by running that machine's own adder, which
 * is the same program `npm run check:onebit` proves. So the strip that says
 * the 8051 is a thousand times quicker than the machine the project can build
 * is reporting a measurement, not an opinion.
 *
 * Everything here is pure. `Routing.tsx` draws it and `npm run check:routing`
 * checks it without a browser.
 */

import { ARCHS, costs } from './machines'
import { KIND_READINGS, fieldOf, spell, unpack } from './telegram'
import { LINKS, SETTLEMENTS, distanceKm } from './world'

/** Every site, by id, since routing talks about places by name. */
export const SITE = new Map(SETTLEMENTS.map((s) => [s.id, s]))

/**
 * Circuits the project has cross-linked since Era 1.
 *
 * The Era 1 network is a tree: twelve links, thirteen sites, and exactly one
 * path between any two of them. A tree does not need a routing table — there
 * is never a choice to make. These three are what turn it into a network with
 * opinions: an eastern cross-link, a northern one, and one along the southern
 * arc. Each pairs two sites that already face each other across a few
 * kilometres of flat ground, and each gives some pair of towns a second way
 * round, which is the only reason a table earns its keep.
 */
const TRUNKS: Array<[string, string]> = [
  ['priok', 'pulogadung'],
  ['cawang', 'bekasi'],
  ['cawang', 'kebayoran'],
]

export interface Circuit {
  a: string
  b: string
  /** Straight-line distance, which is what a radio circuit actually spans. */
  km: number
}

/** One name for a circuit whichever end you name first. */
export const circuitKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export const CIRCUITS: Circuit[] = [...LINKS.map((l): [string, string] => [l.from, l.to]), ...TRUNKS].map(
  ([a, b]) => ({ a, b, km: distanceKm(SITE.get(a)!, SITE.get(b)!) }),
)

/** One row of a node's routing table: to get *there*, hand it to *this* neighbour. */
export interface Route {
  dest: string
  via: string
  hops: number
  km: number
}

/**
 * Build one node's table.
 *
 * Shortest path by kilometres, because a circuit's cost is the distance it has
 * to cross, and the row keeps the first hop rather than the whole path — which
 * is the entire idea of a routing table. A node knows one step. Nobody holds
 * the route.
 */
export function tableFor(node: string, down: ReadonlySet<string> = new Set()): Route[] {
  const km = new Map<string, number>([[node, 0]])
  const hops = new Map<string, number>([[node, 0]])
  const via = new Map<string, string>()
  const settled = new Set<string>()

  for (;;) {
    let next: string | undefined
    for (const [id, cost] of km) {
      if (settled.has(id)) continue
      if (next === undefined || cost < km.get(next)!) next = id
    }
    if (next === undefined) break
    settled.add(next)

    for (const circuit of CIRCUITS) {
      if (down.has(circuitKey(circuit.a, circuit.b))) continue
      const other = circuit.a === next ? circuit.b : circuit.b === next ? circuit.a : undefined
      if (other === undefined || settled.has(other)) continue
      const cost = km.get(next)! + circuit.km
      if (km.has(other) && km.get(other)! <= cost) continue
      km.set(other, cost)
      hops.set(other, hops.get(next)! + 1)
      // The first hop of a path through a neighbour is that neighbour.
      via.set(other, next === node ? other : via.get(next)!)
    }
  }

  return [...via.keys()]
    .map((dest) => ({ dest, via: via.get(dest)!, hops: hops.get(dest)!, km: km.get(dest)! }))
    .sort((x, y) => x.km - y.km)
}

/**
 * The path a packet actually takes, walked one table at a time.
 *
 * Deliberately not a shortest-path search: the packet is handed on by whoever
 * is holding it, so this asks each node in turn where it would send the thing
 * and follows that answer. If the tables ever disagree with each other the
 * walk is what shows it, and the hop limit is what stops two nodes pointing at
 * one another forever — which is a real failure of real routing tables.
 */
export function walk(from: string, to: string, down: ReadonlySet<string> = new Set()): string[] | null {
  if (from === to) return [from]
  const path = [from]
  let here = from
  for (let hop = 0; hop < HOP_LIMIT; hop++) {
    const row = tableFor(here, down).find((r) => r.dest === to)
    if (!row) return null
    path.push(row.via)
    if (row.via === to) return path
    here = row.via
  }
  return null
}

// --- the frame ---------------------------------------------------------------

/** Address, hop limit, length. Three bytes in front of every message. */
export const HEADER_BYTES = 3
/** A packet nobody can deliver in this many hops is dropped rather than circulated. */
export const HOP_LIMIT = 8

/** Where a site sits in the address space: its index, and nothing cleverer. */
export const addressOf = (id: string) => SETTLEMENTS.findIndex((s) => s.id === id)

/**
 * Wrap a payload for the wire: `[dest, hops left, length, ...payload, checksum]`.
 *
 * Small enough to work out on paper, which is the test every format in this
 * project has to pass — somebody in Era 6 is going to have to debug it with a
 * pencil and a lamp. What the payload *means* is not the envelope's business:
 * that is `telegram.ts`, and only the two ends open it.
 */
export function frame(dest: string, payload: number[]): number[] {
  const body = [addressOf(dest), HOP_LIMIT, payload.length, ...payload]
  return [...body, checksum(body)]
}

/** Sum of every byte, low 8 bits. The cheapest check that catches a dropped bit. */
export const checksum = (bytes: number[]) => bytes.reduce((n, byte) => (n + byte) & 0xff, 0)

/** Read a frame back. `ok` is false when the checksum or the length disagrees. */
export function unframe(bytes: number[]): { dest: number; payload: number[]; ok: boolean } {
  const body = bytes.slice(0, -1)
  const length = body[2] ?? 0
  const payload = body.slice(HEADER_BYTES)
  return {
    dest: body[0] ?? -1,
    payload,
    ok: bytes.length > HEADER_BYTES && payload.length === length && checksum(body) === bytes[bytes.length - 1],
  }
}

/** What each byte on the wire is, for the row of them on screen. */
export type ByteRole = 'head' | 'kind' | 'id' | 'value' | 'text' | 'sum'

/**
 * Name every byte of a frame.
 *
 * Worth doing because the packing is only convincing if it can be pointed at:
 * *that* byte is rice, *those two* are fourteen thousand, and the word "rice"
 * is nowhere on the wire.
 */
export function explain(bytes: number[]): { role: ByteRole; what: string }[] {
  const out: { role: ByteRole; what: string }[] = [
    { role: 'head', what: `to ${SETTLEMENTS[bytes[0]]?.name ?? '?'}` },
    { role: 'head', what: `${bytes[1]} hops left` },
    { role: 'head', what: `${bytes[2]} bytes of payload` },
  ]
  const payload = bytes.slice(HEADER_BYTES, -1)
  const readings = payload[0] === KIND_READINGS
  out.push({ role: 'kind', what: readings ? 'readings follow' : 'text follows' })

  for (let i = 1; i < payload.length; ) {
    if (!readings) {
      out.push({ role: 'text', what: `“${String.fromCharCode(payload[i])}”` })
      i += 1
      continue
    }
    const field = fieldOf(payload[i])
    if (!field) break
    out.push({ role: 'id', what: field.name })
    const value = unpackOne(payload.slice(i, i + 1 + field.width))
    for (let k = 0; k < field.width; k++) out.push({ role: 'value', what: value })
    i += 1 + field.width
  }
  out.push({ role: 'sum', what: 'checksum' })
  return out
}

/** One reading, spelled out, for the tooltip on its bytes. */
function unpackOne(bytes: number[]): string {
  const { readings } = unpack([KIND_READINGS, ...bytes])
  return readings[0] ? spell(readings[0]) : '?'
}

// --- what it costs -----------------------------------------------------------

/**
 * Bits per second a circuit carries.
 *
 * The same for every machine, on purpose: the line does not care what is
 * bolted to either end of it, so it is the fixed part of the comparison and
 * every difference on the strip is the processor's doing. 300 bit/s is a
 * teleprinter rate, which is what these circuits are being run at.
 */
export const LINE_BPS = 300

/**
 * Seconds for one byte-wide operation, per machine, measured rather than
 * guessed.
 *
 * The measurement is each machine's own adder: add two numbers, from load to
 * halt, in the cycles that machine really takes. That is the unit every cost
 * below is counted in, so "the 8051 is quicker" means "its adder ran in fewer
 * cycles", which is a thing the workbench shows on screen and
 * `npm run check:onebit` proves over all 256 input pairs.
 */
let measured: Map<string, number> | undefined
export function byteOpSeconds(): Map<string, number> {
  if (!measured) measured = new Map(costs('adder', 0b1011, 0b0110).map((cost) => [cost.arch.id, cost.seconds]))
  return measured
}

/** Byte-wide operations per byte of frame: build the byte, fold it into the checksum. */
const OPS_PER_BYTE = 2

export type StepKind = 'encode' | 'lookup' | 'send' | 'decode'

/** One thing that happens on the way, with what it cost. */
export interface Step {
  kind: StepKind
  /** Where it happens. For a send, the end it leaves from. */
  at: string
  /** The far end of the circuit, for a send. */
  to?: string
  /** For a lookup: the row that matched. */
  row?: Route
  /** Byte-wide operations this step spent. 0 for a send: the line is doing the work. */
  ops: number
  /** Bits pushed down the line. 0 for anything that is not a send. */
  bits: number
  seconds: number
}

export interface Delivery {
  from: string
  to: string
  bytes: number[]
  /** Null when no table can get it there — a cut network, or too many hops. */
  path: string[] | null
  steps: Step[]
  /** Time on the wire. The same on every machine. */
  lineSeconds: number
  /** Time spent thinking. This is the whole of the difference between machines. */
  machineSeconds: number
  seconds: number
}

/**
 * Run one message across the network on one machine.
 *
 * The shape is the same at every node and that is the lesson: receive, check
 * the frame, look the destination up, hand it to a neighbour. Only the ends
 * differ — the sender frames the message first, and the receiver reads it back
 * out. Nothing in the middle ever knows what the message says.
 */
export function deliver(
  from: string,
  to: string,
  archId: string,
  payload: number[],
  down: ReadonlySet<string> = new Set(),
): Delivery {
  const op = byteOpSeconds().get(archId) ?? 0
  const bytes = frame(to, payload)
  const path = walk(from, to, down)
  const steps: Step[] = []

  const spend = (kind: StepKind, at: string, ops: number, extra: Partial<Step> = {}) =>
    steps.push({ kind, at, ops, bits: 0, seconds: ops * op, ...extra })

  // Framing the message: every byte is built and folded into the checksum.
  spend('encode', from, bytes.length * OPS_PER_BYTE)

  if (path) {
    for (let i = 0; i < path.length - 1; i++) {
      const here = path[i]
      const table = tableFor(here, down)
      const row = table.find((r) => r.dest === to)!
      // A node compares the destination against its rows until one matches,
      // and re-checks the frame it was handed. Both are byte compares.
      const rows = table.findIndex((r) => r.dest === to) + 1
      spend('lookup', here, rows + (i === 0 ? 0 : bytes.length), { row })
      const bits = bytes.length * 8
      steps.push({ kind: 'send', at: here, to: row.via, ops: 0, bits, seconds: bits / LINE_BPS })
    }
    // Reading it back out: check the checksum, then turn bytes into letters.
    spend('decode', to, bytes.length * OPS_PER_BYTE)
  }

  const lineSeconds = steps.reduce((n, step) => n + (step.kind === 'send' ? step.seconds : 0), 0)
  const machineSeconds = steps.reduce((n, step) => n + (step.kind === 'send' ? 0 : step.seconds), 0)
  return { from, to, bytes, path, steps, lineSeconds, machineSeconds, seconds: lineSeconds + machineSeconds }
}

/** The same delivery on every machine, for the strip that compares them. */
export function race(from: string, to: string, payload: number[], down: ReadonlySet<string> = new Set()) {
  return ARCHS.map((arch) => ({ arch, ...deliver(from, to, arch.id, payload, down) }))
}
