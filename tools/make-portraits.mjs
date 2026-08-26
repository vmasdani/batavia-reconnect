/**
 * Portraits for the cast nobody has drawn yet.
 *
 * The four founders are hand-drawn pixel art: a 58x60-ish logical sprite at
 * exactly 4x, eighteen to twenty-three colours, one shared outline brown. Rather
 * than invent a second style beside them, this reads those four back at their
 * true resolution, sorts every colour into a role (skin, hair, garment, eyes,
 * outline), and rebuilds the sprite with a different palette. Everyone drawn
 * here is therefore built out of the founders' own proportions, shading and
 * line weight, because they literally are those pixels.
 *
 * A character spec is three colours and a list of accessories. Ramps are not
 * written out: each source colour keeps its position in its ramp, so a skin
 * base of one colour produces a highlight, midtone and shadow in the same
 * relationship the artist used.
 *
 *   npm run make:portraits
 *
 * Reads assets/*.png, writes assets/cast/*.png. Nothing here overwrites the
 * hand-drawn four; the aged founders are new files beside them.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'

const SCALE = 4
const OUT = 'assets/cast'

/* ---------------------------------------------------------------- templates */

/**
 * Which source colour plays which part.
 *
 * Ramps run light to dark. Read off the four sprites directly: every colour in
 * each file appears exactly once below, so nothing is left to a guess about
 * what a stray four-pixel tone was for.
 */
const TEMPLATES = {
  bayu: {
    file: '01-bayu.png', ox: 3, oy: 2,
    skin: ['237,199,166', '237,181,149', '215,137,107'],
    hair: ['78,78,78', '71,71,71', '63,59,58', '57,54,53', '44,39,36'],
    garment: ['73,82,64', '59,63,47', '41,41,29'],
    keep: ['90,48,45', '206,195,189', '130,74,72', '242,242,242', '221,110,89'],
  },
  mel: {
    file: '02-mel.png', ox: 0, oy: 1,
    skin: ['250,198,177', '247,214,191', '226,155,138', '170,99,75', '138,76,55'],
    hair: ['242,242,242', '219,154,87', '181,124,83', '177,118,64', '146,95,62', '123,77,40'],
    garment: ['99,112,148', '80,86,110', '56,56,69'],
    keep: ['53,47,44', '223,199,199', '77,72,70'],
  },
  pakmin: {
    file: '03-pak-min.png', ox: 3, oy: 3,
    skin: ['237,199,166', '237,181,149', '215,137,107', '148,115,107'],
    hair: ['224,224,224', '196,195,195', '181,171,166', '158,149,145', '125,111,103'],
    garment: ['170,61,149', '137,46,111', '95,30,69'],
    keep: ['143,127,118', '206,195,189', '221,110,89', '223,199,199', '242,242,242'],
  },
  tajuddin: {
    file: '04-tajuddin.png', ox: 1, oy: 1,
    skin: ['218,158,121', '210,136,90', '166,96,50', '119,85,77'],
    hair: ['71,71,71', '65,65,65', '57,54,53', '52,49,48', '42,38,35', '40,35,33', '36,32,30'],
    garment: ['121,82,82', '97,62,60', '75,75,75', '61,58,56'],
    keep: ['117,21,40', '168,33,65', '206,195,189', '203,123,71', '255,200,167'],
  },
}

const BG = '255,255,255'
/** Every one of the four is inked in the same brown. */
const OUTLINE = '49,19,11'

const parse = (key) => key.split(',').map(Number)
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))

/**
 * Put `colour` where `source` sat in its ramp.
 *
 * The ramp's own brightness relationships carry the artist's shading; only the
 * hue is replaced. Anything brighter than the ramp head is lifted toward white
 * rather than clipped, which is what keeps highlights on skin from going flat.
 */
function restate(source, ramp, colour) {
  const head = lum(parse(ramp[0]))
  const f = lum(parse(source)) / (head || 1)
  const [r, g, b] = colour
  if (f <= 1) return [clamp(r * f), clamp(g * f), clamp(b * f)]
  const t = Math.min(1, f - 1)
  return [clamp(r + (255 - r) * t), clamp(g + (255 - g) * t), clamp(b + (255 - b) * t)]
}

