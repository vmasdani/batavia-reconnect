/**
 * The technologies the game is actually about.
 *
 * This is a game about rebuilding telecommunication in order, and every era is
 * one real step somebody took in the real world. The script names those steps
 * — AM radio, the switchboard, the valve, core memory, the protocol — but a
 * name in a line of dialogue teaches nobody anything on its own. So every one
 * of them is an entry here, it lights up wherever it is said, and clicking it
 * says what it is, why this project needed it, and who did it first.
 *
 * Structure lives here and a translation supplies only text, exactly as
 * `story.ts` and `story.id.ts` do: which terms exist and which era owns them
 * can never drift between languages.
 *
 * `era` is where the project builds the thing, not where it is first mentioned.
 * A term lights up everywhere it appears, including eras before and after its
 * own, because that is usually the interesting part — Era 0 talks about a
 * telephone it does not have, and Era 7 is still using Era 2's copper.
 */

import type { Lang } from './lang'
import { ID_TERMS } from './glossary.id'

export interface Term {
  id: string
  /** The era that builds it. */
  era: number
  name: string
  /**
   * Other spellings that should light up in the script. Matching is on whole
   * words, so plurals that are not just `+s` belong here, and so does anything
   * the script calls it instead. A spelling written with a capital only matches
   * a capital.
   */
  aliases?: string[]
  /** One sentence: what it is. */
  what: string
  /** One or two: why this project could not skip it. */
  why: string
  /** Who did it first, out there. Left off where there is no single answer. */
  real?: string
}

