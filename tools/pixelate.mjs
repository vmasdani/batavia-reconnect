/**
 * Turn a photograph into pixel art.
 *
 * The eras want a real photograph behind them — a bombed town, a mast on a
 * hill, a room full of valves — and a photograph dropped into this game looks
 * like a photograph dropped into this game. Pixelating it puts the picture on
 * the same grid as everything else on screen: the map is tiles, the portraits
 * are pixels, and a backdrop that is neither reads as a different product.
 *
 * The work is one downscale and one upscale with smoothing off. Chromium is
 * already a dependency (`playwright`, used by the render checks) and it decodes
 * JPEG, PNG, WebP and SVG and does averaged downscaling in one place, so the
 * whole tool is a canvas in a headless page rather than a new image library.
 *
 *   node tools/pixelate.mjs <source> [options]
 *
 * `source` is a local file, an http(s) URL, or a Commons `File:Name.jpg` — the
 * last of those also records who took it, because these are shown to a player
 * and the licence says so.
 *
 *   --out <path>        where to write (default assets/pixel/<name>.png)
 *   --px <n>            pixel size: 5 means every 5x5 block becomes 1 (default 5)
 *   --width <n>         resize the source to this wide first (default 960)
 *   --crop x,y,w,h      take this part of the source first, in fractions of it
 *                       (0.1,0.4,0.6,0.5 = start a tenth in, take the middle)
 *   --brightness <n>    -100..100, like the sliders (default 0)
 *   --contrast <n>      -100..100 (default 0)
 *   --saturation <n>    -100..100; -100 is grey (default 0)
 *   --upscale <n>       also write the art n times bigger, hard-edged (default 1)
 *   --preview           write <out>-before.png too, to compare against
 *
 * The file it writes is the small one — 960 wide at pixel size 5 is 192 across
 * — because that *is* the art, and the page blows it back up with
 * `image-rendering: pixelated` for free. Upscaling here only makes a file that
 * is 25 times the size and says the same thing.
 */

import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'

const UA = 'reconnect-batavia/0.1 (educational game; era backdrops)'

const args = process.argv.slice(2)
const source = args.find((a) => !a.startsWith('--'))
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const has = (name) => args.includes(`--${name}`)
const num = (name, fallback) => Number(flag(name, fallback))

if (!source) {
  console.error(readFileSync(new URL(import.meta.url)).toString().split('*/')[0].split('\n *   ').slice(1).join('\n  '))
  process.exit(1)
}

const px = num('px', 5)
const width = num('width', 960)
const brightness = num('brightness', 0)
const contrast = num('contrast', 0)
const saturation = num('saturation', 0)
const upscale = num('upscale', 1)
/**
 * The part of the photograph worth keeping.
 *
 * A wide hall of switchboard operators pixelated whole gives every face 4
 * pixels and none of them read as a face. Cropping first is the difference
 * between a picture of people and a texture — and it is also how a portrait
 * source gets framed for a backdrop that is much wider than it is tall.
 */
const crop = (flag('crop', '') || '')
  .split(',')
  .map(Number)
  .filter((n) => Number.isFinite(n))

/** A short, file-system-safe name for whatever was asked for. */
const slug = (s) =>
  basename(s.replace(/^File:/, '').replace(/\?.*$/, ''), extname(s.replace(/\?.*$/, '')))
    .replace(/[_\s]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase()

/** The closest file Commons has to a title that did not resolve. */
async function searchCommons(text) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  for (const [k, v] of Object.entries({
    action: 'query',
    format: 'json',
    formatversion: '2',
    list: 'search',
    srnamespace: '6',
    srlimit: '1',
    srsearch: text,
  })) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  return (await res.json())?.query?.search?.[0]?.title
}

