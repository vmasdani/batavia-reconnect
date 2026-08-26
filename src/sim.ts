/**
 * The day loop.
 *
 * One turn is one day, in four phases that always run in the same order:
 *
 *     ASSIGN -> RESOLVE -> DUSK BROADCAST -> NIGHT
 *
 * The scarce thing is not copper, it is the four people. Every raid answered
 * is a scavenging run not made, and every circuit that goes down takes its
 * settlements' population out of the evening's audience — which is where the
 * rations come from. That feedback is the whole game: connect people, and the
 * network pays for the next piece of itself.
 *
 * Nothing here touches React or Pixi. `resolveDay` is a pure function from
 * (world, sim) to a new (world, sim), seeded by day number, so the same day
 * replays identically.
 */

import {
  CAMP_REACH_KM,
  distanceKm,
  groundMetres,
  scavengeState,
  scavengeYieldFactor,
  type BuildStage,
  type ResourceId,
  type Settlement,
  type World,
} from './world'
import { PARTY } from './party'

// --- balance -----------------------------------------------------------------

/**
 * Range constant for the AM link budget. Chosen so the circuits the project
 * already runs come out at the speeds its operators quote: Batavia-Priok at
 * 24 wpm over 8 km, Batavia-Tangerang at 17 wpm over 20 km. Tangerang-Serang
 * lands just outside daylight range, which is why Serang is a night contact.
 */
const RANGE_K = 3.6

/** How much further the signal carries once the ionosphere lifts after dark. */
const NIGHT_SKIP = 1.65

const MAX_WPM = 30

/** Rations eaten per day, by the crew and by each posted operator. */
const CREW_UPKEEP = 1
const OPERATOR_UPKEEP = 0.5

/** Wear added to a running set each day, and the same for a hardened one. */
const WEAR_PER_DAY = 3
const WEAR_PER_DAY_HARDENED = 1.5

/**
 * The night rolls once for whether anyone comes at all, and only then for
 * where. Rolling per site meant the top target alone came up most nights, and
 * a project losing a generator every third night never gets a turn back to
 * build anything. Tuned so a bad night lands about one week in three.
 */
const RAID_BASE = 0.1
const RAID_PER_CAMP = 0.03
const RAID_PER_EXPOSED_SITE = 0.02
const RAID_CHANCE_CAP = 0.45

/** Chance a raid takes the generator rather than just the cache. */
const WRECK_CHANCE = 0.28
const WRECK_CHANCE_HARDENED = 0.1

/**
 * Rations New Batavia's own gardens bring in, network or no network. Enough
 * that a dark night is a setback rather than an unrecoverable one, and short
 * of the crew's own upkeep, so isolation still starves the project slowly.
 */
const HOME_RATIONS = 6

/** What a foraging day brings in when the stores are empty. */
const FORAGE_RATIONS = 5

/**
 * How much of an unfocused traffic type still gets through. The window is an
 * hour of an operator's time, not a switch.
 */
const MIXED_TRAFFIC = 0.4

/** Days of unbroken contact with Serang that close out Act 1. */
const ACT1_STREAK = 7

/** Rations the stores hold. Anything past this spoils in the heat. */
export const RATION_CAP = 90

/** Litres a night, and what the Industrial League charges Bekasi for the same. */
const GENSET_FUEL = 0.5
const LEAGUE_FUEL = 1.2

/** Days a cleared camp stays gone, and the rations surplus that keeps it away. */
const CAMP_RETURN_DAYS = 12
const REGION_FED_RATIONS = 40

/** Travel is one day per this many km of road. */
const KM_PER_TRAVEL_DAY = 30

const HQ = 'batavia'

// --- resources and kits ------------------------------------------------------

export type Stock = Record<ResourceId, number>

export const RESOURCE_ORDER: ResourceId[] = [
  'copper', 'steel', 'cells', 'parts', 'fuel', 'rations',
]

/** Assembled hardware. Raw resources go in one end of the bench, these come out. */
export type KitId = 'mast' | 'transmitter' | 'battery' | 'genset' | 'feeder'

export type Kits = Record<KitId, number>

export interface Recipe {
  id: KitId
  name: string
  cost: Partial<Stock>
  days: number
  note: string
}

export const RECIPES: Recipe[] = [
  {
    id: 'mast', name: 'Mast kit', days: 2, cost: { steel: 6 },
    note: 'Sectional steel, guy wire, and a base plate that will not walk off.',
  },
  {
    id: 'transmitter', name: 'Transmitter set', days: 3, cost: { copper: 6, parts: 3 },
    note: 'Tank coil, valves, key. The part of the project nobody else can build.',
  },
  {
    id: 'battery', name: 'Battery bank', days: 2, cost: { cells: 4, copper: 2 },
    note: 'Enough cells to key a set through an evening window.',
  },
  {
    id: 'genset', name: 'Rebuilt genset', days: 3, cost: { parts: 2, steel: 1 },
    note: 'Runs on a litre of anything that burns. Wants that litre every day.',
  },
  {
    id: 'feeder', name: 'Feeder run', days: 1, cost: { copper: 3 },
    note: 'Buried coax and earth mat. Also what a raid costs you to put back.',
  },
]

const RECIPE_BY_ID = new Map(RECIPES.map((r) => [r.id, r]))

// --- tasks -------------------------------------------------------------------

export type Task =
  | { kind: 'idle' }
  | { kind: 'scavenge'; target: string }
  | { kind: 'craft'; recipe: KitId }
  | { kind: 'survey'; target: string }
  | { kind: 'install'; target: string }
  | { kind: 'commission'; target: string }
  | { kind: 'harden'; target: string }
  | { kind: 'repair'; target: string }
  | { kind: 'guard'; target: string }
  | { kind: 'clear'; target: string }

export type TaskKind = Task['kind']

/** Which crew classes are trusted with which job. */
const TASK_ROLES: Record<TaskKind, string[]> = {
  idle: ['Architect', 'Quartermaster', 'Wireman', 'Warden'],
  scavenge: ['Quartermaster', 'Warden', 'Architect'],
  // The architect drew the sets before anyone built them, so the bench and the
  // mast are his too. Surveying alone runs out once the map is walked, and a
  // planner with nothing left to plan is a planner standing a watch.
  craft: ['Wireman', 'Architect'],
  survey: ['Architect'],
  install: ['Wireman', 'Architect'],
  commission: ['Wireman', 'Architect'],
  harden: ['Warden'],
  repair: ['Wireman', 'Architect'],
  guard: ['Warden', 'Architect', 'Quartermaster'],
  clear: ['Warden'],
}