/** Read a source sprite back at the resolution it was drawn at. */
function readGrid(template) {
  const png = PNG.sync.read(readFileSync(join('assets', template.file)))
  const { width, height, data } = png
  const w = Math.floor((width - template.ox) / SCALE)
  const h = Math.floor((height - template.oy) / SCALE)
  const cells = new Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (width * (y * SCALE + template.oy) + x * SCALE + template.ox) << 2
      cells[w * y + x] = `${data[o]},${data[o + 1]},${data[o + 2]}`
    }
  }
  const known = new Set([BG, OUTLINE, ...template.skin, ...template.hair, ...template.garment, ...template.keep])
  const missed = [...new Set(cells)].filter((c) => !known.has(c))
  if (missed.length) throw new Error(`${template.file}: unclassified colours ${missed.join(' ')}`)
  return { w, h, cells }
}

/* ------------------------------------------------------------------- canvas */

/**
 * A sprite being built: the source grid, plus the role each cell plays, so an
 * accessory can ask "is this hair" rather than matching colours again.
 */
function canvasOf(template) {
  const { w, h, cells } = readGrid(template)
  const role = new Array(w * h)
  const rank = new Array(w * h).fill(0)
  const index = (list) => new Map(list.map((c, i) => [c, i]))
  const skin = index(template.skin)
  const hair = index(template.hair)
  const garment = index(template.garment)
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]
    if (c === BG) role[i] = 'bg'
    else if (c === OUTLINE) role[i] = 'outline'
    else if (skin.has(c)) { role[i] = 'skin'; rank[i] = skin.get(c) }
    else if (hair.has(c)) { role[i] = 'hair'; rank[i] = hair.get(c) }
    else if (garment.has(c)) { role[i] = 'garment'; rank[i] = garment.get(c) }
    else role[i] = 'keep'
  }
  return { w, h, cells, role, rank, template }
}

/** Rows the face lives between, found from the sprite rather than hard-coded. */
function landmarks(c) {
  const rowsWith = (test) => {
    const out = []
    for (let y = 0; y < c.h; y++) {
      for (let x = 0; x < c.w; x++) if (test(c, x, y)) { out.push(y); break }
    }
    return out
  }
  const skinRows = rowsWith((c, x, y) => c.role[c.w * y + x] === 'skin')
  const garmentRows = rowsWith((c, x, y) => c.role[c.w * y + x] === 'garment')
  const hairRows = rowsWith((c, x, y) => c.role[c.w * y + x] === 'hair')
  // The eyes are the darkest small cluster inside the upper face.
  let eyeRow = skinRows[0] + 8
  let best = 0
  for (let y = skinRows[0]; y < skinRows[0] + 22 && y < c.h; y++) {
    let n = 0
    for (let x = 0; x < c.w; x++) if (c.role[c.w * y + x] === 'keep') n++
    if (n > best) { best = n; eyeRow = y }
  }
  return {
    headTop: Math.min(hairRows[0] ?? 0, skinRows[0]),
    faceTop: skinRows[0],
    eyeRow,
    hairBottom: hairRows[hairRows.length - 1] ?? 0,
    shoulderTop: garmentRows[0] ?? c.h - 12,
    bottom: c.h - 1,
  }
}

/* -------------------------------------------------------------- accessories */

const set = (c, x, y, role, rank = 0) => {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const i = c.w * y + x
  c.role[i] = role
  c.rank[i] = rank
}
const roleAt = (c, x, y) => (x < 0 || y < 0 || x >= c.w || y >= c.h ? 'bg' : c.role[c.w * y + x])

/** Silhouette of the head: the first and last non-background cell in a row. */
function span(c, y) {
  let lo = -1
  let hi = -1
  for (let x = 0; x < c.w; x++) {
    if (roleAt(c, x, y) === 'bg') continue
    if (lo < 0) lo = x
    hi = x
  }
  return [lo, hi]
}

