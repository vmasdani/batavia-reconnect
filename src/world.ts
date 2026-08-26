/**
 * The New Batavia region: terrain, settlements and the communication network.
 *
 * Elevation is measured, not invented: `terrain-data.ts` holds a real
 * heightmap baked from public-domain DEM tiles by `npm run bake`. The
 * coastline falls out of the same data — the sea is the below-zero ground
 * connected to the open water at the north edge — so shore and relief cannot
 * disagree with each other.
 *
 * Still hand-traced, because OSM would be a 854 MB download for them: the two
 * river courses, the urban centres, and the settlement positions.
 */

import { HEIGHTS, PROVINCE_IDS, PROVINCE_NAMES, TERRAIN_META } from './terrain-data'

export { PROVINCE_NAMES }

export type Terrain =
  | 'sea'
  | 'shallow'
  | 'sand'
  | 'marsh'
  | 'grass'
  | 'scrub'
  | 'rubble'
  | 'road'
  | 'river'
  | 'hill'

/**
 * Bounding box of the playable region, in degrees. Runs from the Banten coast
 * in the west to the Citarum delta in the east, and from offshore Jakarta Bay
 * down to the volcanic foothills below Bogor.
 */
const { lonMin: LON_MIN, lonMax: LON_MAX, latNorth: LAT_NORTH, latSouth: LAT_SOUTH } = TERRAIN_META

/** Metres per degree near 6 degrees south. */
const KM_PER_DEG_LAT = 110.57
const KM_PER_DEG_LON = 110.7

// Tiles come out roughly square on the ground: 1.2 deg lon is ~133 km and
// 0.95 deg lat is ~105 km, so 88 x 70 gives tiles of about 1.5 km a side.
// The grid must match whatever `npm run bake` wrote.
export const GRID_W = TERRAIN_META.gridW
export const GRID_H = TERRAIN_META.gridH

export const KM_PER_TILE = ((LON_MAX - LON_MIN) * KM_PER_DEG_LON) / GRID_W

export interface Tile {
  tx: number
  ty: number
  elev: number
  terrain: Terrain
  /** Province id; 0 for open sea or ground outside every province polygon. */
  province: number
}

export type SettlementTier = 'hq' | 'relay' | 'outpost'

/**
 * How far a site has come, from a name on a map to a relay that survives
 * losing its generator. The roster renders this as five dots.
 */
export const BUILD_STAGES = ['none', 'surveyed', 'installed', 'running', 'hardened'] as const
export type BuildStage = 0 | 1 | 2 | 3 | 4

export const STAGE_LABEL: Record<BuildStage, string> = {
  0: 'Unvisited',
  1: 'Surveyed',
  2: 'Installed',
  3: 'Running',
  4: 'Hardened',
}

/**
 * An incident demanding the player's attention right now.
 *
 * The kind is what makes it answerable: a raid in progress is settled tonight
 * by whoever is standing there, while a site that has been knocked off the air
 * waits for a wireman and a power kit.
 */
export type AlertKind = 'raid-in-progress' | 'off-air'

export interface Alert {
  kind: AlertKind
  /** Shown verbatim in the HUD, so it carries its own emoji. */
  message: string
  detail: string
}

/**
 * What keeps a site's transmitter running, and what that costs per day.
 * `none` means the mast can be raised but never keyed.
 */
export type Supply = 'genset' | 'battery' | 'free' | 'none'

export interface Settlement {
  id: string
  name: string
  lon: number
  lat: number
  tx: number
  ty: number
  tier: SettlementTier
  /** Height of the mast in metres; drives how tall the tower sprite is. */
  mast: number
  population: number
  power: string
  note: string
  stage: BuildStage
  supply: Supply
  /** A trained operator is posted here. Without one the circuit crawls. */
  operator: boolean
  /** 0 to 100. At 100 the set drops off the air until someone visits it. */
  wear: number
  /** Genset with no fuel in it. Silent until somebody hauls a drum out. */
  cold: boolean
  alert?: Alert
}

export type LinkStatus = 'live' | 'planned' | 'down'

export interface Link {
  from: string
  to: string
  /** Derived every morning from the two endpoints; never authored directly. */
  status: LinkStatus
  /** Era 1 AM radio links are rated in words-per-minute, not bits. */
  bandwidth: string
  latencyMs: number
  /** Words per minute the circuit will actually carry today. */
  wpm: number
  /** Only clears on the night skip, so it carries nothing before dusk. */
  nightOnly: boolean
}

