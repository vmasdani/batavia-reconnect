/**
 * Pull one photograph per glossary term from Wikipedia, and write down who took it.
 *
 * The diagrams in `figures.tsx` explain how a thing works. They cannot say what
 * it looked like, and for most of these — a switchboard, a Strowger switch, a
 * rack of core memory — a photograph of the real object is the thing that makes
 * the rest land. Wikipedia has all of them and most are freely licensed, so the
 * game ships them rather than linking them: this is a game about a country that
 * lost its network, and it would be a poor joke if it needed one to draw a page.
 *
 * What it does, per term with a `wiki` on it:
 *
 *   1. Ask English Wikipedia for the article's lead image at 560 px wide, or,
 *      when the term names a `File:` directly, ask Commons for that file.
 *   2. Ask Commons for the artist and licence of whatever came back.
 *   3. Save the thumbnail to `assets/tech/<id>.<ext>` and record the credit.
 *
 * It is incremental. What it has already got is remembered in
 * `assets/tech/credits.json` and left alone, so a run that Wikimedia cut short
 * with a rate limit can simply be run again to pick up the rest, and a single
 * term can be re-fetched by deleting its line. Pass `--refresh` to take the lot
 * again from scratch.
 *
 * Then it writes `src/photos.ts`: static imports, so Vite fingerprints them and
 * a missing file is a build error rather than a blank rectangle at runtime.
 *
 * Anything without a free licence is dropped on purpose — the credit line is
 * only worth printing if it is true, and a term with no photo still has its
 * diagram, which is the half that teaches.
 *
 *   npm run fetch:photos
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { TERMS } from '../src/glossary'

const UA = 'reconnect-batavia/0.1 (educational game; glossary illustrations)'
/**
 * The photograph is shown in a 190 px column, so this is already twice what a
 * dense screen can use. Larger is only weight — and the whole set has to fit in
 * a repository somebody clones over a bad connection.
 */
const WIDTH = 400

/**
 * Licences we are willing to print a credit line for.
 *
 * CC0 and public domain need no credit at all and get one anyway, because a
 * reader who wants to go and look at the real thing should be able to find it.
 */
const FREE = /^(cc0|cc[ -]|public domain|pd[- ]|no restrictions|attribution$)/i

interface Found {
  id: string
  file: string
  url: string
  credit: string
  license: string
  page: string
}

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms))

/**
 * One API call, backing off when Wikimedia says to.
 *
 * 40 terms is 80 requests, which is enough for the anonymous rate limiter to
 * start refusing. It answers 429 rather than failing silently, so the fix is
 * simply to slow down and try again rather than to shard or parallelise.
 */
const api = async (host: string, params: Record<string, string>) => {
  const url = new URL(`https://${host}/w/api.php`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } })
    if (res.ok) return res.json() as Promise<any>
    if (res.status !== 429 || attempt >= 8) throw new Error(`${host} ${res.status}`)
    await wait(3000 * (attempt + 1))
  }
}

/** Strip the HTML Commons puts in its artist field; a credit line is one line of text. */
const plain = (html: string | undefined) =>
  (html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * A file on Commons whose name looks like this technology.
 *
 * The fallback for the articles that have no lead image at all — several of the
 * abstract ones do not, because there is nothing photographable about "packet
 * switching" — and for the pair of terms whose articles share one photograph,
 * where showing the same picture twice would teach the reader that the 2 things
 * are the same thing.
 */
async function searchFile(query: string): Promise<string[]> {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    list: 'search',
    srsearch: `${query} filetype:bitmap`,
    srnamespace: '6',
    srlimit: '8',
  })
  return (data?.query?.search ?? []).map((hit: any) => hit.title as string)
}

/** The lead image of an article, as a file title. */
async function leadFile(article: string): Promise<string | undefined> {
  const data = await api('en.wikipedia.org', {
    action: 'query',
    titles: article,
    prop: 'pageimages',
    piprop: 'name',
    redirects: '1',
  })
  const page = data?.query?.pages?.[0]
  return page?.pageimage ? `File:${page.pageimage}` : undefined
}