export const TERMS: Term[] = [
  // --- Era 0: people, distance, and line of sight -----------------------------
  {
    id: 'courier',
    era: 0,
    name: 'courier relay',
    aliases: ['courier', 'couriers', 'runner', 'runners'],
    what: 'A message carried on foot, handed from one walker to the next at agreed places.',
    why: 'It is the only network that works with no power, no wire and no trust. Everything in this game is an attempt to beat the speed of a person walking.',
    real: 'The Persian angarium, about 500 BC — riders posted a day apart, so a message moved while its carrier rested.',
  },
  {
    id: 'notice-board',
    era: 0,
    name: 'notice board',
    aliases: ['notice boards'],
    what: 'A fixed place to leave a message for whoever passes next.',
    why: 'It breaks the rule that both people have to be present. A message waits at the board instead of waiting in somebody’s hands, which is the first version of an idea this game never stops using: store the message, forward it later.',
    real: 'Store and forward, the principle every mail system and every packet network has run on since.',
  },
  {
    id: 'signal-fire',
    era: 0,
    name: 'signal fire',
    aliases: ['signal fires', 'beacon', 'beacons'],
    what: 'A fire on high ground, visible from the next hill. Lit or unlit, and nothing else.',
    why: 'One bit of information, crossing 40 kilometres at the speed of light. It cannot say what is wrong, only that something is — and that is still faster than anything else in 2030.',
    real: 'Beacon chains, used from antiquity to the Napoleonic wars.',
  },
  {
    id: 'semaphore',
    era: 0,
    name: 'semaphore',
    aliases: ['flag signals', 'flag telegraph'],
    what: 'Arms, flags or shutters in agreed positions, read through a telescope from the next tower.',
    why: 'The first system that could send any message rather than one alarm, and the first to prove the real cost is not the towers but the people who have to sit in them.',
    real: 'Claude Chappe, France, 1794 — Paris to Lille, 230 km, in about half an hour.',
  },
  {
    id: 'line-of-sight',
    era: 0,
    name: 'line of sight',
    aliases: ['sight line', 'high ground'],
    what: 'Whether 2 points can see each other, once hills, the curve of the earth and everything standing in between are counted.',
    why: 'It decides which signal fires can answer each other, and later which masts can hear each other. Terrain is the constraint the player cannot argue with.',
    real: 'Radio horizon, which is about a seventh further than the visual one because the atmosphere bends the beam down.',
  },

  // --- Era 1: AM radio --------------------------------------------------------
  {
    id: 'am-radio',
    era: 1,
    name: 'AM radio',
    aliases: ['AM', 'amplitude modulation', 'radio'],
    what: 'Speech carried by varying the strength of a radio wave.',
    why: 'It is the easiest way to send a voice that exists. A receiver needs no power supply and barely any parts, which matters enormously when the people you are trying to reach have neither.',
    real: 'Reginald Fessenden, Christmas Eve 1906 — the first voice ever broadcast, heard by ships off Massachusetts.',
  },
  {
    id: 'transmitter',
    era: 1,
    name: 'transmitter',
    aliases: ['transmitters'],
    what: 'The machine that makes the radio wave and puts the voice on it.',
    why: 'The expensive half of a radio link. A village can be given a receiver; a transmitter has to be built, powered and kept working by somebody who understands it.',
  },
  {
    id: 'antenna',
    era: 1,
    name: 'antenna',
    aliases: ['aerial', 'mast', 'masts'],
    what: 'A conductor cut to a length that suits the wavelength, put as high as it can be got.',
    why: 'The one part of a radio you cannot improvise your way around. Height is range, which is why every relay in this game sits on a hill and why the mast is the first thing anybody steals.',
  },
  {
    id: 'generator',
    era: 1,
    name: 'generator',
    aliases: ['generators', 'dynamo'],
    what: 'An engine turning a coil inside a magnet, making electricity.',
    why: 'Nothing else in the era works without it, and it eats fuel every hour it runs. Power, not copper, is what actually limits how long a station can stay on air.',
  },
  {
    id: 'propagation',
    era: 1,
    name: 'propagation',
    aliases: ['skywave', 'ground wave', 'interference'],
    what: 'How far a radio wave actually gets, which changes with the ground, the weather and the time of day.',
    why: 'Medium-wave AM crawls along the ground by day and bounces off the ionosphere at night, so the same station is local at noon and heard 4 provinces away at midnight. The link that worked yesterday may not work today, and nobody has done anything wrong.',
    real: 'The Kennelly–Heaviside layer, proposed in 1902 and confirmed in 1924.',
  },

  // --- Era 2: telegraph -------------------------------------------------------
  {
    id: 'telegraph',
    era: 2,
    name: 'telegraph',
    aliases: ['telegraph line', 'telegraph poles', 'poles'],  // and `tiang`, in the Indonesian list
    what: 'A wire between 2 places, and a battery that can push current down it.',
    why: 'Cheaper per kilometre than radio and far harder to jam, but it has to physically exist the whole way — which makes it the first thing the project owns that somebody can walk up to and cut.',
    real: 'Cooke and Wheatstone, 1837; Morse’s line from Washington to Baltimore, 1844.',
  },
  {
    id: 'telegraph-key',
    era: 2,
    name: 'telegraph key',
    aliases: ['key', 'keys', 'keying', 'keyed'],
    what: 'A sprung lever. Pressing it closes the circuit; letting go opens it.',
    why: 'The whole interface. One moving part, no electronics, and anybody can be taught to use it in a week — which is the entire reason a village can be handed one and left to it.',
  },
  {
    id: 'morse-code',
    era: 2,
    name: 'Morse code',
    aliases: ['Morse', 'dots and dashes'],
    what: 'Letters written as short and long pulses, with the commonest letters given the shortest codes.',
    why: 'It turns a wire that can only be on or off into something that can carry any sentence. The first time this project encodes language into 2 states — and it does it again in Era 5, and again in Era 6.',
    real: 'Alfred Vail and Samuel Morse, 1838. E is one dot because E is the commonest letter in English.',
  },
  {
    id: 'electromagnet',
    era: 2,
    name: 'electromagnet',
    aliases: ['electromagnets', 'coil', 'coils', 'sounder'],
    what: 'Wire wound round iron. Current makes it a magnet; no current, no magnet.',
    why: 'Every part of this era is one of these in a different shape: the sounder that clicks, the relay that repeats, the bell that rings. Learn it once and Era 3’s exchange stops being mysterious.',
  },
  {
    id: 'relay-station',
    era: 2,
    name: 'relay',
    aliases: ['relays', 'relay station', 'relay stations', 'repeater'],
    what: 'A weak incoming signal works an electromagnet, which closes a fresh circuit with a fresh battery behind it.',
    why: 'It is what makes distance stop mattering: a line as long as you like, as long as you can put one of these every so often. It is also, quietly, the first machine in the game that makes a decision.',
  },

  // --- Era 3: telephone -------------------------------------------------------
  {
    id: 'telephone',
    era: 3,
    name: 'telephone',
    aliases: ['telephones', 'phone', 'phones', 'calls'],
    what: 'A microphone and an earpiece on the same wire, so 2 people can simply talk.',
    why: 'It removes the operator, and with them the last person who had to be trained before 2 villages could speak. Communication stops being a message and becomes a conversation.',
    real: 'Alexander Graham Bell, 1876 — patented hours before Elisha Gray filed for much the same thing.',
  },
  {
    id: 'switchboard',
    era: 3,
    name: 'switchboard',
    aliases: ['switchboards', 'switchman'],
    what: 'A panel of sockets and patch cords. An operator hears who you want and joins the 2 lines by hand.',
    why: 'It is what lets 100 lines reach each other without 10,000 wires. It also puts one person in the middle of every private conversation in the province, which is the political problem this whole era is about.',
  },
  {
    id: 'exchange',
    era: 3,
    name: 'exchange',
    aliases: ['exchanges', 'central office'],
    what: 'The building the switchboards live in, and everything that decides which line reaches which.',
    why: 'Whoever holds the exchange holds the network: the queue, the price, the order people are told things in. Handing one over is the hardest thing the project ever does on purpose.',
  },
  {
    id: 'strowger',
    era: 3,
    name: 'step-by-step switch',
    aliases: ['Strowger', 'automatic exchange', 'rotary'],
    what: 'A rotating contact arm that steps one position for each pulse the dial sends, connecting the call without an operator.',
    why: 'The first machine to take a human out of the middle of a conversation — and it was invented by an undertaker who was convinced the local operator was sending his customers to a rival.',
    real: 'Almon Strowger, 1891. The story about the undertaker is true.',
  },
  {
    id: 'standard',
    era: 3,
    name: 'standard',
    aliases: ['standards', 'the standard'],
    what: 'A written rule that everybody’s equipment follows, so equipment nobody coordinated still works together.',
    why: 'It is the only kind of control that survives giving the hardware away. The project keeps the standard and hands over everything else — and that decision, made here, is what Era 7 finally cashes in.',
  },

  // --- Era 4: electronics -----------------------------------------------------
  {
    id: 'vacuum-tube',
    era: 4,
    name: 'vacuum tube',
    aliases: ['valve', 'valves', 'tube', 'tubes'],
    what: 'A heated wire boils electrons across an evacuated glass envelope, and a third electrode in between controls how many get across.',
    why: 'The first component that can amplify — make a small signal into a big one — and the first that can switch without anything moving. Every amplifier, oscillator and logic gate in the next 2 eras is built out of these.',
    real: 'Lee de Forest’s Audion, 1906. He did not fully understand why it worked.',
  },
  {
    id: 'glassblowing',
    era: 4,
    name: 'glassblowing',
    aliases: ['glass', 'glassblower', 'envelope'],
    what: 'Shaping molten glass by breath and hand, to a tolerance the same every time.',
    why: 'A valve is a glass problem before it is an electrical one. This is where the project stops scavenging and starts manufacturing, and it turns out the hard part is not the physics.',
  },
  {
    id: 'sulphuric-acid',
    era: 4,
    name: 'sulphuric acid',
    aliases: ['acid'],
    what: 'The most-produced industrial chemical there is, and the one everything else needs.',
    why: 'Batteries, cleaning glass, and later etching silicon. A country’s ability to make it is close to a measure of whether it has an industry at all — which is why nobody here has made it to specification in 18 years.',
    real: 'The lead chamber process, 1746; the contact process, 1831.',
  },
  {
    id: 'oscillator',
    era: 4,
    name: 'oscillator',
    aliases: ['oscillators', 'carrier'],
    what: 'A circuit that feeds its own output back into itself and settles into a steady tone at one frequency.',
    why: 'It is the beat everything else runs on: the carrier a radio rides, the clock a computer counts, the tone a modem speaks in. Nothing after this era works without something ticking.',
  },
  {
    id: 'amplifier',
    era: 4,
    name: 'amplifier',
    aliases: ['amplifiers', 'amplify', 'amplifies'],
    what: 'A small signal controlling a large power supply, so the shape survives and the strength grows.',
    why: 'It is what makes long distance possible without a person in the middle. A relay repeats a message; an amplifier repeats a voice, and the difference is the whole telephone network.',
  },

  // --- Era 5: computing -------------------------------------------------------
  {
    id: 'core-memory',
    era: 5,
    name: 'core memory',
    aliases: ['ferrite core', 'ferrite cores', 'cores', 'magnet that remembers'],
    what: 'A grid of tiny iron rings on threaded wires. Each ring is magnetised one way or the other, and stays that way with the power off.',
    why: 'Memory that survives losing power — which is exactly what the machines pulled out of ruins did not have, and why they came back empty. It was also woven by hand, ring by ring, by people paid to be patient.',
    real: 'MIT’s Whirlwind, 1953. Apollo flew on it.',
  },
  {
    id: 'punched-card',
    era: 5,
    name: 'punched card',
    aliases: ['punched cards', 'punch card', 'punch cards', 'paper tape'],
    what: 'Stiff card with holes in agreed positions. A hole is a one, no hole is a zero, and a machine reads it by feeling for the light.',
    why: 'A program you can hold, correct with a pencil, post to another town and read back in 40 years. In a place with no disks and no reliable power, information on paper is not a step backwards.',
    real: 'Herman Hollerith, for the 1890 US census — borrowed from the Jacquard loom of 1804.',
  },
  {
    id: 'binary',
    era: 5,
    name: 'binary',
    aliases: ['bit', 'bits', 'binary logic', 'ones and zeroes'],
    what: 'Everything written in 2 states, because 2 states is what a wire, a switch or a magnet can reliably hold.',
    why: 'Morse already did this with dots and dashes. The machine does it with voltages, and the only real change is that nobody has to be listening.',
    real: 'Leibniz described it in 1703; Shannon showed in 1937 that it was the same thing as logic.',
  },
  {
    id: 'routing-table',
    era: 5,
    name: 'routing table',
    aliases: ['routing tables'],
    what: 'A list, held in the machine, of which way to send a message for each place it might be going.',
    why: 'The moment the network stops needing a person to know the map. Hold the message, look up the destination, decide the next hop — that is Era 6 already, running on Era 5’s hardware.',
  },
  {
    id: 'modem',
    era: 5,
    name: 'modem',
    aliases: ['modems'],
    what: 'A device that turns bits into tones a telephone line will carry, and turns them back at the far end.',
    why: 'It lets the network the project already built — wire strung for voices — carry data without a single new pole. Reusing what exists is the whole discipline of this game.',
    real: 'Bell 103, 1962. 300 bits per second, over an ordinary phone call.',
  },

  // --- Era 6: packet networks -------------------------------------------------
  {
    id: 'packet-switching',
    era: 6,
    name: 'packet switching',
    aliases: ['packet', 'packets'],
    what: 'Chop the message into small labelled pieces, send each one separately, and reassemble at the far end.',
    why: 'A dedicated line between every pair of towns cannot scale and cannot survive a cut. Packets share every line and route around damage — which is exactly why the idea was funded in the first place.',
    real: 'Paul Baran and Donald Davies arrived at it separately, 1964–65.',
  },
  {
    id: 'addressing',
    era: 6,
    name: 'addressing',
    aliases: ['address', 'addresses'],
    what: 'Every destination has a name the machines agree on, written on every packet.',
    why: 'Without it a router has nothing to decide with. It sounds like bookkeeping and it is the reason a message can reach a town nobody along the way has heard of.',
  },
  {
    id: 'error-correction',
    era: 6,
    name: 'error correction',
    aliases: ['checksum', 'checksums', 'parity'],
    what: 'Extra bits sent alongside the message, chosen so the receiver can tell whether the rest arrived intact — and sometimes repair it.',
    why: 'The lines are salvaged, the weather is bad and nobody is going to rebuild them. Assume corruption, detect it, ask again. It is cheaper than perfect wire and always was.',
    real: 'Richard Hamming, 1950, after losing a weekend of computer time to a card reader.',
  },
  {
    id: 'integrated-circuit',
    era: 6,
    name: 'integrated circuit',
    aliases: ['chip', 'chips', 'silicon'],
    what: 'A whole circuit — thousands of components and the wiring between them — made at once on a single sliver of silicon.',
    why: 'The drawer full of these is what the network runs on, and there is no more where they came from. The die itself survives burial for decades; it is everything around it that dies.',
    real: 'Jack Kilby and Robert Noyce, 1958–59.',
  },
  {
    id: 'electrolytic-capacitor',
    era: 6,
    name: 'electrolytic capacitor',
    aliases: ['capacitor', 'capacitors'],
    what: 'A capacitor whose insulating layer is held in place by a wet chemical paste.',
    why: 'The paste dries out whether the thing is used or not. It is the single commonest reason a piece of pre-war electronics does not work, and the reason “we found a board” is never the same as “we found a working board”.',
  },

  // --- Era 7: internetworking -------------------------------------------------
  {
    id: 'protocol',
    era: 7,
    name: 'protocol',
    aliases: ['protocols', 'frame format'],
    what: 'The agreed rules for what a message looks like and what each side does next.',
    why: 'The final breakthrough of the whole game is not a machine. 2 networks nobody built together can carry each other’s traffic if, and only if, they have agreed on this.',
  },
  {
    id: 'internetworking',
    era: 7,
    name: 'internetworking',
    aliases: ['internet', 'router', 'routers', 'gateway'],
    what: 'Networks that do not know anything about each other, joined by machines at their edges that translate between them.',
    why: 'It is what stops the project from having to own everything. Every province can build its own network, badly, in its own way — and it still connects.',
    real: 'Vint Cerf and Bob Kahn, 1974. The paper is 9 pages long.',
  },
  {
    id: 'photolithography',
    era: 7,
    name: 'photolithography',
    aliases: ['fab', 'wafer', 'wafers', 'furnace'],
    what: 'Printing a circuit onto silicon with light, then etching away what the light did not protect, dozens of times over.',
    why: 'It is the only way to make chips rather than find them, and it needs a clean room, pure water, gases and a supply chain across 9 provinces. The project spends its last decade on it because a network running on rationed scrap belongs to whoever holds the rations.',
    real: 'Jules Andrus at Bell Labs, 1955.',
  },
  {
    id: 'one-bit-machine',
    era: 7,
    name: 'one-bit machine',
    aliases: ['one bit wide', 'one bit at a time', 'MC14500B', 'MC14500', '8051', 'Intel 8051'],
    what: 'A processor that handles a single bit at a time — one input, one output, a handful of instructions.',
    why: 'Embarrassing next to anything in the drawer, and it does not matter: it is the first one they can make again tomorrow. Enough to run a router, which is all a network boundary needs.',
    real: 'Motorola’s MC14500B, 1977 — a genuine one-bit industrial control unit with 16 instructions. The Intel 8051 of 1980 is the other ancestor: a whole small computer on one chip, still in production today.',
  },
  {
    id: 'open-standard',
    era: 7,
    name: 'published standard',
    aliases: ['publish it', 'published'],
    what: 'The rules written down and given away, including the parts that did not work.',
    why: 'The project’s last act and its only durable defence. A network nobody can be locked out of is not worth capturing, and a standard everybody already implements cannot be taken back.',
    real: 'The RFC series, from 1969 — titled “Request for Comments” because its authors were not sure they were allowed to write it.',
  },
]

