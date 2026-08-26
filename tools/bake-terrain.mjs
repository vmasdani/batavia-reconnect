/**
 * Bakes a real heightmap for the New Batavia region into `src/terrain-data.ts`.
 *
 * Source is the AWS `elevation-tiles-prod` terrarium set: public-domain DEM
 * (SRTM / Copernicus / national surveys) served as PNG tiles with elevation
 * encoded in the colour channels. No API key, no GDAL, no shipped raster.
 *
 * This runs at build time only. The game imports the baked array; it never
 * fetches anything. Run with `npm run bake`.
 *
 * Elevation is the only thing taken from the DEM, but it also gives the
 * coastline for free — the sea is simply where the ground is below zero.
 *
 * Province boundaries come from a second source: geoBoundaries ADM1, which is
 * itself derived from OpenStreetMap and therefore ODbL. Only the province id
 * per tile is baked; the borders are drawn where neighbouring ids differ.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'tools', '.dem-cache')
const OUT = join(ROOT, 'src', 'terrain-data.ts')

/** geoBoundaries ADM1 for Indonesia: OSM-derived province polygons, ODbL. */
const ADM1_URL =
  'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM1/geoBoundaries-IDN-ADM1_simplified.geojson'

/** geoBoundaries uses English exonyms; these read better in a Jakarta game. */
const PROVINCE_RENAME = {
  'Jakarta Special Capital Region': 'DKI Jakarta',
  'West Java': 'Jawa Barat',
  'Central Java': 'Jawa Tengah',
  'East Java': 'Jawa Timur',
}

// Must match the constants in src/world.ts.
const LON_MIN = 106.0
const LON_MAX = 107.2
const LAT_NORTH = -5.9
const LAT_SOUTH = -6.85
const GRID_W = 88
const GRID_H = 70

/**
 * Terrarium zoom level. z11 is ~76 m per pixel here, so each ~1.5 km game
 * tile averages roughly 20 x 20 DEM samples — enough detail to resolve the
 * coast and the river valleys without pulling hundreds of tiles.
 */
const Z = 11
const TILE_PX = 256
const WORLD_PX = TILE_PX * 2 ** Z

const lonToPx = (lon) => ((lon + 180) / 360) * WORLD_PX
const latToPx = (lat) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * WORLD_PX
}

async function fetchTile(tx, ty) {
  const cached = join(CACHE, `${Z}-${tx}-${ty}.png`)
  if (existsSync(cached)) return PNG.sync.read(await readFile(cached))

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(cached, buf)
  return PNG.sync.read(buf)
}

// --- province polygons -------------------------------------------------------

function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** A GeoJSON polygon is an outer ring followed by holes. */
function pointInPolygon(lon, lat, rings) {
  if (!pointInRing(lon, lat, rings[0])) return false
  for (let i = 1; i < rings.length; i++) if (pointInRing(lon, lat, rings[i])) return false
  return true
}

function boundsOf(rings) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of rings[0]) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

async function loadProvinces() {
  const cached = join(CACHE, 'idn-adm1.geojson')
  let text
  if (existsSync(cached)) {
    text = await readFile(cached, 'utf8')
  } else {
    const res = await fetch(ADM1_URL)
    if (!res.ok) throw new Error(`${ADM1_URL} -> ${res.status}`)
    text = await res.text()
    await writeFile(cached, text)
  }

  // Keep only provinces that actually touch the map, each pre-split into
  // bounded polygons so the per-tile test can reject most of them instantly.
  const kept = []
  for (const feature of JSON.parse(text).features) {
    const raw = feature.properties.shapeName
    const name = PROVINCE_RENAME[raw] ?? raw
    const geometry = feature.geometry
    const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
    const inBox = []
    for (const rings of polygons) {
      const b = boundsOf(rings)
      if (b.maxX < LON_MIN || b.minX > LON_MAX || b.maxY < LAT_SOUTH || b.minY > LAT_NORTH) continue
      inBox.push({ rings, bounds: b })
    }
    if (inBox.length) kept.push({ name, polygons: inBox })
  }
  return kept
}

