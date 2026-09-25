/**
 * Where a settlement is drawn, for every screen that draws the region flat.
 *
 * Two screens do: the routing table watches a packet cross the network, and a
 * chapter's opening watches a message cross the region in whatever way that
 * era can manage. They have to agree about where Bekasi is, so the projection
 * lives here and neither of them owns it.
 *
 * Nine of the thirteen sites are inside one 24 km cluster around the old city,
 * and Serang is 70 km west of all of them. Drawn to true proportions that
 * cluster is a smudge, so the region is stretched horizontally: north is still
 * up, west is still left, and every site is still at its own longitude — it is
 * the scale that differs between the axes, which is what a strip map has
 * always done.
 */

import { SETTLEMENTS } from './world'

export const W = 1200
export const H = 260
export const PAD = 26

const LON = { min: Math.min(...SETTLEMENTS.map((s) => s.lon)), max: Math.max(...SETTLEMENTS.map((s) => s.lon)) }
const LAT = { min: Math.min(...SETTLEMENTS.map((s) => s.lat)), max: Math.max(...SETTLEMENTS.map((s) => s.lat)) }

const BY_ID = new Map(SETTLEMENTS.map((s) => [s.id, s]))

/** Where a site is drawn. Straight from its real longitude and latitude. */
export function xy(id: string): { x: number; y: number } {
  const site = BY_ID.get(id)!
  return {
    x: PAD + ((site.lon - LON.min) / (LON.max - LON.min)) * (W - PAD * 2),
    // Latitude is negative going south, so north is the smaller y.
    y: PAD + ((LAT.max - site.lat) / (LAT.max - LAT.min)) * (H - PAD * 2),
  }
}

/** Sites whose name is written under the dot, to keep it off a neighbour's. */
export const LABEL_BELOW = new Set(['kebayoran', 'cawang'])

/** Names at the edge are written inward, or half of them would be outside the box. */
export const anchorAt = (x: number) => (x < 70 ? 'start' : x > W - 70 ? 'end' : 'middle')

/** How big a dot a settlement gets: the tiers really are different sizes of place. */
export const dotSize = (tier: string) => (tier === 'hq' ? 6 : tier === 'relay' ? 4.5 : 3.5)
