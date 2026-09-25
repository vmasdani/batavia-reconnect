/**
 * Game state lives here, outside both React and Pixi.
 *
 * React renders the panels from it and Pixi renders the map from it; neither
 * owns it. That split is what keeps the 60fps camera loop from dragging the
 * React reconciler along with it.
 *
 * The rules of a day live in `sim.ts`. This file only holds the current world
 * and run state and hands them to the resolver.
 */

import { create } from 'zustand'
import { buildWorld, type EraId, type World } from './world'
import type { Scene } from './skits'
import { PARTY, type PartyMember } from './party'
import {
  SURVEY_CREW,
  handoff,
  newSurvey,
  order as orderSurvey,
  parleySeats,
  resolveSurveyDay,
  sendLetter as postLetter,
  type Survey,
  type SurveyTask,
} from './era0'
import type { ParleyResult, ParleySeat } from './parley'
import type { Tuning, TuningSeat } from './tuning'
import {
  newSim,
  refreshLinks,
  resolveDay,
  tuningSeats,
  taskOptions,
  assign,
  type Focus,
  type Kits,
  type LogEntry,
  type Move,
  type Sim,
  type Stock,
  type Task,
} from './sim'

export { reachableFrom } from './sim'
export { availableSkits } from './skits'

/**
 * The crew as the map needs them, whichever era is loaded.
 *
 * Both resolvers produce the same four facts about a person — where they are,
 * what they were told to do, how long it has left, and whether they are laid
 * up — because the map draws exactly those and nothing else. Sharing the shape
 * is what lets one `PixiMap` serve two rule sets without knowing about either.
 */
export interface CrewView {
  at: string
  task: { kind: string; target?: string }
  daysLeft: number
  hurtDays: number
}

export function crewNow(): { roster: PartyMember[]; state: Record<string, CrewView> } {
  const { era, sim, survey } = useGame.getState()
  return era === 0
    ? { roster: SURVEY_CREW, state: survey.crew }
    : { roster: PARTY, state: sim.crew }
}

/**
 * Last night as the player reads it: what happened, and what the depot held
 * before any of it did. The ledger is a straight diff against the current
 * stock rather than a tally the resolver keeps, so it cannot disagree with it.
 */
export interface Report {
  day: number
  log: LogEntry[]
  /** Era 1 only: what the depot held before the night, for the ledger. */
  before?: { stock: Stock; kits: Kits }
}

/**
 * The night, once every exchange at a gate has been settled.
 *
 * Era 0's day is resolved in one go, but the parleys inside it are played by
 * hand, so the click that ends the day and the resolution of that day are not
 * the same moment. Both paths land here with the same shape.
 */
function surveyNight(world: World, survey: Survey, results: Record<string, ParleyResult>) {
  const { survey: next, moves } = resolveSurveyDay(world, survey, results)
  const report: Report = { day: survey.day, log: next.log }
  return moves.length === 0
    ? { survey: next, report, playing: null, pending: null, parleys: [], parleyResults: {} }
    : { survey: next, report: null, playing: moves, pending: report, parleys: [], parleyResults: {} }
}

/** The night, once every set going up tonight has been netted onto a channel. */
function era1Night(world: World, sim: Sim, tunings: Record<string, Tuning>) {
  const { moves, ...next } = resolveDay(world, sim, tunings)
  const report: Report = {
    day: sim.day,
    log: next.sim.log,
    before: { stock: { ...sim.stock }, kits: { ...sim.kits } },
  }
  // The report is what the player actually reads, so it is held in a dialog
  // rather than scrolling past in a side panel — but not over the top of the
  // day being driven out on the map.
  return moves.length === 0
    ? { ...next, report, playing: null, pending: null, tunings: [], tuned: {} }
    : { ...next, report: null, playing: moves, pending: report, tunings: [], tuned: {} }
}