/** Columns the face itself occupies in a row: skin, and the eyes and mouth. */
function faceSpan(c, y) {
  let lo = -1
  let hi = -1
  for (let x = 0; x < c.w; x++) {
    const r = roleAt(c, x, y)
    if (r !== 'skin' && r !== 'keep') continue
    if (lo < 0) lo = x
    hi = x
  }
  return [lo, hi]
}

/**
 * Cut the hair back to the head from `fromRow` down.
 *
 * Palette alone does not make a second character: four people wearing one
 * silhouette read as one person in four shirts, which is what the first pass
 * produced. Changing the outline is the part that separates them.
 *
 * Everything outside the face is cleared, and the cell either side of the face
 * is re-inked, because the line that used to bound the hair was the only
 * outline those rows had.
 */
function crop(c, fromRow) {
  for (let y = fromRow; y < c.h; y++) {
    const [flo, fhi] = faceSpan(c, y)
    for (let x = 0; x < c.w; x++) {
      const r = roleAt(c, x, y)
      if (r !== 'hair' && r !== 'outline') continue
      if (flo >= 0 && x >= flo - 1 && x <= fhi + 1) continue
      // Below the collar the outline is the garment's, not the hair's.
      if (r === 'outline' && (roleAt(c, x, y - 1) === 'garment' || roleAt(c, x, y + 1) === 'garment')) continue
      set(c, x, y, 'bg')
    }
    if (flo < 0) continue
    if (roleAt(c, flo - 1, y) === 'bg') set(c, flo - 1, y, 'outline')
    if (roleAt(c, fhi + 1, y) === 'bg') set(c, fhi + 1, y, 'outline')
  }
}

/** Hair carried straight down past the shoulder, clear of the face. */
function hairFall(c, marks) {
  const edges = []
  for (let x = 0; x < c.w; x++) {
    let bottom = -1
    for (let y = 0; y < c.h; y++) if (roleAt(c, x, y) === 'hair') bottom = y
    if (bottom < 0) continue
    const [flo, fhi] = faceSpan(c, bottom + 1)
    if (flo >= 0 && x > flo && x < fhi) continue
    let filled = false
    for (let y = bottom + 1; y < c.h; y++) {
      if (roleAt(c, x, y) !== 'bg') continue
      set(c, x, y, 'hair', (y + x) % 5 === 0 ? 3 : 1)
      filled = true
    }
    if (filled) edges.push(x)
  }
  for (const x of edges) {
    for (let y = 0; y < c.h; y++) {
      if (roleAt(c, x, y) !== 'hair') continue
      if (roleAt(c, x - 1, y) === 'bg' || roleAt(c, x + 1, y) === 'bg') set(c, x, y, 'outline')
    }
  }
}

/**
 * Two plaits, one either side.
 *
 * A top knot was the obvious second style and does not fit: these sprites put
 * the crown two cells from the top of the frame, so anything above the head is
 * cut off. Everything distinctive therefore has to hang.
 */
function braids(c, marks) {
  crop(c, marks.eyeRow - 2)
  const top = marks.eyeRow - 4
  const bottom = marks.shoulderTop + 6
  const [lo, hi] = span(c, top)
  for (const side of [-1, 1]) {
    const edge = side < 0 ? lo : hi
    for (let y = top; y <= bottom; y++) {
      const t = (y - top) / (bottom - top)
      const width = t > 0.88 ? 1 : 2
      const cx = edge + side * (2 + Math.round(t * 2))
      // A notch every third row is what makes it read as plaited rather than
      // as a rectangle of hair.
      const notch = (y - top) % 3 === 0
      for (let dx = -width; dx <= width; dx++) {
        const rim = Math.abs(dx) === width || y === top || y === bottom
        set(c, cx + dx, y, rim ? 'outline' : 'hair', notch ? 3 : 1)
      }
    }
  }
}