/**
 * Days of progress a scavenging run makes when someone goes along. Two people
 * work one end of a ruin each and the cart is loaded in half the trips, which
 * is the same reason the escort halves the risk: nobody is alone in there.
 */
const ESCORT_PROGRESS = 2

/**
 * How long a day's work takes this role, against the crew's baseline. The
 * quartermaster is the one who knows which roads are open and which bridge is
 * still standing, and that is worth more than anything she carries: a haul she
 * runs comes back while the same trip is still outbound for anyone else.
 */
const ROLE_PACE: Record<string, number> = {
  Quartermaster: 0.6,
}

export interface CrewState {
  /** Settlement the member is standing in, or the one they are walking to. */
  at: string
  task: Task
  /** Days of work left before the task lands. Zero means it lands tonight. */
  daysLeft: number
  /** Days out of action after a bad roll. */
  hurtDays: number
}

// --- log ---------------------------------------------------------------------

export interface LogEntry {
  day: number
  kind: 'good' | 'bad' | 'info'
  text: string
}

// --- broadcast ---------------------------------------------------------------

/** What the evening window is spent saying. */
export type Focus = 'weather' | 'trade' | 'muster' | 'rumor'

export const FOCUS_LABEL: Record<Focus, string> = {
  weather: 'Weather & tides',
  trade: 'Trade calls',
  muster: 'Muster & training',
  rumor: 'Rumour net',
}

export const FOCUS_NOTE: Record<Focus, string> = {
  weather: 'Farm settlements plant and harvest on it. Pays in rations.',
  trade: 'Matches surplus to shortage. Pays in parts, steel and fuel.',
  muster: 'Trains the next operators. Nobody keys a set without one.',
  rumor: 'Roads, sightings, warnings. Raids tonight are less likely to land.',
}

// --- sim state ---------------------------------------------------------------

export interface Sim {
  day: number
  stock: Stock
  kits: Kits
  crew: Record<string, CrewState>
  focus: Focus
  /** Operators trained and waiting for a posting. */
  operators: number
  /** Consecutive days Serang has been reachable. Seven wins Act 1. */
  serangStreak: number
  actComplete: boolean
  /** Last night's rumour net was up, so raiders found the yards watched. */
  warned: boolean
  /** Day each site was last raided. Raiders work a yard once, then move on. */
  lastRaid: Record<string, number>
  /** Skits the crew has already had. See `skits.ts`. */
  seenSkits: string[]
  log: LogEntry[]
}

export function newSim(): Sim {
  return {
    day: 1,
    stock: { copper: 12, steel: 8, cells: 4, parts: 6, fuel: 20, rations: 30 },
    kits: { mast: 0, transmitter: 0, battery: 0, genset: 0, feeder: 0 },
    crew: Object.fromEntries(
      PARTY.map((m) => [m.id, { at: HQ, task: { kind: 'idle' } as Task, daysLeft: 0, hurtDays: 0 }]),
    ),
    focus: 'weather',
    operators: 0,
    serangStreak: 0,
    actComplete: false,
    warned: false,
    lastRaid: {},
    seenSkits: [],
    log: [{ day: 0, kind: 'info', text: 'Day one. The set at Kota Tua is warm and Tangerang is answering.' }],
  }
}

// --- deterministic rolls -----------------------------------------------------

/** mulberry32, seeded per day so a resolved day always resolves the same way. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- link derivation ---------------------------------------------------------

/** Antenna height above sea level: the mast plus the ground it stands on. */
function antennaMetres(s: Settlement): number {
  return s.mast + groundMetres(s.tx, s.ty)
}

/** Daylight reach of a circuit between two sites, in km. */
export function reachKm(a: Settlement, b: Settlement): number {
  return RANGE_K * (Math.sqrt(antennaMetres(a)) + Math.sqrt(antennaMetres(b)))
}

/** A settlement is on the air when it is built, powered and staffed. */
export function isOnAir(s: Settlement): boolean {
  return s.stage >= 3 && s.operator && s.supply !== 'none' && !s.cold && s.wear < 100
}

/**
 * Recompute every circuit from its two endpoints. Called each morning and
 * again after the night's raids, so the map never shows a link the hardware
 * could not support.
 */
export function refreshLinks(world: World): void {
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  for (const link of world.links) {
    const a = byId.get(link.from)
    const b = byId.get(link.to)
    if (!a || !b) continue

    const km = distanceKm(a, b)
    const day = reachKm(a, b)
    const night = day * NIGHT_SKIP
    const both = isOnAir(a) && isOnAir(b)

    link.nightOnly = km > day && km <= night
    link.latencyMs = Math.round(km * 1.8)

    if (!both || km > night) {
      // Hardware standing at both ends but silent reads as a broken circuit;
      // a route where something has yet to be built is merely surveyed.
      const standing = a.stage >= 2 && b.stage >= 2
      link.status = standing ? 'down' : 'planned'
      link.wpm = 0
      link.bandwidth = standing ? 'silent' : '—'
      continue
    }

    const margin = 1 - km / (link.nightOnly ? night : day)
    const worn = 1 - Math.max(a.wear, b.wear) / 150
    const raw = MAX_WPM * margin * worn * (link.nightOnly ? 0.5 : 1)
    link.wpm = Math.max(4, Math.round(raw))
    link.status = 'live'
    link.bandwidth = `${link.wpm} wpm${link.nightOnly ? ' (night)' : ''}`
  }
}

// --- task shape --------------------------------------------------------------

/**
 * One material line in an order's price: so many of a resource, or so many of
 * an assembled kit. Kept structured rather than baked into the label so the
 * panel can draw it with the same icons the stock strip uses.
 */
export type Need =
  | { kind: 'resource'; id: ResourceId; amount: number }
  | { kind: 'kit'; id: KitId; amount: number }

export interface TaskOption {
  task: Task
  label: string
  group: string
  days: number
  /** Everything this order consumes. */
  needs?: Need[]
  /** Any one of these will do — a genset or a battery bank, not both. */
  needsAny?: Need[]
  /** Something true about taking this job that the day count cannot say. */
  hint?: string
  /** Reason the player cannot pick this right now, if any. */
  blocked?: string
}

function resourceNeeds(cost: Partial<Stock>): Need[] {
  return RESOURCE_ORDER.filter((r) => cost[r]).map((r) => ({
    kind: 'resource' as const, id: r, amount: cost[r]!,
  }))
}

const kitNeed = (id: KitId, amount = 1): Need => ({ kind: 'kit', id, amount })

