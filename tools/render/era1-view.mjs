import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(5000)
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5219/')
await page.locator('.menu__choice').nth(2).click()
const canvas = page.locator('.map-host canvas')
for (let i = 0; i < 300 && !(await canvas.isVisible().catch(() => false)); i++) {
  for (const sel of ['.briefing__begin', '.story__skip', '.dialogue__next', '.story__action']) {
    const el = page.locator(sel).first()
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 1500 }).catch(() => {}); break }
  }
  await page.waitForTimeout(40)
}
await page.waitForFunction(() => typeof window.__mapDebug === 'function')
const a = await page.evaluate(() => window.__mapDebug())
await page.waitForTimeout(700)
const b = await page.evaluate(() => window.__mapDebug())
const moved = a.packets.filter((p, i) => b.packets[i] && Math.hypot(b.packets[i].x - p.x, b.packets[i].y - p.y) > 0.5).length
console.log('era 1 packets:', a.packets.length, 'era-0 layer:', a.beams, a.letter, 'moved:', moved)
await page.screenshot({ path: SP + '/era1-links.png' })
console.log('errors:', errors)
await browser.close()
