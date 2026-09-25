/**
 * Era 0 — the exchange at the gate.
 *
 * This is the era's central action, and before this file existed it was a
 * single roll in `resolveSurveyDay`: every decision happened before the walk,
 * and the conversation was a dice throw with a good log line on the end of it.
 *
 * One sentence and one choice. They say what they need; you offer one of the
 * four things the crew actually has. Offer the right one and they are in; offer
 * the wrong one and they want a price, which is a second visit rather than a
 * closed door.
 *
 * It used to be bigger — a hidden fear as well as a hidden want, three rounds,
 * six cards and a running score. That is a puzzle to solve while the player is
 * already planning routes and deciding where the wood goes, and it was the
 * wrong thing to ask them to hold in their head. What is left is the part that
 * was always the point: the offers are the era's own economy, so choosing one
 * teaches boards and fires rather than teaching a minigame.
 *
 * Nothing here knows about React, the world, or `Survey`. `era0.ts` builds a
 * `ParleySeat` and hands it over, which keeps the dependency going one way.
 */

import type { Lang } from './lang'
import { ID_PARLEY } from './parley.id'

/** What this settlement needs. One per place, and it never changes. */
export type Want =
  /** Food, now. */
  | 'food'
  /** Somewhere to leave a message, so word stops depending on who walks past. */
  | 'word'
  /** Somebody to carry word to kin in another town. */
  | 'kin'
  /** Warning of what is coming over the ridge before it arrives. */
  | 'watched'

/**
 * The four things the crew can put on the table, one for each want.
 *
 * They are the era's economy — a sack, a plank, a stack of wood, a runner — so
 * every offer is a promise whose price the player already knows.
 */
export type CardId = 'rations' | 'board' | 'fire' | 'letter'

export const CARDS: CardId[] = ['rations', 'board', 'fire', 'letter']

const ANSWERS: Record<CardId, Want> = {
  rations: 'food',
  board: 'word',
  fire: 'watched',
  letter: 'kin',
}

/**
 * Rations the offer costs, when there are that many to give.
 *
 * The store is what it is: the crew hands over what it has, and the offer is
 * never off the table. An earlier version blocked it below 4 and that was a
 * wall — the larder sits near empty through the first fortnight, so a village
 * that needed food could not be won at all, and a headless run stalled at 3 of
 * 13 settlements and never moved again. What can be given is a price, not a
 * gate.
 */
export const CARD_RATIONS = 4

/** What this offer actually takes out of the store tonight. */
export const rationsCost = (inStore: number) => Math.min(CARD_RATIONS, Math.max(0, inStore))

// --- who is at the table -----------------------------------------------------

/**
 * Everything the exchange needs to know, assembled by `era0.ts`.
 *
 * A flat record rather than the run itself, so this file imports nothing from
 * the day loop and the day loop can import this one.
 */
export interface ParleySeat {
  memberId: string
  memberName: string
  className: string
  target: string
  targetName: string
  /** Where they stood before this. Never `talking` — that returns early. */
  before: 'found' | 'wary'
  /** Times the crew has made its case here, before today. */
  attempts: number
  /** What is in the store right now. Decides whether the offer can be made. */
  rations: number
  /** The high ground above them sees nothing, so a fire here would be a lie. */
  blindHill: boolean
  /** What they need. See `dealWants`. */
  want: Want
  /** Where the courier offer would carry their word. */
  kinId: string
  kinName: string
}

export interface ParleyState {
  seat: ParleySeat
  want: Want
  picked: CardId | null
}

/** What the day loop needs back. No types from `era0.ts` cross this line. */
export interface ParleyResult {
  memberId: string
  target: string
  /** Where they end up, or null when nothing moved. */
  contact: 'talking' | 'wary' | null
  card: CardId | null
  rationsSpent: number
  /** True when a clerk picked rather than the player. */
  auto: boolean
}

// --- what a place needs ------------------------------------------------------

/** FNV-1a, so a settlement id always means the same want in every run. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

const WANTS: Want[] = ['food', 'word', 'kin', 'watched']

/**
 * Deal a want to every settlement in the region.
 *
 * Dealt round-robin down a hash ordering rather than taken from each id's own
 * hash, because thirteen settlements sorted into four buckets by modulo is
 * lumpy: the first version handed `food` to seven of them and `watched` to one,
 * which makes the offer of food almost always right and a fire almost always
 * wrong. Round-robin is even by construction.
 *
 * Nothing here is seeded by the day or the run. A place needs what it needs, so
 * a player who worked Kebayoran out on their last visit is right about it on
 * this one — which is the whole reason `attempts` is worth anything.
 */
export function dealWants(ids: string[]): Map<string, Want> {
  const order = [...ids].sort((a, b) => hash(a) - hash(b))
  return new Map(order.map((id, i) => [id, WANTS[i % WANTS.length]]))
}

// --- playing -----------------------------------------------------------------

export function openParley(seat: ParleySeat): ParleyState {
  // A settlement whose high ground sees nobody cannot want to be watched.
  // Leaving that pair in would make a fire the right answer at a place the
  // roster already marks as blind, which reads as the game lying.
  return {
    seat,
    want: seat.want === 'watched' && seat.blindHill ? 'food' : seat.want,
    picked: null,
  }
}