function travelDays(world: World, from: string, to: string): number {
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  const a = byId.get(from)
  const b = byId.get(to) ?? world.scavenge.find((s) => s.id === to) ?? world.camps.find((c) => c.id === to)
  if (!a || !b) return 0
  return Math.ceil(distanceKm(a, b) / KM_PER_TRAVEL_DAY)
}

function afford(stock: Stock, cost: Partial<Stock>): boolean {
  return RESOURCE_ORDER.every((r) => (stock[r] ?? 0) >= (cost[r] ?? 0))
}

function spend(stock: Stock, cost: Partial<Stock>): void {
  for (const r of RESOURCE_ORDER) stock[r] = Math.max(0, stock[r] - (cost[r] ?? 0))
}

/** Materials a stage transition burns, on top of the kits it needs. */
const HARDEN_COST: Partial<Stock> = { steel: 4 }

/** Litres a site's genset drinks tonight. The League bills Bekasi for theirs. */
function gensetLitres(s: Settlement): number {
  return s.id === 'bekasi' ? LEAGUE_FUEL : GENSET_FUEL
}

/**
 * What tonight costs simply to keep the lights on, before anyone is paid or
 * anything is stolen. The night spends it site by site — it has to, because
 * running short is what decides which set goes cold — so this is the total the
 * same loop would reach, and the plan dialog quotes it rather than its own
 * arithmetic.
 */
export function nightUpkeep(world: World): { rations: number; fuel: number; cells: number } {
  const running = world.settlements.filter((s) => s.stage >= 3)
  return {
    rations:
      PARTY.length * CREW_UPKEEP + running.filter((s) => s.operator).length * OPERATOR_UPKEEP,
    fuel: running.filter((s) => s.supply === 'genset').reduce((sum, s) => sum + gensetLitres(s), 0),
    cells: running.filter((s) => s.supply === 'battery').length * 0.25,
  }
}

/**
 * Everything this member could be told to do today, with the reason attached
 * when they cannot. The UI renders this list directly; the rules stay here.
 */
export function taskOptions(world: World, sim: Sim, memberId: string): TaskOption[] {
  const member = PARTY.find((m) => m.id === memberId)
  const state = sim.crew[memberId]
  if (!member || !state) return []

  const can = (kind: TaskKind) => TASK_ROLES[kind].includes(member.className)
  const pace = ROLE_PACE[member.className] ?? 1
  const options: TaskOption[] = [
    { task: { kind: 'idle' }, label: 'Stand down', group: 'Rest', days: 0 },
  ]
  const trip = (target: string) => travelDays(world, state.at, target)

  if (can('scavenge')) {
    for (const site of world.scavenge) {
      const days = trip(site.id) * 2 + 1
      // Whoever is already going. A second pair of hands is the only thing in
      // the game that makes a job both safer and shorter, so it is worth
      // saying out loud rather than leaving the player to notice it.
      const going = PARTY.filter(
        (m) => m.id !== member.id && sim.crew[m.id]?.task.kind === 'scavenge' &&
          (sim.crew[m.id].task as { target: string }).target === site.id,
      )
      options.push({
        task: { kind: 'scavenge', target: site.id },
        label: `${site.name} — ${site.state}, risk ${site.risk}`,
        group: 'Scavenge',
        days,
        hint: going.length
          ? `${going.map((m) => m.name).join(' and ')} already on this — go together for half the risk and twice the pace`
          : 'Send two, and the run is half the risk and twice the pace',
        blocked: site.hauls >= 4 ? 'stripped to the concrete' : undefined,
      })
    }
  }

  if (can('craft')) {
    for (const recipe of RECIPES) {
      const days = trip(HQ) + recipe.days
      options.push({
        task: { kind: 'craft', recipe: recipe.id },
        label: recipe.name,
        group: 'Workbench (HQ)',
        days,
        needs: resourceNeeds(recipe.cost),
        blocked: afford(sim.stock, recipe.cost) ? undefined : 'materials short',
      })
    }
  }

  for (const s of world.settlements) {
    const days = trip(s.id)
    if (can('survey') && s.stage === 0) {
      options.push({
        task: { kind: 'survey', target: s.id },
        label: `Survey ${s.name}`,
        group: 'Build',
        days: days + 1,
      })
    }
    if (can('install') && s.stage === 1) {
      const short = sim.kits.mast < 1 || sim.kits.transmitter < 1
      options.push({
        task: { kind: 'install', target: s.id },
        label: `Install ${s.name}`,
        group: 'Build',
        days: days + 2,
        needs: [kitNeed('mast'), kitNeed('transmitter')],
        blocked: short ? 'no mast kit or set on the shelf' : undefined,
      })
    }
    if (can('commission') && s.stage === 2) {
      const needsPower = s.supply === 'none'
      const noPower = needsPower && sim.kits.genset < 1 && sim.kits.battery < 1
      options.push({
        task: { kind: 'commission', target: s.id },
        label: `Bring ${s.name} on air`,
        group: 'Build',
        days: days + 1,
        needsAny: needsPower ? [kitNeed('genset'), kitNeed('battery')] : undefined,
        blocked: noPower
          ? 'no genset or battery bank built'
          : s.operator || sim.operators >= 1
            ? undefined
            : 'no trained operator — broadcast a muster',
      })
    }
    if (can('harden') && s.stage === 3) {
      const short = sim.kits.feeder < 1 || !afford(sim.stock, HARDEN_COST)
      options.push({
        task: { kind: 'harden', target: s.id },
        label: `Harden ${s.name}`,
        group: 'Build',
        days: days + 2,
        needs: [kitNeed('feeder'), ...resourceNeeds(HARDEN_COST)],
        blocked: short ? 'needs a feeder run and steel' : undefined,
      })
    }
    // Tuning a drifting set costs a day and nothing else. What a raid takes is
    // the generator, and putting that back is a commissioning job with a kit.
    if (can('repair') && s.stage >= 3 && s.wear >= 30) {
      options.push({
        task: { kind: 'repair', target: s.id },
        label: `Tune ${s.name} — wear ${Math.round(s.wear)}%`,
        group: 'Repair',
        days: days + 1,
      })
    }
    if (can('guard') && s.stage >= 2) {
      options.push({
        task: { kind: 'guard', target: s.id },
        label: `Stand watch at ${s.name}`,
        group: 'Guard',
        // Travel only. They stand the watch the evening they get there, and
        // keep standing it until they are given something else to do.
        days: Math.max(1, days),
      })
    }
  }

  if (can('clear')) {
    for (const camp of world.camps) {
      options.push({
        task: { kind: 'clear', target: camp.id },
        label: `Clear ${camp.name}`,
        group: 'Guard',
        days: trip(camp.id) + 2,
        blocked: camp.active ? undefined : 'already cleared',
      })
    }
  }

  // Nothing anyone takes on lands in less than a day, however fast they drive.
  return pace === 1
    ? options
    : options.map((o) => (o.days === 0 ? o : { ...o, days: Math.max(1, Math.round(o.days * pace)) }))
}

