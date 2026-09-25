/**
 * Era 0 — the survey. The day loop before there is anything to switch on.
 *
 * Same four phases as Era 1 and the same deterministic seeding, and nothing
 * else in common: there is no hardware, no power, no circuits and no dusk
 * window. The scarce thing is not copper, it is *legs*. A message moves only
 * while somebody is carrying it, so distance is the whole cost model, and the
 * only thing the crew can spend is days.
 *
 * The one resource is rations, and the loop that closes is the same shape the
 * later eras use: a settlement that will talk to you shares food, so contact
 * pays for the walking that wins more contact. A region that stays strangers
 * starves the project slowly.
 *
 * Nothing here touches React or Pixi. `resolveSurveyDay` is a pure function
 * from (world, survey) to a new (world, survey), seeded by day number.
 */

import {
  KM_PER_TILE,
  ROADS,
  buildWorld,
  distanceKm,
  groundMetres,
  type Settlement,
  type Terrain,
  type World,
} from './world'
import { PARTY, type PartyMember } from './party'
import { newSim, refreshLinks, RATION_CAP as ERA1_RATION_CAP, type LogEntry, type Move, type Sim } from './sim'
import { autoParley, dealWants, type ParleyResult, type ParleySeat } from './parley'

const HQ = 'batavia'

/**
 * The circuit Era 1 opens with, and the one this era exists to reach.
 *
 * Tangerang is the first place Mel knows somebody in. A letter that gets there
 * and comes back is the proof the region can carry a message at all, which is
 * the only thing anybody will build a transmitter on the strength of.
 */
export const GOAL = 'tangerang'

/** The founders, before the wireman. Pak Min is the prize for finishing. */
export const SURVEY_CREW: PartyMember[] = PARTY.filter((m) => m.id !== 'pakmin')

// --- balance -----------------------------------------------------------------

/**
 * Kilometres of 2030 road a person covers in a day, carrying their own food.
 *
 * Fixed by the script rather than guessed: Bogor is "two days of walking" and
 * Bogor is fifty-one kilometres away. That puts the whole metro inside a day
 * and Serang three days out, which is the right shape — the cost of this era
 * is not the distance, it is how many times you have to go back.
 */
const KM_PER_WALK_DAY = 26

/**
 * Days it takes to be listened to.
 *
 * This, not the walking, is what the era is made of. A settlement is a couple
 * of days of sitting with people who have no reason to believe you, and one
 * that has already asked what it would cost takes longer, because the second
 * conversation is the one where you have to be specific.
 */
const PARLEY_DAYS = 2
const PARLEY_DAYS_WARY = 3

/** Rations New Batavia's own gardens bring in, contact or no contact. */
const HOME_RATIONS = 3

/** Eaten per person per day, at home and on the road. Travelling costs more. */
const UPKEEP_HOME = 1
const UPKEEP_ROAD = 1.5

/** What a settlement that trusts you sends back, per day, once it is talking. */
const SHARED_RATIONS = 0.5

/** A day spent looking for food instead of people. */
const FORAGE_RATIONS = 4

/**
 * Anything past this spoils before it can be carried anywhere.
 *
 * It used to be tied to how good an offer the crew could make, which had that
 * curve backwards: the larder is near-empty during the first parleys and full
 * by the time there is nothing left to win. What can be offered is now a card
 * with a flat price, in `parley.ts`, and this is a shelf life again.
 */
const RATION_CAP = 40

/**
 * Days a message sits at a settlement waiting for somebody heading the right
 * way, when there is nowhere to leave it.
 *
 * This is the whole argument for a notice board. Without one a message needs a
 * hand-to-hand meeting at every stop, and the meeting — not the walking — is
 * what makes the region feel a month wide.
 */
export const RELAY_WAIT = 2

/**
 * What finishing looks like: a letter out to Tangerang and an answer back,
 * over a region that has stayed in contact while it travelled.
 *
 * Both halves are needed and they pull against each other. The letter rewards
 * a narrow, well-boarded road west; the hold rewards walking everywhere. A
 * crew that only does one of them has proved the wrong thing.
 */
export const HOLD_TALKING = 8
export const HOLD_DAYS = 7

/** Days and rations a notice board and a signal fire cost to put up. */
const BOARD_DAYS = 2
const BOARD_RATIONS = 4
const FIRE_DAYS = 3
const FIRE_RATIONS = 6

/** How far from a settlement its people will carry firewood, in kilometres. */
const FIRE_SEARCH_KM = 5

/** Height of the platform the fire is laid on, above the ground it stands on. */
const FIRE_METRES = 8

/** Past this a fire is a smudge nobody would bet a harvest on. */
const FIRE_RANGE_KM = 40

