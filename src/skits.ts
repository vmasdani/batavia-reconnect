/**
 * Skits: short optional conversations between the crew.
 *
 * The day loop in `sim.ts` says what the project did. Skits say what it cost
 * the four people doing it — the era they are living in, the one they came
 * from, and the recurring question of whether any of this is worth it.
 *
 * They are never forced. A skit becomes available when the run reaches the
 * state it belongs to, a chip appears in the top bar, and it waits there until
 * the player asks for it. Viewing one retires it for the rest of the run.
 *
 * Conditions read the world and sim the player already has, so no skit needs
 * the resolver to remember anything for it. Most are written against facts
 * that only ever accumulate — a day count, hauls taken, a stage reached — so
 * an available skit stays available. The two that hang off a passing state
 * (empty depot, somebody laid up) are conditions this run will hit again.
 */

import { surveySkitsIn } from './era0-skits'
import { era2SkitsIn } from './era2-skits'
import { ID_SKITS } from './skits.id'
import type { Lang } from './lang'
import type { Sim } from './sim'
import { reachableFrom } from './sim'
import { SETTLEMENTS, type World } from './world'

/**
 * Stage each site was at on day one. Several relays are already running when
 * the run opens, so "a site came up" has to mean it came up under the player,
 * not that it was standing there when they arrived.
 */
const OPENING_STAGE = new Map(SETTLEMENTS.map((s) => [s.id, s.stage]))

export interface SkitLine {
  /** PartyMember id. The portrait and colour come from `party.ts`. */
  who: string
  text: string
}

/**
 * A conversation, once something has decided it should be offered.
 *
 * The player and the chip only ever need this much, and Era 0 keeps its own
 * skits against its own state (`era0-skits.ts`), so the condition lives with
 * whichever era owns it rather than in the thing that plays it.
 */
export interface Scene {
  id: string
  title: string
  /** Everyone whose portrait sits in the strip, in the order they stand. */
  cast: string[]
  lines: SkitLine[]
}

export interface Skit extends Scene {
  /** True once the run has reached the state this conversation belongs to. */
  when: (world: World, sim: Sim) => boolean
}

/**
 * One scene's words in another language.
 *
 * Text only. Who speaks and when a scene is offered belong to the era that
 * owns the scene, so both eras' translations supply lines at matching indices
 * and nothing about the cast is said twice.
 */
export interface SkitText {
  title: string
  lines: string[]
}

/**
 * A scene wearing a translation's words, where there is one for it.
 *
 * A missing line falls back to the English it was written against rather than
 * rendering blank, which is why the two files are checked for length rather
 * than trusted to stay in step.
 */
export function spoken(scene: Scene, text: SkitText | undefined): Scene {
  if (!text) return scene
  return {
    ...scene,
    title: text.title,
    lines: scene.lines.map((line, i) => ({ ...line, text: text.lines[i] ?? line.text })),
  }
}

const inLang = (skit: Skit, lang: Lang): Scene =>
  spoken(skit, lang === 'id' ? ID_SKITS[skit.id] : undefined)

const site = (world: World, id: string) => world.scavenge.find((s) => s.id === id)
const broughtUp = (world: World, stage: number) =>
  world.settlements.some((s) => s.stage >= stage && s.stage > (OPENING_STAGE.get(s.id) ?? 0))

