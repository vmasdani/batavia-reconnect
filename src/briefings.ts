/**
 * How each era's communication works, what it is asking the player to do, and
 * how its loop is played.
 *
 * Two cards, in this order, between the opening chapter and the map.
 *
 * The **primer** comes first and is the educational point of the whole game:
 * plain language, no jargon, explaining how a message physically moves in this
 * era and what it costs. A notice board and a signal fire are not obvious
 * things — they are 200-year-old ideas nobody alive has had to use — and a
 * player who does not understand them cannot make a single interesting choice.
 * Terms in it light up against the glossary, so anything still unclear is one
 * click from a longer answer.
 *
 * The **briefing** comes second: the objective, what ends the era, and the
 * rules of the loop. It stands where story mode puts its one-line "the work"
 * card, with the rest of what a player actually needs to start.
 *
 * Structure lives here and a translation supplies only text, the same rule
 * `story.ts` and `glossary.ts` follow.
 *
 * Only the eras that are playable have one. `briefingFor` returns nothing for
 * the rest, and the opening simply hands straight to the map.
 */

import type { Lang } from './lang'
import { ID_BRIEFINGS } from './briefings.id'

export interface Primer {
  /** The situation, in one sentence with no jargon in it. */
  problem: string
  /** Each thing this era gives you to move a message with. */
  things: Array<{
    name: string
    /** How it works, as you would explain it to somebody who has never seen one. */
    plain: string
    /** What it cannot do. Usually the more useful half. */
    catch?: string
  }>
  /** What it adds up to, and what it is a trade against. */
  upshot: string
}

export interface Briefing {
  era: number
  /** How communication works here, before anything is asked of the player. */
  primer: Primer
  /** What this year is for, in one sentence. */
  objective: string
  /** Exactly what ends the era. */
  win: string
  /** What pushes back. Neither era can be lost outright; both can be stalled. */
  pressure: string
  /** The loop, in the order a player meets it. */
  how: Array<{ what: string; note: string }>
}

