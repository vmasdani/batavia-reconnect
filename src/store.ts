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
  resolveSurveyDay,
  sendLetter as postLetter,
  type Survey,
  type SurveyTask,
} from './era0'
import {
  newSim,
  refreshLinks,
  resolveDay,
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
  opening: EraId | null
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
      const { survey: next, moves } = resolveSurveyDay(world, survey)
      const report: Report = { day: survey.day, log: next.log }
      if (moves.length === 0) set({ survey: next, report, playing: null, pending: null })
      else set({ survey: next, report: null, playing: moves, pending: report })
      return
    }
    const { moves, ...next } = resolveDay(world, sim)
    const report: Report = {
      day: sim.day,
      log: next.sim.log,
      before: { stock: { ...sim.stock }, kits: { ...sim.kits } },
    }
    // The report is what the player actually reads, so it is held in a dialog
    // rather than scrolling past in a side panel — but not over the top of the
    // day being driven out on the map.
    if (moves.length === 0) set({ ...next, report, playing: null, pending: null })
    else set({ ...next, report: null, playing: moves, pending: report })
  },
  /** Called by the map once the last token is parked. */
  finishPlayback: () => set({ playing: null, report: get().pending, pending: null }),
  dismissReport: () => set({ report: null }),
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
