import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const errors = []

/** Open Era 0 in a language, with the crew posed at a gate, and stop there. */
async function gate(page, lang, pose) {
  await page.goto('http://localhost:5219/')
  if (lang === 'id') await page.locator('.lang__pick', { hasText: 'ID' }).click().catch(() => {})
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
  await page.evaluate(() => window.__game.getState().dismissOpening())
  await page.evaluate(pose)
  await page.locator('.end-day').click()
  await page.locator('.modal--parley').waitFor()
}

/** Tajuddin back at a village that already asked the price, larder near empty. */
const pose = () => {
  const g = window.__game
  const s = { ...g.getState().survey }
  s.contact = { ...s.contact, bogor: 'wary' }
  s.attempts = { ...s.attempts, bogor: 2 }
  s.rations = 2
  s.crew = {
    ...s.crew,
    tajuddin: { at: 'bogor', task: { kind: 'parley', target: 'bogor' }, daysLeft: 1, hurtDays: 0 },
  }
  g.setState({ survey: s })
}

for (const [lang, size] of [['en', { width: 1440, height: 900 }], ['id', { width: 1280, height: 720 }]]) {
  const page = await browser.newPage({ viewport: size })
  page.setDefaultTimeout(8000)
  page.on('console', (m) => m.type() === 'error' && errors.push(`${lang}: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`${lang}: ${e}`))
  await gate(page, lang, pose)

  console.log(`\n--- ${lang} @ ${size.width}x${size.height} ---`)
  console.log('what they need:', await page.locator('.parley__tell').innerText())
  console.log('offers:', await page.locator('.parley__card-label').allInnerTexts())
  // The store holds 2, so the sack is still on the table and says what it
  // would actually cost rather than refusing.
  console.log('what the sack costs:', await page.locator('.parley__card-where').first().innerText())
  // Nothing may overflow: the modal is the one panel that survives a short screen.
  const spill = await page.evaluate(() => {
    const m = document.querySelector('.modal--parley')
    const r = m.getBoundingClientRect()
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), viewport: window.innerHeight, scrolls: m.scrollHeight > m.clientHeight }
  })
  console.log('box:', JSON.stringify(spill))
  await page.screenshot({ path: `${SP}/parley-${lang}.png` })
  await page.close()
}
console.log('\nerrors:', errors)
await browser.close()
