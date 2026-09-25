import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(5000)
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto('http://localhost:5219/')
await page.locator('.menu__choice').nth(1).click()

// Card, chapter, primer, briefing — click through until the map is up.
const canvas = page.locator('.map-host canvas')
for (let i = 0; i < 300 && !(await canvas.isVisible().catch(() => false)); i++) {
  for (const sel of ['.briefing__begin', '.story__skip', '.dialogue__next', '.story__action']) {
    const el = page.locator(sel).first()
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 1500 }).catch(() => {}); break }
  }
  await page.waitForTimeout(40)
}
console.log('map up:', await canvas.isVisible().catch(() => false))

// The canvas appears while `boot` is still loading art, so the probe going
// up is the only honest signal that the map is finished and subscribed.
await page.waitForFunction(() => typeof window.__mapDebug === 'function')

await page.evaluate(() => {
  const g = window.__game
  const s = { ...g.getState().survey }
  s.contact = { ...s.contact }
  for (const id of ['priok','kemayoran','menteng','cawang','senayan','kebayoran','pulogadung','bekasi','tangerang','depok']) s.contact[id] = 'talking'
  s.contact.bogor = 'found'
  s.contact.serang = 'wary'
  s.boards = ['batavia','kemayoran','tangerang','menteng']
  s.fires = ['depok','bogor','kebayoran']
  s.day = 12
  s.letter = { state: 'out', sentOn: 10, due: 16 }
  g.setState({ survey: s })
})
await page.waitForTimeout(900)

const a = await page.evaluate(() => window.__mapDebug())
await page.waitForTimeout(700)
const b = await page.evaluate(() => window.__mapDebug())
const moved = a.packets.filter((p, i) => b.packets[i] && Math.hypot(b.packets[i].x - p.x, b.packets[i].y - p.y) > 0.5).length
// Every courier walks at one pace, whatever the length of its road. Sampled
// over many short windows and taken at the maximum, because a window that
// happens to span a handover or a wait shows less than the pace.
const best = a.packets.map(() => 0)
let last = await page.evaluate(() => window.__mapDebug())
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(120)
  const now = await page.evaluate(() => window.__mapDebug())
  const gap = 0.12
  now.packets.forEach((p, k) => {
    const was = last.packets[k]
    if (!was || p.waiting || was.waiting) return
    best[k] = Math.max(best[k], Math.hypot(p.x - was.x, p.y - was.y) / gap)
  })
  last = now
}
console.log('pace px/s per courier:', best.map((v) => Math.round(v)).join(' '))
console.log("packets:", a.packets.length, "beams:", a.beams, "letter:", a.letter && "on the map", 'moved after 700ms:', moved)
// A courier arriving at a gate with no board stands there. Sampled over a few
// seconds because the pause is short and the legs are not in step.
const seen = new Set()
for (let i = 0; i < 40; i++) {
  const now = await page.evaluate(() => window.__mapDebug())
  now.packets.forEach((p, k) => p.waiting && seen.add(k))
  await page.waitForTimeout(150)
}
console.log('couriers seen waiting at a gate:', seen.size, 'of', a.packets.length,
  '— the rest have a board at both ends')

await page.screenshot({ path: SP + '/era0-network.png' })

await page.mouse.move(720, 450)
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(50) }
await page.waitForTimeout(500)
await page.screenshot({ path: SP + '/era0-region.png' })

console.log('errors:', errors)
await browser.close()
