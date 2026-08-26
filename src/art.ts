/**
 * Procedural sprite generation.
 *
 * The whole map is drawn from Graphics baked into GPU textures at startup, so
 * the project ships with no image assets. Each generated texture reports the
 * anchor that maps its "ground point" onto a tile's top-face centre, computed
 * from the geometry rather than guessed, so nothing floats or sinks.
 */

import { Graphics, Texture, type Renderer } from 'pixi.js'
import { TILE_W, TILE_H } from './iso'
import type { Terrain } from './world'

/** Skirt drawn below every tile's top face so height differences read as cliffs. */
const SIDE_H = 72

export interface Baked {
  texture: Texture
  anchorX: number
  anchorY: number
}

/** Multiply an RGB hex by `f`, clamped. Used for the two shaded side faces. */
function shade(color: number, f: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * f))
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * f))
  const b = Math.min(255, Math.round((color & 0xff) * f))
  return (r << 16) | (g << 8) | b
}

const TERRAIN_COLOR: Record<Terrain, number> = {
  sea: 0x14323f,
  shallow: 0x1d4a58,
  sand: 0x8a7d5e,
  marsh: 0x49543f,
  grass: 0x5c6b45,
  scrub: 0x6b6a48,
  rubble: 0x6a6259,
  road: 0x6f6552,
  river: 0x2c4a55,
  hill: 0x7a6d55,
}

/**
 * Tracks the vertical extent of whatever we draw, so the anchor can be derived
 * instead of hand-tuned. Pixi trims generated textures to the drawn bounds.
 */
class Extent {
  min = Infinity
  max = -Infinity
  add(...ys: number[]) {
    for (const y of ys) {
      if (y < this.min) this.min = y
      if (y > this.max) this.max = y
    }
  }
  /** Anchor that lands `groundY` on the sprite's placement point. */
  anchorFor(groundY: number): number {
    return (groundY - this.min) / (this.max - this.min)
  }
}

function bake(renderer: Renderer, g: Graphics, anchorX: number, anchorY: number): Baked {
  const texture = renderer.generateTexture({ target: g, resolution: 2, antialias: true })
  g.destroy()
  return { texture, anchorX, anchorY }
}

/** Draw an isometric cuboid standing on the ground point (cx, cy). */
function isoBox(
  g: Graphics, cx: number, cy: number, footprint: number, height: number,
  color: number, extent?: Extent,
) {
  const hw = (footprint * TILE_W) / 2
  const hh = (footprint * TILE_H) / 2
  const ty = cy - height

  g.poly([cx - hw, ty, cx, ty + hh, cx, cy + hh, cx - hw, cy]).fill(shade(color, 0.6))
  g.poly([cx + hw, ty, cx, ty + hh, cx, cy + hh, cx + hw, cy]).fill(shade(color, 0.44))
  g.poly([cx, ty - hh, cx + hw, ty, cx, ty + hh, cx - hw, ty]).fill(color)

  extent?.add(ty - hh, cy + hh)
}

/**
 * One terrain tile: a diamond top face plus left/right skirt faces.
 * Drawn with the bounding box top-left at (0, 0) so the anchor is exact.
 */
function tileGraphic(color: number, speckle: number): Graphics {
  const g = new Graphics()
  const left = shade(color, 0.62)
  const right = shade(color, 0.46)
  const midY = TILE_H / 2

  g.poly([0, midY, TILE_W / 2, TILE_H, TILE_W / 2, TILE_H + SIDE_H, 0, midY + SIDE_H]).fill(left)
  g.poly([TILE_W, midY, TILE_W / 2, TILE_H, TILE_W / 2, TILE_H + SIDE_H, TILE_W, midY + SIDE_H]).fill(right)
  g.poly([TILE_W / 2, 0, TILE_W, midY, TILE_W / 2, TILE_H, 0, midY]).fill(color)

  // A few dots of lighter tone break up the flat fill without needing noise textures.
  for (let i = 0; i < speckle; i++) {
    const a = Math.random() * Math.PI * 2
    const r = Math.random() * 0.6
    g.circle(TILE_W / 2 + Math.cos(a) * r * (TILE_W / 2), midY + Math.sin(a) * r * midY, 1.2)
      .fill({ color: shade(color, 1.25), alpha: 0.5 })
  }

  return g
}