async function main() {
  await mkdir(CACHE, { recursive: true })

  const left = Math.floor(lonToPx(LON_MIN) / TILE_PX)
  const right = Math.floor(lonToPx(LON_MAX) / TILE_PX)
  const top = Math.floor(latToPx(LAT_NORTH) / TILE_PX)
  const bottom = Math.floor(latToPx(LAT_SOUTH) / TILE_PX)

  const wanted = []
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) wanted.push([tx, ty])
  }
  console.log(`region ${LON_MIN}..${LON_MAX} lon, ${LAT_SOUTH}..${LAT_NORTH} lat`)
  console.log(`fetching ${wanted.length} terrarium tiles at z${Z}`)

  const tiles = new Map()
  const CONCURRENCY = 6
  for (let i = 0; i < wanted.length; i += CONCURRENCY) {
    const batch = wanted.slice(i, i + CONCURRENCY)
    const pngs = await Promise.all(batch.map(([tx, ty]) => fetchTile(tx, ty)))
    batch.forEach(([tx, ty], k) => tiles.set(`${tx}/${ty}`, pngs[k]))
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, wanted.length)}/${wanted.length}`)
  }
  console.log('')

  /** Elevation in metres at a global Mercator pixel, or null off-coverage. */
  const sampleAt = (px, py) => {
    const png = tiles.get(`${Math.floor(px / TILE_PX)}/${Math.floor(py / TILE_PX)}`)
    if (!png) return null
    const x = Math.floor(px) % TILE_PX
    const y = Math.floor(py) % TILE_PX
    const i = (png.width * y + x) * 4
    // Terrarium encoding: metres = R * 256 + G + B / 256 - 32768
    return png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768
  }

  const provinces = await loadProvinces()
  console.log(`provinces in box: ${provinces.map((p) => p.name).join(', ')}`)

  const heights = new Int16Array(GRID_W * GRID_H)
  const provinceIds = new Uint8Array(GRID_W * GRID_H)
  let min = Infinity
  let max = -Infinity

  for (let gy = 0; gy < GRID_H; gy++) {
    // Game-tile bounds in degrees, then in Mercator pixels. The grid is linear
    // in latitude while the DEM is Mercator, so each row converts separately.
    const latTop = LAT_NORTH - (gy / GRID_H) * (LAT_NORTH - LAT_SOUTH)
    const latBottom = LAT_NORTH - ((gy + 1) / GRID_H) * (LAT_NORTH - LAT_SOUTH)
    const pyTop = latToPx(latTop)
    const pyBottom = latToPx(latBottom)

    for (let gx = 0; gx < GRID_W; gx++) {
      const lonLeft = LON_MIN + (gx / GRID_W) * (LON_MAX - LON_MIN)
      const lonRight = LON_MIN + ((gx + 1) / GRID_W) * (LON_MAX - LON_MIN)
      const pxLeft = lonToPx(lonLeft)
      const pxRight = lonToPx(lonRight)

      // Mean over the footprint. Averaging rather than point-sampling keeps
      // single noisy DEM pixels from producing spikes in the terrain.
      let sum = 0
      let n = 0
      for (let py = Math.floor(pyTop); py < Math.ceil(pyBottom); py++) {
        for (let px = Math.floor(pxLeft); px < Math.ceil(pxRight); px++) {
          const m = sampleAt(px, py)
          if (m !== null) {
            sum += m
            n++
          }
        }
      }
      const metres = n > 0 ? Math.round(sum / n) : 0
      heights[gy * GRID_W + gx] = metres
      if (metres < min) min = metres
      if (metres > max) max = metres

      // Province at the tile centre. 0 means none — open sea, or ground
      // outside every polygon we kept.
      const cLon = (lonLeft + lonRight) / 2
      const cLat = (latTop + latBottom) / 2
      for (let pi = 0; pi < provinces.length; pi++) {
        const hit = provinces[pi].polygons.some(
          ({ rings, bounds }) =>
            cLon >= bounds.minX && cLon <= bounds.maxX &&
            cLat >= bounds.minY && cLat <= bounds.maxY &&
            pointInPolygon(cLon, cLat, rings),
        )
        if (hit) {
          provinceIds[gy * GRID_W + gx] = pi + 1
          break
        }
      }
    }
  }

  const b64 = Buffer.from(new Uint8Array(heights.buffer)).toString('base64')
  const provB64 = Buffer.from(provinceIds).toString('base64')
  const provNames = provinces.map((p) => p.name)
  const provCounts = provNames.map((_, i) => provinceIds.reduce((n, v) => n + (v === i + 1 ? 1 : 0), 0))
  const source = `/**
 * Baked heightmap for the New Batavia region. GENERATED — do not edit.
 *
 * Produced by \`npm run bake\` from AWS terrarium DEM tiles at zoom ${Z}
 * (~76 m per pixel), averaged over each game tile's footprint.
 *
 * Elevation in metres, row-major, indexed \`ty * ${GRID_W} + tx\`, packed as a
 * little-endian Int16Array in base64 — ${(b64.length / 1024).toFixed(1)} KB of source, parsed once at load.
 *
 * Range in this region: ${min} m to ${max} m.
 */

export const TERRAIN_META = {
  lonMin: ${LON_MIN},
  lonMax: ${LON_MAX},
  latNorth: ${LAT_NORTH},
  latSouth: ${LAT_SOUTH},
  gridW: ${GRID_W},
  gridH: ${GRID_H},
  zoom: ${Z},
  minMetres: ${min},
  maxMetres: ${max},
} as const

/**
 * Province names, indexed by id minus one. Id 0 means no province: open sea,
 * or ground outside the polygons that reach this map.
 *
 * Source: geoBoundaries ADM1 for Indonesia, derived from OpenStreetMap.
 * Licensed ODbL — attribution and share-alike apply to the derived data.
 */
export const PROVINCE_NAMES: readonly string[] = ${JSON.stringify(provNames)}

const PACKED_PROVINCES =
  '${provB64}'

/** Province id per tile, row-major, same layout as HEIGHTS. */
export const PROVINCE_IDS: Uint8Array = (() => {
  const binary = atob(PACKED_PROVINCES)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
})()

const PACKED =
  '${b64}'

/** Decoded once at module load; ${GRID_W} x ${GRID_H} elevations in metres. */
export const HEIGHTS: Int16Array = (() => {
  const binary = atob(PACKED)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
})()
`
  await writeFile(OUT, source)
  console.log(`wrote ${OUT}`)
  console.log(`  ${GRID_W}x${GRID_H} tiles, ${min} m .. ${max} m, ${(b64.length / 1024).toFixed(1)} KB base64`)
  provNames.forEach((name, i) => console.log(`  province ${name}: ${provCounts[i]} tiles`))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