/** One crew member's standing to take a job on. */
export interface Candidate {
  memberId: string
  name: string
  /** Days it would cost this member, travel from where they are included. */
  days: number
  /** Already out on something else. */
  busy: boolean
  /** Already assigned to this exact job. */
  assigned: boolean
}

/**
 * Everything that can be done to one place, with who could do it.
 *
 * The panels ask this rather than assembling orders themselves, so a site, a
 * ruin and a bandit camp all present their choices the same way and the rules
 * stay in one file. The workbench is reached through HQ, because that is
 * where the bench is.
 */
export interface TargetAction {
  kind: TaskKind
  task: Task
  label: string
  group: string
  needs?: Need[]
  needsAny?: Need[]
  hint?: string
  blocked?: string
  candidates: Candidate[]
}

export function actionsForTarget(world: World, sim: Sim, targetId: string): TargetAction[] {
  const byKind = new Map<string, TargetAction>()

  for (const member of PARTY) {
    const state = sim.crew[member.id]
    if (!state) continue
    for (const option of taskOptions(world, sim, member.id)) {
      const task = option.task
      const hasTarget = 'target' in task && task.target === targetId
      const atBench = task.kind === 'craft' && targetId === HQ
      if (!hasTarget && !atBench) continue

      const key = task.kind === 'craft' ? `craft:${task.recipe}` : task.kind
      const action = byKind.get(key) ?? {
        kind: task.kind,
        task,
        label: option.label,
        group: option.group,
        needs: option.needs,
        needsAny: option.needsAny,
        hint: option.hint,
        blocked: option.blocked,
        candidates: [],
      }
      action.candidates.push({
        memberId: member.id,
        name: member.name,
        days: option.days,
        busy: state.daysLeft > 0 || state.hurtDays > 0,
        assigned: JSON.stringify(state.task) === JSON.stringify(task),
      })
      byKind.set(key, action)
    }
  }

  return [...byKind.values()]
}

export function assign(sim: Sim, memberId: string, task: Task, days: number): Sim {
  const crew = { ...sim.crew, [memberId]: { ...sim.crew[memberId], task, daysLeft: days } }
  return { ...sim, crew }
}

// --- the bill ----------------------------------------------------------------

/**
 * Whether a member's order lands at the end of today, by the same rule the day
 * loop uses: one day of progress each, two when a second pair of hands is on
 * the same ruin.
 */
function landsTonight(sim: Sim, memberId: string): boolean {
  const state = sim.crew[memberId]
  if (!state || state.hurtDays > 0) return false
  if (state.task.kind === 'idle' || state.daysLeft <= 0) return false
  const crewed =
    state.task.kind === 'scavenge' &&
    Object.entries(sim.crew).some(
      ([id, c]) =>
        id !== memberId && c.task.kind === 'scavenge' &&
        c.task.target === (state.task as { target: string }).target,
    )
  return state.daysLeft - (crewed ? ESCORT_PROGRESS : 1) <= 0
}

/**
 * Days of work still to come after tonight, or null when there is no work.
 * Zero means the order lands this evening. The plan read-back and the bench
 * list both ask this rather than reading `daysLeft` raw, which is the count
 * before today is spent and so is always one too many.
 */
export function daysRemaining(sim: Sim, memberId: string): number | null {
  const state = sim.crew[memberId]
  if (!state || state.hurtDays > 0 || state.task.kind === 'idle' || state.daysLeft <= 0) return null
  return landsTonight(sim, memberId) ? 0 : state.daysLeft - 1
}

/** Everything a member's order is still waiting on, for the plan read-back. */
export interface Progress {
  memberId: string
  /** What comes out of it: a kit name, or the site being worked on. */
  what: string
  kit?: KitId
  /** Days of work left after tonight. Zero means it lands tonight. */
  daysLeft: number
}

/**
 * Orders with a build at the end of them, so the plan dialog can say what is
 * on the bench and how much longer it will be there. Watches and hauls are not
 * builds and stay out of it.
 */
export function buildsInProgress(world: World, sim: Sim): Progress[] {
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  const out: Progress[] = []
  for (const member of PARTY) {
    const state = sim.crew[member.id]
    const left = daysRemaining(sim, member.id)
    if (left === null) continue
    const site = (id: string) => byId.get(id)?.name ?? id
    switch (state.task.kind) {
      case 'craft': {
        const recipe = RECIPE_BY_ID.get(state.task.recipe)!
        out.push({ memberId: member.id, what: recipe.name, kit: recipe.id, daysLeft: left })
        break
      }
      case 'install':
        out.push({ memberId: member.id, what: `${site(state.task.target)} — mast`, daysLeft: left })
        break
      case 'commission':
        out.push({ memberId: member.id, what: `${site(state.task.target)} — on air`, daysLeft: left })
        break
      case 'harden':
        out.push({ memberId: member.id, what: `${site(state.task.target)} — hardened`, daysLeft: left })
        break
      case 'survey':
        out.push({ memberId: member.id, what: `${site(state.task.target)} — survey`, daysLeft: left })
        break
    }
  }
  return out
}

/**
 * What executing today is certain to cost, as negative numbers.
 *
 * Only the outlays nobody has to roll for: the materials of every order that
 * lands tonight, and the upkeep the night charges whatever else happens. Hauls,
 * broadcast income and raids are all decided by dice and are deliberately left
 * out — the plan dialog is a bill, not a preview of the night.
 */