// --- coordinate mapping ------------------------------------------------------

export function tileToLonLat(tx: number, ty: number): { lon: number; lat: number } {
  return {
    lon: LON_MIN + (tx / GRID_W) * (LON_MAX - LON_MIN),
    lat: LAT_NORTH - (ty / GRID_H) * (LAT_NORTH - LAT_SOUTH),
  }
}

export function lonLatToTile(lon: number, lat: number): { tx: number; ty: number } {
  return {
    tx: Math.round(((lon - LON_MIN) / (LON_MAX - LON_MIN)) * GRID_W),
    ty: Math.round(((LAT_NORTH - lat) / (LAT_NORTH - LAT_SOUTH)) * GRID_H),
  }
}

function kmBetween(aLon: number, aLat: number, bLon: number, bLat: number): number {
  return Math.hypot((bLon - aLon) * KM_PER_DEG_LON, (bLat - aLat) * KM_PER_DEG_LAT)
}

// --- measured terrain --------------------------------------------------------

/** Ground height in metres at a grid tile, straight from the baked DEM. */
function metresAt(tx: number, ty: number): number {
  return HEIGHTS[ty * GRID_W + tx] ?? 0
}

// --- traced geography --------------------------------------------------------

/** The Ciliwung, from the Bogor highlands north through the city to Ancol. */
const CILIWUNG: Array<[number, number]> = [
  [106.80, -6.62], [106.82, -6.50], [106.82, -6.40], [106.84, -6.32],
  [106.85, -6.25], [106.83, -6.20], [106.82, -6.16], [106.81, -6.11],
]

/** The Cisadane, running past Tangerang and out at Tanjung Burung. */
const CISADANE: Array<[number, number]> = [
  [106.72, -6.65], [106.70, -6.52], [106.67, -6.40], [106.64, -6.28],
  [106.63, -6.18], [106.62, -6.10], [106.62, -6.03],
]

/** Shortest distance in km from a point to a traced polyline. */
function kmToPolyline(lon: number, lat: number, line: Array<[number, number]>): number {
  let best = Infinity
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1]
    const [x1, y1] = line[i]
    const dx = x1 - x0
    const dy = y1 - y0
    const lenSq = dx * dx + dy * dy
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((lon - x0) * dx + (lat - y0) * dy) / lenSq))
    best = Math.min(best, kmBetween(lon, lat, x0 + dx * t, y0 + dy * t))
  }
  return best
}

/**
 * Urban centres of the real Jabodetabek sprawl, as [lon, lat, radius km].
 * Using several centres instead of one circle reproduces the polycentric
 * shape: a dense core that bleeds south-west toward Depok and east to Bekasi.
 */
const URBAN: Array<[number, number, number]> = [
  [106.83, -6.19, 17], [106.63, -6.18, 9], [107.00, -6.24, 8],
  [106.82, -6.40, 7], [106.80, -6.59, 5],
]

/** 0 at the edge of the sprawl, 1 at the centre of a city. */
function urbanIntensity(lon: number, lat: number): number {
  let best = 0
  for (const [clon, clat, radius] of URBAN) {
    best = Math.max(best, 1 - Math.min(1, kmBetween(lon, lat, clon, clat) / radius))
  }
  return best
}

/**
 * Metres -> tile elevation units, heavily compressed.
 *
 * Measured relief in this box spans 0 m to 2748 m. Mapped linearly the city
 * would be invisible and the volcanoes would leave the screen, so height goes
 * through a square root: Jakarta stays almost flat, Bogor reads as a rise, and
 * Gede still towers without breaking the sprite budget.
 */
function compressElevation(metres: number): number {
  return Math.min(9.5, Math.round(0.19 * Math.sqrt(metres) * 4) / 4)
}

// --- noise -------------------------------------------------------------------

