/**
 * Knock the white studio background out of the character portraits.
 *
 * The portraits are drawn on flat white, which reads as a card on a dark HUD
 * and is unusable as a map marker. A plain "white becomes transparent" pass
 * would also punch holes in eyes, teeth and highlights, so this floods inward
 * from the border instead: only white that is connected to the outside of the
 * frame is background.
 *
 * Edge pixels are then faded rather than cut, so the cutout does not come away
 * with a hard white fringe around the hair.
 *
 *   npm run cut:portraits
 *
 * Reads assets/*.png, writes assets/cut/*.png. Originals are left alone.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'

const SOURCE = 'assets'
const OUT = 'assets/cut'

/** How far from pure white still counts as background. */
const BACKGROUND = 26
/** Anything whiter than this at the cut edge gets faded rather than kept. */
const FRINGE = 80

const whiteness = (r, g, b) => Math.hypot(255 - r, 255 - g, 255 - b)

/**
 * The slate card two of the portraits are drawn on.
 *
 * A whites-only flood leaves that card standing, so its colour has to join the
 * background as well. It is read from the frame's own corners: a corner is the
 * one place in the picture nothing can be but background, which no other test
 * here can claim. The band is wide enough to swallow the card's gradient and
 * far narrower than the distance to any garment — and on a portrait drawn on
 * plain white no corner qualifies, so the pass does nothing at all.
 *
 * The earlier version of this cut any small flat island touching any border
 * pixel. Clothing leaves the frame through the bottom edge and pixel-art
 * shading breaks it into exactly such islands, so it ate the shirts.
 */
const CARD_BAND = 60

function cut(png) {
  const { width, height, data } = png
  const at = (x, y) => (width * y + x) << 2
  const background = new Uint8Array(width * height)
  const queue = []
  const consider = (x, y) => {
    const i = width * y + x
    if (background[i]) return
    const p = at(x, y)
    if (whiteness(data[p], data[p + 1], data[p + 2]) > BACKGROUND) return
    background[i] = 1
    queue.push(i)
  }

  for (let x = 0; x < width; x++) {
    consider(x, 0)
    consider(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    consider(0, y)
    consider(width - 1, y)
  }

  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]
    const x = i % width
    const y = (i / width) | 0
    if (x > 0) consider(x - 1, y)
    if (x < width - 1) consider(x + 1, y)
    if (y > 0) consider(x, y - 1)
    if (y < height - 1) consider(x, y + 1)
  }

  // Second pass: whatever colour the frame's corners are, if it is not white.
  const cardColours = []
  for (const [x, y] of [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]) {
    const p = at(x, y)
    const colour = [data[p], data[p + 1], data[p + 2]]
    if (whiteness(...colour) <= BACKGROUND) continue
    if (cardColours.some((c) => Math.hypot(c[0] - colour[0], c[1] - colour[1], c[2] - colour[2]) <= CARD_BAND)) continue
    cardColours.push(colour)
  }

  if (cardColours.length) {
    const onCard = (p) =>
      cardColours.some(
        (c) => Math.hypot(data[p] - c[0], data[p + 1] - c[1], data[p + 2] - c[2]) <= CARD_BAND,
      )
    const spread = (x, y) => {
      const i = width * y + x
      if (background[i]) return
      if (!onCard(at(x, y))) return
      background[i] = 1
      queue.push(i)
    }
    queue.length = 0
    for (let x = 0; x < width; x++) {
      spread(x, 0)
      spread(x, height - 1)
    }
    for (let y = 0; y < height; y++) {
      spread(0, y)
      spread(width - 1, y)
    }
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head]
      const x = i % width
      const y = (i / width) | 0
      if (x > 0) spread(x - 1, y)
      if (x < width - 1) spread(x + 1, y)
      if (y > 0) spread(x, y - 1)
      if (y < height - 1) spread(x, y + 1)
    }
  }

  let cleared = 0
  for (let i = 0; i < background.length; i++) {
    const p = i << 2
    if (background[i]) {
      data[p + 3] = 0
      cleared += 1
      continue
    }
    // Kept, but sitting against the cut: fade it in proportion to how much of
    // the background it is carrying, which is what kills the white halo.
    const x = i % width
    const y = (i / width) | 0
    const touchesCut =
      (x > 0 && background[i - 1]) ||
      (x < width - 1 && background[i + 1]) ||
      (y > 0 && background[i - width]) ||
      (y < height - 1 && background[i + width])
    if (!touchesCut) continue
    const w = whiteness(data[p], data[p + 1], data[p + 2])
    if (w < FRINGE) data[p + 3] = Math.round(255 * (w / FRINGE))
  }
  return cleared
}

mkdirSync(OUT, { recursive: true })
const files = readdirSync(SOURCE).filter((f) => /^\d\d-.*\.png$/.test(f))
for (const file of files) {
  const png = PNG.sync.read(readFileSync(join(SOURCE, file)))
  const cleared = cut(png)
  writeFileSync(join(OUT, file), PNG.sync.write(png))
  const share = ((cleared / (png.width * png.height)) * 100).toFixed(1)
  console.log(`${file}: ${share}% of the frame was background`)
}
