import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(8000)
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
await page.waitForFunction(() => typeof window.__mapDebug === 'function')
// The chapter card can still be over the map; the day cannot be ended under it.
await page.evaluate(() => window.__game.getState().dismissOpening())
await page.waitForTimeout(200)

// Two crew standing in two different found settlements, each one day from
// finishing a parley: the queue has to play both before the day resolves.
await page.evaluate(() => {
  const g = window.__game
  const s = { ...g.getState().survey }
  s.contact = { ...s.contact, priok: 'found', menteng: 'found' }
  s.rations = 24
  s.crew = {
    ...s.crew,
    bayu: { at: 'priok', task: { kind: 'parley', target: 'priok' }, daysLeft: 1, hurtDays: 0 },
    mel: { at: 'menteng', task: { kind: 'parley', target: 'menteng' }, daysLeft: 1, hurtDays: 0 },
  }
  g.setState({ survey: s })
})

await page.locator('.end-day').click()
await page.locator('.modal--parley').waitFor()
console.log('gate 1:', await page.locator('.modal--parley h2').innerText())
console.log('what they need:', await page.locator('.parley__tell').innerText())
console.log('offers:', await page.locator('.parley__card-label').allInnerTexts())
console.log('nothing to leave with yet:', (await page.locator('.modal--parley .button--primary').count()) === 0)
await page.screenshot({ path: SP + '/parley-open.png' })

// One offer, and that is the whole exchange.
const card = page.locator('.parley__card:not([disabled])').first()
console.log('offering:', await card.locator('.parley__card-label').innerText())
await card.click()
await page.waitForTimeout(120)
console.log('they say:', await page.locator('.parley__said').innerText())
console.log('verdict:', await page.locator('.parley__verdict').innerText())
console.log('offers gone:', (await page.locator('.parley__card').count()) === 0)
await page.screenshot({ path: SP + '/parley-verdict.png' })

const leave = page.locator('.modal--parley .button--primary')
console.log('leave says:', await leave.innerText())
await leave.click()

// Second gate, handed to a clerk.
await page.locator('.modal--parley').waitFor()
console.log('\ngate 2:', await page.locator('.modal--parley h2').innerText())
console.log('what they need:', await page.locator('.parley__tell').innerText())
await page.locator('.modal--parley .button', { hasText: 'handle' }).click()
await page.waitForTimeout(150)
console.log('clerk offered:', await page.locator('.parley__said-card').innerText())
console.log('verdict 2:', await page.locator('.parley__verdict').innerText())
await page.screenshot({ path: SP + '/parley-auto.png' })
await page.locator('.modal--parley .button--primary').click()

// The day resolves once the queue is empty.
await page.locator('.modal--report').waitFor({ timeout: 15000 })
const report = await page.locator('.report__line').allInnerTexts()
console.log('report:\n  ' + report.join('\n  '))
console.log('parley modal gone:', (await page.locator('.modal--parley').count()) === 0)
const after = await page.evaluate(() => {
  const s = window.__game.getState().survey
  return { day: s.day, rations: s.rations, priok: s.contact.priok, menteng: s.contact.menteng, attempts: s.attempts }
})
console.log('after:', JSON.stringify(after))
console.log('errors:', errors)
await browser.close()