/** Hair gathered and hanging down one side. */
function ponytail(c, marks) {
  crop(c, marks.eyeRow - 2)
  const [, hi] = span(c, marks.eyeRow - 4)
  const top = marks.eyeRow - 5
  const bottom = marks.shoulderTop + 4
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top)
    const width = Math.round(3 + Math.sin(t * Math.PI) * 2.4)
    const drift = Math.round(t * 3)
    const cx = hi + 2 + drift
    for (let dx = -width; dx <= width; dx++) {
      const edge = Math.abs(dx) >= width - 0.5 || y === top || y === bottom
      set(c, cx + dx, y, edge ? 'outline' : 'hair', (y + dx) % 4 === 0 ? 3 : 1)
    }
  }
}

/** Cover bare shoulders. Mel's bust is the only female base, and most of the
 *  women who use it are not dressed like her. */
function clothed(c, marks) {
  for (let y = marks.shoulderTop; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (roleAt(c, x, y) === 'skin') set(c, x, y, 'garment', c.rank[c.w * y + x] === 0 ? 0 : 1)
    }
  }
}

/**
 * A moustache and a chin patch, in the hair's own colour.
 *
 * Darkening the whole lower face by a shade or two — the first attempt — puts a
 * brown mask over the cheeks and jaw and reads as dirt, not hair. A beard is
 * hair: it has an edge, and it only grows where it grows.
 */
function goatee(c, marks) {
  // The mouth is a run of ink inside the face, below the eyes. Looking for the
  // lip *colour* instead finds the nose highlight and the shadow in the collar,
  // which is how the first version drew a bar across the philtrum.
  let mouth = null
  for (let y = marks.eyeRow + 2; y <= marks.eyeRow + 12 && y < c.h; y++) {
    const [flo, fhi] = faceSpan(c, y)
    if (flo < 0) continue
    let run = 0
    let bestRun = 0
    let bestEnd = -1
    for (let x = flo; x <= fhi; x++) {
      if (roleAt(c, x, y) === 'outline') {
        run += 1
        if (run > bestRun) { bestRun = run; bestEnd = x }
      } else run = 0
    }
    if (bestRun >= 4 && (!mouth || bestRun > mouth.width)) {
      mouth = { row: y, width: bestRun, lo: bestEnd - bestRun + 1, hi: bestEnd }
    }
  }
  if (!mouth) return

  // The chin is where the face stops being a face and starts being a neck.
  const [wideLo, wideHi] = faceSpan(c, mouth.row)
  let chin = mouth.row
  for (let y = mouth.row + 1; y < c.h; y++) {
    const [flo, fhi] = faceSpan(c, y)
    if (flo < 0 || fhi - flo < (wideHi - wideLo) * 0.42) break
    chin = y
  }

  const grow = (x, y, rank) => {
    if (roleAt(c, x, y) === 'skin') set(c, x, y, 'hair', rank)
  }
  // Centred on the face, not on the ink run: these heads are not centred in
  // their own frame — Tajuddin's sits left of centre to leave room for the
  // ponytail — and a beard hung off the mouth run alone lands crooked.
  const cx = Math.round((wideLo + wideHi) / 2)

  // Moustache: one row. Two rows plus the lip's own ink below it merges into a
  // single dark mass, which is the difference between a goatee and a smudge.
  for (let dx = -3; dx <= 3; dx++) grow(cx + dx, mouth.row - 1, 1)
  // Chin: starts a row clear of the lip, so the mouth is still a mouth, and
  // tapers to the point of the jaw.
  const start = mouth.row + 2
  for (let y = start; y <= chin; y++) {
    const t = (y - start) / Math.max(1, chin - start)
    const half = t > 0.45 ? 1 : 2
    for (let dx = -half; dx <= half; dx++) grow(cx + dx, y, 1)
  }
}

/**
 * Age, on a face that was drawn young.
 *
 * Drawn in the outline brown rather than a darker skin tone: at four pixels a
 * line, a shade of skin one step down is invisible, which is how the first
 * attempt at this failed.
 */
