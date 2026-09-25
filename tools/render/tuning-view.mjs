import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(8000)
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
await page.evaluate(() => window.__game.getState().dismissOpening())

/** Two sets finishing commissioning tonight: the queue has to run both. */
const pose = () => {
  const g = window.__game
  const s = g.getState().sim
  const w = g.getState().world
  for (const id of ['bekasi', 'senayan']) {
    const site = w.settlements.find((x) => x.id === id)
    site.stage = 2
    site.supply = 'none'
  }
  g.setState({
    world: w,
    sim: {
      ...s,
      kits: { ...s.kits, genset: 4 },
      operators: 4,
      crew: {
        ...s.crew,
        pakmin: { ...s.crew.pakmin, at: 'bekasi', task: { kind: 'commission', target: 'bekasi' }, daysLeft: 1, hurtDays: 0 },
        mel: { ...s.crew.mel, at: 'senayan', task: { kind: 'commission', target: 'senayan' }, daysLeft: 1, hurtDays: 0 },
      },
    },
  })
}
await page.evaluate(pose)
// Era 1 confirms the day's orders before it runs them.
await page.locator('.end-day').click()
await page.locator('.modal .button--primary', { hasText: 'Execute day' }).click()
await page.locator('.modal--bench').waitFor()
console.log('bench 1:', await page.locator('.modal--bench h2').innerText())
console.log('meter at rest:', await page.locator('.bench__meter-word').innerText())
await page.screenshot({ path: SP + '/bench-open.png' })

// Sweep the dial and read the meter — the only way to find the carrier is the
// same way the player does it.
const dial = page.locator('.modal--bench input[type=range]')
let best = { khz: 1600, width: -1 }
for (let khz = 1600; khz <= 3000; khz += 40) {
  await dial.fill(String(khz))
  const width = await page.locator('.bench__meter-fill').evaluate((el) => parseFloat(el.style.width))
  if (width > best.width) best = { khz, width }
}
console.log('carrier found at', best.khz, 'kHz, meter', best.width + '%')
await dial.fill(String(best.khz))
await page.waitForTimeout(80)
console.log('meter says:', await page.locator('.bench__meter-word').innerText())
console.log('reach note:', await page.locator('.bench__reach-note').innerText())
console.log('half lit:', await page.locator('.bench__halves .is-on').innerText())
await page.screenshot({ path: SP + '/bench-locked.png' })
await page.locator('.modal--bench .button--primary').click()

// Second set, taken up onto the sky wave to see the strip change.
await page.locator('.modal--bench').waitFor()
console.log('\nbench 2:', await page.locator('.modal--bench h2').innerText())
const ground = await page.locator('.bench__reach-note').innerText()
await page.locator('.modal--bench input[type=range]').fill('6100')
await page.waitForTimeout(80)
console.log('ground strip:', ground)
console.log('sky strip:   ', await page.locator('.bench__reach-note').innerText())
console.log('half lit:', await page.locator('.bench__halves .is-on').innerText())
const dots = await page.locator('.bench__reach svg text').evaluateAll((n) => n.map((t) => `${t.textContent}:${t.getAttribute('fill')}`))
console.log('neighbours on the strip:', dots.join(' '))
await page.screenshot({ path: SP + '/bench-sky.png' })
await page.locator('.modal--bench .button--primary').click()

await page.locator('.modal--report').waitFor({ timeout: 20000 })
console.log('\nreport:\n  ' + (await page.locator('.report__line').allInnerTexts()).join('\n  '))
console.log('bench gone:', (await page.locator('.modal--bench').count()) === 0)
console.log('after:', JSON.stringify(await page.evaluate(() => {
  const w = window.__game.getState().world
  const pick = (id) => { const s = w.settlements.find((x) => x.id === id); return { band: s.band, trim: +s.trim.toFixed(2), stage: s.stage } }
  return {
    bekasi: pick('bekasi'), senayan: pick('senayan'),
    links: w.links.filter((l) => [l.from, l.to].some((x) => x === 'bekasi' || x === 'senayan')).map((l) => `${l.from}-${l.to} ${l.status} ${l.bandwidth}`),
  }
})))
console.log('errors:', errors)
await browser.close()