export function forecastDay(
  world: World,
  sim: Sim,
): { stock: Partial<Stock>; kits: Partial<Kits> } {
  const stock: Partial<Stock> = {}
  const kits: Partial<Kits> = {}
  // Run against a tally, so an order that cannot be paid for bills nothing —
  // which is exactly what the day loop does when it runs out part-way through.
  const purse: Stock = { ...sim.stock }
  const shelf: Kits = { ...sim.kits }
  const takeStock = (cost: Partial<Stock>) => {
    for (const r of RESOURCE_ORDER) {
      const amount = cost[r] ?? 0
      if (!amount) continue
      purse[r] -= amount
      stock[r] = (stock[r] ?? 0) - amount
    }
  }
  const takeKit = (id: KitId, amount = 1) => {
    shelf[id] -= amount
    kits[id] = (kits[id] ?? 0) - amount
  }

  // A crew with nothing to eat spends the day foraging and builds nothing.
  if (sim.stock.rations > 0) {
    for (const member of PARTY) {
      if (!landsTonight(sim, member.id)) continue
      const task = sim.crew[member.id].task
      switch (task.kind) {
        case 'craft': {
          const recipe = RECIPE_BY_ID.get(task.recipe)!
          if (afford(purse, recipe.cost)) takeStock(recipe.cost)
          break
        }
        case 'install':
          if (shelf.mast >= 1 && shelf.transmitter >= 1) {
            takeKit('mast')
            takeKit('transmitter')
          }
          break
        case 'commission': {
          const site = world.settlements.find((s) => s.id === task.target)
          if (site?.supply !== 'none') break
          if (shelf.genset >= 1) takeKit('genset')
          else if (shelf.battery >= 1) takeKit('battery')
          break
        }
        case 'harden':
          if (shelf.feeder >= 1 && afford(purse, HARDEN_COST)) {
            takeKit('feeder')
            takeStock(HARDEN_COST)
          }
          break
      }
    }
  }

  const upkeep = nightUpkeep(world)
  takeStock({
    rations: upkeep.rations,
    // Short drums silence a set rather than overdrawing the store, so the bill
    // stops at what is actually there.
    fuel: Math.min(purse.fuel, upkeep.fuel),
    cells: Math.min(purse.cells, upkeep.cells),
  })

  return { stock, kits }
}

// --- the turn ----------------------------------------------------------------

function cloneWorld(world: World): World {
  // Tiles are 6,000 immutable records and never change after bake, so they are
  // shared rather than copied. Everything a day can touch is copied.
  return {
    ...world,
    settlements: world.settlements.map((s) => ({ ...s })),
    links: world.links.map((l) => ({ ...l })),
    scavenge: world.scavenge.map((s) => ({ ...s })),
    camps: world.camps.map((c) => ({ ...c })),
  }
}

/**
 * Settlements reachable from a root over circuits that are up.
 *
 * This is the rule the whole game turns on: lose one relay and everything
 * behind it leaves the audience, the evening broadcast, and the income.
 */
export function reachableFrom(world: World, rootId: string = HQ): Set<string> {
  const adjacency = new Map<string, string[]>()
  const link = (a: string, b: string) => {
    const list = adjacency.get(a)
    if (list) list.push(b)
    else adjacency.set(a, [b])
  }
  for (const l of world.links) {
    if (l.status !== 'live') continue
    link(l.from, l.to)
    link(l.to, l.from)
  }

  const seen = new Set([rootId])
  const queue = [rootId]
  while (queue.length) {
    for (const next of adjacency.get(queue.shift()!) ?? []) {
      if (!seen.has(next)) {
        seen.add(next)
        queue.push(next)
      }
    }
  }
  return seen
}

/** Camp pressure bearing on a site tonight. */
function campPressure(world: World, place: { lon: number; lat: number }): number {
  let pressure = 0
  for (const camp of world.camps) {
    if (camp.active && distanceKm(camp, place) <= CAMP_REACH_KM) pressure += 3
  }
  return pressure
}

/**
 * How badly a site wants watching tonight.
 *
 * The same number the night uses to pick a target, handed to the HUD so that
 * posting a warden has a visible effect before the dice are rolled rather
 * than only afterwards in the log.
 */
export function raidRisk(
  world: World,
  sim: Sim,
  s: Settlement,
): { threat: number; guarded: boolean; level: 'none' | 'low' | 'medium' | 'high' } {
  const guarded = guardedSites(sim).has(s.id)
  const threat =
    copperOnSite(s.stage) +
    (s.supply === 'genset' && s.stage >= 3 ? 3 : 0) +
    campPressure(world, s) -
    (guarded ? 4 : 0) -
    (s.stage >= 4 ? 3 : 0) -
    s.population / 300
  const level = s.stage < 2 || threat <= 1 ? 'none' : threat <= 5 ? 'low' : threat <= 9 ? 'medium' : 'high'
  return { threat, guarded, level }
}

/**
 * Sites that will have somebody standing on them tonight.
 *
 * A watch counts from the night the warden can actually reach the yard, not
 * the night after: an order given in the morning for a relay an hour up the
 * road is a watch posted this evening, which is the whole point of giving it
 * when the alert comes in. Anything further out counts once they arrive.
 */
function guardedSites(sim: Sim): Set<string> {
  return new Set(
    Object.values(sim.crew)
      .filter((c) => {
        if (c.task.kind !== 'guard' || c.hurtDays > 0) return false
        const target = (c.task as { target: string }).target
        return c.at === target || c.daysLeft <= 1
      })
      .map((c) => (c.task as { target: string }).target),
  )
}

/** Copper standing on site, which is what raiders are actually counting. */
function copperOnSite(stage: BuildStage): number {
  return stage >= 4 ? 10 : stage >= 3 ? 8 : stage >= 2 ? 2 : 0
}

/**
 * One crew member's journey through the day, for the map to play back before
 * the report is read. A day resolves as a single step, so without this the
 * only sign that anyone went anywhere is a token that has teleported.
 *
 * `to` is the place the work happened, which is not always where they ended
 * up: a scavenging run and a raid on a camp both come home to the depot, and
 * `back` is that return leg.
 */
export interface Move {
  memberId: string
  from: string
  to: string
  back?: string
  /** Two or three words dropped over the destination as the leg lands. */
  note?: string
  tone: LogEntry['kind']
}

export interface DayResult {
  world: World
  sim: Sim
  moves: Move[]
}

/**
 * Advance one day. Resolve work, derive the network, pay out the evening
 * broadcast, then let the night have its turn.
 */