export const TERM_BY_ID = new Map(TERMS.map((t) => [t.id, t]))

/** Terms belonging to each era, in the order they are listed above. */
export function termsByEra(terms: Term[]): Map<number, Term[]> {
  const byEra = new Map<number, Term[]>()
  for (const term of terms) {
    const list = byEra.get(term.era)
    if (list) list.push(term)
    else byEra.set(term.era, [term])
  }
  return byEra
}

// --- translation -------------------------------------------------------------

/** The glossary in the player's language, English structure kept. */
export function termsIn(lang: Lang): Term[] {
  if (lang === 'en') return TERMS
  return TERMS.map((term) => {
    const text = ID_TERMS[term.id]
    if (!text) return term
    return { ...term, ...text }
  })
}

// --- finding terms in a line of script ---------------------------------------

/**
 * Every spelling that should light up, in both languages at once.
 *
 * Both, deliberately. The UI language and the language of the text on screen
 * are not always the same thing — Era 1's skits are English whatever the menu
 * is set to — so matching against only one of them would leave terms dark in
 * exactly the places a player is most likely to be reading carefully.
 */
interface Spelling {
  phrase: string
  id: string
  /**
   * True when the phrase has a capital in it, and so must be matched exactly.
   * `AM` is a technology; `am` is a verb, and the two are one keystroke apart.
   */
  exact: boolean
}

