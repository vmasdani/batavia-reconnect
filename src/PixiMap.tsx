/**
 * The map renderer.
 *
 * React mounts this once and then stays out of the way: Pixi owns the frame
 * loop, the camera and every sprite. The only traffic back to React is a
 * selection or hover callback, which is cheap and rare.
 */

import { useEffect, useRef } from 'react'
import {
  Application, Assets, Container, Graphics, Sprite, Text, Texture,
  type FederatedPointerEvent,
} from 'pixi.js'
import { isoToScreen, pickTile, depthOf, TILE_W, TILE_H } from './iso'
import { bakeArt, MAST_PX_PER_M, type Baked } from './art'
import { useGame, crewNow, reachableFrom } from './store'
import { fireLinks, fireSite } from './era0'
import { PROVINCE_NAMES, type Link, type Settlement, type World } from './world'
import type { Move } from './sim'
import truckSE from '../assets/truck/truck-se.png'
import truckSW from '../assets/truck/truck-sw.png'
import truckNW from '../assets/truck/truck-nw.png'
import truckNE from '../assets/truck/truck-ne.png'

/**
 * How long one leg of a day's playback takes. A day resolves in a single step,
 * so this drive is the only place the player sees the distance they spent it
 * on: long enough to read as a journey, short enough that four of them do not
 * become a cutscene.
 */
const LEG_SECONDS = { min: 1.1, max: 4.2, perTile: 1 / 7 }

/** How long the word over a destination hangs there before it is gone. */
const NOTE_SECONDS = 2.2

const NOTE_COLOR = { good: 0x8fe8d0, bad: 0xff6a5a, info: 0xffd9a0 } as const


const MIN_ZOOM = 0.16
const MAX_ZOOM = 2.6

/** Height in pixels of a settlement's mast, matching the baked tower sprite. */
function mastPixels(s: Settlement): number {
  return s.mast * MAST_PX_PER_M
}

/**
 * Per-tile shading, applied as a grey tint so ten terrain textures can cover
 * two thousand tiles without banding into flat plates. Two parts: a
 * deterministic jitter that breaks up the fill, and a height ramp that makes
 * relief readable at a glance.
 */
function tintFor(tx: number, ty: number, elev: number): number {
  const n = Math.sin(tx * 41.7 + ty * 289.3) * 43758.5453
  const jitter = n - Math.floor(n)
  const lift = 0.82 + Math.min(elev, 6) * 0.055
  const v = Math.max(0, Math.min(255, Math.round((212 + jitter * 38) * lift)))
  return (v << 16) | (v << 8) | v
}

function place(sprite: Sprite, baked: Baked, x: number, y: number) {
  sprite.anchor.set(baked.anchorX, baked.anchorY)
  sprite.position.set(x, y)
}

