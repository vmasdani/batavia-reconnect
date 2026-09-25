/**
 * Read both scripts and report what a person would have to catch by eye.
 *
 * The English chapters own the structure and the Indonesian ones supply text at
 * the same indices, so this can tell which Indonesian lines are *spoken* and by
 * whom without the Indonesian file saying anything about speakers. That is the
 * whole reason the register check is possible at all.
 *
 * Three questions, none of which needs a browser:
 *
 *   1. Do the two files still line up? A chapter that has gained a line in one
 *      language and not the other silently mistranslates every line after it.
 *   2. Is anybody speaking a number instead of saying it? People say "2 hari".
 *   3. Does every glossary term still occur in the script it was written for?
 *   4. Does every diagram's pin have words for it, in both languages?
 *   5. Is anybody speaking out of register — a founder in written Indonesian, or
 *      somebody who joined later in slang they would not use with a founder?
 *   6. Is the exchange at the gate saying the same things in both languages?
 *
 * What it cannot see is everything in `language.txt`: whether a contrast names
 * its second term, whether a pivot was signalled, whether an English image
 * survived the crossing. Those are found by reading, and that file says how.
 *
 *   npm run check:script
 */

import { CHAPTERS } from '../src/story'
import { ID_CHAPTERS } from '../src/story.id'
import { SKITS, type Scene, type SkitText } from '../src/skits'
import { ID_SKITS } from '../src/skits.id'
import { SURVEY_SKITS } from '../src/era0-skits'
import { ID_SURVEY_SKITS } from '../src/era0-skits.id'
import { ERA2_SKITS } from '../src/era2-skits'
import { ID_ERA2_SKITS } from '../src/era2-skits.id'
import { TERMS, findTerms } from '../src/glossary'
import { figureFor } from '../src/figures'
import { ID_TERMS } from '../src/glossary.id'
import { EN_PARLEY, type ParleyText } from '../src/parley'
import { ID_PARLEY } from '../src/parley.id'
import { BRIEFINGS } from '../src/briefings'
import { ID_BRIEFINGS } from '../src/briefings.id'

/**
 * The four founders. They walked the region together in 2030 and never stopped
 * working together, so they talk to each other the way old friends in Jakarta
 * do — `gua`, `lu`, and no ceremony, elder or not.
 */
const CASUAL = new Set(['bayu', 'mel', 'tajuddin', 'pakmin'])
/**
 * Everyone who joined later. They say `saya` and address the founders by title,
 * because the project is their work but the founders' whole life. Neither slang
 * nor written Indonesian: ordinary polite speech.
 */
const PLAIN = new Set(['iwan', 'sari', 'ayu', 'ayu2', 'ratna', 'hendra', 'dewi', 'fajar', 'anisa'])

/**
 * Pronouns nobody in this cast uses. The founders are too close for them and
 * the later crew is too polite for them; they belong to written Indonesian and
 * to the narrator, who is skipped.
 *
 * Only the pronouns, deliberately. `tidak` and `sudah` are wrong between Bayu
 * and Mel and completely right when Fajar is speaking to Bayu, and this file
 * cannot tell who is being spoken to — so it flags the words that are wrong in
 * either mouth and leaves the judgement calls to a person.
 */
const TOO_WRITTEN = /\b(aku|kau|kalian|engkau)\b|\w{3,}(mu|ku)\b/gi
/** Roots that merely end in those letters. `suku cadang` is not a possessive. */
const NOT_A_POSSESSIVE =
  /\b(suku|buku|saku|baku|laku|paku|kaku|tungku|ilmu|kamu|waktu|sepatu|tamu|jamu|temu|palu)\b/gi
/** Slang the later crew would not use with the people who founded the thing. */
const TOO_LOOSE = /\b(gua|gue|lu|elo|banget|gak|ga|udah|abis|nyokap)\b/gi

/**
 * Words that read as number words but are not amounts, so they stay spelled.
 * Ordinals (`kedua belas`, the twelfth night), fractions, and `dua-duanya`,
 * which means "both" rather than "two of them".
 */