/** The thumbnail URL, artist and licence of one Commons file. */
async function fileInfo(file: string) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    titles: file,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(WIDTH),
    iiextmetadatafilter: 'Artist|LicenseShortName|Credit|DescriptionUrl',
  })
  const info = data?.query?.pages?.[0]?.imageinfo?.[0]
  if (!info) return undefined
  const meta = info.extmetadata ?? {}
  return {
    url: (info.thumburl ?? info.url) as string,
    credit: plain(meta.Artist?.value) || 'Wikimedia Commons',
    license: plain(meta.LicenseShortName?.value) || 'unknown',
    page: (info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(file)}`) as string,
  }
}

/**
 * Fetch the picture itself.
 *
 * Separate from `api` because the failure is different: a rate-limited image
 * request answers with an HTML error page and HTTP 200, which lands on disk as
 * a 2 kB file named `.jpg` that no browser will draw. Checking the type is the
 * only way to notice.
 */
async function download(url: string): Promise<{ bytes: Buffer; type: string }> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/*' } })
    const type = (res.headers.get('content-type') ?? '').split(';')[0]
    if (res.ok && type.startsWith('image/')) return { bytes: Buffer.from(await res.arrayBuffer()), type }
    if (attempt >= 5) throw new Error(`image came back as ${res.status} ${type || 'no type'}`)
    await wait(2500 * (attempt + 1))
  }
}

/**
 * What the file actually is, from the server rather than from its name.
 *
 * Commons does not resize animated GIFs, so asking for a 400 px thumbnail of
 * one hands back the original at full weight and full animation — a moving
 * picture next to a diagram, which is worse than no picture. Those are refused
 * and the next candidate is tried.
 */
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
/** Past this, a photograph is costing more than it teaches. */
const MAX_BYTES = 320 * 1024

const LEDGER = 'assets/tech/credits.json'
const refresh = process.argv.includes('--refresh')

/** What previous runs already got, so a rate-limited run can be resumed rather than repeated. */
const found: Found[] = refresh || !existsSync(LEDGER) ? [] : JSON.parse(readFileSync(LEDGER, 'utf8'))
const skipped: string[] = []
/** No two terms may share a photograph: the same picture twice reads as the same thing twice. */
const taken = new Set(found.map((f) => f.file))
const have = new Set(found.map((f) => f.id))

for (const term of TERMS) {
  if (!term.wiki || have.has(term.id)) continue

  /** Try each file in turn and keep the first that is free, small and still. */
  const attempt = async (files: string[], why: string[]) => {
    for (const file of files) {
      if (taken.has(file)) continue
      const info = await fileInfo(file)
      if (!info) {
        why.push(`${file}: no imageinfo`)
        continue
      }
      if (!FREE.test(info.license)) {
        why.push(`${file}: “${info.license}”`)
        continue
      }
      const { bytes, type } = await download(info.url)
      const ext = EXT[type]
      if (!ext) {
        why.push(`${file}: ${type}`)
        continue
      }
      if (bytes.length > MAX_BYTES) {
        why.push(`${file}: ${(bytes.length / 1024).toFixed(0)} kB`)
        continue
      }
      writeFileSync(`assets/tech/${term.id}.${ext}`, bytes)
      taken.add(file)
      found.push({ id: term.id, file, url: `${term.id}.${ext}`, credit: info.credit, license: info.license, page: info.page })
      console.log(`  ${term.id.padEnd(24)} ${(bytes.length / 1024).toFixed(0).padStart(4)} kB  ${info.license}`)
      return true
    }
    return false
  }

  // Polite spacing between terms. This runs by hand, and being told to come
  // back later costs more than a second of waiting.
  await wait(700)
  try {
    const why: string[] = []
    // The article's own picture first — it is the one an editor chose as
    // representative — then whatever Commons has under the term's name, which
    // is what saves the abstractions with no lead image at all.
    const lead = term.wiki.startsWith('File:') ? term.wiki : await leadFile(term.wiki)
    const saved =
      (lead ? await attempt([lead], why) : false) ||
      (await attempt(await searchFile(term.wiki.replace(/^File:/, '')), why))
    if (!saved) skipped.push(`${term.id}: nothing usable — ${why.join('; ') || 'no candidates'}`)
  } catch (err) {
    skipped.push(`${term.id}: ${(err as Error).message}`)
  }
}

found.sort((a, b) => TERMS.findIndex((t) => t.id === a.id) - TERMS.findIndex((t) => t.id === b.id))
writeFileSync(LEDGER, `${JSON.stringify(found, null, 2)}\n`)

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const varName = (id: string) => id.replace(/-(.)/g, (_, c) => c.toUpperCase())

writeFileSync(
  'src/photos.ts',
  `/**
 * A photograph of each technology, and who to credit for it.
 *
 * Generated by \`npm run fetch:photos\` — do not edit by hand. The images live
 * in \`assets/tech/\` and are imported rather than fetched, so the game draws
 * its glossary with no network, which is the entire premise of the game.
 *
 * Every entry here is under a free licence and the credit line is rendered
 * under the picture, which is the condition those licences are given on.
 */

${found.map((f) => `import ${varName(f.id)} from '../assets/tech/${f.url}'`).join('\n')}

export interface Photo {
  src: string
  /** Who made it. Shown under the picture, linking to the file's page. */
  credit: string
  /** The licence it is shown under, in the short form Commons uses. */
  license: string
  page: string
}

export const PHOTOS: Record<string, Photo> = {
${found
  .map(
    (f) =>
      `  ${/^[a-z][\w]*$/.test(f.id) ? f.id : q(f.id)}: {\n    src: ${varName(f.id)},\n    credit: ${q(f.credit)},\n    license: ${q(f.license)},\n    page: ${q(f.page)},\n  },`,
  )
  .join('\n')}
}

export const photoFor = (id: string): Photo | undefined => PHOTOS[id]
`,
)

console.log(`\n${found.length} photographs saved to assets/tech/`)
if (skipped.length) console.log(`no photo for ${skipped.length}:\n  ${skipped.join('\n  ')}`)
