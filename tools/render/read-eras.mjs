import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(5000)
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5219/')

for (const lang of ['EN']) {
  await page.getByRole('button', { name: lang, exact: true }).click()
  console.log('\n--', lang, '--')
  console.log('doors:', await page.locator('.menu__era').count())
  for (const era of [5]) {
    await page.locator('.menu__era').nth(era - 2).click()
    const card = await page.locator('.story__title, .story-card__title, h1').first().innerText()
    await page.locator('.story-card__begin').click()
    // Straight past the chapter: the dialogue's own close is what a player
    // who has read it already would use, and it lands on the primer.
    await page.locator('.dialogue__close').click()
    await page.locator('.briefing').waitFor()
    const primer = await page.locator('.briefing__era').innerText()
    const things = await page.locator('.briefing__how--primer li').count()
    await page.locator('.briefing__begin').click()
    const brief = await page.locator('.briefing__era').innerText()
    const how = await page.locator('.briefing__how:not(.briefing__how--primer) li').count()
    const end = await page.locator('.briefing__begin').innerText()
    console.log(`era ${era}: ${card.replace(/\n/g, ' ')} | ${primer.replace(/\n/g, ' ')} things ${things} | ${brief.replace(/\n/g, ' ')} how ${how} | ends "${end}"`)
    if (era === 5 && lang === 'EN') await page.screenshot({ path: SP + '/era5-brief.png' })
    await page.locator('.briefing__begin').click()
    await page.locator('.menu__era').first().waitFor()
  }
}
console.log('\nerrors:', errors)
await browser.close()