const SPELLINGS: Spelling[] = (() => {
  const found: Spelling[] = []
  const add = (id: string, phrase: string) =>
    found.push({ id, phrase, exact: phrase !== phrase.toLowerCase() })
  for (const term of TERMS) {
    add(term.id, term.name)
    for (const alias of term.aliases ?? []) add(term.id, alias)
    const text = ID_TERMS[term.id]
    if (!text) continue
    add(term.id, text.name)
    for (const alias of text.aliases ?? []) add(term.id, alias)
  }
  // Longest first, so `one bit wide` wins over `bit` and `notice board` over
  // `board` — the alternation below takes the first branch that matches.
  return found.sort((a, b) => b.phrase.length - a.phrase.length)
})()

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const PATTERN = new RegExp(`\\b(?:${SPELLINGS.map((s) => escape(s.phrase)).join('|')})\\b`, 'gi')

/** Every spelling that reads the same in lower case, in longest-first order. */
const BY_LOWER = (() => {
  const byLower = new Map<string, Spelling[]>()
  for (const spelling of SPELLINGS) {
    const key = spelling.phrase.toLowerCase()
    const list = byLower.get(key)
    if (list) list.push(spelling)
    else byLower.set(key, [spelling])
  }
  return byLower
})()

export interface TermHit {
  start: number
  end: number
  id: string
}

/**
 * Where the technologies are in a line of text.
 *
 * Ranges rather than a rewritten string, so the caller can clip them — the
 * dialogue player reveals a line a character at a time, and a term has to be
 * able to light up while it is still being typed.
 */
export function findTerms(text: string): TermHit[] {
  const hits: TermHit[] = []
  PATTERN.lastIndex = 0
  for (let match = PATTERN.exec(text); match; match = PATTERN.exec(text)) {
    const candidates = BY_LOWER.get(match[0].toLowerCase()) ?? []
    // A capitalised spelling only counts when the script capitalised it too;
    // an ordinary one counts however it was written, including at the start of
    // a sentence.
    const spelling = candidates.find((s) => !s.exact || s.phrase === match[0])
    if (spelling) hits.push({ start: match.index, end: match.index + match[0].length, id: spelling.id })
  }
  return hits
}