/**
 * A lattice radio mast. `height` is in pixels, measured from the footing to the
 * top platform; the returned anchor puts the footing on the tile surface.
 */
function towerGraphic(height: number, accent: number): { g: Graphics; anchorY: number } {
  const g = new Graphics()
  const extent = new Extent()
  const baseHalf = Math.max(7, height * 0.11)
  const topHalf = 2.6
  const cx = baseHalf + 2
  const groundY = height + 24
  const steel = 0xb9b3a4
  const dark = 0x6e6a60

  const legX = (t: number, side: 1 | -1) => cx + side * (baseHalf + (topHalf - baseHalf) * t)
  const legY = (t: number) => groundY - t * height

  // Cross bracing, drawn first so the legs sit on top of it.
  const bays = Math.max(4, Math.round(height / 13))
  for (let i = 0; i < bays; i++) {
    const t0 = i / bays
    const t1 = (i + 1) / bays
    g.moveTo(legX(t0, -1), legY(t0)).lineTo(legX(t1, 1), legY(t1)).stroke({ width: 1.2, color: dark })
    g.moveTo(legX(t0, 1), legY(t0)).lineTo(legX(t1, -1), legY(t1)).stroke({ width: 1.2, color: dark })
    g.moveTo(legX(t1, -1), legY(t1)).lineTo(legX(t1, 1), legY(t1)).stroke({ width: 1, color: dark })
  }

  g.moveTo(legX(0, -1), legY(0)).lineTo(legX(1, -1), legY(1)).stroke({ width: 2, color: steel })
  g.moveTo(legX(0, 1), legY(0)).lineTo(legX(1, 1), legY(1)).stroke({ width: 2, color: steel })

  // Whip antenna and the beacon that marks a live site.
  const topY = groundY - height
  g.moveTo(cx, topY).lineTo(cx, topY - 11).stroke({ width: 1.6, color: steel })
  g.circle(cx, topY - 13, 3).fill(accent)
  g.circle(cx, topY - 13, 5.5).fill({ color: accent, alpha: 0.22 })
  extent.add(topY - 19)

  isoBox(g, cx, groundY, 0.34, 5, 0x847e70, extent)
  return { g, anchorY: extent.anchorFor(groundY) }
}

/** A cluster of low buildings, sized by settlement tier. */
function settlementGraphic(scale: number, roof: number): { g: Graphics; anchorY: number } {
  const g = new Graphics()
  const extent = new Extent()
  const blocks: Array<[number, number, number, number]> = [
    [-16, 6, 0.5, 16], [10, 4, 0.42, 12], [-2, 14, 0.55, 20],
    [18, 14, 0.36, 10], [-20, 18, 0.34, 9], [2, -4, 0.4, 13],
  ]
  for (const [dx, dy, fp, h] of blocks) {
    isoBox(g, dx * scale, dy * scale, fp * scale, h * scale, roof, extent)
  }
  return { g, anchorY: extent.anchorFor(0) }
}

/**
 * Broken slabs of the old city. Deliberately low and pale: tall dark shapes
 * read as a forest of monoliths rather than as a collapsed skyline.
 */
function ruinGraphic(variant: number): { g: Graphics; anchorY: number } {
  const g = new Graphics()
  const extent = new Extent()
  const shapes: Array<Array<[number, number, number, number, number]>> = [
    [[-5, 2, 0.26, 7, 0x7d746a], [5, 5, 0.18, 4, 0x8a8176]],
    [[0, 1, 0.3, 5, 0x847b70], [8, 6, 0.14, 9, 0x776e64]],
    [[-7, 4, 0.16, 10, 0x6f675e], [3, 0, 0.24, 4, 0x8a8176], [9, 7, 0.14, 3, 0x7d746a]],
  ]
  for (const [dx, dy, fp, h, color] of shapes[variant % shapes.length]) {
    isoBox(g, dx, dy, fp, h, color, extent)
  }
  return { g, anchorY: extent.anchorFor(0) }
}

