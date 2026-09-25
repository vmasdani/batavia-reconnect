/**
 * One photograph per era, pixelated, to sit behind the story.
 *
 * The drawn scenes in `backdrops.tsx` say what an era is about. A photograph
 * says it happened: a real bombed street, real linemen up real poles, a real
 * hall of women at a switchboard. Every era in this game is a step somebody
 * actually took, and a photograph is the shortest way to say so.
 *
 * They are pixelated by `tools/pixelate.mjs` before they get here — 192 pixels
 * across, blown back up by the browser with `image-rendering: pixelated` — so a
 * photograph lands on the same grid as the map and the portraits instead of
 * reading as a photograph pasted into a drawn game. That also makes them small
 * enough to ship: the whole set is under half a megabyte.
 *
 * The credits come straight from the file the tool wrote, because these are
 * shown to a player and most of these licences are given on that condition.
 */

import credits from '../assets/pixel/credits.json'
import era0 from '../assets/pixel/era0.png'
import era1 from '../assets/pixel/era1.png'
import era2 from '../assets/pixel/era2.png'
import era3 from '../assets/pixel/era3.png'
import era4 from '../assets/pixel/era4.png'
import era5 from '../assets/pixel/era5.png'
import era6 from '../assets/pixel/era6.png'
import era7 from '../assets/pixel/era7.png'

export interface EraArt {
  src: string
  /** Who took it. Shown in the corner, linking to the file it came from. */
  credit: string
  license: string
  page: string
}

/**
 * Era 5 was written after these were fetched, so it has no photograph yet and
 * falls back to its drawn scene. The files are named for the era they were
 * pulled for, which is no longer the era they are shown in.
 */
const FILES: Record<number, string> = {
  0: 'era0.png',
  1: 'era1.png',
  2: 'era2.png',
  3: 'era3.png',
  4: 'era4.png',
  6: 'era5.png',
  7: 'era6.png',
  8: 'era7.png',
}
const SRC: Record<string, string> = {
  'era0.png': era0,
  'era1.png': era1,
  'era2.png': era2,
  'era3.png': era3,
  'era4.png': era4,
  'era5.png': era5,
  'era6.png': era6,
  'era7.png': era7,
}

/**
 * The photograph for an era, or nothing — an era with no picture yet falls back
 * to its drawn scene rather than to an empty rectangle.
 */
export function artFor(era: number): EraArt | undefined {
  const file = FILES[era]
  const credit = file ? (credits as Record<string, Omit<EraArt, 'src'>>)[file] : undefined
  return file && credit ? { src: SRC[file], ...credit } : undefined
}