export const SKITS: Skit[] = [
  {
    id: 'ration-tin',
    title: 'The last tin',
    cast: ['mel', 'bayu'],
    when: (_world, sim) => sim.stock.rations < 8,
    lines: [
      { who: 'mel', text: 'The depot is down to the tins nobody wanted the first time.' },
      { who: 'bayu', text: 'How long?' },
      { who: 'mel', text: '3 days if we keep working. 6 if we sit here and wait.' },
      { who: 'bayu', text: 'We are working.' },
      { who: 'mel', text: 'I know. I wanted you to say the number, not leave it in my head.' },
      { who: 'bayu', text: '…3 days.' },
      { who: 'mel', text: '3 days. I will find something on the road.' },
    ],
  },
  {
    id: 'gambir-before',
    title: 'Where he used to work',
    cast: ['pakmin', 'bayu'],
    when: (world) => (site(world, 'gambir')?.hauls ?? 0) >= 1,
    lines: [
      { who: 'pakmin', text: 'You know I sat in that building. Second floor, east side, 31 years.' },
      { who: 'bayu', text: 'Gambir? You never said.' },
      { who: 'pakmin', text: 'Nobody asks the old man where he worked. They ask if the set works.' },
      { who: 'pakmin', text: 'Every one of those racks was a street. Kramat, Senen, Kwitang. I knew which ones clicked wrong.' },
      { who: 'bayu', text: 'And we just pulled the copper out of them.' },
      { who: 'pakmin', text: 'Good. Copper in a radio tower is more useful than copper in a dead wall.' },
      { who: 'pakmin', text: 'I still counted the racks on the way out, though. Habit.' },
    ],
  },
  {
    id: 'mel-roads',
    title: 'The long way round',
    cast: ['mel', 'tajuddin'],
    when: (_world, sim) => sim.day >= 8,
    lines: [
      { who: 'tajuddin', text: 'You took the coast road again. It is 12 kilometres longer.' },
      { who: 'mel', text: 'It is 12 kilometres where I can see trouble before trouble sees me.' },
      { who: 'tajuddin', text: 'That cuts both ways.' },
      { who: 'mel', text: 'It does. I like the half where I get to decide first.' },
      { who: 'mel', text: 'I drove containers out of Tanjung Priok for 6 years. Same roads. Fewer forms now.' },
      { who: 'tajuddin', text: 'And nobody with a pipe waiting at the junction.' },
      { who: 'mel', text: 'No. Just the weighbridge. I hated the weighbridge more.' },
    ],
  },
  {
    id: 'tajuddin-watch',
    title: 'What he watches for',
    cast: ['tajuddin', 'pakmin'],
    when: (_world, sim) => sim.day >= 14,
    lines: [
      { who: 'pakmin', text: 'You are falling asleep standing up.' },
      { who: 'tajuddin', text: 'I am watching the road.' },
      { who: 'pakmin', text: 'You are watching it with your eyes closed.' },
      { who: 'tajuddin', text: 'Dogs, mostly. They know before we do.' },
      { who: 'tajuddin', text: 'My daughter used to do that. Wake up before the call to prayer, every time, no clock.' },
      { who: 'pakmin', text: 'Used to.' },
      { who: 'tajuddin', text: 'Yes. She is dead. So now I do it.' },
    ],
  },
  {
    id: 'laid-up',
    title: 'Laid up',
    cast: ['bayu', 'tajuddin'],
    when: (_world, sim) => Object.values(sim.crew).some((c) => c.hurtDays > 0),
    lines: [
      { who: 'tajuddin', text: 'Sari got hurt on that haul. Write it beside the copper.' },
      { who: 'bayu', text: 'It does not have a column.' },
      { who: 'tajuddin', text: 'Then the ledger is lying. You built it.' },
      { who: 'bayu', text: '…I will give it a column.' },
      { who: 'tajuddin', text: 'Good. Put her name there too. Numbers do not get hurt.' },
    ],
  },
  {
    id: 'why-not-farm',
    title: 'Why not just farm',
    cast: ['mel', 'bayu', 'pakmin'],
    when: (world, sim) => sim.day >= 18 && !sim.actComplete && reachableFrom(world, 'batavia').size <= 3,
    lines: [
      { who: 'mel', text: 'Cirebon is growing rice. Actual rice. Nobody there climbs a radio tower in the rain.' },
      { who: 'bayu', text: 'Nobody there knows Serang is out of water.' },
      { who: 'mel', text: 'Serang is out of water?' },
      { who: 'bayu', text: 'That is my point. Neither do we. We are guessing, and we are 20 kilometres away.' },
      { who: 'pakmin', text: 'Before all this, that was a phone call. 8 seconds.' },
      { who: 'mel', text: 'I am not saying stop. Some mornings I want work that gives us food.' },
      { who: 'bayu', text: 'So do I. But rice will not tell Serang when the water is safe.' },
      { who: 'pakmin', text: 'Then plant the radio tower, boy. It will feed people too. Just not today.' },
    ],
  },
  {
    id: 'first-running',
    title: 'It answered',
    cast: ['pakmin', 'bayu', 'mel'],
    when: (world) => broughtUp(world, 3),
    lines: [
      { who: 'pakmin', text: 'Press it again.' },
      { who: 'bayu', text: 'It answered the first time.' },
      { who: 'pakmin', text: 'Press it again.' },
      { who: 'mel', text: 'He wants to hear it twice so it is not luck.' },
      { who: 'pakmin', text: '31 years. I never trusted a circuit after one answer.' },
      { who: 'bayu', text: '…Still answering.' },
      { who: 'pakmin', text: 'Then it is a circuit. Write it down properly, with the date.' },
    ],
  },
  {
    id: 'first-operator',
    title: 'Somebody else keys it',
    cast: ['bayu', 'tajuddin'],
    when: (_world, sim) => sim.operators >= 1,
    lines: [
      { who: 'bayu', text: 'She got through the whole muster list without asking me.' },
      { who: 'tajuddin', text: 'And that bothers you.' },
      { who: 'bayu', text: 'It is strange. I have been the only one who could do it for so long.' },
      { who: 'tajuddin', text: 'That was never the goal.' },
      { who: 'bayu', text: 'I know. I still liked being needed.' },
      { who: 'tajuddin', text: 'Then get used to being useful instead.' },
    ],
  },
  {
    id: 'act-one',
    title: 'A hundred kilometres',
    cast: ['bayu', 'mel', 'pakmin', 'tajuddin'],
    when: (_world, sim) => sim.actComplete,
    lines: [
      { who: 'mel', text: '7 days straight. Serang picks up at dusk and it is just — there.' },
      { who: 'pakmin', text: '100 kilometres. That is a real circuit.' },
      { who: 'bayu', text: 'It is one circuit. The old network had millions.' },
      { who: 'tajuddin', text: 'The old network also had no one standing outside it with a spear.' },
      { who: 'tajuddin', text: 'Take the win, Bayu. Say it so the others hear you.' },
      { who: 'bayu', text: '…We reconnected Serang.' },
      { who: 'mel', text: 'Louder.' },
      { who: 'bayu', text: 'We reconnected Serang.' },
      { who: 'pakmin', text: 'Now do Bandung. Do it before my knees get worse.' },
    ],
  },
]

