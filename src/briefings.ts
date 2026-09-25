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
  /**
   * The loop, in the order a player meets it.
   *
   * Only the eras that are played have one. The rest are read rather than
   * played, and telling somebody how to play an era they cannot play is worse
   * than saying nothing.
   */
  how?: Array<{ what: string; note: string }>
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
          name: 'The radio tower',
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
      'Put a radio tower, a generator and a transmitter above New Batavia, and hold a circuit open across the region through a rainy season.',
    win: '7 days of unbroken contact with Serang, over a Tangerang relay that has been hardened. A link that only works while nothing goes wrong is not a link.',
    pressure:
      'Wear, weather and the rayap besi. Everything that is running is degrading, and everything that is worth having is worth stealing.',
    how: [
      {
        what: 'A turn is a day',
        note: 'Give each of the 4 crew a job, then execute the day. Most jobs take several, and only some classes are trusted with each.',
      },
      {
        what: '4 stages to a site',
        note: 'Surveyed, installed, running, hardened. A site carries nothing until it is running, and survives nothing until it is hardened.',
      },
      {
        what: 'Build the kit before you install it',
        note: 'Radio tower, transmitter, battery, genset and feeder come off the workbench out of copper, steel, cells and parts. Those come out of the ruins.',
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
  {
    era: 2,
    primer: {
      problem:
        'A radio carries a voice, and a voice needs 2 people awake at the same hour, both of them sober, both of them trained. A wire does not sleep and does not need to be trained.',
      things: [
        {
          name: 'A telegraph key',
          plain: 'A switch. Press it and current runs down the copper; let go and it stops. At the far end that current works an electromagnet, and the magnet clicks in time with your finger. That is the entire machine — a switch here, a click there, and a wire in between.',
        },
        {
          name: 'Morse code',
          plain: 'The wire can only be on or off, so a letter has to be spelled in short and long ons. This is the same thing a signal fire could say in Era 0 — one bit — with one difference that changes everything: you can send hundreds of them a minute, so one bit becomes any sentence you like.',
        },
        {
          name: 'A relay every 30 kilometres',
          plain: 'After about 30 kilometres the current arriving is too feeble to work a magnet. So you put in a magnet weak enough to be worked by it, and have that magnet close a switch on a fresh battery. The message leaves each relay as strong as it started. This is why distance stops mattering.',
          catch: 'Every relay is a hut with a battery in it that somebody has to walk to.',
        },
        {
          name: 'Poles, and what is on them',
          plain: '400 kilometres of wire is 400 kilometres of copper hanging at head height across open country.',
          catch: 'Copper is money now. A telegraph line is a bank spread thin across a whole region with no door on it, and 1 warden cannot watch it. It is only safe if the people it passes want it standing.',
        },
      ],
      upshot:
        'Per word a telegraph is slower than speech. Per message it is far cheaper: no operator waiting at an agreed hour, no fuel, no voice. It runs all night for nobody, which is exactly what a network has to do.',
    },
    objective:
      'String 400 kilometres of telegraph across the Jakarta region, and keep it standing while people cut it down.',
    win: 'A line from New Batavia to Bekasi still standing after a season, with every village it passes walking its own stretch of it.',
    pressure:
      'Theft. You cannot guard a line that long — you can only make it worth more to the people beside it standing up than lying in a cart.',
  },
  {
    era: 3,
    primer: {
      problem:
        'The telegraph works and almost nobody can use it: it needs a trained operator at both ends. A telephone carries the voice itself, so anyone can use it — but 2 people who want to talk need a wire between them, and that is where it falls apart.',
      things: [
        {
          name: 'The telephone',
          plain: 'A microphone turns the pressure of your voice into a current that wobbles the same shape; an earpiece at the far end turns it back into pressure. No code and no training. This is the first machine in the whole story that a person can use without being taught.',
        },
        {
          name: 'Why you cannot simply run wires',
          plain: 'Give every pair of people their own wire and the count grows as the square. 9 settlements is 36 wires. 100 settlements is 4,950. There is not that much copper in the world, and there never was.',
        },
        {
          name: 'The exchange',
          plain: 'So run 1 wire from each subscriber to 1 room, and in that room an operator joins 2 of them together with a patch cord for as long as the call lasts. 100 subscribers now need 100 wires instead of 4,950. Switching, not wire, is the actual invention — and every network built after this one is an argument about how to do it.',
        },
        {
          name: 'The person in the middle',
          plain: 'Somebody has to sit at that board and put the cords in.',
          catch: 'She hears the first second of every call in the region. She knows who is ill, whose husband is not coming home, and what Bekasi will pay for rice before Bekasi does. Nobody decided she should know all of that. It came with the wiring.',
        },
        {
          name: 'Trunks between exchanges',
          plain: 'One exchange serves one town. Join the exchanges to each other with a few thick lines and the whole region can reach itself — as long as everybody agrees whose room the cords are in.',
        },
      ],
      upshot:
        'A telegraph moved messages. An exchange moves conversations, and puts one room in the middle of everything. From here on the hard questions about a network stop being technical and start being about who owns the middle.',
    },
    objective:
      'Run switchboards for 9 settlements, and negotiate who owns each exchange as fast as you can build them.',
    win: 'Every settlement able to call every other one, under an arrangement all of them will still accept next year.',
    pressure:
      'Ownership. Everybody depends on the exchange and nobody voted for it, and the town that hosts one can close it.',
  },
  {
    era: 4,
    primer: {
      problem:
        'Every amplifier in the network runs on a valve, every valve came out of a ruin, and there is nothing left in the ruins. The last salvage trip burned 3 days of fuel to bring back 3 days of parts.',
      things: [
        {
          name: 'What a valve is',
          plain: 'A wire in a glass bulb with the air taken out. Heat it and it boils electrons off into the vacuum, which drift to a plate at the far end. Put a grid of fine wire in between and a tiny voltage on that grid decides how many get through. A small signal now controls a large current: that is amplification, and it is the whole reason a weak radio signal can be made loud.',
        },
        {
          name: 'Amplify twice and it sings',
          plain: 'Feed a bit of a valve’s output back into its own input and it stops needing an input at all — it generates a signal by itself, at a frequency you choose. That is an oscillator. An amplifier and an oscillator between them are every radio, every transmitter and every clock in this story.',
        },
        {
          name: 'The vacuum is the hard part',
          plain: 'Air left inside at even 1 part in 1,000,000 ruins it. The glass has to be blown to a tenth of a millimetre the same way every time, sealed around wires that expand at the same rate the glass does, and a getter fired inside to swallow whatever gas is left.',
          catch: 'A bottle forgives your mistakes. This does not, and the first 14 will not hold their vacuum overnight.',
        },
        {
          name: 'And under the glass, chemistry',
          plain: 'The glass has to be cleaned with sulphuric acid. The acid has to be made from chemicals that have to be made first, from rock that has to be dug up.',
          catch: 'Nobody in the country has made acid to a proper specification for 18 years. Every step here rests on a step below it that nobody has done either — which is what a supply chain is, seen from the bottom.',
        },
      ],
      upshot:
        'Every era before this one was about distance. This one is about making instead of finding, and it is the first time the project has to build the industry under the industry.',
    },
    objective:
      'Build the glassworks and the chemistry under it, and make valves that outlast the ones you can no longer find.',
    win: 'A valve made in New Batavia that runs longer than a salvaged one, made again the next week, and the week after.',
    pressure:
      'Yield. Almost everything you make is wrong, and the only way to a good one is through a great many bad ones.',
  },
  {
    era: 5,
    primer: {
      problem:
        'Every timetable, every toll and every queue on the network is worked out by hand. 15 exchanges is 6 hours of arithmetic a night, and it is wrong by morning. The region can make valves now, and nobody has yet used one as a switch.',
      things: [
        {
          name: 'A relay was always a computer part',
          plain: 'A telegraph relay is a switch that another switch throws, and there has been one every 30 kilometres since 2034. Wire 2 in a line and the current arrives only if both are closed: that is "and". Side by side, and it arrives if either is closed: that is "or". Wire one to break instead of make and that is "not". There is no fourth idea, and 200 relays off the spares shelf will add 2 numbers.',
          catch: 'Metal has to move for a relay to close, and moving metal is slow. The relay adder is never wrong and needs 16 hours for a night of arithmetic a clerk does in 6.',
        },
        {
          name: 'A valve does the same with nothing moving',
          plain: 'Driven hard enough, a valve stops amplifying and simply passes everything or nothing. The same "and", the same "or", no metal — and it changes its mind 1,000,000 times a second instead of 20.',
        },
        {
          name: 'Never switch it off',
          plain: 'A valve nearly always dies in the moment it is heated from cold. 3,000 valves switched off every night is one death every 8 minutes; 3,000 valves left burning is a handful a week. So the heaters stay lit through the night, the holiday and the rainy season.',
          catch: 'A machine that is never switched off is a generator that is never switched off. This era is paid for in diesel, and the fuel argument is older than the machine.',
        },
        {
          name: 'It cannot remember anything',
          plain: 'There is nowhere to keep what you tell it. What the machine knows, it knows because of where 300 plugs sit in 300 sockets. Changing what it does means half a day of rewiring, and 1 plug in the wrong hole is a wrong answer with nothing anywhere to say so.',
          catch: 'That is the problem the next era is named after.',
        },
      ],
      upshot:
        'The first machine in this story that decides anything without a person. It does the work of 40 clerks, it is made of glass, and every morning it is exactly as clever as the wires somebody left in it.',
    },
    objective:
      'Build a machine out of valves that does the arithmetic the region runs on, and keep 3,000 of them alight through a rainy season.',
    win: 'The nightly timetable for 15 exchanges, worked out by the machine, correct, on a night nobody switched it off.',
    pressure:
      'Valves and fuel. One dies somewhere in the racks every few hours, and the generator burns whether the machine is working or waiting.',
  },
  {
    era: 6,
    primer: {
      problem:
        'The counting room decides anything you can wire into it and forgets all of it the moment the plugs change. In the drawer sit whole processors — a computer on one chip, salvaged and perfect — and they are useless on their own: a processor with no memory it can keep and no program it can keep is a stone. The machine also has to be one a workshop can build twice, from a design the old world published complete.',
      things: [
        {
          name: 'A processor in the drawer',
          plain: 'A whole computer on one chip: an adder, registers, the logic to run a program, all of it, salvaged and still perfect after 30 years. On its own it does nothing — it cannot hold a single number once the power blinks, it has no program to run, and it has no way to reach a person.',
        },
        {
          name: 'Core memory',
          plain: 'A ring of ferrite the size of a grain of rice, threaded on 3 fine wires. Push current through the wires and the ring magnetises one way round; push it the other way and it flips. One way is 0 and the other is 1. Take the power away and it stays exactly as you left it, in the dark, indefinitely. 4,096 bits took 11 women 4 months, and no machine can do it — building that machine is a harder problem than the memory is.',
        },
        {
          name: 'Reading it wipes it',
          plain: 'The only way to find out which way a core is magnetised is to try to flip it and see whether it objects.',
          catch: 'Which means every read destroys what it read, and the machine has to write it straight back. Half the wiring exists only to undo the damage of looking.',
        },
        {
          name: 'Punched cards',
          plain: 'The program goes in as holes in stiff paper: a hole is a 1, no hole is a 0. A day of work fits in both hands, a mistake is corrected with a pencil, and the cards can be posted to Bandung and read back in 40 years.',
        },
        {
          name: 'A design you can build twice',
          plain: 'Rather than invent the machine, they copy one the old world printed complete in a magazine — every schematic, published on purpose so any workshop could reproduce it. A microcomputer: the salvaged processor, the woven memory, a keypad and a screen. Stand one at every junction and it takes a message in, holds it, looks up where it should go, and sends it on with nobody in the room.',
        },
      ],
      upshot:
        'Memory is what turns a bare chip into a machine that can decide, and a published design is what lets a second workshop build the same one. It is also the first machine in the story that outlives the person who set it going.',
    },
    objective:
      'Thread core memory, build a whole computer around a chip from the drawer to a published design, and teach the generation that was born after the war.',
    win: 'A machine that takes a message in at one hour and sends it on at another, correctly, with nobody in the room — and a second one built from the same printed pages.',
    pressure:
      'Time, and the people running out of it. The ones who remember the old world are the ones who still have to be asked.',
  },
  {
    era: 7,
    primer: {
      problem:
        'The lines stopped being wires between 2 towns years ago. What runs now is a packet network — and every router in it runs on a chip somebody found in a drawer, of which there were 311, then 40, then 9.',
      things: [
        {
          name: 'A modem',
          plain: 'The telephone network already reaches everywhere and it only carries sound. So turn the bits into sounds it will carry — one tone for a 1, another for a 0 — and turn them back at the far end. Nothing about the phone lines has to change, which is the only reason this was ever affordable.',
        },
        {
          name: 'Packets',
          plain: 'Cut a message into small pieces and write the destination on every piece. Pieces from a dozen different conversations then share the same wire, interleaved, and nobody has to book the line for the length of a call. A wire that used to carry 1 conversation carries all of them.',
        },
        {
          name: 'Checksums',
          plain: 'Some pieces arrive damaged. Each one carries a small sum of its own contents, so the far end can check it and simply ask again for the ones that fail.',
          catch: 'Asking again is cheaper than perfect wire. Every network since has been built on being allowed to be wrong occasionally.',
        },
        {
          name: 'Routers',
          plain: 'At every junction, a small computer that reads the address on a packet and decides which line it leaves by. That is the Era 6 machine, one at every crossroads, and it is the part that runs on the chips from the drawer.',
        },
        {
          name: 'Chips do not rot',
          plain: '30 years in a drawer and the chips themselves were perfect — ceramic and plastic outlast almost everything.',
          catch: 'Everything around them died. Capacitors dried out, batteries leaked, disks seized. And memory without power keeps nothing, so the boards came back undamaged and empty: 40 years of other people’s thinking, and only the machines survived it.',
        },
      ],
      upshot:
        'Packets make a network that survives its own faults. The chips make one that cannot survive its own supply. This era is those 2 facts pulling in opposite directions.',
    },
    objective:
      'Stretch the last salvaged chips across 15 provinces, while 9 of them argue about a furnace at Cilegon.',
    win: 'Every province reachable, and an agreement to build the furnace signed before the drawer is empty.',
    pressure:
      'The count. It falls every year, and no amount of care makes it go back up.',
  },
  {
    era: 8,
    primer: {
      problem:
        'A network that runs on rationed scrap belongs to whoever controls the rations. The only way out is to make the chips, and making a chip is not a workshop — it is a chemical industry that 9 provinces have to agree about for 10 years.',
      things: [
        {
          name: 'What a fab is',
          plain: 'Sand refined to silicon purer than anything else people make, grown into a single crystal, sliced, and then printed on: layers of pattern laid down through masks and driven into the surface with dopants that change how it conducts. Do that 20 times in register and the pattern is a circuit.',
        },
        {
          name: 'Dust',
          plain: 'A speck of dust on the wafer is a broken circuit. The room has to be cleaner than an operating theatre, which sounds like a joke until it costs you a year.',
          catch: '3 good chips out of 400. That is not a failure of skill; that is what the first year looks like everywhere it has ever been done.',
        },
        {
          name: 'A one-bit machine',
          plain: 'What they can actually make is tiny: 16 instructions, one bit at a time, copied from a dead MC14500B with the part number still printed on the package. There is an Intel 8051 in the same drawer that is an entire computer on one chip and better by every measure anyone can take.',
          catch: 'And nothing in that drawer can be made again tomorrow. Speed was never the point.',
        },
        {
          name: 'A protocol',
          plain: 'Networks built by people who never met each other only join up if they agree on the shape of a frame, how addresses are written, and what happens when 2 of them disagree. That agreement is worth more than any of the hardware: it is what lets a network you do not control become part of yours.',
        },
        {
          name: 'Publishing it',
          plain: 'The furnace process, the frame format, the addressing, and 23 years of failures, written down and given away.',
          catch: 'Which ends the project. A standard everybody has is a standard nobody needs you for — and that was always the job.',
        },
      ],
      upshot:
        'The arc closes here. Era 0 was 3 people walking to a village to ask whether anybody was alive. This is the same act at the scale of a country: make the thing, then give away how, so nobody has to be asked permission again.',
    },
    objective:
      'Run the fab until it works, publish everything you learned, and hand the network to people who never asked your permission.',
    win: 'A chip made in this country, made again the following week, and a standard in the hands of everyone who wants it.',
    pressure:
      'Everything at once — purity, crystal, masks, dopants, dust — and each failure naming a problem a whole region has to solve before the next attempt is possible.',
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
    how: briefing.how?.map((point, i) => ({ ...point, ...(text.how?.[i] ?? {}) })),
  }
}