export const BRIEFINGS: Briefing[] = [
  {
    era: 0,
    primer: {
      problem:
        'There are no telephones and there is no radio. If you want to tell Bogor something, a person has to walk to Bogor and say it out loud.',
      things: [
        {
          name: 'A courier',
          plain: 'Somebody walks the message there. Bogor is 2 days away on foot, so asking Bogor a question and getting an answer takes 4 days — 2 out, 2 back. In 2030 that is the entire network.',
        },
        {
          name: 'A notice board',
          plain: 'A board nailed up at a village gate: a postbox on the road. Without one, a courier arriving there has to wait until somebody turns up who is going the right way, which costs about 2 days of standing around. With one, they pin the message up and go home, and whoever passes next carries it onward. The message keeps moving while nobody is carrying it.',
          catch: 'It only helps on a road people actually walk. A board on a route nobody uses is a board nobody reads.',
        },
        {
          name: 'A signal fire',
          plain: 'A stack of dry wood on the hill above a village, with somebody who knows to sit next to it. Light it and every village that can see that hill knows — instantly, at the speed of light, instead of in 2 days.',
          catch: 'It can say exactly one thing: lit, or not lit. Not what, not who, not how much. And it only works between 2 hills that can genuinely see each other — most of this region is flat, so most hills see nothing at all, and a fire on one of those is 3 days thrown away.',
        },
      ],
      upshot:
        'So the era is a trade. Legs are slow and can say anything. A fire is instant and can say almost nothing. Boards are what stop a message sitting still in between. Put all 3 together and a question asked this morning can have an answer tomorrow instead of next week.',
    },
    objective:
      'Walk to every settlement in the region, find out who is still alive, and turn enough of them into people who will answer you.',
    win: 'Hold 8 settlements in contact for 7 days running, and send a letter to Tangerang that comes back with an answer.',
    pressure:
      'Rations. Nobody dies of an empty store, but an empty store costs a day of foraging, and a day spent on food is a day not spent walking.',
    how: [
      {
        what: 'A turn is a day',
        note: 'Click a settlement, then send somebody to it. Every order costs days, and nothing moves until you end the day.',
      },
      {
        what: 'Walk first, then talk',
        note: 'Walking finds a place. A parley is what wins it over, and it can fail. A settlement that asked what it would cost takes a day longer and trusts you less.',
      },
      {
        what: 'Notice boards',
        note: '2 days and 4 rations. Without one, a message sits at that gate for 2 days waiting for the next runner going the right way.',
      },
      {
        what: 'Signal fires',
        note: '3 days and 6 rations, and only worth it where the high ground can see another settlement. The roster marks the ones that see nothing with ×.',
      },
      {
        what: 'Rations are the clock',
        note: '3 come in a day from the gardens. Everybody eats 1 at home and 1.5 on the road, and every settlement that is talking sends 0.5 back.',
      },
      {
        what: 'The number that matters',
        note: 'How many days a message takes to reach Tangerang. Everything you build is an attempt to bring it down.',
      },
    ],
  },
  {
    era: 1,
    primer: {
      problem:
        'Still no telephones. But there is copper in the ruins and one old man who knows how a transmitter works, and a radio can put a voice 100 kilometres away in the time it takes to say it.',
      things: [
        {
          name: 'What a radio actually is',
          plain: 'Push electricity up and down a wire fast enough and it throws off an invisible wave. A wire a long way off wiggles in step with that wave. Wire, wave, wire — that is the whole idea, and everything else is care and patience.',
        },
        {
          name: 'AM',
          plain: 'The crude way to carry a voice: make the wave stronger and weaker in the shape of the sound. Crude is the point. A receiver for AM can be built out of almost nothing, and almost nothing is what the villages have.',
        },
        {
          name: 'The mast',
          plain: 'The wire has to be high up. Near the ground the wave travels in more or less a straight line, so how far you reach is decided by how tall the antenna is at both ends. That is why every site in this era is a tower on a hill.',
          catch: 'It is also the most valuable object for 40 kilometres, standing in the open, with a light on top of it.',
        },
        {
          name: 'Why night is different',
          plain: 'After dark the top of the atmosphere turns into a mirror and the wave bounces off it. The same station that barely reaches Tangerang at noon can be heard 4 provinces away at midnight.',
          catch: 'Nothing you built changed — the sun did. A link that worked last night may not work at breakfast.',
        },
        {
          name: 'What it costs to keep',
          plain: 'A generator eats fuel every hour the set is on, everything that is running wears out a little every day, and somebody has to be at the far end at the agreed hour or there is nobody to hear you.',
        },
      ],
      upshot:
        'Against Era 0 this is a message in seconds instead of 2 days. The catch is that it only exists while the machine is running, and keeping a machine running is what the whole era is about.',
    },
    objective:
      'Put a mast, a generator and a transmitter above New Batavia, and hold a circuit open across the region through a rainy season.',
    win: '7 days of unbroken contact with Serang, over a Tangerang relay that has been hardened. A link that only works while nothing goes wrong is not a link.',
    pressure:
      'Wear, weather and the rayap besi. Everything that is running is degrading, and everything that is worth having is worth stealing.',
    how: [
      {
        what: 'A turn is a day',
        note: 'Give each of the 4 crew a job, then execute the day. Most jobs take several, and only some classes are trusted with each.',
      },
      {
        what: 'Four stages to a site',
        note: 'Surveyed, installed, running, hardened. A site carries nothing until it is running, and survives nothing until it is hardened.',
      },
      {
        what: 'Build the kit before you install it',
        note: 'Mast, transmitter, battery, genset and feeder come off the workbench out of copper, steel, cells and parts. Those come out of the ruins.',
      },
      {
        what: 'Range is height, and the time of day',
        note: 'How far a link reaches is decided by the masts at both ends. After dark the signal bounces off the ionosphere and reaches much further.',
      },
      {
        what: 'Everything wears out',
        note: 'A running site loses 3% a day, half that if it is hardened. Raids take the exposed ones. Guard them, harden them, or clear the camp the raiders come from.',
      },
      {
        what: 'The dusk broadcast',
        note: 'Choose what goes out each evening — weather, trade calls, muster, or rumour. It is where rations, parts and the next operators come from.',
      },
    ],
  },
]

/** The briefing for an era, in the player's language, or nothing if it has none. */
export function briefingFor(era: number, lang: Lang): Briefing | undefined {
  const briefing = BRIEFINGS.find((b) => b.era === era)
  if (!briefing || lang === 'en') return briefing
  const text = ID_BRIEFINGS[era]
  if (!text) return briefing
  return {
    ...briefing,
    ...text,
    // Structure reuse: the English lists decide how many points there are and
    // what order they come in, and a missing one falls back rather than blanks.
    primer: {
      ...briefing.primer,
      ...text.primer,
      things: briefing.primer.things.map((thing, i) => ({
        ...thing,
        ...(text.primer.things[i] ?? {}),
      })),
    },
    how: briefing.how.map((point, i) => ({ ...point, ...(text.how[i] ?? {}) })),
  }
}