interface GameState {
  /**
   * Which era is loaded. The eras share this store because they share the
   * world, the map and the day loop; they do not share rules, which is why
   * each has its own resolver rather than one resolver with era flags in it.
   */
  era: EraId
  world: World
  sim: Sim
  /** Era 0's run. Untouched while Era 1 is loaded, and the other way round. */
  survey: Survey
  selectedId: string | null
  hovered: { tx: number; ty: number } | null
  /**
   * The day the map is currently playing back, and the report waiting behind
   * it. Executing a day resolves it instantly; the animation is the only part
   * that takes time, so the report is held until the drive is over.
   */
  playing: Move[] | null
  pending: Report | null
  /** A ruin the player is inspecting. Mutually exclusive with `selectedId`. */
  selectedScavengeId: string | null
  /** A bandit camp the player is inspecting. */
  selectedCampId: string | null
  /** Last night, held open in a dialog until the player has read it. */
  report: Report | null
  /**
   * The skit being played and how far through it the player has read. Opening
   * one is always the player's choice, so this is never set by the resolver.
   */
  skit: Scene | null
  skitLine: number
  /**
   * The era whose opening scene has not been read yet, or null.
   *
   * Set when a playable era is loaded and cleared when the scene is read or
   * skipped, so the chapter plays once at the start of a run and never again —
   * including the run Era 0 hands to Era 1, which is a fresh Era 1 either way.
   * Kept here rather than in `sim`/`survey` because it is about the screen
   * having been shown, not about anything the day loop resolves.
   */
  opening: number | null
  /**
   * Exchanges at a gate that are waiting to be played, head first.
   *
   * Era 0's day loop is a batch — three people can finish three different
   * parleys on one click — so the conversations cannot be played from inside
   * it. Ending the day fills this queue instead, the modal plays the head, and
   * the day is resolved once the queue is empty. See `parleySeats`.
   */
  parleys: ParleySeat[]
  /** What each of them came to, keyed by the crew member who was at the table. */
  parleyResults: Record<string, ParleyResult>
  settleParley: (result: ParleyResult) => void
  /**
   * Sets that go on the air tonight and are waiting to be netted, head first.
   *
   * Era 1's own version of the same queue, and for the same reason: more than
   * one site can come up on a single click of End day, so the bench cannot be
   * played from inside `resolveDay`. See `tuningSeats`.
   */
  tunings: TuningSeat[]
  /** Where each bench was left, keyed by the crew member who was at the set. */
  tuned: Record<string, Tuning>
  settleTuning: (tuning: Tuning) => void
  enterEra: (era: EraId) => void
  /**
   * Take the prologue's end state into Era 1. Unlike `enterEra(1)`, which
   * starts Era 1 from its own hand-tuned opening, this derives the world and
   * the stores from what the survey actually left behind.
   */
  carryIntoEra1: () => void
  orderWalk: (memberId: string, task: SurveyTask, days: number) => void
  sendLetter: () => void
  select: (id: string | null) => void
  selectScavenge: (id: string | null) => void
  selectCamp: (id: string | null) => void
  setHovered: (tile: { tx: number; ty: number } | null) => void
  finishPlayback: () => void
  setFocus: (focus: Focus) => void
  order: (memberId: string, task: Task, days: number) => void
  standDown: (memberId: string) => void
  endDay: () => void
  dismissReport: () => void
  openSkit: (scene: Scene) => void
  advanceSkit: () => void
  closeSkit: () => void
  /**
   * Show an era's chapter, primer and briefing without playing it.
   *
   * Eras 2 to 7 are written but not built. They still have a scene, and the
   * technology each one is about is the point of the game, so the menu opens
   * them the same way a playable era opens — and stops where the map would be.
   */
  readEra: (era: number) => void
  dismissOpening: () => void
}

/** Day one, with every circuit derived from the hardware that is actually up. */
function openingWorld(era: EraId): World {
  const world = buildWorld(era)
  // Era 0 has no links to derive, and `refreshLinks` on an empty list is a
  // no-op, so this stays one path rather than two.
  refreshLinks(world)
  return world
}

