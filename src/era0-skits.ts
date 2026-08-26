/**
 * Era 0's skits.
 *
 * Same contract as `skits.ts` — a conversation that becomes available when the
 * run reaches the state it belongs to, offered as a chip and never forced —
 * but against `Survey` rather than `Sim`, because the two eras share no state
 * and folding one condition type into the other would only hide that.
 *
 * There are three people in this era, not four, and none of them has built
 * anything yet. So these are not about hardware: they are about walking into a
 * place that has no reason to trust you, and what it costs to be seen.
 *
 * Unlike Era 1's, these are translated. The prologue is the one playable screen
 * that already knows which language the player picked, and its ending is the
 * story's own closing scene, so a skit in English between two Indonesian scenes
 * would be the odd one out.
 */

import type { Scene } from './skits'
import type { Lang } from './lang'
import { reached, type Survey } from './era0'
import { ID_SURVEY_SKITS } from './era0-skits.id'

export interface SurveySkit extends Scene {
  /** True once the survey has reached the state this conversation belongs to. */
  when: (survey: Survey) => boolean
}

export const SURVEY_SKITS: SurveySkit[] = [
  {
    id: 'first-gate',
    title: 'The first gate',
    cast: ['mel', 'bayu'],
    when: (survey) => reached(survey).length >= 2,
    lines: [
      { who: 'mel', text: 'They watched us walk in from about a kilometre out. Nobody moved.' },
      { who: 'bayu', text: 'Were they afraid?' },
      { who: 'mel', text: 'No. They were deciding. There is a difference, and you learn it fast.' },
      { who: 'bayu', text: 'So what decided it?' },
      { who: 'mel', text: 'You had a notebook out and I had both hands empty. That is it. That is the entire negotiation.' },
      { who: 'bayu', text: 'Then I will keep the notebook out.' },
      { who: 'mel', text: 'Keep it out at every gate. And walk slower than feels natural.' },
    ],
  },
  {
    id: 'asked-the-price',
    title: 'Free is a price',
    cast: ['mel', 'bayu', 'tajuddin'],
    when: (survey) => Object.values(survey.contact).includes('wary'),
    lines: [
      { who: 'mel', text: 'They asked what it costs. I said nothing. They asked again.' },
      { who: 'bayu', text: 'It does cost nothing.' },
      { who: 'mel', text: 'Bayu. Everyone who ever said "free" to them wanted something bigger later.' },
      { who: 'tajuddin', text: 'She is right. Free is the most expensive word you can say to a village that has been through 2030.' },
      { who: 'bayu', text: 'Then what do I say?' },
      { who: 'tajuddin', text: 'Say a price. Say one sack of rice a season, and let them argue you down to half.' },
      { who: 'mel', text: 'Then the deal is theirs. Then they own it.' },
      { who: 'bayu', text: '…That is worse arithmetic and better sense.' },
    ],
  },
  {
    id: 'first-fire',
    title: 'One bit',
    cast: ['tajuddin', 'bayu'],
    when: (survey) => survey.fires.length >= 1,
    lines: [
      { who: 'tajuddin', text: 'Wood is laid. Dry, covered, and somebody who knows to sit next to it.' },
      { who: 'bayu', text: 'And it can only say one thing.' },
      { who: 'tajuddin', text: 'It says 2 things. Lit, or not lit.' },
      { who: 'bayu', text: 'One bit.' },
      { who: 'tajuddin', text: 'Call it what you like. It crosses 20 kilometres before you have your boots on.' },
      { who: 'bayu', text: 'The old world had a version of this. Semaphore — arms on a hilltop, a whole sentence at a time, as long as the line of sight held and somebody stayed awake at every post.' },
      { who: 'tajuddin', text: 'We have 3 people. We get one bit.' },
      { who: 'bayu', text: 'It also tells everyone on that ridge that we are here.' },
      { who: 'tajuddin', text: 'Yes. That is the part I have been sitting with. I still say light it.' },
    ],
  },
  {
    id: 'letter-waiting',
    title: 'Out of our hands',
    cast: ['mel', 'bayu', 'tajuddin'],
    when: (survey) => survey.letter.state !== 'unsent',
    lines: [
      { who: 'mel', text: 'It went out with the Kemayoran runner this morning.' },
      { who: 'bayu', text: 'How long?' },
      { who: 'mel', text: 'Depends on every gate between here and there, and not one of them is ours.' },
      { who: 'bayu', text: 'I hate this part.' },
      { who: 'mel', text: 'You built this part. This is what it is.' },
      { who: 'tajuddin', text: 'It is the first thing we have sent that is not a person. Whatever comes back, it already happened.' },
      { who: 'bayu', text: '…Right. It already happened.' },
    ],
  },
]

// `?.` so a node tool can import this file; vite substitutes the whole
// `import.meta.env` expression, so the guard costs nothing in the browser.
if (import.meta.env?.DEV) {
  for (const skit of SURVEY_SKITS) {
    const text = ID_SURVEY_SKITS[skit.id]
    if (!text || text.lines.length !== skit.lines.length) {
      console.error(
        `era0-skits.id.ts is out of step at "${skit.id}": expected ${skit.lines.length} lines, ` +
          `got ${text ? text.lines.length : 'nothing'}.`,
      )
    }
  }
}

/**
 * Everything the crew is ready to talk about and has not talked about yet, in
 * the player's language.
 *
 * Same structure reuse as the story: the English list owns who speaks and when,
 * and a translation supplies only text at matching indices, so a missing line
 * falls back to English rather than rendering blank.
 */
export function availableSurveySkits(survey: Survey, lang: Lang): Scene[] {
  return SURVEY_SKITS.filter(
    (skit) => !survey.seenSkits.includes(skit.id) && skit.when(survey),
  ).map((skit) => {
    const text = lang === 'id' ? ID_SURVEY_SKITS[skit.id] : undefined
    if (!text) return skit
    return {
      ...skit,
      title: text.title,
      lines: skit.lines.map((line, i) => ({ ...line, text: text.lines[i] ?? line.text })),
    }
  })
}
