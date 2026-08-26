/**
 * Isometric projection helpers.
 *
 * World space is a square tile grid: `tx` runs east, `ty` runs south.
 * Screen space is a 2:1 diamond projection, so one tile is TILE_W wide and
 * TILE_H tall. Elevation lifts a tile straight up the screen by ELEV_STEP,
 * which is what makes towers and hills read as having real height.
 */

export const TILE_W = 64
export const TILE_H = 32
export const ELEV_STEP = 20

export interface Point {
  x: number
  y: number
}

/** Tile coordinate + elevation -> screen position of the tile's top-face centre. */
export function isoToScreen(tx: number, ty: number, elev = 0): Point {
  return {
    x: (tx - ty) * (TILE_W / 2),
    y: (tx + ty) * (TILE_H / 2) - elev * ELEV_STEP,
  }
}

/**
 * Screen position -> fractional tile coordinate at ground level.
 *
 * `isoToScreen` maps a tile to the CENTRE of its top face, so this inverse is
 * centre-relative too: a point anywhere inside tile (5, 7)'s diamond returns
 * a value in [4.5, 5.5] x [6.5, 7.5]. Round it to get the tile, never floor.
 */
export function screenToIso(x: number, y: number): Point {
  const a = x / (TILE_W / 2)
  const b = y / (TILE_H / 2)
  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
  }
}

/** True when a screen point lies inside the diamond of a tile's top face. */
export function insideTopFace(px: number, py: number, centre: Point): boolean {
  const dx = Math.abs(px - centre.x) / (TILE_W / 2)
  const dy = Math.abs(py - centre.y) / (TILE_H / 2)
  return dx + dy <= 1
}

/**
 * Pick the tile whose top face is visible at a screen point.
 *
 * The flat inverse is not enough: a tile at elevation e is drawn e * ELEV_STEP
 * higher up the screen, so the tile actually under the cursor is further from
 * the camera than the ground-level answer. Undo that shift one elevation step
 * at a time, from the highest terrain downward — the first tile whose diamond
 * really contains the point is also the one drawn on top of the others, since
 * a higher lift means a larger tx + ty means a later draw.
 */
export function pickTile(
  x: number,
  y: number,
  lookup: (tx: number, ty: number) => { elev: number } | undefined,
  maxElev: number,
  step = 0.25,
): Point | null {
  for (let elev = maxElev; elev >= -1e-9; elev -= step) {
    const iso = screenToIso(x, y + elev * ELEV_STEP)
    const tx = Math.round(iso.x)
    const ty = Math.round(iso.y)
    const tile = lookup(tx, ty)
    if (!tile) continue
    // Re-project with the tile's true height and test the diamond exactly,
    // so terrain that does not sit on the scan step is still picked.
    if (insideTopFace(x, y, isoToScreen(tx, ty, tile.elev))) return { x: tx, y: ty }
  }
  return null
}

/**
 * Painter's-algorithm sort key. Tiles further from the camera (smaller
 * tx + ty) draw first. The elevation term keeps tall objects layered above
 * the ground they stand on, and `bias` separates props from their own tile.
 */
export function depthOf(tx: number, ty: number, elev = 0, bias = 0): number {
  return (tx + ty) * 16 + elev * 4 + bias
}