function wrinkles(c, marks) {
  const line = (x, y) => {
    const i = c.w * y + x
    if (x >= 0 && y >= 0 && x < c.w && y < c.h && c.role[i] === 'skin') c.role[i] = 'outline'
  }
  const mid = Math.round(c.w / 2)
  // Brow.
  for (const dx of [-10, -9, -8, -7, 7, 8, 9, 10]) line(mid + dx, marks.eyeRow - 4)
  for (const dx of [-9, -8, 8, 9]) line(mid + dx, marks.eyeRow - 6)
  // Crow's feet.
  for (const side of [-1, 1]) {
    line(mid + side * 14, marks.eyeRow - 1)
    line(mid + side * 15, marks.eyeRow)
    line(mid + side * 14, marks.eyeRow + 1)
  }
  // Nose to mouth.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) line(mid + side * (6 + k), marks.eyeRow + 5 + k)
  }
}

/** A cloth band across the brow, tied at the side. */
function band(c, marks) {
  const y0 = marks.faceTop + 1
  for (let y = y0; y <= y0 + 2; y++) {
    for (let x = 0; x < c.w; x++) {
      if (roleAt(c, x, y) === 'skin' || roleAt(c, x, y) === 'hair') set(c, x, y, 'cloth', y === y0 ? 0 : 1)
    }
  }
}

/** Cups over the ears, and a band across the top of the head. */
function headphones(c, marks) {
  // The band has to follow the crown. Drawn as a straight bar across the top it
  // floats above the head, because the top rows of a head are the narrow ones.
  for (let x = 0; x < c.w; x++) {
    let top = -1
    for (let y = marks.headTop; y <= marks.eyeRow; y++) {
      if (roleAt(c, x, y) !== 'bg') { top = y; break }
    }
    if (top < 0) continue
    set(c, x, top, 'outline')
    set(c, x, top + 1, 'cloth', 0)
    set(c, x, top + 2, 'cloth', 1)
  }
  for (const side of [0, 1]) {
    const [lo, hi] = span(c, marks.eyeRow)
    const edge = side ? hi : lo
    const dir = side ? 1 : -1
    for (let dy = -4; dy <= 4; dy++) {
      for (let d = -1; d <= 2; d++) {
        const x = edge + dir * d
        const y = marks.eyeRow + dy
        if (Math.abs(dy) === 4 || d === 2) set(c, x, y, 'outline')
        else set(c, x, y, 'cloth', Math.abs(dy) > 2 ? 1 : 0)
      }
    }
  }
}

/**
 * Hair covered, and the cloth carried down past the jaw to the shoulder.
 *
 * Recolouring the hair alone reads as dyed hair, which is what the first
 * version of this looked like. The shape has to change too: the cloth sits a
 * cell wider than the head all the way down, and hangs straight below the
 * hairline instead of following the jaw in.
 */