const NOT_AN_AMOUNT =
  /\bdua-dua\w*|\bke(dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas)( belas)?\b|\b(dua|tiga|empat|lima|enam|delapan|sembilan|sepuluh) per(dua|tiga|empat|lima|enam|delapan|sepuluh)\b|\b(two|three|four) (thirds|quarters|fifths)\b/gi

/**
 * Spoken numbers. `satu`/`one` are left alone: in both languages they usually
 * mean "a single", not a count, and a digit there reads worse than the word.
 */
const SPOKEN_NUMBER_ID =
  /\b(dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|se?ratus|se?ribu|se?juta)\b/gi
const SPOKEN_NUMBER_EN =
  /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|hundred|thousand|million)\b/gi

let problems = 0
const flag = (where: string, what: string, line: string) => {
  problems++
  console.log(`  ${where}  ${what}\n      ${line}`)
}

for (let c = 0; c < CHAPTERS.length; c++) {
  const en = CHAPTERS[c]
  const id = ID_CHAPTERS[c]
  console.log(`\nera ${en.era} — ${en.title}`)
  if (!id) {
    console.log('  no Indonesian chapter at all')
    problems++
    continue
  }

  // The title card and the work card are read as often as the dialogue is, so
  // the digits rule applies to them too. They have no speaker, so that is all.
  for (const [part, text] of [
    ['premise', id.premise],
    ['interlude', id.interlude],
  ] as const) {
    for (const [label, line, pattern] of [
      [`EN ${part}`, en[part], SPOKEN_NUMBER_EN],
      [`ID ${part}`, text, SPOKEN_NUMBER_ID],
    ] as const) {
      const found = line.replace(NOT_AN_AMOUNT, ' ').match(pattern)
      if (found) flag(part, `${label} spells a number: ${[...new Set(found)].join(', ')}`, line)
    }
  }

  for (const part of ['opening', 'closing'] as const) {
    const lines = en[part]
    const text = id[part]
    if (lines.length !== text.length) {
      flag(`${part}`, `line counts differ: EN ${lines.length}, ID ${text.length}`, '')
      continue
    }
    for (let i = 0; i < lines.length; i++) {
      const who = lines[i].who
      const at = `${part}[${i}] ${who}`
      const idLine = text[i]

      for (const [label, line, pattern] of [
        ['EN', lines[i].text, SPOKEN_NUMBER_EN],
        ['ID', idLine, SPOKEN_NUMBER_ID],
      ] as const) {
        const found = line.replace(NOT_AN_AMOUNT, ' ').match(pattern)
        if (found) flag(at, `${label} spells a number: ${[...new Set(found)].join(', ')}`, line)
      }

      if (who === 'narrator') continue
      if (CASUAL.has(who)) {
        const found = idLine.replace(NOT_A_POSSESSIVE, ' ').match(TOO_WRITTEN)
        if (found) flag(at, `too written for ${who}: ${[...new Set(found)].join(', ')}`, idLine)
      } else if (PLAIN.has(who)) {
        // Both directions: the later crew says `saya`, so slang is wrong and so
        // is the literary register they would sound stiff in.
        const found = [
          ...(idLine.match(TOO_LOOSE) ?? []),
          ...(idLine.replace(NOT_A_POSSESSIVE, ' ').match(TOO_WRITTEN) ?? []),
        ]
        if (found.length) flag(at, `out of register for ${who}: ${[...new Set(found)].join(', ')}`, idLine)
      }
    }
  }
}