export function resolveDay(prevWorld: World, prevSim: Sim): DayResult {
  const world = cloneWorld(prevWorld)
  const sim: Sim = {
    ...prevSim,
    stock: { ...prevSim.stock },
    kits: { ...prevSim.kits },
    lastRaid: { ...prevSim.lastRaid },
    crew: Object.fromEntries(Object.entries(prevSim.crew).map(([id, c]) => [id, { ...c }])),
    log: [],
  }
  const roll = rng(sim.day * 7919)
  const moves: Move[] = []
  const byId = new Map(world.settlements.map((s) => [s.id, s]))
  const say = (kind: LogEntry['kind'], text: string) => sim.log.push({ day: sim.day, kind, text })

  const hungry = sim.stock.rations <= 0

  // --- work --------------------------------------------------------------
  if (hungry) {
    // A day spent foraging is a day not spent on the network, but it is never
    // a dead end: the project can always claw its way back to a working day.
    sim.stock.rations += FORAGE_RATIONS
    say('bad', `No rations left. The crew spent the day foraging and brought back ${FORAGE_RATIONS}.`)
  } else {
    // Escorted runs: two crew on the same ruin halve the risk of a bad roll.
    const partySize = new Map<string, number>()
    for (const c of Object.values(sim.crew)) {
      if (c.task.kind === 'scavenge') partySize.set(c.task.target, (partySize.get(c.task.target) ?? 0) + 1)
    }

    for (const member of PARTY) {
      const state = sim.crew[member.id]
      if (state.hurtDays > 0) {
        state.hurtDays -= 1
        continue
      }
      if (state.task.kind === 'idle' || state.daysLeft <= 0) continue

      const crewed =
        state.task.kind === 'scavenge' && (partySize.get(state.task.target) ?? 1) > 1
      state.daysLeft -= crewed ? ESCORT_PROGRESS : 1
      if (state.daysLeft > 0) continue

      const task = state.task
      const origin = state.at
      // Filled in by whichever case runs, then turned into the leg the map
      // plays: where they went, what happened there, and whether they came
      // home afterwards.
      let landed: { to: string; back?: string; note: string; tone: LogEntry['kind'] } | null = null
      switch (task.kind) {
        case 'scavenge': {
          const site = world.scavenge.find((s) => s.id === task.target)!
          const factor = scavengeYieldFactor(site.hauls)
          if (factor === 0) {
            say('info', `${member.name} found nothing left at ${site.name}.`)
            break
          }
          const escorted = (partySize.get(site.id) ?? 1) > 1
          const danger = (site.risk / 10) * (escorted ? 0.5 : 1) + campPressure(world, site) / 100
          const bad = roll() < danger
          const share = factor * (bad ? 0.5 : 1)
          const got: string[] = []
          for (const r of RESOURCE_ORDER) {
            const amount = Math.round((site.drops[r] ?? 0) * share)
            if (amount > 0) {
              sim.stock[r] += amount
              got.push(`${amount} ${r}`)
            }
          }
          site.hauls += 1
          site.state = scavengeState(site.hauls)
          if (bad) {
            state.hurtDays = 2
            say('bad', `${member.name} was jumped at ${site.name}. Half the haul dropped: ${got.join(', ') || 'nothing'}. Out for two days.`)
          } else {
            say('good', `${member.name} hauled ${got.join(', ') || 'nothing'} out of ${site.name}.`)
          }
          landed = { to: site.id, back: HQ, note: bad ? 'Jumped!' : 'Hauled out', tone: bad ? 'bad' : 'good' }
          state.at = HQ
          break
        }
        case 'craft': {
          const recipe = RECIPE_BY_ID.get(task.recipe)!
          if (!afford(sim.stock, recipe.cost)) {
            say('bad', `${member.name} ran out of materials part-way through the ${recipe.name.toLowerCase()}.`)
            landed = { to: HQ, note: 'Materials short', tone: 'bad' }
            state.at = HQ
            break
          }
          spend(sim.stock, recipe.cost)
          sim.kits[recipe.id] += 1
          landed = { to: HQ, note: `${recipe.name} built`, tone: 'good' }
          state.at = HQ
          say('good', `${member.name} finished a ${recipe.name.toLowerCase()}.`)
          break
        }
        case 'survey': {
          const s = byId.get(task.target)!
          s.stage = 1
          landed = { to: s.id, note: 'Surveyed', tone: 'good' }
          state.at = s.id
          say('good', `${member.name} surveyed ${s.name}. ${Math.round(groundMetres(s.tx, s.ty))} m of ground under the site.`)
          break
        }
        case 'install': {
          const s = byId.get(task.target)!
          if (sim.kits.mast < 1 || sim.kits.transmitter < 1) {
            say('bad', `${member.name} reached ${s.name} and found the kit was never built.`)
            landed = { to: s.id, back: origin, note: 'No kit', tone: 'bad' }
            break
          }
          sim.kits.mast -= 1
          sim.kits.transmitter -= 1
          s.stage = 2
          landed = { to: s.id, note: 'Mast up', tone: 'good' }
          state.at = s.id
          say('good', `${member.name} stood the mast at ${s.name}. It needs power and somebody to key it.`)
          break
        }
        case 'commission': {
          const s = byId.get(task.target)!
          if (s.supply === 'none') {
            if (sim.kits.genset > 0) {
              sim.kits.genset -= 1
              s.supply = 'genset'
              s.power = 'Rebuilt genset'
            } else if (sim.kits.battery > 0) {
              sim.kits.battery -= 1
              s.supply = 'battery'
              s.power = 'Battery bank, swapped weekly'
            } else {
              say('bad', `${s.name} has a set and no way to power it.`)
              landed = { to: s.id, back: origin, note: 'No power', tone: 'bad' }
              break
            }
          }
          if (!s.operator) {
            if (sim.operators < 1) {
              say('bad', `${s.name} is powered but nobody there can key it.`)
              landed = { to: s.id, back: origin, note: 'No operator', tone: 'bad' }
              break
            }
            sim.operators -= 1
            s.operator = true
          }
          s.stage = 3
          s.wear = 0
          delete s.alert
          landed = { to: s.id, note: 'On air!', tone: 'good' }
          state.at = s.id
          say('good', `${s.name} is on the air.`)
          break
        }
        case 'harden': {
          const s = byId.get(task.target)!
          if (sim.kits.feeder < 1 || !afford(sim.stock, HARDEN_COST)) {
            say('bad', `${s.name} could not be hardened: the feeder run or the steel was gone.`)
            landed = { to: s.id, back: origin, note: 'Nothing to build with', tone: 'bad' }
            break
          }
          sim.kits.feeder -= 1
          spend(sim.stock, HARDEN_COST)
          s.stage = 4
          landed = { to: s.id, note: 'Hardened', tone: 'good' }
          state.at = s.id
          say('good', `${s.name} is hardened. Buried feeder, spare valves, and a fence worth the name.`)
          break
        }
        case 'repair': {
          const s = byId.get(task.target)!
          s.wear = 0
          delete s.alert
          landed = { to: s.id, note: 'Tuned', tone: 'good' }
          state.at = s.id
          say('good', `${member.name} tuned ${s.name} back onto frequency.`)
          break
        }
        case 'guard': {
          const s = byId.get(task.target)!
          if (origin !== s.id) landed = { to: s.id, note: 'On watch', tone: 'info' }
          state.at = s.id
          // A watch is a standing post, not a job that finishes.
          state.daysLeft = 1
          break
        }
        case 'clear': {
          const camp = world.camps.find((c) => c.id === task.target)!
          state.at = HQ
          if (!camp.active) {
            landed = { to: camp.id, back: HQ, note: 'Already gone', tone: 'info' }
            break
          }
          if (roll() < 0.25) {
            state.hurtDays = 3
            landed = { to: camp.id, back: HQ, note: 'Driven off!', tone: 'bad' }
            say('bad', `${member.name} was driven off ${camp.name} and came back hurt.`)
            break
          }
          camp.active = false
          camp.returnsOn = sim.day + CAMP_RETURN_DAYS
          sim.stock.copper += 3
          landed = { to: camp.id, back: HQ, note: 'Cleared!', tone: 'good' }
          say('good', `${camp.name} is cleared. Three copper back off their cart.`)
          break
        }
      }
      // A leg with no distance in it is still worth playing: the word over the
      // site is how the player learns the day's work landed.
      if (landed) {
        moves.push({
          memberId: member.id,
          from: origin,
          to: landed.to,
          back: landed.back === landed.to ? undefined : landed.back,
          note: landed.note,
          tone: landed.tone,
        })
      }
      if (state.task.kind !== 'guard' && state.daysLeft <= 0) state.task = { kind: 'idle' }
    }
  }

  refreshLinks(world)

  // --- dusk: the broadcast window ----------------------------------------
  const on = reachableFrom(world)
  const capacity = world.links.reduce((sum, l) => (l.status === 'live' ? sum + l.wpm : sum), 0)
  const audience = world.settlements
    .filter((s) => on.has(s.id) && s.id !== HQ)
    .reduce((sum, s) => sum + s.population, 0)
  const throughput = Math.min(capacity, audience / 60)

  sim.stock.rations += HOME_RATIONS
  sim.warned = false
  if (throughput <= 0) {
    say('bad', 'Nothing on the air at dusk. Nobody heard anything from New Batavia tonight.')
  } else {
    // Every window carries a bit of everything — the weather still goes out
    // on a trading night. The focus is what the operators spend most of the
    // hour on, not the only thing they say, so no single choice starves the
    // project of what it did not pick.
    const share = (kind: Focus) => throughput * (sim.focus === kind ? 1 : MIXED_TRAFFIC)

    sim.stock.rations += share('weather') * 0.22
    sim.stock.parts += share('trade') * 0.05
    sim.stock.steel += share('trade') * 0.05
    sim.stock.fuel += share('trade') * 0.1
    sim.stock.copper += share('trade') * 0.02
    // Nobody trains for a posting that does not exist yet.
    sim.operators = Math.min(3, sim.operators + share('muster') * 0.02)
    sim.warned = sim.focus === 'rumor'

    switch (sim.focus) {
      case 'weather':
        say('info', `Weather and tides went out to ${audience.toLocaleString('en-US')} people. ${(throughput * 0.22).toFixed(1)} rations came back.`)
        break
      case 'trade':
        say('info', `Trade calls matched surplus to shortage. ${(throughput * 0.1).toFixed(1)} litres of fuel came in with them.`)
        break
      case 'muster':
        say('info', `Muster and training. ${sim.operators.toFixed(2)} operators ready to post.`)
        break
      case 'rumor':
        say('info', 'Rumour net up. Every yard on the network knows what to watch for tonight.')
        break
    }
  }

  // --- night: upkeep, wear, weather, raids --------------------------------
  const running = world.settlements.filter((s) => s.stage >= 3)
  sim.stock.rations -= nightUpkeep(world).rations

  // Fuel is poured HQ first, then into the biggest audiences. A short drum
  // silences the far outposts rather than the whole network at once, which is
  // what the quartermaster would actually do with the last twenty litres.
  const gensets = running
    .filter((s) => s.supply === 'genset')
    .sort((a, b) => (a.id === HQ ? -1 : b.id === HQ ? 1 : b.population - a.population))
  let cold = 0
  for (const s of gensets) {
    const litres = gensetLitres(s)
    if (sim.stock.fuel >= litres) {
      sim.stock.fuel -= litres
      s.cold = false
    } else {
      s.cold = true
      cold += 1
    }
  }

  // Battery sites drink cells the same way, and go quiet the same way when
  // there are none left to swap in.
  for (const s of running.filter((x) => x.supply === 'battery')) {
    if (sim.stock.cells >= 0.25) {
      sim.stock.cells -= 0.25
      s.cold = false
    } else {
      s.cold = true
      cold += 1
    }
  }

  for (const s of running) {
    s.wear += s.stage >= 4 ? WEAR_PER_DAY_HARDENED : WEAR_PER_DAY
    if (s.wear >= 100) {
      s.wear = 100
      s.stage = 2
      s.alert = {
        kind: 'off-air',
        message: '\u{1F4E1} OFF AIR — SET NEEDS WORK',
        detail: 'Nobody has been up the mast in weeks. The set has drifted off frequency and stopped keying.',
      }
      say('bad', `${s.name} dropped off the air. The set has been running untouched too long.`)
    }
  }

  if (cold > 0) {
    say('bad', `Fuel short. ${cold} genset ${cold === 1 ? 'site is' : 'sites are'} cold and off the air until a drum arrives.`)
  }
  if (sim.stock.rations > RATION_CAP) {
    sim.stock.rations = RATION_CAP
  }
  if (sim.stock.rations < 0) {
    sim.stock.rations = 0
    say('bad', 'Rations are gone. Tomorrow the crew looks for food instead of copper.')
  }

  const guarded = guardedSites(sim)

  // --- incidents already in progress --------------------------------------
  // A raid alert is a night's warning, not a permanent decoration: whoever is
  // standing there settles it, and nobody standing there settles it too.
  for (const s of world.settlements) {
    if (s.alert?.kind !== 'raid-in-progress') continue
    if (guarded.has(s.id)) {
      const recovered = 2 + Math.floor(roll() * 3)
      sim.stock.copper += recovered
      delete s.alert
      sim.lastRaid[s.id] = sim.day
      say('good', `The watch at ${s.name} ran them off the feeder run. ${recovered} copper stayed where it was.`)
      continue
    }
    const stolen = Math.min(Math.floor(sim.stock.copper), 3 + Math.floor(roll() * 3))
    sim.stock.copper -= stolen
    sim.lastRaid[s.id] = sim.day
    if (s.stage >= 3) {
      s.stage = 2 as BuildStage
      s.supply = 'none'
      s.power = 'None — generator stolen'
      s.cold = false
      s.alert = {
        kind: 'off-air',
        message: '\u{1F4E1} OFF AIR — GENERATOR GONE',
        detail: `Nobody came. They took the feeder run and the generator with it, and ${s.name} needs a power kit and a wireman before it keys again.`,
      }
      say('bad', `Nobody was watching ${s.name}. The feeder run and the generator are gone${stolen > 0 ? `, along with ${stolen} copper` : ''}.`)
    } else {
      delete s.alert
      say('bad', `They finished stripping ${s.name} overnight${stolen > 0 ? ` and took ${stolen} copper with them` : ''}.`)
    }
  }

  const candidates = world.settlements
    .filter((s) => s.stage >= 2)
    .map((s) => ({
      s,
      // What a cartload from this site is worth against what standing in
      // front of it would cost them.
      threat:
        copperOnSite(s.stage) +
        (s.supply === 'genset' && s.stage >= 3 ? 3 : 0) +
        campPressure(world, s) -
        (guarded.has(s.id) ? 4 : 0) -
        (s.stage >= 4 ? 3 : 0) -
        s.population / 300,
    }))
    // A site already stripped of everything that runs is not worth the walk,
    // and a yard hit two nights ago has nothing new in it either.
    .filter((c) => c.threat > 1 && sim.day - (sim.lastRaid[c.s.id] ?? -99) > 2)

  const activeCamps = world.camps.filter((c) => c.active).length
  const exposed = candidates.filter((c) => !guarded.has(c.s.id)).length
  const tonight =
    Math.min(
      RAID_CHANCE_CAP,
      RAID_BASE + RAID_PER_CAMP * activeCamps + RAID_PER_EXPOSED_SITE * exposed,
    ) * (sim.warned ? 0.7 : 1)

  if (candidates.length > 0 && roll() < tonight) {
    // Where they go is a weighted draw, so a guarded or hardened site is
    // rarely the one they pick rather than merely a slower night's work.
    const total = candidates.reduce((sum, c) => sum + c.threat, 0)
    let cursor = roll() * total
    const hit = candidates.find((c) => (cursor -= c.threat) <= 0) ?? candidates[0]
    const s = hit.s

    // Someone standing in the yard is the whole defence. They do not fight
    // over it; they go and find an easier one.
    if (guarded.has(s.id)) {
      sim.lastRaid[s.id] = sim.day
      say('good', `Raiders came as far as ${s.name}, saw the watch, and turned round.`)
    } else {
      // They carry off what is lying in the site's cache, which is drawn from
      // the project's stock. An empty stock is its own kind of protection.
      const stolen = Math.min(Math.floor(sim.stock.copper), 2 + Math.floor(roll() * 3))
      sim.stock.copper -= stolen
      const hardened = s.stage >= 4
      const wrecked = roll() < (hardened ? WRECK_CHANCE_HARDENED : WRECK_CHANCE)
      const took = stolen > 0 ? `${stolen} copper gone` : 'the cache was already empty'
      sim.lastRaid[s.id] = sim.day
      if (wrecked) {
        // The mast and the trench stay; what walks off is the generator. The
        // site drops to installed and needs a power kit before it keys again,
        // which is a parts-and-steel problem rather than a copper one — so a
        // run of bad nights can never lock the project out of its own repairs.
        s.stage = Math.max(2, s.stage - 1) as BuildStage
        s.supply = 'none'
        s.power = 'None — generator stolen'
        s.cold = false
        s.alert = {
          kind: 'off-air',
          message: '\u{1F977} RAYAP BESI RAID',
          detail: `The generator is gone. Everything behind ${s.name} is off the air until a wireman brings a new one.`,
        }
        say('bad', `Raid on ${s.name}: ${took}, and the generator with it. The site is off the air.`)
      } else {
        say('bad', `Raiders hit ${s.name} — ${took}. The mast held.`)
      }
    }
  }

  // The rumour net's payoff: a named target for tomorrow night, in time to
  // post somebody on it.
  if (sim.warned) {
    const next = world.settlements
      .filter((s) => s.stage >= 2 && !s.alert)
      .map((s) => ({ s, risk: raidRisk(world, sim, s) }))
      .filter((c) => c.risk.level === 'high' || c.risk.level === 'medium')
      .sort((a, b) => b.risk.threat - a.risk.threat)[0]
    if (next) {
      next.s.alert = {
        kind: 'raid-in-progress',
        message: '\u{1F977} RAYAP BESI — HEARD ON THE NET',
        detail: `Three settlements have passed the same word: they are working toward ${next.s.name} tomorrow night. Somebody standing in the yard is what stops it.`,
      }
      say('info', `Rumour net: ${next.s.name} is the yard they are talking about. Post a watch on it.`)
    }
  }

  for (const camp of world.camps) {
    if (camp.active || camp.returnsOn === null) continue
    if (sim.day < camp.returnsOn) continue
    if (sim.stock.rations >= REGION_FED_RATIONS) {
      camp.returnsOn = sim.day + 4
      say('info', `${camp.name} stayed empty. There is food moving on that road now.`)
      continue
    }
    camp.active = true
    camp.returnsOn = null
    say('bad', `${camp.name} is occupied again. Hungry people, and copper that is easy to carry.`)
  }

  refreshLinks(world)

  // --- act 1 goal ---------------------------------------------------------
  const onAfterNight = reachableFrom(world)
  sim.serangStreak = onAfterNight.has('serang') ? sim.serangStreak + 1 : 0
  // The mentor will not sign off on uptime alone. Serang hangs off Tangerang
  // by a single thread, and a circuit that survives only while nothing goes
  // wrong is not a circuit he will call built.
  const tangerang = byId.get('tangerang')!
  if (sim.serangStreak >= ACT1_STREAK && !sim.actComplete) {
    if (tangerang.stage >= 4) {
      sim.actComplete = true
      say('good', `${ACT1_STREAK} days of unbroken contact with Serang, over a relay that can take a hit. Act 1 complete.`)
    } else if (sim.serangStreak === ACT1_STREAK) {
      say('info', 'The mentor looks at the Serang trace and then at Tangerang. "Harden that relay first. Then it is a circuit."')
    }
  }

  sim.day += 1
  return { world, sim, moves }
}
