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
      { who: 'mel', text: 'Depot is down to the tins nobody wanted in the first place.' },
      { who: 'bayu', text: 'How long?' },
      { who: 'mel', text: '3 days if we eat like we are working. 6 if we eat like we are waiting.' },
      { who: 'bayu', text: 'We are working.' },
      { who: 'mel', text: "I know. I only wanted you to say it out loud, so it is your number and not mine." },
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
      { who: 'pakmin', text: 'Nobody asks the old man where he worked. They ask if the set is fixed.' },
      { who: 'pakmin', text: 'Every one of those racks was a street. Kramat, Senen, Kwitang. I knew which ones clicked wrong.' },
      { who: 'bayu', text: 'And we just pulled the copper out of them.' },
      { who: 'pakmin', text: 'Good. Better in a mast than in a wall nobody is calling through.' },
      { who: 'pakmin', text: 'I still counted the racks on the way out, though. Habit.' },
    ],
  },
  {
    id: 'mel-roads',
    title: 'The long way round',
    cast: ['mel', 'tajuddin'],
    when: (_world, sim) => sim.day >= 8,
    lines: [
      { who: 'tajuddin', text: 'You took the coast road again. It is 12 kilometres further.' },
      { who: 'mel', text: 'It is 12 kilometres of somebody being able to see me coming from a long way off.' },
      { who: 'tajuddin', text: 'That cuts both ways.' },
      { who: 'mel', text: 'It does. I like the half where I get to decide first.' },
      { who: 'mel', text: 'I drove containers out of Tanjung Priok for 6 years. Same roads, more paperwork.' },
      { who: 'tajuddin', text: 'And nobody with a pipe waiting at the junction.' },
      { who: 'mel', text: 'No. Just the weighbridge. I hated the weighbridge more, honestly.' },
    ],
  },
  {
    id: 'tajuddin-watch',
    title: 'What he watches for',
    cast: ['tajuddin', 'pakmin'],
    when: (_world, sim) => sim.day >= 14,
    lines: [
      { who: 'pakmin', text: 'You have not slept properly since we lit the second mast.' },
      { who: 'tajuddin', text: 'I sleep. In pieces.' },
      { who: 'pakmin', text: 'What is it you are listening for, out there?' },
      { who: 'tajuddin', text: 'Dogs, mostly. They know before we do.' },
      { who: 'tajuddin', text: 'My daughter used to do that. Wake up before the call to prayer, every time, no clock.' },
      { who: 'pakmin', text: 'Used to.' },
      { who: 'tajuddin', text: 'Used to. So now I do it.' },
    ],
  },
  {
    id: 'laid-up',
    title: 'Laid up',
    cast: ['bayu', 'tajuddin'],
    when: (_world, sim) => Object.values(sim.crew).some((c) => c.hurtDays > 0),
    lines: [
      { who: 'tajuddin', text: 'That is the cost of the haul. You should write it in the ledger with the copper.' },
      { who: 'bayu', text: 'It does not have a column.' },
      { who: 'tajuddin', text: 'Then the ledger is lying to you, and you built the ledger.' },
      { who: 'bayu', text: '…I will give it a column.' },
      { who: 'tajuddin', text: 'Good. Then when you look at the number you will stop before it gets bigger.' },
    ],
  },
  {
    id: 'why-not-farm',
    title: 'Why not just farm',
    cast: ['mel', 'bayu', 'pakmin'],
    when: (world, sim) => sim.day >= 18 && !sim.actComplete && reachableFrom(world, 'batavia').size <= 3,
    lines: [
      { who: 'mel', text: 'Cirebon is growing rice. Actual rice. Nobody there is climbing a mast in the rain.' },
      { who: 'bayu', text: 'Nobody there knows Serang is out of water either.' },
      { who: 'mel', text: 'Serang is out of water?' },
      { who: 'bayu', text: 'That is my point. Neither do we. We are guessing, and we are 20 kilometres away.' },
      { who: 'pakmin', text: 'Before all this, that was a phone call. 8 seconds.' },
      { who: 'mel', text: 'I am not saying stop. I am saying some mornings I would rather be planting something that comes up.' },
      { who: 'bayu', text: 'So would I. I just cannot make myself believe it is the useful thing.' },
      { who: 'pakmin', text: 'Then plant the mast, boy. It comes up too. It just takes longer.' },
    ],
  },
  {
    id: 'first-running',
    title: 'It answered',
    cast: ['pakmin', 'bayu', 'mel'],
    when: (world) => broughtUp(world, 3),
    lines: [
      { who: 'pakmin', text: 'Key it again.' },
      { who: 'bayu', text: 'It answered the first time.' },
      { who: 'pakmin', text: 'Key it again.' },
      { who: 'mel', text: 'He wants to hear it twice so it is not luck.' },
      { who: 'pakmin', text: '31 years. Every circuit I ever brought up, I brought up twice.' },
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
      { who: 'bayu', text: 'She got through the whole muster list without asking me once.' },
      { who: 'tajuddin', text: 'And that bothers you.' },
      { who: 'bayu', text: 'It does not bother me. It is strange. I have been the only one who could do it for so long that it felt like the job.' },
      { who: 'tajuddin', text: 'It was never the job. The job was there being more than one of you.' },
      { who: 'bayu', text: 'Then I have been doing it badly and calling it hard work.' },
      { who: 'tajuddin', text: 'Most people do. Teach the next one faster.' },
    ],
  },
  {
    id: 'act-one',
    title: 'A hundred kilometres',
    cast: ['bayu', 'mel', 'pakmin', 'tajuddin'],
    when: (_world, sim) => sim.actComplete,
    lines: [
      { who: 'mel', text: '7 days straight. Serang picks up at dusk and it is just — there.' },
      { who: 'pakmin', text: '100 kilometres. That is not a toy any more.' },
      { who: 'bayu', text: 'It is one circuit. The old network had millions.' },
      { who: 'tajuddin', text: 'The old network also had nobody standing outside it with a spear.' },
      { who: 'tajuddin', text: 'Take the win, Bayu. Out loud, where they can hear you take it.' },
      { who: 'bayu', text: '…We reconnected Serang.' },
      { who: 'mel', text: 'Louder.' },
      { who: 'bayu', text: 'We reconnected Serang.' },
      { who: 'pakmin', text: 'Now do Bandung, and do it before I am too old to climb.' },
    ],
  },
]

const SKIT_BY_ID = new Map(SKITS.map((s) => [s.id, s]))

export const skitById = (id: string) => SKIT_BY_ID.get(id)

/** Everything the crew is ready to talk about and has not talked about yet. */
export function availableSkits(world: World, sim: Sim): Skit[] {
  return SKITS.filter((skit) => !sim.seenSkits.includes(skit.id) && skit.when(world, sim))
}