/**
 * What stands on the ground between two fires, in metres, by what the ground
 * is. The heightmap is bare earth — it does not know about the twenty-storey
 * blocks still standing across the whole northern plain, and those are exactly
 * what a fire has to be seen over.
 *
 * This is why the flat city cannot signal to itself and the southern highland
 * can: it is not the distance, it is what is in the way.
 */
const CLUTTER: Record<Terrain, number> = {
  sea: 0, shallow: 0, river: 0,
  sand: 2, marsh: 3, grass: 3, road: 3,
  scrub: 9,
  hill: 15,
  rubble: 26,
}

/**
 * Earth radius in metres, inflated by the usual four thirds for atmospheric
 * refraction. Over thirty kilometres the ground itself bulges some fifty
 * metres above the straight line between two fires, which is why flat pairs
 * fail and why Bogor, six hundred metres up, sees half the region.
 */
const EARTH_METRES = 8.5e6

/** Days of walking are shorter for whoever knows which bridge is still up. */
const ROLE_PACE: Record<string, number> = {
  Quartermaster: 0.75,
}

// --- contact -----------------------------------------------------------------

/**
 * How far a settlement has got with the project.
 *
 * The shape is fixed by what the crew found: nineteen would talk, six told
 * them to go away, and thirteen asked what it would cost. `wary` is that third
 * group — the ones who want a price, who are told the price is nothing, and
 * who trust it less for that.
 */
export type Contact = 'unknown' | 'found' | 'wary' | 'talking'

export const CONTACT_LABEL: Record<Contact, string> = {
  unknown: 'not reached',
  found: 'found',
  wary: 'wants a price',
  talking: 'talking',
}

export const CONTACT_NOTE: Record<Contact, string> = {
  unknown: 'Nobody has been. What New Batavia believes about this place is hearsay.',
  found: 'Walked into, and still standing. They have not agreed to anything.',
  wary: 'They asked what it would cost. They were told nothing, and liked that less.',
  talking: 'Talking, and sending food back with the couriers.',
}

// --- tasks -------------------------------------------------------------------

export type SurveyTask =
  | { kind: 'idle' }
  | { kind: 'walk'; target: string }
  | { kind: 'parley'; target: string }
  | { kind: 'board'; target: string }
  | { kind: 'fire'; target: string }
  | { kind: 'forage' }

export type SurveyTaskKind = SurveyTask['kind']

export interface Walker {
  /** Settlement they are standing in, or the one they are walking to. */
  at: string
  task: SurveyTask
  daysLeft: number
  hurtDays: number
}

export interface TaskChoice {
  task: SurveyTask
  label: string
  group: string
  days: number
  /** Why it cannot be ordered, when it cannot. */
  blocked?: string
}

// --- state -------------------------------------------------------------------

/**
 * Where the letter to Tangerang has got to.
 *
 * It is not a crew member — a village runner carries it — so it moves on the
 * network the crew has built rather than on anybody's legs, and how long it
 * takes is the score for everything they have done so far.
 */
export type Letter =
  | { state: 'unsent' }
  | { state: 'out'; sentOn: number; due: number }
  | { state: 'back'; leftOn: number; due: number }
  | { state: 'home'; on: number }

export interface Survey {
  day: number
  rations: number
  contact: Record<string, Contact>
  /** Times the crew has made its case at each settlement. */
  attempts: Record<string, number>
  /** Settlements with a notice board on the gate. */
  boards: string[]
  /** Settlements with a signal fire laid on the high ground above them. */
  fires: string[]
  crew: Record<string, Walker>
  letter: Letter
  /** Consecutive days with `HOLD_TALKING` settlements in contact. */
  hold: number
  /** Day the era was won, or null while it is still being played. */
  wonOn: number | null
  /** Skits the crew has already had. See `era0-skits.ts`. */
  seenSkits: string[]
  log: LogEntry[]
}

export function newSurvey(): Survey {
  return {
    day: 1,
    rations: 20,
    contact: { [HQ]: 'talking' },
    attempts: {},
    // New Batavia has had a board on its own gate since the first week. It is
    // everywhere else that has nowhere to leave a piece of paper.
    boards: [HQ],
    fires: [],
    letter: { state: 'unsent' },
    hold: 0,
    wonOn: null,
    seenSkits: [],
    crew: Object.fromEntries(
      SURVEY_CREW.map((m) => [m.id, { at: HQ, task: { kind: 'idle' } as SurveyTask, daysLeft: 0, hurtDays: 0 }]),
    ),
    log: [
      {
        day: 0,
        kind: 'info',
        text: 'Day one. Thirty-eight villages within a week of here, and New Batavia has spoken to none of them.',
      },
    ],
  }
}

