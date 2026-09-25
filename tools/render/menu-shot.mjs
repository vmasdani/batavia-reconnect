import { chromium } from 'playwright'
const SP = process.env.SP
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(5000)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5219/')
await page.getByRole('button', { name: 'EN', exact: true }).click()
await page.screenshot({ path: SP + '/menu.png' })
await page.locator('.menu__era').nth(4).click()
await page.locator('.story-card__begin').click()
await page.locator('.dialogue__close').click()
await page.locator('.briefing').waitFor()
await page.screenshot({ path: SP + '/era6-primer.png' })
console.log('errors:', errors)
await browser.close()