/** Ask Commons for the file itself and for who to credit. */
async function fromCommons(file) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  for (const [k, v] of Object.entries({
    action: 'query',
    format: 'json',
    formatversion: '2',
    titles: file,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(Math.max(width, 960)),
    iiextmetadatafilter: 'Artist|LicenseShortName|DescriptionUrl',
  })) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  const info = (await res.json())?.query?.pages?.[0]?.imageinfo?.[0]
  // Commons titles are copied off a page by eye and an l is an I often enough
  // to be worth one search rather than an error message.
  if (!info) {
    const near = await searchCommons(file.replace(/^File:/, '').replace(/\.\w+$/, '').replace(/\([^)]*\)/g, ' '))
    if (near && near !== file) {
      console.log(`  no ${file}; using ${near}`)
      return fromCommons(near)
    }
    throw new Error(`Commons has no ${file}`)
  }
  const meta = info.extmetadata ?? {}
  // Commons will not thumbnail some files as wide as asked (big PNGs in
  // particular), and a 600 px thumbnail pixelated at 5 is a 120 px picture —
  // blocks so large that faces stop being faces. Take the original in that case
  // and let the canvas do the resize.
  const thumb = info.thumbwidth >= Math.max(width, 960) ? info.thumburl : info.url
  // Commons often gives the artist as a link plus the same words again as its
  // text, which strips to "Unknown authorUnknown author". Collapse the repeat.
  const plain = (s) =>
    s
      ? String(s)
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/^(.{4,}?)\1+/, '$1')
      : ''
  return {
    url: thumb ?? info.url,
    credit: {
      file,
      credit: plain(meta.Artist?.value) || 'Wikimedia Commons',
      license: plain(meta.LicenseShortName?.value) || 'unknown',
      page: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(file)}`,
    },
  }
}

/**
 * Download, backing off when Wikimedia says no.
 *
 * Doing a whole set of eras in one go is a dozen requests in a minute from one
 * address, which is exactly what the anonymous rate limiter is watching for. A
 * 429 halfway through a set is not an error, it is a request to wait.
 */
async function grab(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/*' } })
    if (res.ok) return { bytes: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') ?? 'image/jpeg' }
    if (attempt >= 4) throw new Error(`image came back ${res.status}`)
    const wait = 3000 * (attempt + 1)
    console.log(`  ${res.status}; waiting ${wait / 1000}s`)
    await new Promise((r) => setTimeout(r, wait))
  }
}

async function load() {
  if (source.startsWith('File:')) {
    const { url, credit } = await fromCommons(source)
    return { ...(await grab(url)), credit }
  }
  if (/^https?:/.test(source)) {
    return grab(source)
  }
  const ext = extname(source).toLowerCase()
  const type = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[ext] ?? 'image/jpeg'
  return { bytes: readFileSync(source), type }
}

const { bytes, type, credit } = await load()
const out = flag('out', join('assets/pixel', `${slug(source)}.png`))
mkdirSync(dirname(out), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()
const shots = await page.evaluate(
  async ({ data, px, width, crop, brightness, contrast, saturation, upscale, preview }) => {
    const img = new Image()
    img.src = data
    await img.decode()

    const [cx, cy, cw, ch] = crop.length === 4 ? crop : [0, 0, 1, 1]
    const box = {
      x: Math.round(cx * img.naturalWidth),
      y: Math.round(cy * img.naturalHeight),
      w: Math.max(1, Math.round(cw * img.naturalWidth)),
      h: Math.max(1, Math.round(ch * img.naturalHeight)),
    }

    // Fit to the working width first: pixel size means nothing without knowing
    // what it is a fifth of, and a 4000 px original at pixel size 5 is still a
    // photograph.
    const w = Math.min(width, box.w)
    const h = Math.round((box.h / box.w) * w)

    const cell = Math.max(1, Math.round(px))
    const small = document.createElement('canvas')
    small.width = Math.max(1, Math.round(w / cell))
    small.height = Math.max(1, Math.round(h / cell))
    const sc = small.getContext('2d')
    // Smoothing ON going down: each output pixel is the average of the block it
    // replaces, which is what makes the result read as the same picture. Nearest
    // neighbour here would just throw 24 pixels out of every 25 away.
    sc.imageSmoothingEnabled = true
    sc.imageSmoothingQuality = 'high'
    const f = (v) => (100 + v) / 100
    sc.filter = `brightness(${f(brightness)}) contrast(${f(contrast)}) saturate(${f(saturation)})`
    sc.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, small.width, small.height)

    const blowUp = (source, times) => {
      const big = document.createElement('canvas')
      big.width = source.width * times
      big.height = source.height * times
      const bc = big.getContext('2d')
      // And OFF going back up, which is the entire look: hard square edges.
      bc.imageSmoothingEnabled = false
      bc.drawImage(source, 0, 0, big.width, big.height)
      return big
    }

    const before = document.createElement('canvas')
    if (preview) {
      before.width = w
      before.height = h
      before.getContext('2d').drawImage(img, box.x, box.y, box.w, box.h, 0, 0, w, h)
    }

    return {
      art: (upscale > 1 ? blowUp(small, upscale) : small).toDataURL('image/png'),
      grid: [small.width, small.height],
      before: preview ? before.toDataURL('image/png') : undefined,
    }
  },
  {
    data: `data:${type};base64,${bytes.toString('base64')}`,
    px,
    width,
    crop,
    brightness,
    contrast,
    saturation,
    upscale,
    preview: has('preview'),
  },
)
await browser.close()

const write = (path, dataUrl) => {
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  writeFileSync(path, buf)
  return buf.length
}
const size = write(out, shots.art)
if (shots.before) write(out.replace(/\.png$/, '-before.png'), shots.before)

// The credit is only worth keeping next to the picture it belongs to, so it
// goes in the folder the picture landed in rather than one central ledger.
if (credit) {
  const ledger = join(dirname(out), 'credits.json')
  const all = existsSync(ledger) ? JSON.parse(readFileSync(ledger, 'utf8')) : {}
  all[basename(out)] = credit
  writeFileSync(ledger, `${JSON.stringify(all, null, 2)}\n`)
}

console.log(
  `${out}  ${shots.grid[0]}x${shots.grid[1]} pixels${upscale > 1 ? ` (written ${upscale}x)` : ''}  ${(size / 1024).toFixed(0)} kB` +
    (credit ? `\n  ${credit.credit} — ${credit.license}` : ''),
)