export const useGame = create<GameState>((set, get) => ({
  era: 1,
  world: openingWorld(1),
  sim: newSim(),
  survey: newSurvey(),
  selectedId: 'batavia',
  hovered: null,
  playing: null,
  pending: null,
  selectedScavengeId: null,
  selectedCampId: null,
  report: null,
  skit: null,
  skitLine: 0,
  // Era 1 is what the page opens on, and its chapter should play the first
  // time it is looked at just as it does when it is chosen from the menu.
  opening: 1,
  parleys: [],
  parleyResults: {},
  tunings: [],
  tuned: {},
  // Selecting one kind of thing clears the others, so only one panel is open.
  select: (id) => set({ selectedId: id, selectedScavengeId: null, selectedCampId: null }),
  selectScavenge: (id) => set({ selectedScavengeId: id, selectedId: null, selectedCampId: null }),
  selectCamp: (id) => set({ selectedCampId: id, selectedId: null, selectedScavengeId: null }),
  setHovered: (hovered) => set({ hovered }),
  /**
   * Load an era. Re-entering the one already loaded keeps the run going, so
   * stepping out to the main menu and back does not throw a game away.
   */
  enterEra: (era) => {
    if (get().era === era) return
    set({
      era,
      world: openingWorld(era),
      // A fresh era is a fresh run of it; the other era's run is left alone.
      sim: era === 1 ? newSim() : get().sim,
      survey: era === 0 ? newSurvey() : get().survey,
      selectedId: 'batavia',
      selectedScavengeId: null,
      selectedCampId: null,
      hovered: null,
      playing: null,
      pending: null,
      report: null,
      skit: null,
      skitLine: 0,
      opening: era,
      parleys: [],
      parleyResults: {},
      tunings: [],
      tuned: {},
    })
  },
  carryIntoEra1: () => {
    const { world, sim } = handoff(get().survey)
    set({
      era: 1,
      world,
      sim,
      selectedId: 'batavia',
      selectedScavengeId: null,
      selectedCampId: null,
      hovered: null,
      playing: null,
      pending: null,
      report: null,
      skit: null,
      skitLine: 0,
      opening: 1,
      parleys: [],
      parleyResults: {},
      tunings: [],
      tuned: {},
    })
  },
  sendLetter: () => set({ survey: postLetter(get().world, get().survey) }),
  setFocus: (focus) => set({ sim: { ...get().sim, focus } }),
  order: (memberId, task, days) => set({ sim: assign(get().sim, memberId, task, days) }),
  orderWalk: (memberId, task, days) => set({ survey: orderSurvey(get().survey, memberId, task, days) }),
  standDown: (memberId) => set({ sim: assign(get().sim, memberId, { kind: 'idle' }, 0) }),
  endDay: () => {
    const { era, world, sim, survey } = get()
    if (era === 0) {
      // Anybody sitting down at a gate tonight is played before the day is,
      // because the day cannot be resolved until it knows how those went.
      const seats = parleySeats(world, survey)
      if (seats.length > 0) return set({ parleys: seats, parleyResults: {} })
      set(surveyNight(world, survey, {}))
      return
    }
    // Anything going on the air tonight is netted before the day is resolved,
    // because the day cannot derive a single circuit until it knows the band.
    const seats = tuningSeats(world, sim)
    if (seats.length > 0) return set({ tunings: seats, tuned: {} })
    set(era1Night(world, sim, {}))
  },
  /** One bench is done. Run the next, or resolve the day. */
  settleTuning: (tuning) => {
    const { world, sim, tunings, tuned } = get()
    const next = { ...tuned, [tuning.memberId]: tuning }
    const rest = tunings.slice(1)
    if (rest.length > 0) return set({ tunings: rest, tuned: next })
    set(era1Night(world, sim, next))
  },
  /**
   * One exchange is over. Play the next, or resolve the day.
   *
   * Rations promised at the first gate are taken off what the second gate can
   * be offered: two people out talking on the same day are spending from one
   * store, and a card the crew cannot actually deliver should not be on the
   * table at the second gate.
   */
  settleParley: (result) => {
    const { world, survey, parleys, parleyResults } = get()
    const results = { ...parleyResults, [result.memberId]: result }
    const spent = Object.values(results).reduce((sum, r) => sum + r.rationsSpent, 0)
    const rest = parleys.slice(1).map((seat) => ({ ...seat, rations: Math.max(0, survey.rations - spent) }))
    if (rest.length > 0) return set({ parleys: rest, parleyResults: results })
    set(surveyNight(world, survey, results))
  },
  /** Called by the map once the last token is parked. */
  finishPlayback: () => set({ playing: null, report: get().pending, pending: null }),
  dismissReport: () => set({ report: null }),
  readEra: (era) => set({ opening: era }),
  dismissOpening: () => set({ opening: null }),
  // The caller passes the scene rather than an id: Era 0's skits are
  // translated, so which text is being played is the caller's decision and not
  // something the store can look up.
  openSkit: (skit) => set({ skit, skitLine: 0 }),
  advanceSkit: () => {
    const { skit, skitLine } = get()
    if (!skit) return
    if (skitLine + 1 < skit.lines.length) set({ skitLine: skitLine + 1 })
    else get().closeSkit()
  },
  // Closing retires the skit whether or not it was read to the end: it was
  // opened deliberately, and a chip that will not go away is worse than a
  // conversation the player chose to walk out of.
  closeSkit: () => {
    const { skit, era, sim, survey } = get()
    if (!skit) return
    set({
      skit: null,
      skitLine: 0,
      ...(era === 0
        ? { survey: { ...survey, seenSkits: [...survey.seenSkits, skit.id] } }
        : { sim: { ...sim, seenSkits: [...sim.seenSkits, skit.id] } }),
    })
  },
}))


// A handle on the store for the dev server only, so a headless browser can put
// a run into a state that would otherwise take forty days of clicking to reach.
// `import.meta.env.DEV` is false in a built bundle, so this never ships.
if (import.meta.env.DEV) {
  ;(window as unknown as { __game?: typeof useGame }).__game = useGame
}

/** Everything the named member could be told to do today. */
export function ordersFor(memberId: string) {
  const { world, sim } = useGame.getState()
  return taskOptions(world, sim, memberId)
}
