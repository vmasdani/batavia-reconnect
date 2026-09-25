import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
page.setDefaultTimeout(8000)
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

// --- the era 0 primer, which is where a term first pops up ------------------
await page.goto('http://localhost:5219/')
await page.locator('.menu__choice').nth(1).click()
for (let i = 0; i < 120; i++) {
  if (await page.locator('.briefing__how--primer').isVisible().catch(() => false)) break
  for (const sel of ['.story-card__begin', '.dialogue__close']) {
    const el = page.locator(sel).first()
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 1200 }).catch(() => {}); break }
  }
  await page.waitForTimeout(60)
}
await page.waitForSelector('.briefing__plate .figure__svg')
const plates = await page.locator('.briefing__plate').count()
const photos = await page.locator('.briefing__plate img').count()
const broken = await page.evaluate(() =>
  [...document.querySelectorAll('.figure__photo img')].filter((i) => i.complete && i.naturalWidth === 0).length,
)
const steps = await page.locator('.briefing__plate .figure__steps li').count()
const pins = await page.locator('.briefing__plate .figure__svg circle[stroke]').count()
console.log(JSON.stringify({ plates, photos, brokenImages: broken, stepLines: steps }))
await page.locator('.briefing').screenshot({ path: `${SP}/shot-primer.png` })

// --- a term panel, opened from a blue word in the primer ---------------------
await page.locator('.briefing__how--primer .term').first().click()
await page.waitForSelector('.modal--term .figure')
await page.locator('.modal--term').screenshot({ path: `${SP}/shot-term.png` })
await page.keyboard.press('Escape').catch(() => {})

// --- the glossary page, all 40 -----------------------------------------------
await page.goto('http://localhost:5219/')
await page.locator('.menu__choice').nth(3).click()
await page.waitForSelector('.term-card .figure__svg')
await page.evaluate(async () => {
  const scroll = document.querySelector('.glossary__scroll')
  for (let y = 0; y < scroll.scrollHeight; y += 600) { scroll.scrollTop = y; await new Promise((r) => setTimeout(r, 60)) }
  scroll.scrollTop = 0
})
await page.waitForTimeout(400)
const cards = await page.locator('.term-card').count()
const drawn = await page.locator('.term-card .figure__svg').count()
const shots = await page.locator('.term-card .figure__photo img').count()
const badGlossary = await page.evaluate(() =>
  [...document.querySelectorAll('.figure__photo img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
)
console.log(JSON.stringify({ cards, diagrams: drawn, photographs: shots, broken: badGlossary }))
await page.locator('.glossary__era').first().screenshot({ path: `${SP}/shot-glossary.png` })

console.log('errors:', errors.length ? errors.slice(0, 5) : 'none')
await browser.close()
