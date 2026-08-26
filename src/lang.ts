/**
 * English and Indonesian, for the menu and story mode.
 *
 * The chapters exist once, in English, and a translation supplies only text:
 * `chaptersIn` rebuilds each chapter from the English structure so era numbers,
 * speakers and the break between the halves can never drift between languages.
 * A missing line falls back to English rather than rendering blank, and says so
 * loudly in dev, which is where a half-finished translation should be caught.
 *
 * The gameplay HUD is still English only. It is a much larger surface — orders,
 * resources, reports, skits — and nothing here assumes it will stay that way.
 */

import { CHAPTERS, type Chapter } from './story'
import { ID_CHAPTERS } from './story.id'

export type Lang = 'en' | 'id'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'id', label: 'ID' },
]

export interface UiText {
  /** Menu. */
  tagline: string
  start: string
  startNote: string
  era0: string
  era0Note: string
  era1: string
  era1Note: string
  glossary: string
  glossaryNote: string
  /** Glossary panel. */
  inTheRealWorld: string
  close: string
  /** Story chrome. */
  mainMenu: string
  draft: string
  era: string
  theWork: string
  opening: string
  ending: string
  begin: string
  yearsLater: string
  back: string
  next: string
  show: string
  finish: string
  readAgain: string
  /** Leave an era's opening scene without reading it. */
  skip: string
  /** The briefing card between the opening scene and the map. */
  briefing: string
  /** The primer card that explains the era's communication. */
  primer: string
  primerLead: string
  butNot: string
  soWhat: string
  toTheWork: string
  objective: string
  toWin: string
  pushingBack: string
  howToPlay: string
  startEra: string
  endTitle: string
  endPremise: string
}

export const UI: Record<Lang, UiText> = {
  en: {
    tagline: 'People die. Ideas do not. Being able to build the idea is what takes a lifetime.',
    start: 'Start',
    startNote: 'The whole arc, Era 0 to Era 7. Script only — no gameplay.',
    era0: 'Era 0 — The Survey',
    era0Note: 'Forty villages, no radio, and three people who can walk.',
    era1: 'Era 1 — The First Voice',
    era1Note: 'AM radio across the Jakarta region.',
    glossary: 'Glossary',
    glossaryNote: 'Every technology the eight eras rebuild, and who built it first.',
    inTheRealWorld: 'In the real world: ',
    close: 'Close',
    mainMenu: 'Main menu',
    draft: 'draft script',
    era: 'Era',
    theWork: 'the work',
    opening: 'opening',
    ending: 'ending',
    begin: 'Begin',
    yearsLater: 'Years later',
    back: 'back',
    next: 'Next',
    show: 'Show',
    finish: 'Finish',
    readAgain: 'Read again',
    skip: 'skip',
    briefing: 'the work',
    primer: 'how a message moves',
    primerLead: 'Where you are starting from',
    butNot: 'What it cannot do',
    soWhat: 'What it adds up to',
    toTheWork: 'The work',
    objective: 'The work',
    toWin: 'To finish the era',
    pushingBack: 'What pushes back',
    howToPlay: 'How it is played',
    startEra: 'Begin day 1',
    endTitle: 'The First Internet',
    endPremise: 'Forty-one years. The man who understood it best did not live to see the end of it.',
  },
  id: {
    tagline: 'Manusia mati. Gagasan tidak. Yang butuh seumur hidup adalah kemampuan membangunnya.',
    start: 'Mulai',
    startNote: 'Seluruh kisahnya, Era 0 sampai Era 7. Hanya naskah — tanpa permainan.',
    era0: 'Era 0 — Penjajakan',
    era0Note: 'Empat puluh kampung, tanpa radio, dan tiga orang yang bisa berjalan kaki.',
    era1: 'Era 1 — Suara Pertama',
    era1Note: 'Radio AM di wilayah Jakarta.',
    glossary: 'Glosarium',
    glossaryNote: 'Semua teknologi yang dibangun ulang di delapan era, dan siapa yang membuatnya lebih dulu.',
    inTheRealWorld: 'Di dunia nyata: ',
    close: 'Tutup',
    mainMenu: 'Menu utama',
    draft: 'naskah draf',
    era: 'Era',
    theWork: 'pekerjaannya',
    opening: 'pembuka',
    ending: 'penutup',
    begin: 'Mulai',
    yearsLater: 'Bertahun-tahun kemudian',
    back: 'kembali',
    next: 'Lanjut',
    show: 'Tampilkan',
    finish: 'Selesai',
    readAgain: 'Baca lagi',
    skip: 'lewati',
    briefing: 'pekerjaannya',
    primer: 'bagaimana pesan bergerak',
    primerLead: 'Titik berangkatnya',
    butNot: 'Yang tidak bisa dilakukannya',
    soWhat: 'Jadinya bagaimana',
    toTheWork: 'Pekerjaannya',
    objective: 'Pekerjaannya',
    toWin: 'Untuk menyelesaikan era ini',
    pushingBack: 'Yang melawan',
    howToPlay: 'Cara memainkannya',
    startEra: 'Mulai hari 1',
    endTitle: 'Internet Pertama',
    endPremise:
      'Empat puluh satu tahun. Orang yang paling paham soal itu tidak hidup sampai akhirnya.',
  },
}

if (import.meta.env.DEV) {
  CHAPTERS.forEach((chapter, i) => {
    const text = ID_CHAPTERS[i]
    const wrong =
      !text ||
      text.opening.length !== chapter.opening.length ||
      text.closing.length !== chapter.closing.length
    if (wrong) {
      console.error(
        `story.id.ts is out of step with story.ts at era ${chapter.era}: expected ` +
          `${chapter.opening.length}/${chapter.closing.length} lines, got ` +
          `${text ? `${text.opening.length}/${text.closing.length}` : 'nothing'}.`,
      )
    }
  })
}

export function chaptersIn(lang: Lang): Chapter[] {
  if (lang === 'en') return CHAPTERS
  return CHAPTERS.map((chapter, i) => {
    const text = ID_CHAPTERS[i]
    if (!text) return chapter
    return {
      ...chapter,
      title: text.title,
      premise: text.premise,
      interlude: text.interlude,
      opening: chapter.opening.map((line, k) => ({ ...line, text: text.opening[k] ?? line.text })),
      closing: chapter.closing.map((line, k) => ({ ...line, text: text.closing[k] ?? line.text })),
    }
  })
}
