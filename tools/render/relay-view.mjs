import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto('http://localhost:5219/', { waitUntil: 'networkidle' })
// Era 2 is read-only from the menu, which is the shortest way in.
await page.getByRole('button', { name: /The Copper War/ }).click()
await page.getByRole('button', { name: 'Begin', exact: true }).click()
await page.waitForSelector('.relay__map')
await page.waitForTimeout(1400)
await page.screenshot({ path: 'tools/render/relay-early.png' })
const early = await page.locator('.relay__caption').innerText()
await page.waitForTimeout(3000)
await page.screenshot({ path: 'tools/render/relay-mid.png' })
const mid = await page.locator('.relay__caption').innerText()
await page.waitForSelector('.relay__verdict', { timeout: 20000 })
await page.screenshot({ path: 'tools/render/relay-done.png' })
console.log('early:', early.replace(/\n/g, ' | '))
console.log('mid:', mid.replace(/\n/g, ' | '))
console.log('verdict:', (await page.locator('.relay__verdict').innerText()).replace(/\n/g, ' | '))
await page.getByRole('button', { name: 'Next' }).click()
console.log('after next, dialogue shown:', await page.locator('.dialogue, .story').count() > 0)
console.log('errors:', errors)
await browser.close()
