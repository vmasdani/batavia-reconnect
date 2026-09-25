import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto('http://localhost:5219/', { waitUntil: 'networkidle' })
await p.getByRole('button', { name: /^Start/ }).click()
// Every chapter, straight through: the eight numbers are the arc.
for (const era of [0, 1, 2, 3, 4, 5, 6, 7]) {
  await p.locator('.story__era').nth(era).click()
  await p.getByRole('button', { name: 'Begin', exact: true }).click()
  await p.waitForSelector('.relay__map')
  await p.locator('.relay__skip').click()
  await p.waitForSelector('.relay__verdict')
  const said = (await p.locator('.relay__verdict').innerText()).split('\n').filter(Boolean)
  console.log(`era ${era}: ${said[1]} ${said[2]}`)
  if (era === 7) await p.screenshot({ path: 'tools/render/relay-era7.png' })
}
await p.getByRole('button', { name: 'Next' }).click()
console.log('falls through to the scene:', await p.locator('.dialogue__line, .dialogue').count() > 0)
console.log('errors:', errors)
await b.close()
