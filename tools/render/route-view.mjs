import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 940 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto('http://localhost:5219/', { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /routing table/i }).click()
await page.waitForSelector('.route__map')
await page.screenshot({ path: 'tools/render/route-idle.png' })

const wire = async () => (await page.locator('.route__wire code').allTextContents()).join(' ')
const saving = () => page.locator('.route__saving').innerText()
console.log('stock wire:', await wire(), '|', await saving())
await page.getByRole('button', { name: 'Weather' }).click()
console.log('weather wire:', await wire(), '|', await saving())
await page.screenshot({ path: 'tools/render/route-weather.png' })
await page.getByRole('button', { name: 'Free text' }).click()
console.log('text wire:', await wire(), '|', await saving())
await page.getByRole('button', { name: 'Stock report' }).click()

await page.getByRole('button', { name: 'Send ▸' }).click()
await page.waitForSelector('.route__steps li.is-at')
await page.waitForTimeout(1800)
await page.screenshot({ path: 'tools/render/route-mid.png' })
await page.waitForFunction(() => document.querySelector('.sim__sum.is-done') !== null, null, { timeout: 20000 })
const delivered = await page.locator('.sim__sum.is-done').innerText()
const steps = await page.locator('.route__steps li').allInnerTexts()
const race = await page.locator('.sim__race li').allInnerTexts()
await page.screenshot({ path: 'tools/render/route-done.png' })

// Cut the line the packet just used and check the route changes.
await page.getByRole('button', { name: 'Kemayoran — Pulo Gadung' }).click()
await page.waitForTimeout(300)
const rerouted = await page.locator('.route__steps li').allInnerTexts()
await page.screenshot({ path: 'tools/render/route-cut.png' })

// Isolate Serang entirely.
await page.selectOption('.route__field:nth-of-type(2) select', 'serang')
await page.getByRole('button', { name: 'Tangerang — Serang' }).click()
await page.waitForTimeout(300)
const noRoute = await page.locator('.sim__error').count()

console.log('delivered:', delivered)
console.log('steps:\n' + steps.join('\n'))
console.log('race:\n' + race.join('\n'))
console.log('after cut:\n' + rerouted.join('\n'))
console.log('no-route message shown:', noRoute)
console.log('errors:', errors)
await browser.close()
