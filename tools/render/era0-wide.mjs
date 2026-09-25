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
const canvas = page.locator('.map-host canvas')
for (let i = 0; i < 300 && !(await canvas.isVisible().catch(() => false)); i++) {
  for (const sel of ['.briefing__begin', '.story__skip', '.dialogue__next', '.story__action']) {
    const el = page.locator(sel).first()
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 1500 }).catch(() => {}); break }
  }
  await page.waitForTimeout(40)
}
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
  g.setState({ survey: s, selectedId: 'depok' })
})
await page.waitForTimeout(600)
await page.mouse.move(720, 450)
for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(60) }
await page.evaluate(() => window.__game.setState({ selectedId: null }))
await page.evaluate(() => window.__game.setState({ selectedId: 'depok' }))
await page.waitForTimeout(600)
await page.screenshot({ path: SP + '/era0-south.png' })
console.log('errors:', errors)
await browser.close()