// Both eras' skits are translated scripts of the same shape, so they are held
// to the same rules by the same walk. The only difference is which list and
// which translation go in.
const checkSkits = (label: string, skits: Scene[], text: Record<string, SkitText>) => {
  console.log(`\n${label}`)
  for (const skit of skits) {
    const said = text[skit.id]
    if (!said) {
      flag(skit.id, 'no Indonesian text at all', '')
      continue
    }
    if (said.lines.length !== skit.lines.length) {
      flag(skit.id, `line counts differ: EN ${skit.lines.length}, ID ${said.lines.length}`, '')
      continue
    }
    skit.lines.forEach((line, i) => {
      const at = `${skit.id}[${i}] ${line.who}`
      for (const [tag, spoken, pattern] of [
        ['EN', line.text, SPOKEN_NUMBER_EN],
        ['ID', said.lines[i], SPOKEN_NUMBER_ID],
      ] as const) {
        const found = spoken.replace(NOT_AN_AMOUNT, ' ').match(pattern)
        if (found) flag(at, `${tag} spells a number: ${[...new Set(found)].join(', ')}`, spoken)
      }
      if (CASUAL.has(line.who)) {
        const found = said.lines[i].replace(NOT_A_POSSESSIVE, ' ').match(TOO_WRITTEN)
        if (found) flag(at, `too written for ${line.who}: ${[...new Set(found)].join(', ')}`, said.lines[i])
      } else if (PLAIN.has(line.who)) {
        const found = [
          ...(said.lines[i].match(TOO_LOOSE) ?? []),
          ...(said.lines[i].replace(NOT_A_POSSESSIVE, ' ').match(TOO_WRITTEN) ?? []),
        ]
        if (found.length) flag(at, `out of register for ${line.who}: ${[...new Set(found)].join(', ')}`, said.lines[i])
      }
    })
  }
}

checkSkits('era 0 skits', SURVEY_SKITS, ID_SURVEY_SKITS)
checkSkits('era 1 skits', SKITS, ID_SKITS)
checkSkits('era 2 skits', ERA2_SKITS, ID_ERA2_SKITS)

// The primers and briefings are read like everything else, so the digits rule
// covers them too, and each one has to have Indonesian text of the same shape.
console.log('\nbriefings')
for (const briefing of BRIEFINGS) {
  const text = ID_BRIEFINGS[briefing.era]
  if (!text) {
    flag(`era ${briefing.era}`, 'no Indonesian briefing at all', '')
    continue
  }
  if (text.primer.things.length !== briefing.primer.things.length) {
    flag(
      `era ${briefing.era} primer`,
      `thing counts differ: EN ${briefing.primer.things.length}, ID ${text.primer.things.length}`,
      '',
    )
  }
  // Only the eras that are played carry a how-to-play list, and the English
  // file decides which those are.
  if ((text.how?.length ?? 0) !== (briefing.how?.length ?? 0)) {
    flag(
      `era ${briefing.era}`,
      `point counts differ: EN ${briefing.how?.length ?? 0}, ID ${text.how?.length ?? 0}`,
      '',
    )
  }
  const prose = (b: typeof briefing | typeof text) =>
    [
      b.primer.problem,
      ...b.primer.things.flatMap((t) => [t.name, t.plain, t.catch ?? '']),
      b.primer.upshot,
      b.objective,
      b.win,
      b.pressure,
      ...(b.how ?? []).flatMap((h) => [h.what, h.note]),
    ].join(' ')
  for (const [label, line, pattern] of [
    ['EN', prose(briefing), SPOKEN_NUMBER_EN],
    ['ID', prose(text), SPOKEN_NUMBER_ID],
  ] as const) {
    const found = line.replace(NOT_AN_AMOUNT, ' ').match(pattern)
    if (found) flag(`era ${briefing.era}`, `${label} spells a number: ${[...new Set(found)].join(', ')}`, '')
  }
}