function hijab(c, marks) {
  for (let i = 0; i < c.role.length; i++) {
    if (c.role[i] === 'hair') { c.role[i] = 'cloth'; c.rank[i] = 1 }
  }
  // Mel's hair has strands inked into it. Under cloth those read as hair, so
  // any line with cloth on every side of it is filled in; a line that still
  // touches skin or the outside is the scarf's own edge and stays.
  for (let pass = 0; pass < 2; pass++) {
    const filled = []
    for (let y = 0; y < c.h; y++) {
      for (let x = 0; x < c.w; x++) {
        if (roleAt(c, x, y) !== 'outline') continue
        const near = [roleAt(c, x - 1, y), roleAt(c, x + 1, y), roleAt(c, x, y - 1), roleAt(c, x, y + 1)]
        if (near.some((r) => r === 'bg' || r === 'skin' || r === 'keep')) continue
        if (near.filter((r) => r === 'cloth').length < 3) continue
        filled.push([x, y])
      }
    }
    for (const [x, y] of filled) set(c, x, y, 'cloth', 1)
  }
  // One soft highlight along the crown, and nothing else. A headscarf has no
  // strands: leaving the hair ramp's bright streaks in place — worse, lifting
  // them — is what made the first two versions of this read as dyed hair.
  for (let y = marks.headTop; y <= marks.headTop + 5; y++) {
    for (let x = 0; x < c.w; x++) if (roleAt(c, x, y) === 'cloth') set(c, x, y, 'cloth', 0)
  }
  // Everything above the brow is cloth, full stop. Recolouring only the hair
  // leaves the fringe inked across the forehead, and a fringe is the single
  // strongest signal that what is on the head is hair.
  const brow = marks.eyeRow - 8
  for (let y = 0; y <= brow; y++) {
    for (let x = 0; x < c.w; x++) {
      const r = roleAt(c, x, y)
      if (r === 'bg' || r === 'garment') continue
      set(c, x, y, 'cloth', 1)
    }
  }
  for (let y = 0; y <= brow; y++) {
    for (let x = 0; x < c.w; x++) {
      if (roleAt(c, x, y) !== 'cloth') continue
      if (roleAt(c, x - 1, y) === 'bg' || roleAt(c, x + 1, y) === 'bg' || roleAt(c, x, y - 1) === 'bg') {
        set(c, x, y, 'outline')
      }
    }
  }
  // The edge of the scarf, drawn rather than implied.
  {
    const [lo, hi] = span(c, brow)
    for (let x = lo + 1; x < hi; x++) set(c, x, brow, 'outline')
  }
  // Lift the crown: cloth sits on top of hair, so the head gets taller.
  {
    const [lo, hi] = span(c, marks.headTop + 2)
    for (let x = lo; x <= hi; x++) {
      set(c, x, marks.headTop - 2, 'outline')
      set(c, x, marks.headTop - 1, 'cloth', 1)
    }
  }
  const widest = span(c, marks.hairBottom)
  for (let y = marks.headTop - 1; y <= marks.shoulderTop; y++) {
    // Below the hairline the cloth stops following the face and hangs.
    const [lo, hi] = y <= marks.hairBottom ? span(c, y) : widest
    if (lo < 0) continue
    for (const [x, ink] of [[lo - 4, true], [lo - 3, false], [lo - 2, false], [lo - 1, false], [hi + 1, false], [hi + 2, false], [hi + 3, false], [hi + 4, true]]) {
      if (roleAt(c, x, y) !== 'bg') continue
      set(c, x, y, ink ? 'outline' : 'cloth', 1)
    }
    if (y > marks.hairBottom) {
      for (let x = lo; x <= hi; x++) if (roleAt(c, x, y) === 'bg') set(c, x, y, 'cloth', 1)
    }
  }
  // Hem, where the cloth meets the shoulder.
  // The shawl carries past the shoulder rather than stopping at a hem line.
  const [lo, hi] = widest
  for (let y = marks.shoulderTop; y < c.h; y++) {
    for (const [x, ink] of [[lo - 4, true], [lo - 3, false], [lo - 2, false], [hi + 2, false], [hi + 3, false], [hi + 4, true]]) {
      set(c, x, y, ink ? 'outline' : 'cloth', 1)
    }
  }
}

/** Frames around whatever the base uses for eyes. */
function glasses(c, marks) {
  const mid = Math.round(c.w / 2)
  const top = marks.eyeRow - 2
  const bottom = marks.eyeRow + 2
  for (const side of [-1, 1]) {
    const outer = mid + side * 13
    const inner = mid + side * 3
    const lo = Math.min(outer, inner)
    const hi = Math.max(outer, inner)
    for (let x = lo; x <= hi; x++) {
      set(c, x, top, 'outline')
      set(c, x, bottom, 'outline')
    }
    for (let y = top; y <= bottom; y++) {
      set(c, lo, y, 'outline')
      set(c, hi, y, 'outline')
    }
  }
  for (let x = mid - 3; x <= mid + 3; x++) set(c, x, top, 'outline')
}

const OPS = {
  clothed, goatee, wrinkles, band, headphones, hijab, glasses,
  hairFall, braids, ponytail,
  crop: (c, marks) => crop(c, marks.eyeRow - 2),
}

/* ------------------------------------------------------------------ writing */

