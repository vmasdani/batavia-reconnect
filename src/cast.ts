/**
 * Everyone who speaks, playable or not.
 *
 * The four founders are the playable crew and carry the drawn portraits from
 * `party.ts`. Everyone else is generated from those four by
 * `npm run make:portraits` — same proportions, same shading, different palette
 * — so the whole cast is one style rather than four hand-drawn faces and eight
 * placeholders. The emoji fallback stays for anyone added before their sprite.
 *
 * The founders also have a second portrait, greyed and lined. The project runs
 * forty-one years and the story is partly about how long that is; the same
 * four faces at the end as at the start would quietly argue the opposite.
 *
 * `narrator` has no face on purpose. It is the game talking, not a person.
 */

import { PARTY } from './party'
import iwanPortrait from '../assets/cast/iwan.png'
import sariPortrait from '../assets/cast/sari.png'
import ayuPortrait from '../assets/cast/ayu.png'
import ratnaPortrait from '../assets/cast/ratna.png'
import hendraPortrait from '../assets/cast/hendra.png'
import dewiPortrait from '../assets/cast/dewi.png'
import fajarPortrait from '../assets/cast/fajar.png'
import anisaPortrait from '../assets/cast/anisa.png'
import bayuOld from '../assets/cast/bayu-old.png'
import melOld from '../assets/cast/mel-old.png'
import tajuddinOld from '../assets/cast/tajuddin-old.png'

/** The era from which the founders are drawn old. 2052: twenty-two years in. */
export const AGED_FROM = 5

const AGED: Record<string, string> = {
  bayu: bayuOld,
  mel: melOld,
  tajuddin: tajuddinOld,
}

export interface CastMember {
  id: string
  name: string
  /** Their trade, shown under the name on a title card. */
  role: string
  /** Drawn portrait, when one exists. */
  portrait?: string
  /** The same face late in the project, for those who live that long. */
  portraitOld?: string
  /** Stand-in for anyone added before their sprite is generated. */
  emoji?: string
  /** Their colour in dialogue, matching the map colours the crew already use. */
  color: number
}

const FOUNDERS: CastMember[] = PARTY.map((m) => ({
  id: m.id,
  name: m.name,
  role: m.className,
  portrait: m.portrait,
  portraitOld: AGED[m.id],
  color: m.color,
}))

/** Joins from Era 2 onward. See CHARACTER ROSTER in `spec.txt`. */
const LATER: CastMember[] = [
  { id: 'iwan', name: 'Iwan', role: 'Machinist', portrait: iwanPortrait, color: 0xffc06a },
  { id: 'sari', name: 'Sari', role: 'Lineman', portrait: sariPortrait, color: 0x9fd8ff },
  { id: 'ayu', name: 'Ayu', role: 'Switchman', portrait: ayuPortrait, color: 0xffe08a },
  { id: 'ratna', name: 'Ibu Ratna', role: 'Envoy', portrait: ratnaPortrait, color: 0xd8b4ff },
  { id: 'hendra', name: 'Hendra', role: 'Glassblower', portrait: hendraPortrait, color: 0xffa06a },
  { id: 'dewi', name: 'Dewi', role: 'Chemist', portrait: dewiPortrait, color: 0x8fe8c8 },
  { id: 'fajar', name: 'Fajar', role: 'Coder', portrait: fajarPortrait, color: 0x7fe0ff },
  { id: 'anisa', name: 'Anisa', role: 'Mathematician', portrait: anisaPortrait, color: 0xc0e88f },
]

export const NARRATOR: CastMember = {
  id: 'narrator',
  name: '',
  role: '',
  color: 0xa4b3ba,
}

export const CAST: CastMember[] = [...FOUNDERS, ...LATER]

const BY_ID = new Map([...CAST, NARRATOR].map((m) => [m.id, m]))

export const castById = (id: string) => BY_ID.get(id)

/** The face this era should use. Nobody is aged before `AGED_FROM`. */
export function portraitAt(member: CastMember, era = 0): string | undefined {
  return era >= AGED_FROM && member.portraitOld ? member.portraitOld : member.portrait
}

/** `#rrggbb` for a member's colour, or the dim ink if the id is unknown. */
export function castColor(id: string): string {
  const value = BY_ID.get(id)?.color ?? 0xa4b3ba
  return `#${value.toString(16).padStart(6, '0')}`
}
