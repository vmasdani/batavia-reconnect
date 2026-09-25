import { chromium } from 'playwright'
const SP = process.env.SP
const b = await chromium.launch()
for (const [w, h, tag] of [[1600, 950, 'wide'], [1440, 900, 'laptop'], [1160, 800, 'shot'], [900, 760, 'narrow'], [1280, 720, 'short']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  p.setDefaultTimeout(8000)
  const errs = []; p.on('pageerror', e => errs.push(String(e)))
  await p.goto('http://localhost:5219/')
  await p.locator('.menu__choice').nth(2).click()
  await p.locator('.story-card__begin').first().click()

  // Headless raster makes the character-at-a-time reveal glacial, so finish
  // the line the way a fast reader does.
  await p.locator('.dialogue__next').click()
  // Line 1 names four technologies and announces nothing: no plate until the
  // pointer asks for one.
  await p.waitForSelector('.dialogue__text .term')
  const quiet = await p.locator('.dialogue__plate').count()
  await p.locator('.dialogue__text .term').first().hover()
  await p.waitForSelector('.dialogue__shot')
  const hoverName = await p.locator('.dialogue__shot-name').innerText()
  const hoverShots = await p.locator('.dialogue__shot').count()
  const hoverDiagrams = await p.locator('.dialogue__plate .figure__svg').count()
  if (tag === 'laptop') await p.screenshot({ path: `${SP}/plate-hover.png` })
  await p.mouse.move(4, 4)
  await p.waitForTimeout(120)
  const afterHover = await p.locator('.dialogue__plate').count()

  // Hover, then advance without moving the pointer: the word is taken away
  // underneath it and no leave event ever fires.
  await p.locator('.dialogue__text .term').first().hover()
  await p.waitForSelector('.dialogue__shot')
  await p.locator('.dialogue__next').click()
  await p.waitForTimeout(200)
  const afterAdvance = await p.locator('.dialogue__plate').count()

  // Line 5 is "build a radio out of a drum of wire and a truck battery".
  for (let i = 0; i < 3; i++) {
    await p.locator('.dialogue__next').click()   // advance
    await p.waitForTimeout(50)
    await p.locator('.dialogue__next').click()   // finish the reveal
    await p.waitForTimeout(50)
  }
  await p.waitForSelector('.dialogue__shot')
  const names = await p.locator('.dialogue__shot-name').allInnerTexts()
  const buildDiagrams = await p.locator('.dialogue__plate .figure__svg').count()
  const box = await p.locator('.dialogue__plate').boundingBox()
  const text = await p.locator('.dialogue__box').boundingBox()
  console.log(tag, JSON.stringify({
    plateBeforeHover: quiet, hover: hoverName, hoverShots, afterHover, afterAdvance,
    gapAboveBox: Math.round(text.y - (box.y + box.height)),
    build: names, diagramsInDialogue: hoverDiagrams + buildDiagrams,
    onScreen: box.x >= 0 && box.y >= 0 && box.x + box.width <= w && box.y + box.height <= h,
    overlapsBox: !(box.y >= text.y + text.height || box.y + box.height <= text.y),
    errors: errs.length,
  }))
  await p.screenshot({ path: `${SP}/plate-${tag}.png` })
  await p.close()
}
await b.close()