function render(canvas, spec) {
  const { w, h, cells, role, rank, template } = canvas
  const png = new PNG({ width: w * SCALE, height: h * SCALE })
  const ramps = {
    skin: [template.skin, spec.skin],
    hair: [template.hair, spec.hair],
    garment: [template.garment, spec.garment],
    cloth: [template.garment, spec.cloth ?? spec.garment],
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = w * y + x
      let rgb = null
      let alpha = 255
      const r = role[i]
      if (r === 'bg') alpha = 0
      else if (r === 'outline') rgb = parse(OUTLINE)
      else if (r === 'keep') rgb = parse(cells[i])
      else {
        const [source, colour] = ramps[r]
        rgb = restate(source[Math.min(rank[i], source.length - 1)], source, colour)
      }
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < SCALE; dx++) {
          const o = (png.width * (y * SCALE + dy) + x * SCALE + dx) << 2
          png.data[o] = rgb ? rgb[0] : 0
          png.data[o + 1] = rgb ? rgb[1] : 0
          png.data[o + 2] = rgb ? rgb[2] : 0
          png.data[o + 3] = alpha
        }
      }
    }
  }
  return png
}

/* --------------------------------------------------------------- characters */

/** Three colours and a list of accessories. See CHARACTER ROSTER in spec.txt. */
const CAST = [
  // The eight who join in later eras.
  { id: 'iwan', base: 'tajuddin', skin: [206, 148, 106], hair: [78, 68, 60], garment: [112, 106, 78], ops: ['crop', 'goatee'] },
  { id: 'sari', base: 'mel', skin: [222, 168, 126], hair: [58, 46, 42], garment: [126, 152, 138], cloth: [222, 190, 120], ops: ['hairFall', 'clothed', 'band'] },
  { id: 'ayu', base: 'mel', skin: [238, 194, 158], hair: [82, 60, 46], garment: [196, 158, 88], cloth: [96, 104, 112], ops: ['crop', 'clothed', 'headphones'] },
  { id: 'ratna', base: 'mel', skin: [214, 166, 128], hair: [62, 58, 60], garment: [128, 96, 152], cloth: [138, 166, 170], ops: ['clothed', 'hijab'] },
  { id: 'hendra', base: 'pakmin', skin: [198, 138, 96], hair: [96, 92, 88], garment: [186, 108, 66], ops: [] },
  { id: 'dewi', base: 'mel', skin: [232, 186, 152], hair: [96, 72, 54], garment: [140, 198, 178], ops: ['braids', 'clothed'] },
  { id: 'fajar', base: 'bayu', skin: [226, 176, 136], hair: [44, 40, 42], garment: [110, 170, 200], ops: ['crop'] },
  { id: 'anisa', base: 'mel', skin: [224, 176, 138], hair: [70, 52, 44], garment: [176, 200, 138], ops: ['ponytail', 'clothed', 'glasses'] },

  // The founders, forty years on. Same faces, greyed and lined.
  { id: 'bayu-old', base: 'bayu', skin: [224, 186, 156], hair: [162, 166, 168], garment: [82, 92, 74], ops: ['wrinkles'] },
  { id: 'mel-old', base: 'mel', skin: [236, 202, 180], hair: [206, 194, 172], garment: [104, 116, 148], ops: ['clothed', 'wrinkles'] },
  { id: 'tajuddin-old', base: 'tajuddin', skin: [204, 150, 116], hair: [172, 168, 164], garment: [124, 88, 88], ops: ['wrinkles'] },
]

mkdirSync(OUT, { recursive: true })
for (const spec of CAST) {
  const template = TEMPLATES[spec.base]
  const canvas = canvasOf(template)
  const marks = landmarks(canvas)
  for (const op of spec.ops) OPS[op](canvas, marks)
  const png = render(canvas, spec)
  writeFileSync(join(OUT, `${spec.id}.png`), PNG.sync.write(png))
  console.log(`${spec.id}.png  ${png.width}x${png.height}  from ${spec.base}${spec.ops.length ? ` + ${spec.ops.join(', ')}` : ''}`)
}