export const isRight = (state: ParleyState, id: CardId) => ANSWERS[id] === state.want

export function playCard(state: ParleyState, id: CardId): ParleyState {
  return state.picked ? state : { ...state, picked: id }
}

/**
 * What the offer came to.
 *
 * Contact never goes backwards, here or anywhere else in the era: a wrong offer
 * costs the days it took to walk there and none of the ground already won. A
 * place that was merely found now wants a price, which is a second visit rather
 * than a closed door — and by then the player knows the answer.
 */
export function parleyResult(state: ParleyState, auto = false): ParleyResult {
  const card = state.picked
  const right = card !== null && isRight(state, card)
  return {
    memberId: state.seat.memberId,
    target: state.seat.target,
    contact: right ? 'talking' : state.seat.before === 'found' ? 'wary' : null,
    card,
    rationsSpent: card === 'rations' ? rationsCost(state.seat.rations) : 0,
    auto,
  }
}

/**
 * The offer a clerk would make: one of the four, without having listened.
 *
 * The skip button on the screen plays `blindCard` into the same state so the
 * player can see what was offered; this is the headless version of it, and the
 * two land on the same card. It is also what a seat with no player decision at
 * all falls back to, which keeps `tools/survey-balance.ts` able to
 * run forty days in sixty milliseconds. It is not a formula that approximates
 * the game — it *is* the game, played deaf, so the two cannot drift apart.
 */
export function blindCard(state: ParleyState): CardId {
  const { target, memberId, attempts } = state.seat
  // Seeded on the attempt as well as the place, so a clerk sent back to the
  // same gate tries something else rather than the same thing forever.
  return CARDS[hash(`${target}|${memberId}|${attempts}`) % CARDS.length]
}

export function autoParley(seat: ParleySeat): ParleyResult {
  const state = openParley(seat)
  return parleyResult(playCard(state, blindCard(state)), true)
}

// --- what is said ------------------------------------------------------------

export interface ParleyText {
  /** Heading over the exchange. */
  lead: string
  /** What they say they need. One line, and it is the whole puzzle. */
  wants: Record<Want, string>
  /** Offer labels, and the promise under each one. */
  cards: Record<CardId, { label: string; note: string }>
  /** What they say back, to the right offer and to a wrong one. */
  replies: Record<CardId, { good: string; bad: string }>
  verdict: { talking: string; wary: string }
  /** Chrome. */
  handOver: string
  handOverNote: string
  done: string
  autoNote: string
}

/**
 * The English text. `parley.id.ts` supplies the Indonesian at the same keys.
 *
 * The want line is the whole game, so it says what they need plainly. It used
 * to be a clue to be decoded alongside a second clue about what they feared,
 * which is one riddle too many for a screen the player reaches while they are
 * also working out who walks where tomorrow.
 */
const EN: ParleyText = {
  lead: 'They came out to the gate. Nobody has said no yet.',
  wants: {
    food: 'The cooking fires are out and it is the middle of the day. Nobody here has eaten since yesterday.',
    word: 'Every message they get comes from whoever happens to walk past, and half of it arrives too late to be worth having.',
    kin: 'Half this village has family in another town, and no way to send them a single word.',
    watched: 'There is a boy up on the ridge who has been there since before you arrived, watching the road.',
  },
  cards: {
    rations: { label: 'Rations', note: 'Out of the store, carried in and handed over.' },
    board: {
      label: 'A board on your gate',
      note: 'Somewhere to leave a message, so word stops waiting for the right runner.',
    },
    fire: {
      label: 'A fire on your hill',
      note: 'Wood laid and dry. It says one thing, and it says it before anybody walks.',
    },
    letter: { label: 'We carry your word', note: 'Whatever you want said, said where you cannot go.' },
  },
  replies: {
    rations: {
      good: 'The sacks go straight past the elders to the back of the crowd. Somebody starts a fire.',
      bad: 'They take it, and set it down where it was handed to them. Nobody looks at it again.',
    },
    board: {
      good: '"Where would it go — on the post, or inside?" They are already arguing about the post.',
      bad: 'A plank with paper on it. They have seen paper.',
    },
    fire: {
      good: 'The boy on the ridge is called down and asked how long the wood would need to stay dry.',
      bad: 'They look up at the hill, and then at each other. Nobody up there is waiting for anything.',
    },
    letter: {
      good: '3 people start talking at once, and all 3 of them name the same town.',
      bad: 'Nobody has anything they need said anywhere.',
    },
  },
  verdict: {
    talking: 'They are in. You come away with a name to ask for and a share of the harvest.',
    wary: 'Not this time. They ask what it would cost, and they do not believe the answer.',
  },
  handOver: 'Let them handle it',
  handOverNote: 'One offer, picked without listening.',
  done: 'Leave',
  autoNote: 'Handed over. The offer was made without listening.',
}

const PACKS: Partial<Record<Lang, ParleyText>> = { en: EN, id: ID_PARLEY }

/**
 * The pack in the player's language.
 *
 * English owns the structure and is the fallback, exactly as the story and the
 * skits do: a half-finished translation renders English rather than blank.
 */
export function parleyText(lang: Lang): ParleyText {
  return PACKS[lang] ?? EN
}

export const EN_PARLEY = EN
