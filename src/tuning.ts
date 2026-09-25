/**
 * Era 1 — the tuning bench, run once per site as it goes on the air.
 *
 * One dial and one meter. The scale has two halves with a dead gap between
 * them, and one carrier hiding in each half: drag until the meter climbs, stop
 * on the peak, lock it in. Which half you stopped in is the site's band, and
 * how near the peak you got is its trim.
 *
 * That is the whole interaction, deliberately — it is a console task, not a
 * system. What makes it worth stopping for is the picture beside it: the reach
 * redrawn as the dial moves, so the skip zone stops being a glossary entry and
 * becomes a hole you can see your neighbours fall into.
 *
 * Nothing here knows about React or the day loop. `sim.ts` builds a
 * `TuningSeat` and takes a `Tuning` back.
 */

import type { Band } from './world'

// --- the dial ----------------------------------------------------------------

/**
 * The scale, in kHz, and the gap that splits it.
 *
 * A real set would tune continuously across the whole range; the gap is here
 * because the choice being made is *which kind of propagation*, and a scale
 * with a hole in the middle says that in one look. Nothing transmits between
 * `GROUND_TOP` and `SKY_BOTTOM`.
 */
export const DIAL_LOW = 1600
export const DIAL_HIGH = 7400
export const GROUND_TOP = 3000
export const SKY_BOTTOM = 5000
export const DIAL_STEP = 20

/** How far off the carrier the meter still hears anything, in kHz. */
const WINDOW = 320

/**
 * Trim at a dead miss and at dead on.
 *
 * Floored well above zero on purpose. A botched tune should cost speed on
 * every circuit the site carries, and it should never take the site off the
 * air — that is what `wear` and a lost generator are for, and a minigame that
 * can brick a site is a minigame players stop trusting.
 */
const TRIM_FLOOR = 0.6
const TRIM_TOP = 1

/** Where a site's two carriers sit. Fixed by its name, so a place has a channel. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

export interface Carriers {
  ground: number
  sky: number
}

export function carriersOf(id: string): Carriers {
  const h = hash(id)
  // Kept a window clear of each end of its half, so no carrier is unreachable
  // and none of them sits on the dead gap.
  return {
    ground: 1900 + (h % 9) * 100,
    sky: 5300 + ((h >>> 8) % 17) * 100,
  }
}

export const bandAt = (khz: number): Band => (khz <= (GROUND_TOP + SKY_BOTTOM) / 2 ? 'ground' : 'sky')

/**
 * What the meter reads at this point on the dial: 0 in the hiss, 1 on the nose.
 *
 * Only the carrier in the half you are standing in counts. Drifting across the
 * gap does not pick the other one up faintly — they are different propagation,
 * not two stations on one band.
 */
export function signalAt(carriers: Carriers, khz: number): number {
  const carrier = bandAt(khz) === 'ground' ? carriers.ground : carriers.sky
  return Math.max(0, 1 - Math.abs(khz - carrier) / WINDOW)
}

// --- what the day loop passes back and forth ----------------------------------

/** Everything the bench needs about the site being brought up. */
export interface TuningSeat {
  memberId: string
  target: string
  targetName: string
  /** Metres of antenna above sea level at this site. Sets the reach picture. */
  metres: number
  /**
   * Every neighbour this site has a circuit to.
   *
   * `band` and `holdsBoth` are here so the bench can say the other thing that
   * kills a circuit: propagation that works fine to a station already sitting
   * on the other half of the dial. Without it the strip shows a green dot and
   * the morning report shows a dead link, which is a mystery rather than a
   * lesson.
   */
  neighbours: Array<{
    id: string
    name: string
    km: number
    metres: number
    band: Band
    /** Already transmitting, so its band is a fact rather than a plan. */
    live: boolean
    /** Hardened: holds both halves of the dial and will meet you either way. */
    holdsBoth: boolean
  }>
}

/** What the bench decided. */
export interface Tuning {
  memberId: string
  target: string
  khz: number
  band: Band
  trim: number
  /** True when a clerk did it rather than the player. */
  auto: boolean
}

export function tuningFor(seat: TuningSeat, khz: number, auto = false): Tuning {
  const signal = signalAt(carriersOf(seat.target), khz)
  return {
    memberId: seat.memberId,
    target: seat.target,
    khz,
    band: bandAt(khz),
    trim: TRIM_FLOOR + (TRIM_TOP - TRIM_FLOOR) * signal,
    auto,
  }
}

/**
 * The bench as an operator with somewhere else to be would leave it: on the
 * ground wave, somewhere in the right neighbourhood, not on the nose.
 *
 * This is what the skip button leaves behind and what a site nobody stopped at
 * falls back to, so handing it over is a known, mediocre result rather than a
 * dice roll — and `tools/era1-balance.ts` can drive a run without a screen.
 */
export function autoTuning(seat: TuningSeat): Tuning {
  const { ground } = carriersOf(seat.target)
  const off = ((hash(`${seat.target}|${seat.memberId}`) % 9) - 4) * DIAL_STEP
  return tuningFor(seat, ground + off * 2, true)
}
