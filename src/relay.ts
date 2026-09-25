/**
 * The same message, sent across the same region, once per era.
 *
 * Every chapter opens with it: Serang wants to tell Bogor something, and the
 * message is carried the whole way in whatever the era can actually manage.
 * Nine places, eight legs, one number at the end. In 2030 that number is nine
 * days. By the last era it is milliseconds, and nothing about the geography
 * changed — only what is standing on it.
 *
 * This is the only place in the game where the eras are lined up against each
 * other, and it is deliberately the *same* errand each time, because a
 * comparison where the task also changes proves nothing.
 *
 * **How the times are worked out.** Two numbers per era: how long a leg takes,
 * and how long the message sits at each place it is handed on. Almost every
 * era is dominated by the second one — the runner waiting for someone going
 * the right way, the operator who has to be raised before anything can be read
 * to them — which is the actual history of telecommunications and not a
 * flourish. Only Era 0 cares how far a leg is; radio does not slow down over
 * 20 km. Eras 7 and 8 take their leg time from the packet the routing screen
 * sends, at the line rate that screen states, so the two agree.
 *
 * Structure lives here and a translation supplies only text, the same rule
 * `story.ts` and `briefings.ts` follow. `npm run check:relay` proves every era
 * is quicker than the one before it.
 */

import type { Lang } from './lang'
import { ID_RELAYS } from './relay.id'
import { ROADS, SETTLEMENTS, distanceKm } from './world'

/** The errand. West edge of the map to the highland in the south. */
export const FROM = 'serang'
export const TO = 'bogor'

const SITE = new Map(SETTLEMENTS.map((s) => [s.id, s]))

/**
 * The chain the message follows, out of the courier roads.
 *
 * Not authored: these are the routes people already walk, and every later era
 * put its poles and its masts along them, so the chain is the same in 2030 and
 * in 2071. Breadth-first, because on this graph the fewest stops is also the
 * fewest hand-offs, which is what every era is actually paying for.
 */
export function chain(from = FROM, to = TO): string[] {
  const back = new Map<string, string>([[from, from]])
  const queue = [from]
  for (let head = 0; head < queue.length; head++) {
    const here = queue[head]
    if (here === to) break
    for (const [a, b] of ROADS) {
      const other = a === here ? b : b === here ? a : undefined
      if (other === undefined || back.has(other)) continue
      back.set(other, here)
      queue.push(other)
    }
  }
  if (!back.has(to)) return []
  const path = [to]
  while (path[0] !== from) path.unshift(back.get(path[0])!)
  return path
}

/** One leg of the errand, and what it cost. */
export interface Leg {
  from: string
  to: string
  km: number
  /** Seconds crossing the ground. */
  travel: number
  /** Seconds lost at the far end, being handed on. Zero at the last stop: it has arrived. */
  handoff: number
}

export interface EraRelay {
  era: number
  /** What carries it between two places. */
  carrier: string
  /** What is said or done at a stop before it goes on. `%s` is the next place. */
  handoff: string
  /** What the number at the end means, in one line. */
  upshot: string
  /** Seconds to cross one leg. Only Era 0 uses the distance. */
  travel(km: number): number
  /** Seconds lost at each place the message is handed on. */
  wait: number
}

/**
 * A runner covers about 25 km of this a day: no bridges, no cleared roads, and
 * a river to talk somebody into ferrying you across. Half a day goes at each
 * village waiting for somebody who is heading the right way.
 */
const DAY = 86_400

/**
 * A packet at the routing screen's own numbers: an 11-byte frame at 300 bit/s
 * is 293 ms on the wire, and the table lookup that follows it is microseconds.
 * Era 7's circuits are the ones the last chapter is about — 9600 bit/s, which
 * is a modem and not a miracle.
 */
const FRAME_BITS = 11 * 8