/** Cheap deterministic hash, used instead of pulling in a noise library. */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number, scale: number): number {
  const sx = x / scale
  const sy = y / scale
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  const fx = sx - x0
  const fy = sy - y0
  const ease = (t: number) => t * t * (3 - 2 * t)
  const ux = ease(fx)
  const uy = ease(fy)
  const a = hash(x0, y0)
  const b = hash(x0 + 1, y0)
  const c = hash(x0, y0 + 1)
  const d = hash(x0 + 1, y0 + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

// --- coastline, derived from the heightmap -----------------------------------

/**
 * Which tiles are open water.
 *
 * The DEM clamps the ocean to exactly 0 m, but so is a lot of genuinely dry
 * ground on the Jakarta plain — the city really is that flat, and parts of the
 * north are at or below sea level. Testing for zero alone would flood them.
 *
 * So: flood fill inward from the open water along the northern edge. Only
 * zero-height ground actually connected to the sea becomes sea; inland hollows
 * at the same height stay land, which is what they are.
 */
function floodSea(): Uint8Array {
  const sea = new Uint8Array(GRID_W * GRID_H)
  const queue: number[] = []

  for (let tx = 0; tx < GRID_W; tx++) {
    if (metresAt(tx, 0) <= 0) {
      sea[tx] = 1
      queue.push(tx)
    }
  }

  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    const tx = i % GRID_W
    const ty = (i / GRID_W) | 0
    const neighbours = [[tx - 1, ty], [tx + 1, ty], [tx, ty - 1], [tx, ty + 1]]
    for (const [nx, ny] of neighbours) {
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
      const j = ny * GRID_W + nx
      if (sea[j] || metresAt(nx, ny) > 0) continue
      sea[j] = 1
      queue.push(j)
    }
  }
  return sea
}

/** Tiles from open water, by breadth-first search. 0 on the sea itself. */
function distanceFromSea(sea: Uint8Array): Int16Array {
  const dist = new Int16Array(GRID_W * GRID_H).fill(-1)
  const queue: number[] = []
  for (let i = 0; i < sea.length; i++) {
    if (sea[i]) {
      dist[i] = 0
      queue.push(i)
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    const tx = i % GRID_W
    const ty = (i / GRID_W) | 0
    for (const [nx, ny] of [[tx - 1, ty], [tx + 1, ty], [tx, ty - 1], [tx, ty + 1]]) {
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
      const j = ny * GRID_W + nx
      if (dist[j] !== -1) continue
      dist[j] = dist[i] + 1
      queue.push(j)
    }
  }
  return dist
}

// --- terrain -----------------------------------------------------------------

function terrainAt(
  tx: number, ty: number, lon: number, lat: number,
  metres: number, isSea: boolean, fromSea: number,
): Terrain {
  if (isSea) {
    // Shelf water: within a tile or two of land, so the bay reads shallower
    // at its edges than out in the Java Sea.
    return fromSea === 0 && nearLand(tx, ty) ? 'shallow' : 'sea'
  }
  if (fromSea === 1) return 'sand'

  // Half a tile either side of the traced course, so a river reads as a line
  // rather than as a lake once it is skewed into the isometric projection.
  const river = Math.min(kmToPolyline(lon, lat, CILIWUNG), kmToPolyline(lon, lat, CISADANE))
  if (river < KM_PER_TILE * 0.45) return 'river'

  // North Jakarta is genuinely low, wet ground: fishponds and mangrove flats.
  if (metres <= 3 && fromSea < 6 && smoothNoise(lon * 120, lat * 120, 4) > 0.42) return 'marsh'

  // Thresholds in metres, straight off the DEM: bare rock high on the cones,
  // speckling in through the foothills below.
  if (metres > 900) return 'hill'
  if (metres > 380 && smoothNoise(lon * 90, lat * 90, 5) > 0.48) return 'hill'

  // Ruins of the old metropolis, following the real footprint of the sprawl.
  const urban = urbanIntensity(lon, lat)
  if (urban > 0.25 && smoothNoise(lon * 150, lat * 150, 3.5) < urban * 0.95) return 'rubble'

  if (smoothNoise(lon * 80, lat * 80, 6) > 0.56) return 'scrub'
  return 'grass'
}

/** True when any orthogonal neighbour of a sea tile stands above water. */
let seaMask: Uint8Array
function nearLand(tx: number, ty: number): boolean {
  for (const [nx, ny] of [[tx - 1, ty], [tx + 1, ty], [tx, ty - 1], [tx, ty + 1]]) {
    if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
    if (!seaMask[ny * GRID_W + nx]) return true
  }
  return false
}

// --- settlements -------------------------------------------------------------

interface SettlementSeed
  extends Omit<Settlement, 'tx' | 'ty' | 'supply' | 'operator' | 'wear' | 'cold'> {}

const SEEDS: SettlementSeed[] = [
  {
    id: 'batavia', name: 'New Batavia', lon: 106.813, lat: -6.135, tier: 'hq', mast: 42,
    population: 1840, power: 'Diesel genset + battery bank',
    note: 'Kota Tua, the old harbour town. Project HQ and the first transmitter site.',
    stage: 4,
  },
  {
    id: 'priok', name: 'Tanjung Priok', lon: 106.880, lat: -6.107, tier: 'relay', mast: 28,
    population: 610, power: 'Salvaged marine generator',
    note: 'Container yards picked over for copper, steel and switchgear.',
    stage: 3,
  },
  {
    id: 'kemayoran', name: 'Kemayoran', lon: 106.853, lat: -6.157, tier: 'outpost', mast: 18,
    population: 430, power: 'Hand-cranked charger',
    note: 'Flat, open runway ground. Good line of sight in every direction.',
    stage: 3,
  },
  {
    id: 'menteng', name: 'Menteng', lon: 106.833, lat: -6.196, tier: 'relay', mast: 32,
    population: 950, power: 'Shared genset, rationed',
    note: 'Central relay. Every southbound circuit passes through here.',
    stage: 3,
  },
  {
    id: 'senayan', name: 'Senayan', lon: 106.802, lat: -6.222, tier: 'outpost', mast: 16,
    population: 380, power: 'None - battery drops only',
    note: 'Stadium shell converted into a workshop and antenna farm.',
    stage: 1,
  },
  {
    id: 'kebayoran', name: 'Kebayoran', lon: 106.783, lat: -6.244, tier: 'outpost', mast: 14,
    population: 290, power: 'None - battery drops only',
    note: 'Farmland. Sceptical of the project until the weather reports began.',
    stage: 1,
  },
  {
    id: 'cawang', name: 'Cawang', lon: 106.868, lat: -6.245, tier: 'relay', mast: 26,
    population: 520, power: 'Waterwheel on the Ciliwung',
    note: 'Interchange ruins. The only dry crossing east of the river.',
    stage: 3,
  },
  {
    id: 'pulogadung', name: 'Pulo Gadung', lon: 106.905, lat: -6.181, tier: 'relay', mast: 27,
    population: 480, power: 'Tapped off the Kemayoran genset',
    note: 'Old industrial estate. Miles of buried cable, and everyone knows it.',
    stage: 3,
    alert: {
      kind: 'raid-in-progress',
      message: '\u{1F977} RAYAP BESI ALERT! NEED IMMEDIATE ACTION!',
      detail:
        'Iron termites are stripping the feeder run tonight. Copper is going ' +
        'out by the cartload. Lose this relay and everything east of the ' +
        'Ciliwung drops off the air.',
    },
  },
  {
    id: 'bekasi', name: 'Bekasi', lon: 107.000, lat: -6.235, tier: 'outpost', mast: 20,
    population: 700, power: 'Industrial League grid',
    note: 'Foundries still running. The League wants payment for every watt.',
    stage: 2,
  },
  {
    id: 'tangerang', name: 'Tangerang', lon: 106.630, lat: -6.178, tier: 'relay', mast: 30,
    population: 880, power: 'Diesel genset',
    note: 'First long-distance contact. Proof that the idea works.',
    stage: 3,
  },
  {
    id: 'serang', name: 'Serang', lon: 106.150, lat: -6.120, tier: 'outpost', mast: 22,
    population: 340, power: 'Wind charger',
    note: 'Edge of the known network. Reachable only at night, on a good skip.',
    // Surveyed and no more: the mast, the set and the operator are the whole
    // of Act 1, and the copper for that set is the reason anyone goes into
    // Muara Karang.
    stage: 1,
  },
  {
    id: 'depok', name: 'Depok', lon: 106.818, lat: -6.402, tier: 'outpost', mast: 15,
    population: 260, power: 'None',
    note: 'Surveyed, not yet built. Needs 40 poles and wire we do not have.',
    stage: 1,
  },
  {
    id: 'bogor', name: 'Bogor', lon: 106.797, lat: -6.595, tier: 'outpost', mast: 24,
    population: 410, power: 'Micro-hydro',
    note: 'Highland site at 265 m. From up there a mast could reach Bandung.',
    stage: 0,
  },
]

/**
 * The prose in `power` is what the crew would say; this is what the day loop
 * charges them for. Bekasi is a genset only in the sense that the Industrial
 * League sells them the fuel.
 */
const SUPPLY: Record<string, Supply> = {
  batavia: 'genset', priok: 'genset', kemayoran: 'battery', menteng: 'genset',
  senayan: 'none', kebayoran: 'none', cawang: 'free', pulogadung: 'genset',
  bekasi: 'genset', tangerang: 'genset', serang: 'free', depok: 'none',
  bogor: 'none',
}

export const SETTLEMENTS: Settlement[] = SEEDS.map((seed) => ({
  ...seed,
  ...lonLatToTile(seed.lon, seed.lat),
  supply: SUPPLY[seed.id] ?? 'none',
  // Anything already on the air got there with somebody to key it.
  operator: seed.stage >= 3,
  wear: 0,
  cold: false,
}))

/**
 * The circuits the project has surveyed. Only the pair of endpoints is
 * authored: status, bandwidth and latency all fall out of mast height, ground
 * height, distance and wear, so a link cannot claim to be carrying traffic
 * that its two ends could not actually support.
 */
const LINK_ROUTES: Array<[string, string]> = [
  ['batavia', 'tangerang'], ['tangerang', 'serang'], ['batavia', 'priok'],
  ['batavia', 'kemayoran'], ['kemayoran', 'menteng'], ['menteng', 'cawang'],
  ['kemayoran', 'pulogadung'], ['menteng', 'senayan'], ['senayan', 'kebayoran'],
  ['pulogadung', 'bekasi'], ['kebayoran', 'depok'], ['depok', 'bogor'],
]

export const LINKS: Link[] = LINK_ROUTES.map(([from, to]) => ({
  from,
  to,
  status: 'planned' as LinkStatus,
  bandwidth: '—',
  latencyMs: 0,
  wpm: 0,
  nightOnly: false,
}))

/**
 * Ruins worth climbing into.
 *
 * Every era in the plan runs on parts nobody can make yet, so the old city is
 * the supply chain: an exchange for relays, a power station for windings, a
 * market for valves. Each site is a real Jakarta location, and each is a
 * finite resource — once it is stripped it stays stripped.
 */
export type ScavengeState = 'untouched' | 'picked' | 'stripped'

/** The six things the crew can carry back out of the old city. */
export type ResourceId = 'copper' | 'steel' | 'cells' | 'parts' | 'fuel' | 'rations'

export interface ScavengeSite {
  id: string
  name: string
  kind: string
  lon: number
  lat: number
  tx: number
  ty: number
  state: ScavengeState
  /** What a crew can still pull out of it. */
  yields: string[]
  /** The same list in units, for a full haul out of an untouched site. */
  drops: Partial<Record<ResourceId, number>>
  /** Hauls taken so far. Two picks it over, four strips it for good. */
  hauls: number
  note: string
  /** Rough danger of sending people in, 1-3. */
  risk: number
}

interface ScavengeSeed extends Omit<ScavengeSite, 'tx' | 'ty' | 'drops' | 'hauls'> {}

/**
 * What each ruin is actually made of. Muara Karang is the only real copper
 * faucet on the Act 1 map, and it is the one with a flooded turbine hall.
 */
const DROPS: Record<string, Partial<Record<ResourceId, number>>> = {
  gambir: { copper: 4, parts: 3 },
  muarakarang: { copper: 11, steel: 2 },
  manggarai: { cells: 4, copper: 3, steel: 4 },
  jatinegara: { parts: 6, cells: 2 },
  cakung: { steel: 5, copper: 2, fuel: 5 },
  cilincing: {},
}

const HAULS_TAKEN: Record<ScavengeState, number> = { untouched: 0, picked: 2, stripped: 4 }

const SCAVENGE_SEEDS: ScavengeSeed[] = [
  {
    id: 'gambir', name: 'Gambir Exchange', kind: 'Telephone exchange',
    lon: 106.830, lat: -6.176, state: 'untouched', risk: 1,
    yields: ['Relay banks', 'Switchgear', 'Insulated wire'],
    note: 'Racks of strowger gear, still bolted down. Nobody else knew what it was for.',
  },
  {
    id: 'muarakarang', name: 'Muara Karang Station', kind: 'Power station',
    lon: 106.782, lat: -6.107, state: 'picked', risk: 3,
    yields: ['Transformer cores', 'Copper windings'],
    note: 'Flooded turbine hall. The windings are worth more than anything else on this map.',
  },
  {
    id: 'manggarai', name: 'Manggarai Depot', kind: 'Railway depot',
    lon: 106.850, lat: -6.212, state: 'untouched', risk: 2,
    yields: ['Signal cable', 'Lead-acid cells', 'Steel mast stock'],
    note: 'Signalling runs the length of the yard. Cable in the trough, not in the ground.',
  },
  {
    id: 'jatinegara', name: 'Jatinegara Market', kind: 'Electronics market',
    lon: 106.870, lat: -6.215, state: 'picked', risk: 2,
    yields: ['Valves', 'Capacitors', 'Meters'],
    note: "Stall after stall of components. Half of it is already in somebody else's cart.",
  },
  {
    id: 'cakung', name: 'Cakung Warehouses', kind: 'Warehouse belt',
    lon: 106.940, lat: -6.190, state: 'untouched', risk: 2,
    yields: ['Drum wire', 'Sheet steel', 'Fuel drums'],
    note: 'Kilometres of loading bays. The rayap besi are working this belt eastward.',
  },
  {
    id: 'cilincing', name: 'Cilincing Scrapyards', kind: 'Scrapyard',
    lon: 106.940, lat: -6.108, state: 'stripped', risk: 1,
    yields: [],
    note: 'Picked to the concrete years ago. Worth a look only for what blows in.',
  },
]

export const SCAVENGE_SITES: ScavengeSite[] = SCAVENGE_SEEDS.map((seed) => ({
  ...seed,
  ...lonLatToTile(seed.lon, seed.lat),
  drops: DROPS[seed.id] ?? {},
  hauls: HAULS_TAKEN[seed.state],
}))

/** State a site has fallen to after this many hauls. */
export function scavengeState(hauls: number): ScavengeState {
  return hauls >= 4 ? 'stripped' : hauls >= 2 ? 'picked' : 'untouched'
}

/** Fraction of a full haul still down there. */
export function scavengeYieldFactor(hauls: number): number {
  return hauls >= 4 ? 0 : hauls >= 2 ? 0.55 : 1
}

// --- measurements the day loop needs -----------------------------------------

/** Great-circle-ish distance in km between two points on the map. */
export function distanceKm(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): number {
  return kmBetween(a.lon, a.lat, b.lon, b.lat)
}

/**
 * Height of the ground under a tile, in metres.
 *
 * Antenna height above average terrain is what actually sets radio range, so
 * a 24 m mast on the Bogor highland outperforms a 42 m mast on the Kota Tua
 * waterfront. The DEM already knows this; the day loop just asks it.
 */
export function groundMetres(tx: number, ty: number): number {
  return Math.max(0, metresAt(tx, ty))
}

/**
 * A rayap besi camp. Not an enemy spawner so much as a symptom: they come
 * back unless the region around them has food coming in, which is the whole
 * argument the protagonist keeps making about the network.
 */
export interface Camp {
  id: string
  name: string
  lon: number
  lat: number
  tx: number
  ty: number
  active: boolean
  /** Day the camp re-forms after being cleared, or null while it stands. */
  returnsOn: number | null
}

/** Camps within this many km of a site add to the pressure on it. */
export const CAMP_REACH_KM = 15

interface CampSeed extends Omit<Camp, 'tx' | 'ty'> {}

const CAMP_SEEDS: CampSeed[] = [
  {
    // Far enough off the warehouse belt to be its own place on the map: they
    // camp where nobody has a reason to walk, and work outward from there.
    id: 'cakung-camp', name: 'Cakung belt camp', lon: 106.985, lat: -6.215,
    active: true, returnsOn: null,
  },
  {
    id: 'klender-camp', name: 'Klender yard camp', lon: 106.908, lat: -6.221,
    active: true, returnsOn: null,
  },
  {
    id: 'cilincing-camp', name: 'Cilincing shore camp', lon: 106.988, lat: -6.096,
    active: true, returnsOn: null,
  },
]

export const CAMPS: Camp[] = CAMP_SEEDS.map((seed) => ({
  ...seed,
  ...lonLatToTile(seed.lon, seed.lat),
}))

export interface World {
  tiles: Tile[]
  at(tx: number, ty: number): Tile | undefined
  settlements: Settlement[]
  links: Link[]
  scavenge: ScavengeSite[]
  camps: Camp[]
}

/**
 * The routes couriers already use, which are the same routes the first
 * telegraph poles will follow.
 *
 * These are carved into the terrain as road tiles, and they are also the
 * graph a message travels along in Era 0: a runner follows the road, so a
 * settlement is only reachable through the ones between it and here.
 */
export const ROADS: Array<[string, string]> = [
  ['batavia', 'priok'], ['batavia', 'kemayoran'], ['kemayoran', 'menteng'],
  ['menteng', 'cawang'], ['menteng', 'senayan'], ['senayan', 'kebayoran'],
  ['kemayoran', 'pulogadung'], ['pulogadung', 'bekasi'],
  ['kebayoran', 'depok'], ['depok', 'bogor'],
  ['batavia', 'tangerang'], ['tangerang', 'serang'],
]

function carveRoads(index: Map<string, Tile>) {
  const byId = new Map(SETTLEMENTS.map((s) => [s.id, s]))
  for (const [a, b] of ROADS) {
    const s = byId.get(a)!
    const e = byId.get(b)!
    const steps = Math.ceil(Math.hypot(e.tx - s.tx, e.ty - s.ty) * 2)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const tile = index.get(`${Math.round(s.tx + (e.tx - s.tx) * t)},${Math.round(s.ty + (e.ty - s.ty) * t)}`)
      if (tile && tile.terrain !== 'river' && tile.terrain !== 'sea' && tile.terrain !== 'shallow') {
        tile.terrain = 'road'
      }
    }
  }
}

/**
 * Which era's world to build.
 *
 * Era 0 is the same ground and the same thirteen settlements, before any of it
 * exists: no masts, nothing commissioned, nobody trained, no circuits, and
 * none of the ruins or camps on the map, because nobody has been out there to
 * find them. The roads `carveRoads` lays down are still there — those are the
 * routes couriers already walk. The telegraph will follow them in Era 2 and
 * the survey follows them now.
 */
export type EraId = 0 | 1

/** A settlement as it stood in 2030: a place with people in it, and nothing else. */
function beforeAnything(s: Settlement): Settlement {
  const bare: Settlement = {
    ...s, stage: 0, mast: 0, operator: false, supply: 'none', wear: 0, cold: false,
  }
  // Nothing to raid, and nobody who would hear about it if there were.
  delete bare.alert
  return bare
}

export function buildWorld(era: EraId = 1): World {
  const tiles: Tile[] = []
  const index = new Map<string, Tile>()

  seaMask = floodSea()
  const fromSea = distanceFromSea(seaMask)

  for (let ty = 0; ty < GRID_H; ty++) {
    for (let tx = 0; tx < GRID_W; tx++) {
      const i = ty * GRID_W + tx
      const { lon, lat } = tileToLonLat(tx, ty)
      const metres = metresAt(tx, ty)
      const tile: Tile = {
        tx,
        ty,
        elev: compressElevation(metres),
        terrain: terrainAt(tx, ty, lon, lat, metres, seaMask[i] === 1, fromSea[i]),
        province: PROVINCE_IDS[i],
      }
      tiles.push(tile)
      index.set(`${tx},${ty}`, tile)
    }
  }

  carveRoads(index)

  // Settlements sit on flattened, cleared ground.
  for (const s of SETTLEMENTS) {
    const centre = index.get(`${s.tx},${s.ty}`)
    if (!centre) continue
    // Several of these really are river towns — Kota Tua sits on the Ciliwung
    // mouth, Tangerang on the Cisadane — so the site itself becomes quay
    // rather than open water, and the mast has somewhere to stand.
    if (centre.terrain === 'river') centre.terrain = 'road'
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tile = index.get(`${s.tx + dx},${s.ty + dy}`)
        if (tile && tile.terrain !== 'sea' && tile.terrain !== 'shallow') {
          tile.elev = centre.elev
          if (tile.terrain !== 'road' && tile.terrain !== 'river') tile.terrain = 'scrub'
        }
      }
    }
  }

  return {
    tiles,
    at: (tx, ty) => index.get(`${tx},${ty}`),
    settlements: SETTLEMENTS.map((s) => (era === 0 ? beforeAnything(s) : { ...s })),
    // Era 0 has no circuits to plan, let alone carry anything.
    links: era === 0 ? [] : LINKS.map((l) => ({ ...l })),
    // Nor anything on the map that nobody has walked to yet. The ruins and the
    // camps are out there; finding them is what the survey is for.
    scavenge: era === 0 ? [] : SCAVENGE_SITES.map((s) => ({ ...s })),
    camps: era === 0 ? [] : CAMPS.map((c) => ({ ...c })),
  }
}
