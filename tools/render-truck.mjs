/**
 * Renders the Blue Truck model into isometric sprite sheets.
 *
 * The project has the truck only as a 3D model and a set of perspective
 * previews, none of which line up with the map's projection. Rather than
 * skewing a preview by hand, this loads the glTF in a headless browser and
 * renders it through an orthographic camera set to the game's exact isometric
 * angle — 45 degrees round, atan(0.5) up — so the sprite sits on the tiles
 * without any fudging.
 *
 * Four yaw angles rather than two-plus-mirrors: mirroring would flip the
 * driver's side and the asymmetric details, and rendering is free here.
 *
 * Run with `npm run render:truck`. Build-time only.
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { chromium } from 'playwright'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'assets', 'truck')
const PORT = 4199

/** Screen headings on the isometric grid, and the model yaw that produces them. */
const HEADINGS = [
  { name: 'se', yaw: 270 },  // toward +tx: down and right on screen
  { name: 'sw', yaw: 180 },  // toward +ty: down and left
  { name: 'nw', yaw: 90 },   // toward -tx: up and left
  { name: 'ne', yaw: 0 },    // toward -ty: up and right
]

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary',
  '.png': 'image/png', '.bin': 'application/octet-stream',
}

async function main() {
  await mkdir(OUT, { recursive: true })

  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0])
      const file = path === '/' ? '/tools/render/truck.html' : path
      const body = await readFile(join(ROOT, file))
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  await new Promise((done) => server.listen(PORT, done))

  const browser = await chromium.launch({
    args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
  })
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  try {
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 40000 })
  } catch {
    const detail = await page.evaluate(() => window.__err ?? '(no error captured)')
    throw new Error(`render page never became ready: ${detail}`)
  }

  for (const { name, yaw } of HEADINGS) {
    const dataUrl = await page.evaluate((y) => window.__renderYaw(y), yaw)
    const png = Buffer.from(dataUrl.split(',')[1], 'base64')
    await writeFile(join(OUT, `truck-${name}.png`), png)
    console.log(`  truck-${name}.png  yaw ${yaw}deg  ${(png.length / 1024).toFixed(1)} KB`)
  }

  if (errors.length) console.error('page errors:', errors.join('\n'))
  await browser.close()
  server.close()
  console.log(`wrote ${HEADINGS.length} sprites to assets/truck/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