export const RELAYS: EraRelay[] = [
  {
    era: 0,
    carrier: 'On foot',
    handoff: 'Wait at the gate for somebody walking to %s',
    upshot: 'Ask Bogor a question today and the answer comes back inside the month.',
    travel: (km) => (km / 25) * DAY,
    wait: DAY / 2,
  },
  {
    era: 1,
    carrier: 'Spoken over AM radio',
    handoff: '“Please relay to %s.”',
    upshot: 'Nine days became six minutes, and every one of those minutes is a person talking.',
    travel: () => 15,
    wait: 30,
  },
  {
    era: 2,
    carrier: 'Keyed in Morse down a wire',
    handoff: 'Re-keyed by hand for %s',
    upshot: 'Slower per word than a voice, and it works in weather that no voice gets through.',
    travel: () => 25,
    wait: 10,
  },
  {
    era: 3,
    carrier: 'Patched through by switchboard',
    handoff: 'The operator at %s is plugged in',
    upshot: 'Nobody re-reads it any more. The line is joined end to end and Serang talks to Bogor.',
    travel: () => 2,
    wait: 5,
  },
  {
    era: 4,
    carrier: 'Carried on a valve repeater',
    handoff: 'Amplified and passed on to %s',
    upshot: 'The first era where the message crosses a place without anybody there noticing.',
    travel: () => 0.5,
    wait: 0.7,
  },
  {
    era: 5,
    carrier: 'Handed on by a timetable a machine wrote',
    handoff: 'The hour on the line to %s was booked overnight',
    upshot: 'The line is no quicker. The waiting is, because nobody has to work out whose turn it is.',
    travel: () => 0.5,
    wait: 0.35,
  },
  {
    era: 6,
    carrier: 'Stored and forwarded by machine',
    handoff: 'Held on a drum until the line to %s is free',
    upshot: 'A machine now waits instead of a person, and it never goes home at dusk.',
    travel: () => 0.4,
    wait: 0.15,
  },
  {
    era: 7,
    carrier: 'A packet, addressed and switched',
    handoff: 'Looked up in the table: out on the line to %s',
    upshot: 'Nobody along the way knows what it says, and nobody had to be asked.',
    travel: () => FRAME_BITS / 300,
    wait: 0.0002,
  },
  {
    era: 8,
    carrier: 'A packet across joined networks',
    handoff: 'Handed to the next network at %s',
    upshot: 'The same errand as 2030, and the region is now smaller than a heartbeat.',
    travel: () => FRAME_BITS / 9600,
    wait: 0.00005,
  },
]

/** One era's errand, translated, with every leg costed. */
export interface Errand {
  era: number
  carrier: string
  upshot: string
  path: string[]
  legs: Leg[]
  /** Seconds, start to finish. The number the chapter opens on. */
  seconds: number
  /** What is said at each stop, already naming the place it goes to next. */
  handoffAt(index: number): string
}

export function errandFor(era: number, lang: Lang = 'en'): Errand | undefined {
  const model = RELAYS.find((one) => one.era === era)
  if (!model) return undefined
  const said = lang === 'id' ? (ID_RELAYS[era] ?? model) : model
  const path = chain()
  const legs: Leg[] = path.slice(0, -1).map((from, i) => {
    const to = path[i + 1]
    const km = distanceKm(SITE.get(from)!, SITE.get(to)!)
    return {
      from,
      to,
      km,
      travel: model.travel(km),
      // The last stop is the destination: it is read, not handed on.
      handoff: i === path.length - 2 ? 0 : model.wait,
    }
  })
  return {
    era,
    carrier: said.carrier,
    upshot: said.upshot,
    path,
    legs,
    seconds: legs.reduce((n, leg) => n + leg.travel + leg.handoff, 0),
    handoffAt: (index) => said.handoff.replace('%s', SITE.get(path[index + 1])?.name ?? ''),
  }
}

/** The units a span gets read out in, largest that leaves a number worth saying. */
export type Unit = 'ms' | 'sec' | 'min' | 'hour' | 'day'

/**
 * How long that was, as a number and a unit kept apart.
 *
 * Apart because the chapter card sets them in different sizes, and because the
 * unit is a word that has to be translated while the number is not.
 */
export function span(seconds: number): { value: string; unit: Unit } {
  if (seconds < 1) return { value: String(Math.round(seconds * 1000)), unit: 'ms' }
  if (seconds < 90) return { value: seconds.toFixed(seconds < 10 ? 1 : 0), unit: 'sec' }
  if (seconds < 5400) return { value: String(Math.round(seconds / 60)), unit: 'min' }
  if (seconds < 2 * DAY) return { value: String(Math.round(seconds / 3600)), unit: 'hour' }
  return { value: (seconds / DAY).toFixed(1).replace(/\.0$/, ''), unit: 'day' }
}