export const contactOf = (survey: Survey, id: string): Contact => survey.contact[id] ?? 'unknown'

/** Places the crew has actually stood in. Everything else is hearsay. */
export function reached(survey: Survey): string[] {
  return Object.keys(survey.contact).filter((id) => contactOf(survey, id) !== 'unknown')
}

// --- distance ----------------------------------------------------------------

/** Days on foot between two settlements, never less than one. */
export function walkDays(world: World, from: string, to: string, pace = 1): number {
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  const a = byId.get(from)
  const b = byId.get(to)
  if (!a || !b || a.id === b.id) return 0
  return Math.max(1, Math.round((distanceKm(a, b) / KM_PER_WALK_DAY) * pace))
}

// --- signals -----------------------------------------------------------------

/**
 * The high ground a settlement would lay its fire on.
 *
 * The player picks a settlement, not a tile: the people who live there already
 * know which hill is worth the climb. What the terrain decides is whether that
 * hill is worth anything, and for most of the coastal plain it is not.
 *
 * Cached by settlement, because the heightmap is baked and a settlement never
 * moves, while the world object is rebuilt every day.
 */
const fireSites = new Map<string, { tx: number; ty: number; metres: number }>()

export function fireSite(world: World, s: Settlement): { tx: number; ty: number; metres: number } {
  const cached = fireSites.get(s.id)
  if (cached) return cached
  const reach = Math.round(FIRE_SEARCH_KM / KM_PER_TILE)
  // The settlement's own ground is the floor. Somewhere to put a fire always
  // exists; what the search is looking for is somewhere better.
  let best = { tx: s.tx, ty: s.ty, metres: groundMetres(s.tx, s.ty) }
  for (let ty = s.ty - reach; ty <= s.ty + reach; ty++) {
    for (let tx = s.tx - reach; tx <= s.tx + reach; tx++) {
      if (Math.hypot(tx - s.tx, ty - s.ty) > reach) continue
      const terrain = world.at(tx, ty)?.terrain
      // Nothing off the edge of the map, and nothing in the water. Both would
      // otherwise be picked: `groundMetres` reads a neighbouring row for a
      // tile that is off the grid, and a river bank on the way up to Bogor is
      // higher than the village below it while being no place for a fire.
      if (!terrain || terrain === 'sea' || terrain === 'shallow' || terrain === 'river') continue
      const metres = groundMetres(tx, ty)
      if (metres > best.metres) best = { tx, ty, metres }
    }
  }
  fireSites.set(s.id, best)
  return best
}

/** Kilometres between two grid tiles. Tiles are square to within a percent. */
const tileKm = (a: { tx: number; ty: number }, b: { tx: number; ty: number }) =>
  Math.hypot(a.tx - b.tx, a.ty - b.ty) * KM_PER_TILE

/**
 * Whether two fires can see each other, over the real baked ground.
 *
 * Both ends stand `FIRE_METRES` above their own hill. The sight line between
 * them is straight; the ground under it is not, so every tile along the way
 * has to clear both the terrain and the earth's own bulge, which over these
 * distances is the term that does the work.
 */
const seen = new Map<string, boolean>()