// Era 0's parley is read like dialogue, so the digits rule covers it. The keys
// cannot drift — `ParleyText` is one interface and TypeScript holds both packs
// to it — so what is left to check is the prose, and that nothing came through
// a translation still in English.
console.log('\nparley')
const parleyProse = (pack: ParleyText) => [
  pack.lead,
  ...Object.values(pack.wants),
  ...Object.values(pack.cards).flatMap((c) => [c.label, c.note]),
  ...Object.values(pack.replies).flatMap((r) => Object.values(r)),
  ...Object.values(pack.verdict),
  pack.handOver, pack.handOverNote, pack.done, pack.autoNote,
]
for (const [label, lines, pattern] of [
  ['EN', parleyProse(EN_PARLEY), SPOKEN_NUMBER_EN],
  ['ID', parleyProse(ID_PARLEY), SPOKEN_NUMBER_ID],
] as const) {
  for (const line of lines) {
    const found = line.replace(NOT_AN_AMOUNT, ' ').match(pattern)
    if (found) flag('parley', `${label} spells a number: ${[...new Set(found)].join(', ')}`, line)
  }
}
const enParley = new Set(parleyProse(EN_PARLEY))
for (const line of parleyProse(ID_PARLEY)) {
  if (enParley.has(line)) flag('parley', 'left in English', line)
}

// The glossary lights terms up wherever they are said. An entry nobody ever
// says is not wrong, but it is worth knowing about — an Era 0 term may only
// ever appear in the prologue's own panels, and a typo in an alias looks
// exactly the same from here.
console.log('\nglossary')
const said = new Set<string>()
const sweep = (text: string) => findTerms(text).forEach((hit) => said.add(hit.id))
for (const chapter of CHAPTERS) {
  sweep(chapter.premise)
  sweep(chapter.interlude)
  for (const line of [...chapter.opening, ...chapter.closing]) sweep(line.text)
}
for (const text of ID_CHAPTERS) {
  sweep(text.premise)
  sweep(text.interlude)
  for (const line of [...text.opening, ...text.closing]) sweep(line)
}
for (const skit of SURVEY_SKITS) for (const line of skit.lines) sweep(line.text)
for (const text of Object.values(ID_SURVEY_SKITS)) for (const line of text.lines) sweep(line)
for (const skit of ERA2_SKITS) for (const line of skit.lines) sweep(line.text)
for (const text of Object.values(ID_ERA2_SKITS)) for (const line of text.lines) sweep(line)

for (const term of TERMS) {
  const text = ID_TERMS[term.id]
  if (!text) {
    flag(term.id, 'no Indonesian text at all', '')
    continue
  }
  // Same digits rule as the script. A glossary entry is read the same way.
  for (const [label, line, pattern] of [
    ['EN', [term.what, term.why, term.real, ...(term.steps ?? [])].filter(Boolean).join(' '), SPOKEN_NUMBER_EN],
    ['ID', [text.what, text.why, text.real, ...(text.steps ?? [])].filter(Boolean).join(' '), SPOKEN_NUMBER_ID],
  ] as const) {
    const found = line!.replace(NOT_AN_AMOUNT, ' ').match(pattern)
    if (found) flag(term.id, `${label} spells a number: ${[...new Set(found)].join(', ')}`, line!)
  }

  // A diagram numbers its pins and the glossary supplies the words for them. A
  // pin with nothing to say is a number floating on a drawing, which is worse
  // than no number at all — so the two counts have to agree, in both languages.
  const pins = figureFor(term.id)?.pins
  if (pins === undefined) {
    if (term.steps) flag(term.id, 'has steps written but no diagram drawn for them', '')
  } else {
    if ((term.steps?.length ?? 0) !== pins) flag(term.id, `diagram draws ${pins} pins, EN writes ${term.steps?.length ?? 0}`, '')
    if ((text.steps?.length ?? 0) !== pins) flag(term.id, `diagram draws ${pins} pins, ID writes ${text.steps?.length ?? 0}`, '')
  }
}
const unsaid = TERMS.filter((t) => !said.has(t.id))
console.log(
  unsaid.length === 0
    ? `  all ${TERMS.length} terms occur in the script`
    : `  ${TERMS.length - unsaid.length}/${TERMS.length} terms occur in the script; not said anywhere: ` +
      unsaid.map((t) => `${t.id} (era ${t.era})`).join(', '),
)

console.log(problems === 0 ? '\nBoth scripts read clean.' : `\n${problems} to look at.`)