export function PixiMap() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    const app = new Application()

    const boot = async () => {
      await app.init({
        background: 0x0d1418,
        antialias: true,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio ?? 1, 2),
        autoDensity: true,
      })
      if (disposed) {
        app.destroy(true)
        return
      }
      host.appendChild(app.canvas)
      // `resizeTo` only takes effect on the next resize observation, so the
      // opening fit below would otherwise be computed against the renderer's
      // default size and land somewhere different on every load.
      app.renderer.resize(host.clientWidth, host.clientHeight)

      const { world } = useGame.getState()
      const art = bakeArt(
        app.renderer,
        new Map(world.settlements.filter((s) => s.mast > 0).map((s) => [s.id, s.mast])),
      )

      // --- scene graph -------------------------------------------------------
      const camera = new Container()
      const scene = new Container()      // terrain + props, depth sorted together
      const borders = new Container()    // province boundaries, draped on the ground
      const overlay = new Container()    // hover marker, sits above the ground
      const wires = new Container()      // links, drawn over the terrain
      const plans = new Container()      // where today's orders will take people
      scene.sortableChildren = true
      camera.addChild(scene, borders, overlay, wires, plans)

      // Everything drawn on the map is decoration; the only things that take a
      // click are the hit zones added to `overlay` below. This is not a
      // tidiness rule — the hover marker follows the cursor, so while it was
      // hit-testable it sat under every single click and swallowed it, and
      // nothing on the map could be selected with a real mouse.
      // Nothing drawn on the map takes a click of its own. Sprites were doing
      // that job before, and the hover marker — which follows the cursor by
      // definition — sat under every click and swallowed it, so with a real
      // mouse nothing on the map could be selected at all. Instead the stage
      // owns one picker, below, which answers a click with whichever site,
      // ruin or camp is nearest to it. That also settles overlaps by distance
      // rather than by draw order, which is what a player expects when a mast
      // stands next to a ruin.
      scene.interactiveChildren = false
      borders.interactiveChildren = false
      overlay.interactiveChildren = false
      wires.interactiveChildren = false
      plans.interactiveChildren = false
      app.stage.addChild(camera)

      // How far picking has to unwind the elevation lift.
      const maxElev = world.tiles.reduce((m, t) => Math.max(m, t.elev), 0)

      // --- terrain -----------------------------------------------------------
      for (const tile of world.tiles) {
        const baked = art.tiles[tile.terrain]
        const p = isoToScreen(tile.tx, tile.ty, tile.elev)
        const sprite = new Sprite(baked.texture)
        place(sprite, baked, p.x, p.y)
        sprite.zIndex = depthOf(tile.tx, tile.ty, tile.elev)
        // A deterministic per-tile tint. Without it, thousands of tiles sharing
        // ten textures read as flat blocks of colour rather than as ground.
        sprite.tint = tintFor(tile.tx, tile.ty, tile.elev)
        scene.addChild(sprite)

        // Scatter standing ruins on some of the rubble so the old city reads
        // as collapsed rather than merely discoloured.
        if (tile.terrain === 'rubble' && (tile.tx * 7 + tile.ty * 13) % 3 === 0) {
          const variant = (tile.tx * 5 + tile.ty * 3) % art.ruins.length
          const baked = art.ruins[variant]
          const ruin = new Sprite(baked.texture)
          place(ruin, baked, p.x, p.y)
          ruin.zIndex = depthOf(tile.tx, tile.ty, tile.elev, 2)
          scene.addChild(ruin)
        }
      }

      /**
       * Everything on the map that answers to a click, in world coordinates.
       * Filled in as the sites, ruins and camps are drawn.
       */
      interface Pick {
        kind: 'site' | 'ruin' | 'camp'
        id: string
        x: number
        y: number
        /** Height of the mast above the ground point, for site picks. */
        mast: number
      }
      const picks: Pick[] = []

      // Target sizes in world units, so they track the map as it zooms.
      const SITE_RX = TILE_W * 0.9
      const SITE_RY = TILE_H * 1.2
      const MAST_HALF_WIDTH = 24
      const RUIN_RX = TILE_W * 0.85
      const RUIN_RY = TILE_H * 1.3
      const RUIN_LIFT = 20
      // The camp's badge floats above its ground point; the target spans both,
      // so clicking the marker and clicking the ground it stands on both work.
      const CAMP_RADIUS = 30
      const CAMP_LIFT = 20

      const inside = (pick: Pick, dx: number, dy: number): boolean => {
        if (pick.kind === 'site') {
          const onGround = (dx * dx) / (SITE_RX * SITE_RX) + (dy * dy) / (SITE_RY * SITE_RY) <= 1
          const onMast = Math.abs(dx) <= MAST_HALF_WIDTH && dy <= 0 && dy >= -(pick.mast + 30)
          return onGround || onMast
        }
        if (pick.kind === 'ruin') {
          const oy = dy + RUIN_LIFT
          return (dx * dx) / (RUIN_RX * RUIN_RX) + (oy * oy) / (RUIN_RY * RUIN_RY) <= 1
        }
        return Math.hypot(dx, dy + CAMP_LIFT) <= CAMP_RADIUS
      }

      /** Whatever the click landed on, nearest first. */
      const pickAt = (local: { x: number; y: number }): Pick | null => {
        let best: Pick | null = null
        let bestDistance = Infinity
        for (const pick of picks) {
          const dx = local.x - pick.x
          const dy = local.y - pick.y
          if (!inside(pick, dx, dy)) continue
          const distance = Math.hypot(dx, dy)
          if (distance < bestDistance) {
            bestDistance = distance
            best = pick
          }
        }
        return best
      }

      // Drag state is declared before the site handlers because a click that
      // ends a pan must not also count as selecting a settlement.
      let dragging = false
      let panning = false
      let downAt = { x: 0, y: 0 }

      /**
       * Screen pixels the pointer may wander between press and release before
       * this counts as a drag rather than a click.
       *
       * A real mouse moves a few pixels while the button is going down, which
       * is why selecting a mast felt broken: the map panned those pixels and
       * the click was written off as a drag. Nothing moves inside the dead
       * zone, and a release inside it selects whatever is under the pointer.
       */
      const DEAD_ZONE = 7

      let last = { x: 0, y: 0 }

      // Sites that physically exist: on a circuit that is up, or on one that
      // is down. Purely surveyed sites have nothing standing yet.
      const built = new Set<string>()
      for (const link of world.links) {
        if (link.status === 'planned') continue
        built.add(link.from)
        built.add(link.to)
      }

      // --- province borders --------------------------------------------------
      // Drawn along the tile edges where the province id changes. Only between
      // two real provinces: a province/sea edge is just the coastline, which
      // the terrain already renders.
      const provinceLines = new Graphics()
      const provinceLabels: Text[] = []
      const centroids = new Map<number, { x: number; y: number; n: number }>()

      for (const tile of world.tiles) {
        if (tile.province === 0) continue
        const p = isoToScreen(tile.tx, tile.ty, tile.elev)

        const seen = centroids.get(tile.province) ?? { x: 0, y: 0, n: 0 }
        seen.x += p.x
        seen.y += p.y
        seen.n += 1
        centroids.set(tile.province, seen)

        const right = { x: p.x + TILE_W / 2, y: p.y }
        const bottom = { x: p.x, y: p.y + TILE_H / 2 }
        const left = { x: p.x - TILE_W / 2, y: p.y }

        const east = world.at(tile.tx + 1, tile.ty)
        if (east && east.province !== 0 && east.province !== tile.province) {
          provinceLines.moveTo(right.x, right.y).lineTo(bottom.x, bottom.y)
        }
        const south = world.at(tile.tx, tile.ty + 1)
        if (south && south.province !== 0 && south.province !== tile.province) {
          provinceLines.moveTo(bottom.x, bottom.y).lineTo(left.x, left.y)
        }
      }
      // Two passes. The soft wide stroke gives the border weight when zoomed
      // in; `pixelLine` draws a one-pixel hairline regardless of camera scale,
      // which is what keeps the boundary visible when zoomed out to the whole
      // region — a scaled 2 px stroke would vanish there.
      provinceLines.stroke({ width: 5, color: 0xc9a2ff, alpha: 0.16 })
      const provinceHairline = provinceLines.clone(true)
      provinceHairline.stroke({ pixelLine: true, color: 0xe0c8ff, alpha: 0.85 })
      borders.addChild(provinceLines, provinceHairline)

      for (const [id, sum] of centroids) {
        const label = new Text({
          text: (PROVINCE_NAMES[id - 1] ?? '').toUpperCase(),
          style: {
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 17,
            fontWeight: '700',
            fill: 0xd9bcff,
            letterSpacing: 4,
            stroke: { color: 0x120b1c, width: 4 },
          },
        })
        label.anchor.set(0.5)
        // A watermark, not a place name: it should sit behind the network.
        label.alpha = 0.5
        label.resolution = 2
        label.position.set(sum.x / sum.n, sum.y / sum.n)
        borders.addChild(label)
        provinceLabels.push(label)
      }

      // --- settlements and masts --------------------------------------------
      const reachable = reachableFrom(world, 'batavia')
      const ringTexture = (() => {
        const g = new Graphics()
        g.ellipse(TILE_W, TILE_H, TILE_W, TILE_H).stroke({ width: 3, color: 0xffb347 })
        const t = app.renderer.generateTexture({ target: g, resolution: 2, antialias: true })
        g.destroy()
        return t
      })()

      interface Site { settlement: Settlement; ground: { x: number; y: number }; beacon: number }
      const sites = new Map<string, Site>()
      const rings: Array<{ sprite: Sprite; phase: number; urgent: boolean }> = []
      const labels: Array<{ text: Text; minor: boolean }> = []
      const alertBadges: Container[] = []
      const salvageLabels: Text[] = []
      interface SiteView {
        /** Absent before anyone has built a mast — Era 0 has none. */
        tower: Sprite | null
        label: Text
        ring: { sprite: Sprite; phase: number; urgent: boolean }
        badge: Container
      }
      const views = new Map<string, SiteView>()

      for (const s of world.settlements) {
        const tile = world.at(s.tx, s.ty)!
        const ground = isoToScreen(s.tx, s.ty, tile.elev)
        const live = reachable.has(s.id)
        sites.set(s.id, { settlement: s, ground, beacon: ground.y - mastPixels(s) - 13 })
        picks.push({ kind: 'site', id: s.id, x: ground.x, y: ground.y, mast: mastPixels(s) })

        // Built once for every site and then shown or hidden as the day loop
        // changes what is on the air, because the world object is replaced
        // wholesale every turn and rebuilding the scene would drop the camera.
        const ring = new Sprite(ringTexture)
        ring.anchor.set(0.5)
        ring.position.set(ground.x, ground.y)
        ring.alpha = 0
        ring.zIndex = 0
        ring.eventMode = 'none'
        ring.visible = live || Boolean(s.alert)
        if (s.alert) ring.tint = 0xff3b30
        const ringView = { sprite: ring, phase: Math.random(), urgent: Boolean(s.alert) }
        rings.push(ringView)
        overlay.addChild(ring)

        const cluster = art.settlements[s.tier]
        const buildings = new Sprite(cluster.texture)
        place(buildings, cluster, ground.x, ground.y)
        buildings.zIndex = depthOf(s.tx, s.ty, tile.elev, 3)
        scene.addChild(buildings)

        // A settlement with no mast has no tower sprite at all, rather than a
        // zero-height one: the buildings are what the player is looking at in
        // Era 0, and an empty sprite still sorts and still takes a pick.
        let tower: Sprite | null = null
        if (s.mast > 0) {
          const baked = art.towers.get(s.id)!
          tower = new Sprite(baked.texture)
          place(tower, baked, ground.x, ground.y)
          tower.zIndex = depthOf(s.tx, s.ty, tile.elev, 4)
          tower.tint = s.alert ? 0xffb0a4 : live ? 0xffffff : 0xa8b2b8
          scene.addChild(tower)
        }

        const label = new Text({
          text: s.name,
          style: {
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 16,
            fontWeight: '600',
            fill: s.alert ? 0xff6a5a : live ? 0xffd9a0 : 0xa9b8c0,
            letterSpacing: 0.8,
            stroke: { color: 0x0d1418, width: 3.5 },
          },
        })
        label.anchor.set(0.5, 1)
        label.position.set(ground.x, ground.y - mastPixels(s) - 22)
        label.zIndex = depthOf(s.tx, s.ty, tile.elev, 5)
        label.resolution = 2
        scene.addChild(label)
        // Outpost names are held back when zoomed out, because the inner
        // districts sit two or three tiles apart and collide. The exceptions
        // are the ones that need watching: an outpost with hardware standing
        // but no signal, and anything raising an alert.
        const stranded = built.has(s.id) && !live
        const minor = s.tier === 'outpost' && !stranded && !s.alert
        labels.push({ text: label, minor })

        const badge = new Container()
        const plate = new Graphics()
        plate
          .poly([0, -13, 13, 9, -13, 9])
          .fill({ color: 0xff3b30 })
          .stroke({ width: 2, color: 0x1a0c0a })
        plate.rect(-1.6, -6, 3.2, 8).fill(0xfff0ec)
        plate.circle(0, 5, 1.9).fill(0xfff0ec)
        badge.addChild(plate)
        badge.position.set(ground.x, ground.y - mastPixels(s) - 78)
        badge.zIndex = depthOf(s.tx, s.ty, tile.elev, 6)
        badge.visible = Boolean(s.alert)
        scene.addChild(badge)
        alertBadges.push(badge)

        views.set(s.id, { tower, label, ring: ringView, badge })

      }


      // --- links -------------------------------------------------------------
      // Redrawn whenever the day loop hands back a new world: a raid taking a
      // relay off the air has to show up as a broken line without rebuilding
      // the scene, which would drop the camera.
      const wireGraphics = new Graphics()
      wires.addChild(wireGraphics)

      const packets: Array<{ sprite: Graphics; from: Site; to: Site; t: number; speed: number }> = []

      // --- Era 0 signals -----------------------------------------------------
      // Boards and fires are the only thing this era builds, and a fire is
      // worth exactly what it can see, so the sight lines are drawn on the
      // ground they were worked out from. Nothing here runs in Era 1.
      const signalGraphics = new Graphics()
      wires.addChild(signalGraphics)

      /** Screen point of the hill each settlement would lay its fire on. */
      const firePoints = new Map<string, { x: number; y: number }>()
      for (const s of world.settlements) {
        const hill = fireSite(world, s)
        firePoints.set(s.id, isoToScreen(hill.tx, hill.ty, world.at(hill.tx, hill.ty)?.elev ?? 0))
      }

      const drawSignals = () => {
        signalGraphics.clear()
        const { era, survey } = useGame.getState()
        if (era !== 0) return

        for (const [a, b] of fireLinks(world, survey)) {
          const from = firePoints.get(a)
          const to = firePoints.get(b)
          if (!from || !to) continue
          const steps = Math.max(4, Math.floor(Math.hypot(to.x - from.x, to.y - from.y) / (11 * strokeScale)))
          for (let i = 0; i < steps; i += 2) {
            const t0 = i / steps
            const t1 = Math.min(1, (i + 1) / steps)
            signalGraphics
              .moveTo(from.x + (to.x - from.x) * t0, from.y + (to.y - from.y) * t0)
              .lineTo(from.x + (to.x - from.x) * t1, from.y + (to.y - from.y) * t1)
              .stroke({ width: 1.6 * strokeScale, color: 0xff9d4a, alpha: 0.6 })
          }
        }

        for (const id of survey.fires) {
          const at = firePoints.get(id)
          if (!at) continue
          const r = 7 * strokeScale
          signalGraphics.circle(at.x, at.y, r * 2.1).fill({ color: 0xff9d4a, alpha: 0.13 })
          signalGraphics
            .poly([at.x, at.y - r * 1.6, at.x + r * 0.8, at.y, at.x, at.y + r * 0.7, at.x - r * 0.8, at.y])
            .fill({ color: 0xffc978 })
            .stroke({ width: 1.4 * strokeScale, color: 0x2a1207 })
        }

        for (const id of survey.boards) {
          const site = sites.get(id)
          if (!site) continue
          // Off to the right of the cluster: the crew tokens park below it and
          // the name sits above, and a board that overlaps either reads as
          // part of the settlement art rather than as something built.
          const w = 6 * strokeScale
          const x = site.ground.x + 34 * strokeScale
          const y = site.ground.y - 2 * strokeScale
          signalGraphics
            .rect(x - w, y - w * 1.5, w * 2, w * 1.5)
            .fill({ color: 0xe8dcc0 })
            .stroke({ width: 1.2 * strokeScale, color: 0x2a1207 })
          signalGraphics.moveTo(x, y).lineTo(x, y + w).stroke({ width: 1.6 * strokeScale, color: 0x2a1207 })
        }
      }

      /**
       * Strokes are in world units, so they shrink with the camera: at region
       * zoom a 2.6 px dash lands under half a pixel and the Serang and Bogor
       * routes — the two the player most needs to see from up there — vanish.
       * Widths are multiplied by this instead, and the lines are redrawn when
       * the wheel moves, which is the only thing that changes it.
       */
      let strokeScale = 1
      const strokeScaleFor = (zoom: number) => Math.min(3.5, Math.max(1, 1 / zoom))

      const drawLinks = (links: Link[]) => {
        wireGraphics.clear()
        for (const packet of packets) packet.sprite.destroy()
        packets.length = 0

        for (const link of links) {
          const a = sites.get(link.from)
          const b = sites.get(link.to)
          if (!a || !b) continue
          const ax = a.ground.x
          const ay = a.beacon
          const bx = b.ground.x
          const by = b.beacon

          if (link.status === 'live') {
            wireGraphics.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 4 * strokeScale, color: 0xffb347, alpha: 0.12 })
            wireGraphics.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 1.4 * strokeScale, color: 0xffc978, alpha: 0.9 })

            const dot = new Graphics()
            dot.circle(0, 0, 2.6).fill(0xfff2d0)
            dot.circle(0, 0, 5).fill({ color: 0xffb347, alpha: 0.28 })
            wires.addChild(dot)
            packets.push({ sprite: dot, from: a, to: b, t: Math.random(), speed: 0.055 + Math.random() * 0.03 })
          } else if (link.status === 'planned') {
            // A surveyed route is the player's whole to-do list — Serang,
            // Depok, Bogor are all only this line — so it carries the same
            // soft underlay a live circuit gets rather than fading out at
            // region zoom.
            wireGraphics.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 6 * strokeScale, color: 0x7fa8bd, alpha: 0.1 })
            // Hand-stepped dashes: Pixi has no dashed stroke.
            const dist = Math.hypot(bx - ax, by - ay)
            const steps = Math.max(2, Math.floor(dist / (14 * strokeScale)))
            for (let i = 0; i < steps; i += 2) {
              const t0 = i / steps
              const t1 = Math.min(1, (i + 1) / steps)
              wireGraphics
                .moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0)
                .lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1)
                .stroke({ width: 2.6 * strokeScale, color: 0x9dc6db, alpha: 0.75 })
            }
          } else {
            // A silent circuit shows the break: two stubs and a gap. It is the
            // loudest thing the map has to say, so it is drawn heaviest.
            const mx = (ax + bx) / 2
            const my = (ay + by) / 2
            const arm = 7 * strokeScale
            for (const [sx, sy] of [[ax, ay], [bx, by]] as const) {
              wireGraphics
                .moveTo(sx, sy)
                .lineTo(sx + (mx - sx) * 0.62, sy + (my - sy) * 0.62)
                .stroke({ width: 7 * strokeScale, color: 0xd9614f, alpha: 0.13 })
              wireGraphics
                .moveTo(sx, sy)
                .lineTo(sx + (mx - sx) * 0.62, sy + (my - sy) * 0.62)
                .stroke({ width: 3.2 * strokeScale, color: 0xff7d6b, alpha: 0.9 })
            }
            wireGraphics.moveTo(mx - arm, my - arm).lineTo(mx + arm, my + arm).stroke({ width: 3 * strokeScale, color: 0xff7d6b })
            wireGraphics.moveTo(mx + arm, my - arm).lineTo(mx - arm, my + arm).stroke({ width: 3 * strokeScale, color: 0xff7d6b })
          }
        }
      }

      drawLinks(world.links)

      /** Members riding in a truck right now, drawn by the playback instead. */
      const driving = new Set<string>()

      /**
       * Who is on the crew this era. Read once: the map is unmounted and
       * rebuilt when the era changes, because each era has its own screen.
       */
      const { roster } = crewNow()

      /**
       * Park each crew token on the site its member is standing in. Two people
       * at the same relay stand side by side rather than on top of each other.
       */
      const syncCrew = () => {
        const { state: crew } = crewNow()

        // Grouped first, so a pair standing at the same relay can be centred
        // on it rather than trailing off toward the next site's label.
        const atSite = new Map<string, typeof crewTokens>()
        for (const token of crewTokens) {
          const where = crew[token.member.id].at
          const list = atSite.get(where)
          if (list) list.push(token)
          else atSite.set(where, [token])
        }

        for (const [siteId, tokens] of atSite) {
          const site = sites.get(siteId)
          for (let i = 0; i < tokens.length; i++) {
            const { member, sprite } = tokens[i]
            if (!site) {
              sprite.visible = false
              continue
            }
            const state = crew[member.id]
            const inTransit = state.daysLeft > 0
            // Anyone mid-playback is riding in a cab of their own.
            sprite.visible = !driving.has(member.id)
            const tile = world.at(site.settlement.tx, site.settlement.ty)!
            const spread = (i - (tokens.length - 1) / 2) * 21
            sprite.position.set(site.ground.x + spread, site.ground.y + 20)
            sprite.zIndex = depthOf(site.settlement.tx, site.settlement.ty, tile.elev, 6)
            // Out on the road: still shown at the site they left, but faded,
            // so "who is where" and "who is free" read differently.
            sprite.alpha = inTransit ? 0.45 : 1
          }
        }

        drawPlans()
      }

      /**
       * Bring the scene into line with a world the day loop has replaced.
       * Geometry never moves, so only the things a day can change are touched:
       * what is lit, what is raising an alarm, what is left in a ruin, and what
       * the circuits look like.
       */
      const syncWorld = (next: World) => {
        const lit = reachableFrom(next, 'batavia')
        const standing = new Set<string>()
        for (const link of next.links) {
          if (link.status === 'planned') continue
          standing.add(link.from)
          standing.add(link.to)
        }

        for (const s of next.settlements) {
          const view = views.get(s.id)
          if (!view) continue
          const live = lit.has(s.id)
          if (view.tower) view.tower.tint = s.alert ? 0xffb0a4 : live ? 0xffffff : 0xa8b2b8
          view.label.style.fill = s.alert ? 0xff6a5a : live ? 0xffd9a0 : 0xa9b8c0
          view.badge.visible = Boolean(s.alert)
          view.ring.sprite.visible = live || Boolean(s.alert)
          view.ring.urgent = Boolean(s.alert)
          view.ring.sprite.tint = s.alert ? 0xff3b30 : 0xffffff
          const stranded = standing.has(s.id) && !live
          const entry = labels.find((l) => l.text === view.label)
          if (entry) entry.minor = s.tier === 'outpost' && !stranded && !s.alert
        }

        for (const marker of campMarkers) {
          const camp = next.camps.find((c) => c.id === marker.id)
          if (!camp) continue
          marker.badge.alpha = camp.active ? 1 : 0.3
          marker.label.alpha = camp.active ? 1 : 0.3
          marker.label.text = camp.active ? camp.name : `${camp.name} (cleared)`
        }

        for (const marker of salvageMarkers) {
          const site = next.scavenge.find((sc) => sc.id === marker.id)
          if (!site) continue
          marker.live = site.state !== 'stripped'
          marker.sprite.texture = art.salvage[site.state].texture
          marker.label.style.fill = site.state === 'stripped' ? 0x7f8f96 : 0x8fe8d0
          if (!marker.live) marker.sprite.pivot.y = 0
        }

        drawLinks(next.links)
      }

      // --- scavengeable ruins ------------------------------------------------
      // Each of these is a real Jakarta site the crew can strip for parts, so
      // they get a heavier ruin cluster and a marker that can be clicked.
      const salvageMarkers: Array<{ id: string; sprite: Sprite; label: Text; live: boolean }> = []

      for (const site of world.scavenge) {
        const tile = world.at(site.tx, site.ty)
        if (!tile) continue
        const ground = isoToScreen(site.tx, site.ty, tile.elev)

        // A denser knot of rubble, so the site reads as a ruin from the air.
        for (let i = 0; i < 4; i++) {
          const baked = art.ruins[i % art.ruins.length]
          const rubble = new Sprite(baked.texture)
          const offset = [[0, 0], [-26, 10], [24, 8], [-4, 20]][i]
          place(rubble, baked, ground.x + offset[0], ground.y + offset[1])
          rubble.zIndex = depthOf(site.tx, site.ty, tile.elev, 2)
          rubble.tint = 0xb9b1a6
          scene.addChild(rubble)
        }

        picks.push({ kind: 'ruin', id: site.id, x: ground.x, y: ground.y, mast: 0 })

        const baked = art.salvage[site.state]
        const marker = new Sprite(baked.texture)
        marker.scale.set(1.35)
        place(marker, baked, ground.x, ground.y - 26)
        marker.zIndex = depthOf(site.tx, site.ty, tile.elev, 5)
        scene.addChild(marker)
        const markerView = {
          id: site.id,
          sprite: marker,
          label: null as unknown as Text,
          live: site.state !== 'stripped',
        }
        salvageMarkers.push(markerView)

        const label = new Text({
          text: site.name,
          style: {
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 13,
            fill: site.state === 'stripped' ? 0x7f8f96 : 0x8fe8d0,
            letterSpacing: 0.6,
            stroke: { color: 0x0d1418, width: 3.5 },
          },
        })
        label.anchor.set(0.5, 1)
        label.resolution = 2
        label.position.set(ground.x, ground.y - 50)
        label.zIndex = depthOf(site.tx, site.ty, tile.elev, 6)
        scene.addChild(label)
        salvageLabels.push(label)
        markerView.label = label
      }

      // --- bandit camps ------------------------------------------------------
      // The raiders are on the map rather than only in the report, because a
      // camp is a place the player can go and do something about.
      const campMarkers: Array<{ id: string; badge: Container; label: Text }> = []

      for (const camp of world.camps) {
        const tile = world.at(camp.tx, camp.ty)
        if (!tile) continue
        const ground = isoToScreen(camp.tx, camp.ty, tile.elev)

        picks.push({ kind: 'camp', id: camp.id, x: ground.x, y: ground.y, mast: 0 })

        const badge = new Container()
        const plate = new Graphics()
        plate.circle(0, 0, 13).fill({ color: 0x2a1614 }).stroke({ width: 2, color: 0xff6a5a })
        // A crossed pair of pry bars: what the yards are actually being lost to.
        plate.moveTo(-5, -5).lineTo(5, 5).stroke({ width: 2.2, color: 0xff9d8f })
        plate.moveTo(5, -5).lineTo(-5, 5).stroke({ width: 2.2, color: 0xff9d8f })
        badge.addChild(plate)
        badge.position.set(ground.x, ground.y - 34)
        badge.zIndex = depthOf(camp.tx, camp.ty, tile.elev, 6)
        scene.addChild(badge)

        const label = new Text({
          text: camp.name,
          style: {
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 12,
            fill: 0xff8f7f,
            letterSpacing: 0.6,
            stroke: { color: 0x0d1418, width: 3.5 },
          },
        })
        label.anchor.set(0.5, 0)
        label.resolution = 2
        label.position.set(ground.x, ground.y - 16)
        label.zIndex = depthOf(camp.tx, camp.ty, tile.elev, 6)
        scene.addChild(label)
        salvageLabels.push(label)
        campMarkers.push({ id: camp.id, badge, label })
      }

      // --- the convoy --------------------------------------------------------
      // Sprites were rendered from the glTF model through an orthographic
      // camera at this exact projection, so no skewing is needed here: pick
      // the sprite matching the heading and drop it on the tile.
      const truckTextures = {
        se: await Assets.load<Texture>(truckSE),
        sw: await Assets.load<Texture>(truckSW),
        nw: await Assets.load<Texture>(truckNW),
        ne: await Assets.load<Texture>(truckNE),
      }

      /** Every place a crew member can be sent, in tile coordinates. */
      const stopTiles = new Map<string, { tx: number; ty: number }>()
      for (const s of world.settlements) stopTiles.set(s.id, { tx: s.tx, ty: s.ty })
      for (const s of world.scavenge) stopTiles.set(s.id, { tx: s.tx, ty: s.ty })
      for (const c of world.camps) stopTiles.set(c.id, { tx: c.tx, ty: c.ty })

      // --- today's orders, before they are executed ---------------------------
      // Orders are given from a panel on the far side of the screen, so
      // without this the only sign that Bayu is being sent to Pulo Gadung is a
      // line of text. A faint dotted run from where he stands to where he is
      // going puts the plan on the map it is a plan about.
      const planGraphics = new Graphics()
      plans.addChild(planGraphics)

      /** Screen point for a stop, lifted onto the ground it stands on. */
      const stopPoint = (at: { tx: number; ty: number }) =>
        isoToScreen(at.tx, at.ty, world.at(at.tx, at.ty)?.elev ?? 0)

      const drawPlans = () => {
        planGraphics.clear()
        // While the day is being driven out, the trucks are the plan.
        if (useGame.getState().playing) return

        const { state: crew } = crewNow()
        for (const member of roster) {
          const state = crew[member.id]
          if (!state || state.hurtDays > 0) continue
          const task = state.task
          if (task.kind === 'idle' || !task.target) continue
          const from = stopTiles.get(state.at)
          const to = stopTiles.get(task.target)
          if (!from || !to || (from.tx === to.tx && from.ty === to.ty)) continue

          const a = stopPoint(from)
          const b = stopPoint(to)
          const dist = Math.hypot(b.x - a.x, b.y - a.y)
          const steps = Math.max(2, Math.floor(dist / (13 * strokeScale)))
          for (let i = 0; i < steps; i += 2) {
            const t0 = i / steps
            const t1 = Math.min(1, (i + 1) / steps)
            planGraphics
              .moveTo(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0)
              .lineTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1)
              .stroke({ width: 2.2 * strokeScale, color: member.color, alpha: 0.34 })
          }
          // A ring at the far end, so a route reads as going somewhere rather
          // than as a stray line crossing the map.
          planGraphics.circle(b.x, b.y, 9 * strokeScale).stroke({ width: 2 * strokeScale, color: member.color, alpha: 0.45 })
        }
      }

      // --- hover marker ------------------------------------------------------
      const marker = new Sprite(art.marker.texture)
      marker.anchor.set(art.marker.anchorX, art.marker.anchorY)
      marker.eventMode = 'none'
      marker.zIndex = 0
      marker.visible = false
      overlay.addChild(marker)

      // --- camera ------------------------------------------------------------
      // Frame the network by its own bounding box. The region is much larger
      // than the built-out part of it, so fitting the whole grid would open on
      // mostly empty highland and open sea.
      // Frame everything that physically exists: sites on air, sites whose
      // circuit is down, and anything raising an alert. Purely surveyed sites
      // are left out, or the view would open over empty highland.
      const framed = [...sites.values()].filter(
        (site) =>
          reachable.has(site.settlement.id) ||
          built.has(site.settlement.id) ||
          site.settlement.alert,
      )
      const xs = framed.map((site) => site.ground.x)
      const ys = framed.map((site) => site.ground.y)
      const pad = 90
      const boxW = Math.max(1, Math.max(...xs) - Math.min(...xs)) + pad * 2
      const boxH = Math.max(1, Math.max(...ys) - Math.min(...ys)) + pad * 2

      // Fit into the clear space between the HUD panels, not the whole canvas,
      // or the westernmost sites end up parked underneath the roster.
      const inset = { left: 300, right: 362, top: 150, bottom: 134 }
      const viewW = Math.max(320, app.screen.width - inset.left - inset.right)
      const viewH = Math.max(240, app.screen.height - inset.top - inset.bottom)
      const startZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(viewW / boxW, viewH / boxH)))
      const centre = {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
      }
      camera.scale.set(startZoom)
      camera.position.set(
        inset.left + viewW / 2 - centre.x * startZoom,
        inset.top + viewH / 2 - centre.y * startZoom,
      )
      // The opening fit is a zoom like any other, so the circuits drawn above
      // it are redrawn at the weight that fit calls for.
      strokeScale = strokeScaleFor(startZoom)
      drawLinks(world.links)
      drawSignals()


      // --- crew markers ------------------------------------------------------
      // One portrait token per crew member, parked on whichever site they are
      // standing in. Four sprites that move, rather than a sprite per site.
      const portraitTextures = new Map<string, Texture>()
      for (const member of roster) {
        portraitTextures.set(member.id, await Assets.load<Texture>(member.portrait))
      }

      /** A portrait cropped to a ringed disc, ready to sit on the ground. */
      const tokenTexture = (member: (typeof roster)[number], diameter: number) => {
        const holder = new Container()
        const ring = new Graphics()
        ring.circle(diameter / 2, diameter / 2, diameter / 2).fill({ color: 0x0d1418 })
        holder.addChild(ring)

        const face = new Sprite(portraitTextures.get(member.id)!)
        // The cut-outs are head-and-shoulders on a square canvas; showing the
        // top two thirds keeps the face centred in the disc.
        const scale = diameter / face.texture.width
        face.scale.set(scale * 1.15)
        face.anchor.set(0.5, 0.42)
        face.position.set(diameter / 2, diameter / 2)
        const mask = new Graphics()
        mask.circle(diameter / 2, diameter / 2, diameter / 2 - 1.5).fill(0xffffff)
        face.mask = mask
        holder.addChild(face, mask)

        const rim = new Graphics()
        rim.circle(diameter / 2, diameter / 2, diameter / 2 - 0.8).stroke({ width: 2, color: 0xffb347 })
        holder.addChild(rim)

        const texture = app.renderer.generateTexture({ target: holder, resolution: 2, antialias: true })
        holder.destroy({ children: true })
        return texture
      }

      const TOKEN = 26
      const crewTokens = roster.map((member) => {
        // Clicking a token selects the site it is standing on, because the
        // site's own hit zone is directly above it in `overlay`.
        const sprite = new Sprite(tokenTexture(member, TOKEN))
        sprite.anchor.set(0.5, 1)
        scene.addChild(sprite)
        return { member, sprite }
      })

      // --- day playback ------------------------------------------------------
      // One truck per crew member, parked out of sight until the day they are
      // sent somewhere. A day can move all four at once, so they cannot share.
      const rigs = new Map<string, { truck: Sprite; token: Sprite }>()
      for (const member of roster) {
        const truck = new Sprite(truckTextures.se)
        truck.anchor.set(0.5, 0.72)
        truck.scale.set(0.34)
        truck.visible = false
        const token = new Sprite(tokenTexture(member, 22))
        token.anchor.set(0.5, 1)
        token.visible = false
        scene.addChild(truck, token)
        rigs.set(member.id, { truck, token })
      }

      interface Leg { from: { tx: number; ty: number }; to: { tx: number; ty: number } }
      interface Drive {
        memberId: string
        legs: Leg[]
        leg: number
        t: number
        /** Seconds still to wait at the destination while the word is up. */
        hold: number
        note?: string
        tone: 'good' | 'bad' | 'info'
        /** Set once the note has been dropped, so it is dropped only once. */
        noted: boolean
        depthTile: string
      }

      let drives: Drive[] = []
      const floaters: { text: Text; life: number }[] = []

      /** The word over a place, rising and fading as it goes. */
      const dropNote = (at: { tx: number; ty: number }, text: string, tone: Drive['tone']) => {
        const tile = world.at(at.tx, at.ty)
        const p = isoToScreen(at.tx, at.ty, tile?.elev ?? 0)
        const label = new Text({
          text,
          style: {
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 18,
            fontWeight: '700',
            fill: NOTE_COLOR[tone],
            letterSpacing: 1.2,
            stroke: { color: 0x0d1418, width: 4 },
          },
        })
        label.anchor.set(0.5, 1)
        label.resolution = 2
        label.position.set(p.x, p.y - 54)
        label.zIndex = depthOf(at.tx, at.ty, tile?.elev ?? 0, 9)
        scene.addChild(label)
        floaters.push({ text: label, life: 0 })
      }

      const legSeconds = (leg: Leg) => {
        const span = Math.hypot(leg.to.tx - leg.from.tx, leg.to.ty - leg.from.ty)
        return Math.min(LEG_SECONDS.max, Math.max(LEG_SECONDS.min, span * LEG_SECONDS.perTile))
      }

      const endPlayback = () => {
        drives = []
        driving.clear()
        for (const { truck, token } of rigs.values()) {
          truck.visible = false
          token.visible = false
        }
        syncCrew()
        useGame.getState().finishPlayback()
      }

      const startPlayback = (moves: Move[]) => {
        drives = []
        driving.clear()
        for (const move of moves) {
          const from = stopTiles.get(move.from)
          const to = stopTiles.get(move.to)
          const rig = rigs.get(move.memberId)
          if (!from || !to || !rig) continue
          const legs: Leg[] = []
          if (from.tx !== to.tx || from.ty !== to.ty) legs.push({ from, to })
          const back = move.back ? stopTiles.get(move.back) : undefined
          if (back) legs.push({ from: to, to: back })
          drives.push({
            memberId: move.memberId,
            legs,
            leg: 0,
            t: 0,
            hold: NOTE_SECONDS,
            note: move.note,
            tone: move.tone,
            noted: legs.length === 0,
            depthTile: '',
          })
          // The word lands as they arrive; with no distance to cover, now.
          if (legs.length === 0 && move.note) dropNote(to, move.note, move.tone)
          driving.add(move.memberId)
          rig.truck.visible = legs.length > 0
          rig.token.visible = legs.length > 0
        }
        syncCrew()
        // Nothing playable in the day: let the subscriber that handed it over
        // finish first, or the report would be set from inside its own notify.
        if (drives.length === 0) queueMicrotask(endPlayback)
      }

      /** Advance one truck along its route. Returns false once it is parked. */
      const stepDrive = (drive: Drive, dt: number): boolean => {
        const rig = rigs.get(drive.memberId)!
        if (drive.leg >= drive.legs.length) {
          rig.truck.visible = false
          rig.token.visible = false
          drive.hold -= dt
          return drive.hold > 0
        }

        const leg = drive.legs[drive.leg]
        drive.t += dt / legSeconds(leg)
        const done = drive.t >= 1
        const e = Math.min(1, drive.t)
        // Ease both ends: a truck that starts and stops dead reads as a sprite
        // being dragged, not a vehicle covering ground.
        const eased = e * e * (3 - 2 * e)
        const tx = leg.from.tx + (leg.to.tx - leg.from.tx) * eased
        const ty = leg.from.ty + (leg.to.ty - leg.from.ty) * eased
        const under = world.at(Math.round(tx), Math.round(ty))
        const p = isoToScreen(tx, ty, under?.elev ?? 0)
        rig.truck.position.set(p.x, p.y)
        rig.token.position.set(p.x + 2, p.y - 26)

        // Four sprites, so snap the heading to whichever iso axis dominates.
        const dtx = leg.to.tx - leg.from.tx
        const dty = leg.to.ty - leg.from.ty
        rig.truck.texture =
          Math.abs(dtx) > Math.abs(dty)
            ? dtx > 0 ? truckTextures.se : truckTextures.nw
            : dty > 0 ? truckTextures.sw : truckTextures.ne

        // Re-sorting 6000 children every frame would be wasteful, so only
        // touch zIndex when the truck actually crosses onto a new tile.
        const key = `${Math.round(tx)},${Math.round(ty)}`
        if (key !== drive.depthTile) {
          drive.depthTile = key
          rig.truck.zIndex = depthOf(Math.round(tx), Math.round(ty), under?.elev ?? 0, 5)
          rig.token.zIndex = rig.truck.zIndex + 1
        }

        if (!done) return true
        // Arrived: say what happened here, then either turn for home or park.
        if (!drive.noted) {
          drive.noted = true
          if (drive.note) dropNote(leg.to, drive.note, drive.tone)
        }
        drive.leg += 1
        drive.t = 0
        return true
      }

      syncCrew()

      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
        dragging = true
        panning = false
        downAt = { x: e.global.x, y: e.global.y }
        last = { x: e.global.x, y: e.global.y }
      })

      app.stage.on('pointertap', (e: FederatedPointerEvent) => {
        if (panning) return
        const pick = pickAt(camera.toLocal(e.global))
        if (!pick) return
        const game = useGame.getState()
        if (pick.kind === 'site') game.select(pick.id)
        else if (pick.kind === 'ruin') game.selectScavenge(pick.id)
        else game.selectCamp(pick.id)
      })

      const endDrag = () => { dragging = false }
      app.stage.on('pointerup', endDrag)
      app.stage.on('pointerupoutside', endDrag)

      app.stage.on('pointermove', (e: FederatedPointerEvent) => {
        if (dragging) {
          if (!panning) {
            // Still inside the dead zone: hold the map still, so a click that
            // wobbles stays a click.
            if (Math.hypot(e.global.x - downAt.x, e.global.y - downAt.y) <= DEAD_ZONE) return
            panning = true
            last = { x: e.global.x, y: e.global.y }
          }
          const dx = e.global.x - last.x
          const dy = e.global.y - last.y
          camera.position.set(camera.x + dx, camera.y + dy)
          last = { x: e.global.x, y: e.global.y }
          host.style.cursor = 'grabbing'
        }

        const local = camera.toLocal(e.global)
        if (!dragging) host.style.cursor = pickAt(local) ? 'pointer' : 'grab'
        const hit = pickTile(local.x, local.y, world.at, maxElev)
        const tile = hit ? world.at(hit.x, hit.y) : undefined

        if (tile) {
          const p = isoToScreen(tile.tx, tile.ty, tile.elev)
          marker.position.set(p.x, p.y)
          marker.visible = true
          const current = useGame.getState().hovered
          if (!current || current.tx !== tile.tx || current.ty !== tile.ty) {
            useGame.getState().setHovered({ tx: tile.tx, ty: tile.ty })
          }
        } else {
          marker.visible = false
          if (useGame.getState().hovered) useGame.getState().setHovered(null)
        }
      })

      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = app.canvas.getBoundingClientRect()
        const px = e.clientX - rect.left
        const py = e.clientY - rect.top
        const before = { x: (px - camera.x) / camera.scale.x, y: (py - camera.y) / camera.scale.y }
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.scale.x * (e.deltaY > 0 ? 0.9 : 1.1)))
        camera.scale.set(next)
        camera.position.set(px - before.x * next, py - before.y * next)

        const wanted = strokeScaleFor(next)
        if (Math.abs(wanted - strokeScale) > 0.01) {
          strokeScale = wanted
          drawLinks(useGame.getState().world.links)
          drawSignals()
          drawPlans()
        }
      }
      app.canvas.addEventListener('wheel', onWheel, { passive: false })

      // --- frame loop --------------------------------------------------------
      app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000

        for (const packet of packets) {
          packet.t += dt * packet.speed
          if (packet.t > 1) packet.t -= 1
          const eased = packet.t
          packet.sprite.position.set(
            packet.from.ground.x + (packet.to.ground.x - packet.from.ground.x) * eased,
            packet.from.beacon + (packet.to.beacon - packet.from.beacon) * eased,
          )
        }

        // Counter-scale labels so they stay readable as the camera pulls back,
        // clamped so they do not swamp the map at the far end of the zoom range.
        const labelScale = Math.min(2.4, Math.max(1, 1 / camera.scale.x))
        // Province names counter-scale further than place names do, so they
        // still read when the camera pulls back over the whole region.
        const provinceScale = Math.min(5, Math.max(1, 1 / camera.scale.x))
        for (const label of provinceLabels) label.scale.set(provinceScale)
        for (const label of labels) {
          label.text.scale.set(labelScale)
          // Outposts are the crowded ones; hold their names back until the
          // camera is close enough for them not to overlap each other.
          label.text.visible = !label.minor || camera.scale.x > 0.85
        }

        for (const ring of rings) {
          ring.phase += dt * (ring.urgent ? 0.8 : 0.32)
          if (ring.phase > 1) ring.phase -= 1
          const scale = 0.25 + ring.phase * (ring.urgent ? 2.1 : 1.5)
          ring.sprite.scale.set(scale, scale)
          ring.sprite.alpha = (1 - ring.phase) * (ring.urgent ? 0.85 : 0.35)
        }

        // Drive the day's legs in tile space, so the trucks follow the ground
        // rather than a straight line across the screen.
        if (drives.length > 0) {
          drives = drives.filter((drive) => stepDrive(drive, dt))
          if (drives.length === 0) endPlayback()
        }

        // The word over a place: rises a little, then goes.
        for (let i = floaters.length - 1; i >= 0; i--) {
          const floater = floaters[i]
          floater.life += dt / NOTE_SECONDS
          floater.text.position.y -= dt * 12
          floater.text.alpha = Math.min(1, floater.life * 5) * (1 - Math.max(0, floater.life - 0.55) / 0.45)
          floater.text.scale.set(labelScale)
          if (floater.life >= 1) {
            floater.text.destroy()
            floaters.splice(i, 1)
          }
        }

        // Ruin names appear earlier than outpost names do: they are spread
        // across the map rather than stacked up in the city core.
        for (const label of salvageLabels) {
          label.scale.set(labelScale)
          label.visible = camera.scale.x > 0.45
        }

        // A slow bob marks a ruin that still has something in it.
        const bob = Math.sin(ticker.lastTime / 520)
        for (const marker of salvageMarkers) {
          if (marker.live) marker.sprite.pivot.y = bob * 3
        }

        // Hard on/off blink, not a sine fade — it has to read as an alarm.
        const blinkOn = Math.floor(ticker.lastTime / 420) % 2 === 0
        for (const badge of alertBadges) {
          badge.alpha = blinkOn ? 1 : 0.15
          badge.scale.set(labelScale)
        }
      })

      // Centre the camera whenever the selection changes, so clicking a name
      // in the roster flies the map to it.
      const unsubscribe = useGame.subscribe((state, prev) => {
        if (state.world !== prev.world) syncWorld(state.world)
        // Starting playback claims the moving tokens, so it has to run before
        // the roster is re-parked or they flicker onto their new sites first.
        if (state.playing !== prev.playing && state.playing) startPlayback(state.playing)
        // Playback owns the plan overlay while it runs, so the day it ends is
        // the day the next set of orders can be drawn again.
        if (state.playing !== prev.playing && !state.playing) drawPlans()
        if (state.sim !== prev.sim) syncCrew()
        // Era 0's run lives in `survey`; without this its orders never reach
        // the plan overlay and its crew never re-park after a day.
        if (state.survey !== prev.survey) {
          syncCrew()
          drawSignals()
        }
        if (state.selectedId === prev.selectedId || !state.selectedId) return
        const site = sites.get(state.selectedId)
        if (!site) return
        const z = camera.scale.x
        camera.position.set(
          app.screen.width / 2 - site.ground.x * z,
          app.screen.height / 2 + 40 - site.ground.y * z,
        )
      })

      cleanup = () => {
        unsubscribe()
        // The report is held behind the map. If the map goes, release it.
        if (useGame.getState().playing) useGame.getState().finishPlayback()
        app.canvas.removeEventListener('wheel', onWheel)
        ringTexture.destroy(true)
        app.destroy(true, { children: true, texture: true })
      }
    }

    let cleanup: (() => void) | null = null
    void boot()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return <div ref={hostRef} className="map-host" />
}