/**
 * Marker floating over a scavengeable ruin. Deliberately cool-toned: amber is
 * the network, red is an alarm, so salvage gets its own channel.
 */
function salvageGraphic(state: 'untouched' | 'picked' | 'stripped'): { g: Graphics; anchorY: number } {
  const g = new Graphics()
  const tint = state === 'untouched' ? 0x5fe3c0 : state === 'picked' ? 0x9fd0a8 : 0x6f7f88
  const dim = state === 'stripped' ? 0.45 : 1

  g.poly([0, 0, 9, 10, 0, 20, -9, 10]).fill({ color: 0x0d1418, alpha: 0.85 * dim })
  g.poly([0, 0, 9, 10, 0, 20, -9, 10]).stroke({ width: 2, color: tint, alpha: dim })
  // A claw-and-crate glyph: something worth pulling out of the rubble.
  g.rect(-4, 7, 8, 6).stroke({ width: 1.6, color: tint, alpha: dim })
  g.moveTo(-4, 10).lineTo(4, 10).stroke({ width: 1.2, color: tint, alpha: 0.8 * dim })
  return { g, anchorY: 1 }
}

export interface ArtSet {
  tiles: Record<Terrain, Baked>
  towers: Map<string, Baked>
  settlements: Record<'hq' | 'relay' | 'outpost', Baked>
  ruins: Baked[]
  salvage: Record<'untouched' | 'picked' | 'stripped', Baked>
  marker: Baked
}

/** Metres of mast map to pixels at this rate. */
export const MAST_PX_PER_M = 2.1

export function bakeArt(renderer: Renderer, mastHeights: Map<string, number>): ArtSet {
  const tiles = {} as Record<Terrain, Baked>
  const tileAnchorY = TILE_H / 2 / (TILE_H + SIDE_H)
  for (const key of Object.keys(TERRAIN_COLOR) as Terrain[]) {
    const speckle = key === 'sea' || key === 'shallow' ? 0 : 6
    tiles[key] = bake(renderer, tileGraphic(TERRAIN_COLOR[key], speckle), 0.5, tileAnchorY)
  }

  const towers = new Map<string, Baked>()
  for (const [id, metres] of mastHeights) {
    const { g, anchorY } = towerGraphic(metres * MAST_PX_PER_M, 0xffb347)
    towers.set(id, bake(renderer, g, 0.5, anchorY))
  }

  const settlements = {} as ArtSet['settlements']
  for (const [tier, scale] of [['hq', 1.15], ['relay', 0.85], ['outpost', 0.6]] as const) {
    const roof = tier === 'hq' ? 0x8a6f52 : tier === 'relay' ? 0x7d6a55 : 0x6f6152
    const { g, anchorY } = settlementGraphic(scale, roof)
    settlements[tier] = bake(renderer, g, 0.5, anchorY)
  }

  const salvage = {} as ArtSet['salvage']
  for (const state of ['untouched', 'picked', 'stripped'] as const) {
    const { g, anchorY } = salvageGraphic(state)
    salvage[state] = bake(renderer, g, 0.5, anchorY)
  }

  const ruins = [0, 1, 2].map((v) => {
    const { g, anchorY } = ruinGraphic(v)
    return bake(renderer, g, 0.5, anchorY)
  })

  const markerG = new Graphics()
  markerG
    .poly([TILE_W / 2, 0, TILE_W, TILE_H / 2, TILE_W / 2, TILE_H, 0, TILE_H / 2])
    .stroke({ width: 2, color: 0xffd479, alpha: 0.95 })

  return {
    tiles,
    towers,
    settlements,
    ruins,
    salvage,
    marker: bake(renderer, markerG, 0.5, 0.5),
  }
}