export function fireSees(world: World, a: Settlement, b: Settlement): boolean {
  const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`
  const cached = seen.get(key)
  if (cached !== undefined) return cached
  const answer = traceFire(world, a, b)
  seen.set(key, answer)
  return answer
}

function traceFire(world: World, a: Settlement, b: Settlement): boolean {
  const from = fireSite(world, a)
  const to = fireSite(world, b)
  const km = tileKm(from, to)
  if (km === 0 || km > FIRE_RANGE_KM) return false

  const hA = from.metres + FIRE_METRES
  const hB = to.metres + FIRE_METRES
  const steps = Math.max(2, Math.ceil(km / KM_PER_TILE))
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const tx = Math.round(from.tx + (to.tx - from.tx) * t)
    const ty = Math.round(from.ty + (to.ty - from.ty) * t)
    const sightLine = hA + (hB - hA) * t
    // How far the ground has risen away from the straight chord by here.
    const d = km * 1000 * t
    const bulge = (d * (km * 1000 - d)) / (2 * EARTH_METRES)
    const clutter = CLUTTER[world.at(tx, ty)?.terrain ?? 'grass']
    if (groundMetres(tx, ty) + clutter + bulge >= sightLine) return false
  }
  return true
}

/** Settlements whose fire this one's fire could answer, built or not. */
export function fireReach(world: World, id: string): Settlement[] {
  const here = world.settlements.find((s) => s.id === id)
  if (!here) return []
  return world.settlements.filter((s) => s.id !== id && fireSees(world, here, s))
}

export const hasBoard = (survey: Survey, id: string) => survey.boards.includes(id)
export const hasFire = (survey: Survey, id: string) => survey.fires.includes(id)

/** Fires that are lit at both ends and can see each other. */
export function fireLinks(world: World, survey: Survey): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  for (let i = 0; i < survey.fires.length; i++) {
    for (let k = i + 1; k < survey.fires.length; k++) {
      const a = byId.get(survey.fires[i])
      const b = byId.get(survey.fires[k])
      if (a && b && fireSees(world, a, b)) pairs.push([a.id, b.id])
    }
  }
  return pairs
}

// --- how long a message takes -------------------------------------------------

/**
 * Days a message takes to reach a settlement from New Batavia, by hand.
 *
 * Three things set the number, and the player can only change two of them.
 *
 * The route is the road network, not a straight line: a runner walks the road,
 * so Serang is only reachable through Tangerang, and every settlement between
 * here and there has to be talking or the message stops with them.
 *
 * At every stop the message waits `RELAY_WAIT` days for somebody heading on,
 * unless there is a **notice board** to leave it on, in which case it does not
 * wait at all. That includes the last stop: a message nobody can leave
 * anywhere is a message that needs its recipient found.
 *
 * A **signal fire** does not carry the message — it carries one bit, which is
 * enough to say *a runner is coming*. Two lit fires that can see each other
 * are a route of their own, off the road entirely: the far village walks out
 * to meet ours, so the hop costs half the walk and nobody waits at the far
 * end, because they were watching the hill.
 */
export function messageDays(world: World, survey: Survey, to: string, from = HQ): number | null {
  return search(world, survey, to, from)?.days ?? null
}

/**
 * The settlements a message actually passes through, in order, ending at `to`.
 *
 * The map draws the letter to Tangerang crossing the region, and a drawn route
 * that disagreed with the number in the panel would be worse than no route at
 * all — so both come out of the same search. See `messageRoute` callers in
 * `PixiMap.tsx`.
 */
export function messageRoute(world: World, survey: Survey, to: string, from = HQ): string[] | null {
  return search(world, survey, to, from)?.route ?? null
}

/** Cheapest way for a message to get from `from` to `to`, or nothing. */
function search(
  world: World,
  survey: Survey,
  to: string,
  from: string,
): { days: number; route: string[] } | null {
  if (to !== from && contactOf(survey, to) !== 'talking') return null
  if (contactOf(survey, from) !== 'talking') return null
  if (to === from) return { days: 0, route: [from] }

  /** Every way out of a settlement, and what taking it costs in days. */
  const routes = new Map<string, Array<{ to: string; days: number }>>()
  const add = (a: string, b: string, days: number) => {
    if (!routes.has(a)) routes.set(a, [])
    routes.get(a)!.push({ to: b, days })
  }
  for (const [a, b] of ROADS) {
    // Arriving on the road means finding somebody to hand the message to,
    // unless there is a board to leave it on.
    add(a, b, walkDays(world, a, b) + (hasBoard(survey, b) ? 0 : RELAY_WAIT))
    add(b, a, walkDays(world, b, a) + (hasBoard(survey, a) ? 0 : RELAY_WAIT))
  }
  for (const [a, b] of fireLinks(world, survey)) {
    const met = Math.max(1, Math.round(walkDays(world, a, b) / 2))
    add(a, b, met)
    add(b, a, met)
  }

  const best = new Map<string, number>([[from, 0]])
  const cameFrom = new Map<string, string>()
  const queue = [from]
  while (queue.length) {
    queue.sort((a, b) => (best.get(a) ?? 0) - (best.get(b) ?? 0))
    const here = queue.shift()!
    const cost = best.get(here)!
    for (const leg of routes.get(here) ?? []) {
      // A settlement that is not talking will not pass a message on, and it
      // will not receive one either: there is nobody there who knows us.
      if (contactOf(survey, leg.to) !== 'talking') continue
      const step = cost + leg.days
      if (step >= (best.get(leg.to) ?? Infinity)) continue
      best.set(leg.to, step)
      cameFrom.set(leg.to, here)
      queue.push(leg.to)
    }
  }

  const days = best.get(to)
  if (days === undefined) return null
  const route = [to]
  for (let at = to; at !== from; ) {
    at = cameFrom.get(at)!
    route.unshift(at)
  }
  return { days, route }
}

// --- orders ------------------------------------------------------------------

/** Everything this member could be told to do today, and what it would cost. */
export function surveyOptions(world: World, survey: Survey, memberId: string): TaskChoice[] {
  const member = SURVEY_CREW.find((m) => m.id === memberId)
  const state = survey.crew[memberId]
  if (!member || !state) return []

  const pace = ROLE_PACE[member.className] ?? 1
  const here = contactOf(survey, state.at)
  const options: TaskChoice[] = [
    { task: { kind: 'idle' }, label: 'Stand down', group: 'Rest', days: 0 },
    { task: { kind: 'forage' }, label: 'Forage', group: 'Rest', days: 1 },
  ]

  if (here === 'found' || here === 'wary') {
    options.push({
      task: { kind: 'parley', target: state.at },
      label: here === 'wary' ? 'Make the case again' : 'Talk to them',
      group: 'Here',
      days: here === 'wary' ? PARLEY_DAYS_WARY : PARLEY_DAYS,
    })
  }

  // Signals are only built where the people have already agreed to keep them
  // burning: a board on the gate of a village that told you to leave is a
  // board nobody reads.
  if (here === 'talking') {
    options.push({
      task: { kind: 'board', target: state.at },
      label: 'Put up a notice board',
      group: 'Here',
      days: BOARD_DAYS,
      blocked: hasBoard(survey, state.at)
        ? 'There is already one on the gate.'
        : survey.rations < BOARD_RATIONS
          ? `Needs ${BOARD_RATIONS} rations to feed the hands who cut the timber.`
          : undefined,
    })
    const seen = fireReach(world, state.at)
    options.push({
      task: { kind: 'fire', target: state.at },
      label: 'Lay a signal fire',
      group: 'Here',
      days: FIRE_DAYS,
      blocked: hasFire(survey, state.at)
        ? 'The wood is already stacked up there.'
        : seen.length === 0
          ? 'Nothing to see from the high ground here.'
          : survey.rations < FIRE_RATIONS
            ? `Needs ${FIRE_RATIONS} rations for the days spent hauling wood.`
            : undefined,
    })
  }

  for (const s of world.settlements) {
    if (s.id === state.at) continue
    const contact = contactOf(survey, s.id)
    options.push({
      task: { kind: 'walk', target: s.id },
      label: contact === 'unknown' ? `Walk to ${s.name}` : `Return to ${s.name}`,
      group: contact === 'unknown' ? 'Unreached' : 'Known',
      days: walkDays(world, state.at, s.id, pace),
    })
  }
  return options
}

/**
 * Days a letter would need to reach Tangerang and come back, as things stand.
 *
 * Null until there is a road of talking settlements the whole way. The return
 * leg is worked out separately because the waiting is not symmetrical: a board
 * at New Batavia helps the answer home and does nothing for the letter out.
 */
export function roundTripDays(world: World, survey: Survey): number | null {
  const out = messageDays(world, survey, GOAL)
  const back = messageDays(world, survey, HQ, GOAL)
  return out === null || back === null ? null : out + back
}

/** Hand the letter to a runner. The crew stays where it is. */
export function sendLetter(world: World, survey: Survey): Survey {
  if (survey.letter.state !== 'unsent') return survey
  const out = messageDays(world, survey, GOAL)
  if (out === null) return survey
  return {
    ...survey,
    letter: { state: 'out', sentOn: survey.day, due: survey.day + out },
    log: survey.log,
  }
}

export function order(survey: Survey, memberId: string, task: SurveyTask, days: number): Survey {
  return {
    ...survey,
    crew: { ...survey.crew, [memberId]: { ...survey.crew[memberId], task, daysLeft: days } },
  }
}

/** Days still to come after tonight, or null when there is no work. */
export function daysLeftAfterToday(survey: Survey, memberId: string): number | null {
  const state = survey.crew[memberId]
  if (!state || state.hurtDays > 0 || state.task.kind === 'idle' || state.daysLeft <= 0) return null
  return Math.max(0, state.daysLeft - 1)
}

// --- the day -----------------------------------------------------------------

export interface SurveyDay {
  survey: Survey
  moves: Move[]
}

// --- the exchange at the gate -------------------------------------------------

/**
 * Where the courier card would carry this settlement's word.
 *
 * The nearest other place that is not New Batavia: kin are in the next town,
 * not in the town the strangers came from, and offering to carry word home to
 * ourselves is not an offer. Straight-line rather than by road, because it is a
 * relationship and not a route.
 */
function kinOf(world: World, id: string): Settlement {
  const here = world.settlements.find((s) => s.id === id)!
  return world.settlements
    .filter((s) => s.id !== id && s.id !== HQ)
    .sort((a, b) => distanceKm(here, a) - distanceKm(here, b))[0]
}

/**
 * What every settlement in the region wants, dealt once and cached.
 *
 * The deal only depends on which settlements exist, and that list is baked, so
 * this is computed on the first parley of a session and never again.
 */
let wants: ReturnType<typeof dealWants> | null = null
const wantsIn = (world: World) => (wants ??= dealWants(world.settlements.map((s) => s.id)))

/** Everything `parley.ts` needs about a conversation that is about to happen. */
function parleySeat(
  world: World,
  survey: Survey,
  member: PartyMember,
  place: Settlement,
  before: 'found' | 'wary',
): ParleySeat {
  const kin = kinOf(world, place.id)
  return {
    want: wantsIn(world).get(place.id)!,
    memberId: member.id,
    memberName: member.name,
    className: member.className,
    target: place.id,
    targetName: place.name,
    before,
    attempts: survey.attempts[place.id] ?? 0,
    rations: survey.rations,
    // A fire promised to people who can see for themselves that their own ridge
    // looks at nothing is not a weak offer. It is a tell.
    blindHill: fireReach(world, place.id).length === 0,
    kinId: kin.id,
    kinName: kin.name,
  }
}

/**
 * Who sits down at a gate tonight, worked out before the day is resolved.
 *
 * The day loop is a batch — three people can finish three different parleys on
 * one click of End day — so the exchanges cannot be played from inside it. The
 * store asks this first, plays each seat in turn, and hands the outcomes back
 * to `resolveSurveyDay`.
 *
 * Deduplicated by settlement: two people arriving at the same gate on the same
 * day is a mistake the player made, and it should cost them the second pair of
 * legs rather than open the same conversation twice.
 */
export function parleySeats(world: World, survey: Survey): ParleySeat[] {
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  const seats: ParleySeat[] = []
  const taken = new Set<string>()
  // Nothing happens on a day that starts with an empty store: `resolveSurveyDay`
  // spends it foraging and never reaches the crew loop at all.
  if (survey.rations <= 0) return seats
  for (const member of SURVEY_CREW) {
    const state = survey.crew[member.id]
    if (state.hurtDays > 0 || state.task.kind !== 'parley' || state.daysLeft !== 1) continue
    const place = byId.get(state.task.target)
    const before = place ? contactOf(survey, place.id) : 'unknown'
    if (!place || taken.has(place.id)) continue
    if (before !== 'found' && before !== 'wary') continue
    taken.add(place.id)
    seats.push(parleySeat(world, survey, member, place, before))
  }
  return seats
}

/** Rations the crew will eat tonight, given where they are standing. */
export function surveyUpkeep(survey: Survey): number {
  return SURVEY_CREW.reduce((sum, m) => {
    const state = survey.crew[m.id]
    const away = state.at !== HQ || state.daysLeft > 0
    return sum + (away ? UPKEEP_ROAD : UPKEEP_HOME)
  }, 0)
}

/** What contact sends back tonight. */
export function surveyIncome(survey: Survey): number {
  const talking = Object.entries(survey.contact).filter(([id, c]) => id !== HQ && c === 'talking')
  return HOME_RATIONS + talking.length * SHARED_RATIONS
}

/**
 * One day, resolved.
 *
 * `results` carries the outcome of every exchange the player actually played,
 * keyed by the crew member who was at the table. A seat that is missing from it
 * is played blind by `autoParley` — which is what the skip button leaves behind
 * and what lets `tools/survey-balance.ts` drive forty days without a screen.
 */
export function resolveSurveyDay(
  world: World,
  prev: Survey,
  results: Record<string, ParleyResult> = {},
): SurveyDay {
  const survey: Survey = {
    ...prev,
    contact: { ...prev.contact },
    attempts: { ...prev.attempts },
    boards: [...prev.boards],
    fires: [...prev.fires],
    crew: Object.fromEntries(Object.entries(prev.crew).map(([id, c]) => [id, { ...c }])),
    log: [],
  }
  const moves: Move[] = []
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  const say = (kind: LogEntry['kind'], text: string) => survey.log.push({ day: survey.day, kind, text })

  const hungry = survey.rations <= 0

  if (hungry) {
    // A day spent foraging is a day not spent walking, but it is never a dead
    // end: the crew can always claw its way back to a working day.
    survey.rations += FORAGE_RATIONS
    say('bad', `Nothing left to carry. The day went on foraging, and brought back ${FORAGE_RATIONS}.`)
  } else {
    const anyOrders = SURVEY_CREW.some((m) => {
      const state = survey.crew[m.id]
      return state.hurtDays > 0 || (state.task.kind !== 'idle' && state.daysLeft > 0)
    })
    if (!anyOrders) say('info', 'Nobody was given anything to do. The day went past anyway.')

    for (const member of SURVEY_CREW) {
      const state = survey.crew[member.id]
      if (state.hurtDays > 0) {
        state.hurtDays -= 1
        continue
      }
      if (state.task.kind === 'idle' || state.daysLeft <= 0) continue
      state.daysLeft -= 1
      if (state.daysLeft > 0) continue

      const task = state.task
      const origin = state.at
      let landed: { to: string; note: string; tone: LogEntry['kind'] } | null = null

      switch (task.kind) {
        case 'walk': {
          const place = byId.get(task.target)!
          state.at = place.id
          const first = contactOf(survey, place.id) === 'unknown'
          if (first) survey.contact[place.id] = 'found'
          say(
            first ? 'good' : 'info',
            first
              ? `${member.name} walked into ${place.name}. ${place.population.toLocaleString('en-US')} people, and they are still there.`
              : `${member.name} is back at ${place.name}.`,
          )
          landed = { to: place.id, note: first ? 'Found them' : 'Back', tone: first ? 'good' : 'info' }
          break
        }
        case 'parley': {
          const place = byId.get(task.target)!
          landed = { to: place.id, note: '', tone: 'info' }
          const before = contactOf(survey, place.id)
          // Somebody else may have got there first while this one was walking.
          if (before === 'talking') {
            say('info', `${place.name} was already in by the time ${member.name} finished making the case.`)
            landed.note = 'Already in'
            break
          }
          // The exchange itself is `parley.ts`. What arrives here is only its
          // outcome, because the player plays it in a modal between the click
          // and the day — see `parleySeats`. A seat nobody sat down at is
          // played blind by the same rules rather than by a second formula
          // standing next to them, so the skip button and the balance tool can
          // never drift away from what the cards actually do.
          const seat = parleySeat(world, survey, member, place, before === 'wary' ? 'wary' : 'found')
          survey.attempts[place.id] = (survey.attempts[place.id] ?? 0) + 1
          const given = results[member.id]
          const result = given && given.target === place.id ? given : autoParley(seat)
          survey.rations = Math.max(0, survey.rations - result.rationsSpent)
          if (result.rationsSpent > 0) {
            say('info', `${result.rationsSpent} rations went over the gate at ${place.name}.`)
          }
          if (result.contact === 'talking') {
            survey.contact[place.id] = 'talking'
            say('good', `${place.name} is in. ${member.name} came away with a name to ask for and a share of their harvest.`)
            landed.note = 'They are in'
            landed.tone = 'good'
          } else if (result.contact === 'wary') {
            survey.contact[place.id] = 'wary'
            say('info', `${place.name} asked what New Batavia would charge. ${member.name} said nothing, and they liked that less.`)
            landed.note = 'They want a price'
          } else {
            // Ground held rather than gained. They had already asked the price
            // and they are still asking it, which is not the same as being
            // thrown out and should not read like it. A wrong offer costs the
            // days it took to walk there and nothing that was already won.
            say('info', `${place.name} is still asking what it would cost, and ${member.name} still has the same answer.`)
            landed.note = 'Still wants a price'
          }
          break
        }
        case 'board': {
          const place = byId.get(task.target)!
          landed = { to: place.id, note: 'Board up', tone: 'good' }
          if (survey.boards.includes(place.id)) {
            say('info', `${place.name} already had a board by the time ${member.name} finished the second one.`)
            landed.note = 'Already up'
            landed.tone = 'info'
            break
          }
          survey.boards.push(place.id)
          survey.rations -= BOARD_RATIONS
          say(
            'good',
            `${member.name} nailed a board to the gate at ${place.name}. A message left there waits for the next runner instead of the right one.`,
          )
          break
        }
        case 'fire': {
          const place = byId.get(task.target)!
          landed = { to: place.id, note: 'Fire laid', tone: 'good' }
          if (survey.fires.includes(place.id)) {
            say('info', `The fire above ${place.name} was already laid.`)
            landed.note = 'Already laid'
            landed.tone = 'info'
            break
          }
          survey.fires.push(place.id)
          survey.rations -= FIRE_RATIONS
          // What the fire is worth is what it can see tonight, not what it
          // might see once somebody else builds theirs.
          const answering = fireLinks(world, survey)
            .filter(([a, b]) => a === place.id || b === place.id)
            .map(([a, b]) => byId.get(a === place.id ? b : a)!.name)
          say(
            'good',
            answering.length > 0
              ? `The fire above ${place.name} was lit, and ${answering.join(' and ')} answered it the same night.`
              : `The fire above ${place.name} is stacked and dry. Nothing has answered it yet.`,
          )
          break
        }
        case 'forage': {
          survey.rations += FORAGE_RATIONS
          say('info', `${member.name} spent the day foraging: ${FORAGE_RATIONS} rations.`)
          break
        }
      }

      if (landed && landed.to !== origin) {
        moves.push({ memberId: member.id, from: origin, to: landed.to, note: landed.note, tone: landed.tone })
      } else if (landed) {
        moves.push({ memberId: member.id, from: origin, to: origin, note: landed.note, tone: landed.tone })
      }
      state.task = { kind: 'idle' }
    }
  }

  // --- night ---------------------------------------------------------------
  const income = surveyIncome(survey)
  const upkeep = surveyUpkeep(survey)
  survey.rations = Math.min(RATION_CAP, survey.rations + income - upkeep)
  if (survey.rations <= 0) {
    survey.rations = 0
    say('bad', 'The store is empty. Tomorrow goes on finding food, not people.')
  }

  const talking = reached(survey).filter((id) => contactOf(survey, id) === 'talking').length

  // --- the letter ----------------------------------------------------------
  const byName = (id: string) => byId.get(id)?.name ?? id
  if (survey.letter.state === 'out' && survey.day >= survey.letter.due) {
    // The way home is worked out now, not when the letter left: anything the
    // crew built while it was walking counts toward the answer coming back.
    const back = messageDays(world, survey, HQ, GOAL)
    const days = survey.day - survey.letter.sentOn
    if (back === null) {
      survey.letter = { state: 'unsent' }
      say('bad', `The letter reached ${byName(GOAL)} in ${days} days, and there is no longer a way to answer it.`)
    } else {
      survey.letter = { state: 'back', leftOn: survey.day, due: survey.day + back }
      say(
        'good',
        `${byName(GOAL)} has the letter, ${days} days out. They are writing back, and the answer is ${back} days behind it.`,
      )
    }
  } else if (survey.letter.state === 'back' && survey.day >= survey.letter.due) {
    survey.letter = { state: 'home', on: survey.day }
    say('good', `The answer is in. Somebody in ${byName(GOAL)} wrote back, and it got here.`)
    if (survey.hold < HOLD_DAYS) {
      say(
        'info',
        `One letter is not a network. ${HOLD_TALKING} settlements have to stay in contact for ${HOLD_DAYS} days running before this counts as anything.`,
      )
    }
  }

  // --- the hold ------------------------------------------------------------
  // Contact is not banked. The count is of settlements talking *tonight*, so
  // the run only stands while the region does.
  survey.hold = talking >= HOLD_TALKING ? survey.hold + 1 : 0

  if (survey.wonOn === null && survey.letter.state === 'home' && survey.hold >= HOLD_DAYS) {
    survey.wonOn = survey.day
    say(
      'good',
      `${HOLD_TALKING} settlements, ${HOLD_DAYS} days running, and a letter that went to ${byName(GOAL)} and came back. The region can carry a message.`,
    )
  }

  say(
    'info',
    `${talking} of ${world.settlements.length} talking. ${income.toFixed(1)} rations in, ${upkeep.toFixed(1)} out.`,
  )

  survey.day += 1
  return { survey, moves }
}

// --- what Era 1 starts from ---------------------------------------------------

/**
 * Era 0's end state as Era 1's opening world and run.
 *
 * Era 1's authored opening is a region that has already been surveyed, and
 * this is where that survey came from — so a settlement the crew talked to
 * keeps everything Era 1 says it has, and one they never walked into has
 * nothing the project put there: no set commissioned, no generator hauled out,
 * nobody trained. A place that was found but never won over keeps its gear and
 * loses its operator, because the gear stands there either way and a watch is
 * a favour.
 *
 * The mast itself is left alone everywhere. Those are pre-war towers standing
 * over pre-war towns, up whether or not anybody has walked to them — and the
 * day loop has no way to raise one, so zeroing a mast would kill a site for
 * good rather than set it back.
 *
 * `newSim` stays the standalone Era 1 start. Only a run that came through the
 * prologue gets this one, so Era 1's own balance is untouched by it.
 */
export function handoff(survey: Survey): { world: World; sim: Sim } {
  const world = buildWorld(1)
  for (const s of world.settlements) {
    const contact = contactOf(survey, s.id)
    if (contact === 'talking') continue
    if (contact === 'unknown') {
      s.stage = 0
      s.operator = false
      s.supply = 'none'
      s.wear = 0
      s.cold = false
      // Nothing worth raiding, and nobody who would have got word to us.
      delete s.alert
    } else {
      s.operator = false
    }
  }
  refreshLinks(world)

  const base = newSim()
  const carried = Math.round(survey.rations)
  const known = reached(survey).length
  return {
    world,
    sim: {
      ...base,
      stock: { ...base.stock, rations: Math.min(ERA1_RATION_CAP, base.stock.rations + carried) },
      log: [
        {
          day: 0,
          kind: 'info',
          text: `Day one, and not from nothing: ${known} of ${world.settlements.length} settlements walked into, ${carried} rations carried in from the survey.`,
        },
      ],
    },
  }
}

/** For the map: a settlement the survey knows something about. */
export function isReached(survey: Survey, s: Settlement): boolean {
  return contactOf(survey, s.id) !== 'unknown'
}
