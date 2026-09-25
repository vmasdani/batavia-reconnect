/**
 * Era 0's skits.
 *
 * Same contract as `skits.ts` — a conversation that becomes available when the
 * run reaches the state it belongs to, offered as a chip and never forced —
 * but against `Survey` rather than `Sim`, because the two eras share no state
 * and folding one condition type into the other would only hide that.
 *
 * There are three people in this era, not four, and none of them has built
 * anything yet. So these are not about hardware. Some are about walking into
 * a place that has no reason to trust you, and what it costs to be seen. The
 * rest are about what the war took and what these three still carry: telephones
 * that connected in 8 seconds, a truck driver who kept books, the fear of
 * having just told the whole region where they sleep. None of them ends in an
 * instruction, because the day loop is the instruction. These are what is left
 * when the walking stops.
 *
 * Unlike Era 1's, these are translated. The prologue is the one playable screen
 * that already knows which language the player picked, and its ending is the
 * story's own closing scene, so a skit in English between two Indonesian scenes
 * would be the odd one out.
 */

import { spoken, type Scene } from './skits'
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
      { who: 'mel', text: 'They watched us walk in from about a kilometre away. Nobody moved.' },
      { who: 'bayu', text: 'Were they afraid?' },
      { who: 'mel', text: 'No. They were deciding whether to let us through.' },
      { who: 'bayu', text: 'What made them decide?' },
      { who: 'mel', text: 'You showed them the notebook. I kept both hands empty. That was enough.' },
      { who: 'bayu', text: 'Then I will keep the notebook out.' },
      { who: 'mel', text: 'Keep it out at every gate. And walk slower than feels natural.' },
      { who: 'bayu', text: 'What do you think about while you walk?' },
      { who: 'mel', text: 'The gate behind us. It is the only one I cannot see.' },
    ],
  },
  {
    id: 'eight-seconds',
    title: '8 seconds',
    cast: ['bayu', 'mel'],
    when: (survey) => reached(survey).length >= 3,
    lines: [
      { who: 'bayu', text: 'Before the war I called my mother in Bandung every Sunday. It took 8 seconds to connect. I stopped noticing the 8 seconds.' },
      { who: 'bayu', text: 'That is the part I cannot forgive. Not the war. That I stopped noticing.' },
      { who: 'mel', text: 'I stopped noticing the weighbridge.' },
      { who: 'mel', text: 'Nobody notices a thing while it works. Then it is gone, and you spend the rest of your life paying attention.' },
    ],
  },
  {
    id: 'asked-the-price',
    title: 'Free is a price',
    cast: ['mel', 'bayu', 'tajuddin'],
    when: (survey) => Object.values(survey.contact).includes('wary'),
    lines: [
      { who: 'mel', text: 'They asked what it costs. I said nothing. They asked me twice.' },
      { who: 'bayu', text: 'Because it costs nothing.' },
      { who: 'mel', text: 'Bayu. People who say "free" usually want something later.' },
      { who: 'tajuddin', text: 'She is right. They have heard that word before.' },
      { who: 'bayu', text: 'Then what do I say?' },
      { who: 'tajuddin', text: 'Say a price. Say one sack of rice a season, and let them argue you down to half.' },
      { who: 'mel', text: 'Then the deal is theirs. Then they own it.' },
      { who: 'bayu', text: '…That is worse arithmetic. It may be better trust.' },
    ],
  },
  {
    id: 'first-fire',
    title: 'One bit',
    cast: ['tajuddin', 'bayu'],
    when: (survey) => survey.fires.length >= 1,
    lines: [
      { who: 'tajuddin', text: 'Wood is laid. Dry, covered, and somebody who knows to sit next to it.' },
      { who: 'bayu', text: 'It can only say one thing.' },
      { who: 'tajuddin', text: 'It says 2 things. Lit, or not lit.' },
      { who: 'bayu', text: 'One bit.' },
      { who: 'tajuddin', text: 'Call it what you like. It crosses 20 kilometres before you put your boots on.' },
      { who: 'bayu', text: 'The old world had a version of this. Semaphore — arms on a hilltop, a whole sentence at a time, as long as the line of sight held and somebody stayed awake at every post.' },
      { who: 'tajuddin', text: 'We have 3 people. One bit is what we can afford.' },
      { who: 'bayu', text: 'It also tells everyone on that ridge that we are here.' },
      { who: 'tajuddin', text: 'Yes. That is the part I have been sitting with. I still say light it.' },
    ],
  },
  {
    id: 'the-eggs',
    title: 'The eggs',
    cast: ['mel', 'tajuddin'],
    when: (survey) => survey.day >= 7,
    lines: [
      { who: 'mel', text: 'Bayu wrote down how many eggs the woman at Depok sold us. The number. The price. The colour of the hen.' },
      { who: 'tajuddin', text: 'How many eggs?' },
      { who: 'mel', text: 'I did not ask. I was afraid he would show me the page.' },
      { who: 'tajuddin', text: 'You drove with men who kept books like that?' },
      { who: 'mel', text: 'One. The only truck that never lost a manifest. Everybody hated him until the audit.' },
      { who: 'tajuddin', text: 'And after the audit?' },
      { who: 'mel', text: 'They named a route after him. Quietly, so he would not write that down either.' },
    ],
  },
  {
    id: 'letter-waiting',
    title: 'Out of our hands',
    cast: ['mel', 'bayu', 'tajuddin'],
    when: (survey) => survey.letter.state !== 'unsent',
    lines: [
      { who: 'mel', text: 'The Kemayoran runner took it this morning.' },
      { who: 'bayu', text: 'How long?' },
      { who: 'mel', text: 'It depends on every gate between here and there. None of them belongs to us.' },
      { who: 'bayu', text: 'I hate this part.' },
      { who: 'mel', text: "During the war I carried a driver's pay to his wife for 8 months. He never came back. She never once asked me to stop bringing it." },
      { who: 'mel', text: 'You learn to be the envelope. It is easier than being the letter.' },
      { who: 'mel', text: 'You built this part. This is what it is.' },
      { who: 'tajuddin', text: 'It is the first thing we have sent without sending a person. We cannot change it now.' },
      { who: 'bayu', text: '…Right. It already happened.' },
    ],
  },
  {
    id: 'two-fires',
    title: 'What the fires say',
    cast: ['tajuddin', 'bayu'],
    when: (survey) => survey.fires.length >= 2,
    lines: [
      { who: 'tajuddin', text: '2 fires lit. Anybody on either ridge now knows where we sleep.' },
      { who: 'bayu', text: 'You want to put them out.' },
      { who: 'tajuddin', text: 'No. I want you to know what we did. Twice I have been the man who did not see it coming. Not this time.' },
      { who: 'bayu', text: 'Then we sleep in shifts from tonight.' },
      { who: 'tajuddin', text: 'We were always going to sleep in shifts. Now it is for something we chose.' },
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
  ).map((skit) => inLang(skit, lang))
}

/**
 * All of them, whatever the run has reached.
 *
 * Story mode has no run to earn a skit against and wants the whole set, so the
 * condition is the caller's business and the translation is not.
 */
export function surveySkitsIn(lang: Lang): Scene[] {
  return SURVEY_SKITS.map((skit) => inLang(skit, lang))
}

const inLang = (skit: SurveySkit, lang: Lang): Scene =>
  spoken(skit, lang === 'id' ? ID_SURVEY_SKITS[skit.id] : undefined)