const SKIT_BY_ID = new Map(SKITS.map((s) => [s.id, s]))

export const skitById = (id: string) => SKIT_BY_ID.get(id)

// `?.` so a node tool can import this file; vite substitutes the whole
// `import.meta.env` expression, so the guard costs nothing in the browser.
if (import.meta.env?.DEV) {
  for (const skit of SKITS) {
    const text = ID_SKITS[skit.id]
    if (!text || text.lines.length !== skit.lines.length) {
      console.error(
        `skits.id.ts is out of step at "${skit.id}": expected ${skit.lines.length} lines, ` +
          `got ${text ? text.lines.length : 'nothing'}.`,
      )
    }
  }
}

/**
 * Everything the crew is ready to talk about and has not talked about yet, in
 * the player's language.
 */
export function availableSkits(world: World, sim: Sim, lang: Lang): Scene[] {
  return SKITS.filter((skit) => !sim.seenSkits.includes(skit.id) && skit.when(world, sim)).map(
    (skit) => inLang(skit, lang),
  )
}

/**
 * Every skit an era has, in the player's language, ignoring whether a run has
 * earned any of them.
 *
 * Play offers one at a time and only once the world is in the state it belongs
 * to. Story mode has no world, so it reads the lot — which is why the
 * conditions stay with the eras that own them and only the list lives here.
 */
export function skitsFor(era: number, lang: Lang): Scene[] {
  if (era === 0) return surveySkitsIn(lang)
  if (era === 2) return era2SkitsIn(lang)
  return era === 1 ? SKITS.map((skit) => inLang(skit, lang)) : []
}
