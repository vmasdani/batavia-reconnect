/**
 * Era 2's skits.
 *
 * Era 2 is written but not playable: there is no day loop to earn a skit
 * against, the way Era 0 has its survey and Era 1 its sim. So these are plain
 * `Scene`s with no `when` — `skitsFor(2)` hands the whole set to Story mode,
 * which is the only place they are read, and nothing gates them.
 *
 * Two people join the crew here: Iwan, who came off motorcycles and generators,
 * and Sari, who strings and climbs the line. They are not founders, so they
 * speak the later crew's register — `saya`, and the founders by title — while
 * the four founders still say `gua` and `lu` to each other. The one exception
 * the whole script keeps is Bayu to Pak Min: `saya` and `Bapak`, at their age
 * gap. The rules these lines are written to live in `language.txt`.
 *
 * Like Era 0's and unlike Era 1's, these are translated: Story mode already
 * knows the player's language, so an English skit between Indonesian chapters
 * would be the odd one out.
 */

import { spoken, type Scene } from './skits'
import type { Lang } from './lang'
import { ID_ERA2_SKITS } from './era2-skits.id'

export const ERA2_SKITS: Scene[] = [
  {
    id: 'iwan-engines',
    title: 'Something to fix',
    cast: ['iwan', 'mel'],
    lines: [
      { who: 'iwan', text: 'For 11 years a machine that stopped was my whole day. You listen to it, you smell it, you find the one bolt. This wire does nothing. It just stands there being right.' },
      { who: 'mel', text: 'You miss the breaking.' },
      { who: 'iwan', text: 'I miss being needed at 3 in the morning. A generator does not keep business hours.' },
      { who: 'mel', text: 'I drove containers. A truck tells you when it is dying — it gets loud first.' },
      { who: 'iwan', text: 'This wire will never get loud. One morning it is simply gone, cut clean.' },
      { who: 'mel', text: 'Then it is more like cargo than an engine. Cargo does not warn you either. You count it, and one day the count is short.' },
      { who: 'iwan', text: '…I preferred the engine. At least the engine was trying.' },
    ],
  },
  {
    id: 'from-up-there',
    title: 'From up there',
    cast: ['sari', 'bayu'],
    lines: [
      { who: 'sari', text: 'From the top of a pole you can see 3 ridges. On a clear morning, 4.' },
      { who: 'bayu', text: 'What is up there?' },
      { who: 'sari', text: 'Old burn scars. Somebody lit warning fires on those ridges, years back. The black rings are still there.' },
      { who: 'bayu', text: 'That was us. Before your time. One fire meant raiders on the road, and we slept in shifts.' },
      { who: 'sari', text: 'One fire, one message. Now I hang a wire that carries a whole sentence, and I am the only one who still sees those rings.' },
      { who: 'bayu', text: 'You will not be the last. Half the children in Kampung Sawah want to climb after you.' },
      { who: 'sari', text: 'Then I will teach them the rings are worth a look on the way up.' },
    ],
  },
  {
    id: 'what-the-room-was',
    title: 'The room',
    cast: ['iwan', 'tajuddin'],
    lines: [
      { who: 'iwan', text: 'Everyone here says 2027 like the whole country was in the room. I was 14. I remember the lights going, and my father not knowing why.' },
      { who: 'tajuddin', text: 'Nobody knew why. That was the weapon. A wire you can cut, you can see who cut it. That year there was nothing to see.' },
      { who: 'iwan', text: 'So what did you do?' },
      { who: 'tajuddin', text: 'I stood a night over a substation that had been dead a week. Guarding a thing that was never coming back on. It let me feel useful.' },
      { who: 'iwan', text: 'And now you guard copper people actually want.' },
      { who: 'tajuddin', text: 'Now I guard a thing worth stealing. You cannot imagine how much better that is. A raider at least agrees with you about what has value.' },
      { who: 'iwan', text: '…I never once thought of a raider as agreeing with me.' },
    ],
  },
  {
    id: 'whole-book',
    title: 'The whole book',
    cast: ['pakmin', 'bayu'],
    lines: [
      { who: 'pakmin', text: 'You handed every village a codebook. A number for rice, a number for flour. You know we already did that, once?' },
      { who: 'bayu', text: 'Before the war, Pak?' },
      { who: 'pakmin', text: 'At the exchange. Every regular caller had a 3-digit code. You did not ask for the fish market at Muara Angke. You asked for 118, and 118 was a man named Slamet who always smelled of ice.' },
      { who: 'bayu', text: 'So the book is not mine to invent.' },
      { who: 'pakmin', text: 'Nothing you build is new, Bay. It is only cheaper. I kept 400 codes in a ledger and 200 more in my head.' },
      { who: 'bayu', text: 'And when you left?' },
      { who: 'pakmin', text: 'I handed the ledger to the next man. The 200 in my head, nobody asked for. Write your whole book down. Do not be the last man alive who knows what 118 meant.' },
    ],
  },
  {
    id: 'child-keys',
    title: 'In a month',
    cast: ['sari', 'iwan'],
    lines: [
      { who: 'sari', text: 'There is a girl in Cikampek, maybe 9. She keys faster than her uncle, and she corrects him out loud.' },
      { who: 'iwan', text: 'The uncle is the one we trained.' },
      { who: 'sari', text: 'I know. He asked me, very quietly, if we could train her instead and let him go back to carrying poles.' },
      { who: 'iwan', text: 'Can a 9-year-old hold a village hour?' },
      { who: 'sari', text: 'She already holds it. He just stands behind her so it looks proper.' },
      { who: 'iwan', text: 'In a month she learned the thing it took me a month to believe was even possible.' },
      { who: 'sari', text: 'Give her 5 years. She will not remember a time the wire was not hers.' },
    ],
  },
  {
    id: 'worth-lifting',
    title: 'Worth lifting',
    cast: ['mel', 'tajuddin'],
    lines: [
      { who: 'mel', text: 'I found the man who took the Serang stretch. Not caught. Found. He was 6 kilometres off, rolling it onto a cart, alone.' },
      { who: 'tajuddin', text: 'What did you do?' },
      { who: 'mel', text: 'I asked him what copper goes for now. He said enough to feed a house for a season. Then he asked if I was going to hit him.' },
      { who: 'tajuddin', text: 'Were you?' },
      { who: 'mel', text: 'In the war I moved cargo past men thinner than him and did not blink. That was the job. This is not the war, and I am tired of the job.' },
      { who: 'tajuddin', text: 'So you let him go.' },
      { who: 'mel', text: 'I let him keep 20 metres and bring the rest back himself. A house has to eat, and the line still stands. Do not tell Bayu I did arithmetic in the dark.' },
    ],
  },
  {
    id: 'named-section',
    title: 'Ruas Haji Umar',
    cast: ['tajuddin', 'bayu'],
    lines: [
      { who: 'tajuddin', text: 'Kampung Sawah put a name on their 2 kilometres. Painted it on the first pole. Ruas Haji Umar.' },
      { who: 'bayu', text: 'Who was Haji Umar?' },
      { who: 'tajuddin', text: 'A man who died before we ever came here. Their man. They did not ask us whether they could put a name on our wire.' },
      { who: 'bayu', text: 'It is not our wire any more. That was the entire point.' },
      { who: 'tajuddin', text: 'I know it was. I spent 30 years keeping things safe by holding on to them. It still catches me — a thing is safest the moment you can no longer call it yours.' },
      { who: 'bayu', text: 'You almost sound glad.' },
      { who: 'tajuddin', text: 'Do not push it. Ask me again after the wet season, when their splices hold or they do not.' },
    ],
  },
]

// `?.` so a node tool can import this file; vite substitutes the whole
// `import.meta.env` expression, so the guard costs nothing in the browser.
if (import.meta.env?.DEV) {
  for (const skit of ERA2_SKITS) {
    const text = ID_ERA2_SKITS[skit.id]
    if (!text || text.lines.length !== skit.lines.length) {
      console.error(
        `era2-skits.id.ts is out of step at "${skit.id}": expected ${skit.lines.length} lines, ` +
          `got ${text ? text.lines.length : 'nothing'}.`,
      )
    }
  }
}

/**
 * Every Era 2 skit, in the player's language.
 *
 * There is no run to earn them against, so unlike the other eras there is no
 * "available" variant: Story mode reads the whole set and the translation is
 * the only thing that varies.
 */
export function era2SkitsIn(lang: Lang): Scene[] {
  return ERA2_SKITS.map((skit) => spoken(skit, lang === 'id' ? ID_ERA2_SKITS[skit.id] : undefined))
}
