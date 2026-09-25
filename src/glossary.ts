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
 * telephone it does not have, and Era 8 is still using Era 2's copper.
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
  /**
   * The English Wikipedia article whose lead image is the photograph of this
   * thing, or a `File:` on Commons when the lead image is the wrong picture.
   * `npm run fetch:photos` reads this; nothing at runtime does.
   */
  wiki?: string
  /**
   * The words for the numbered pins on this term's diagram in `figures.tsx`,
   * in order — the walk-through that a name and a sentence cannot give.
   *
   * Exactly as many as the diagram draws. `check:script` says so by name when
   * a translation is short, because a pin with no words is worse than no pin.
   */
  steps?: string[]
}

export const TERMS: Term[] = [
  // --- Era 0: people, distance, and line of sight -----------------------------
  {
    id: 'courier',
    era: 0,
    wiki: 'Pony Express',
    name: 'courier relay',
    aliases: ['courier', 'couriers', 'runner', 'runners'],
    what: 'A message carried on foot, handed from one walker to the next at agreed places.',
    why: 'It is the only network that works with no power, no wire and no trust. Everything in this game is an attempt to beat the speed of a person walking.',
    real: 'The Persian angarium, about 500 BC — riders posted a day apart, so a message moved while its carrier rested.',
    steps: [
      'A message starts here, said out loud to somebody willing to walk with it.',
      'They walk. The message moves exactly as fast as a pair of legs and no faster.',
      'It arrives 2 days later. An answer is another 2 days, so a question costs 4.',
    ],
  },
  {
    id: 'notice-board',
    era: 0,
    wiki: 'Bulletin board',
    name: 'notice board',
    aliases: ['notice boards'],
    what: 'A fixed place to leave a message for whoever passes next.',
    why: 'It breaks the rule that both people have to be present. A message waits at the board instead of waiting in somebody’s hands, which is the first version of an idea this game never stops using: store the message, forward it later.',
    real: 'Store and forward, the principle every mail system and every packet network has run on since.',
    steps: [
      'A carrier arrives with a message that is not for anybody here.',
      'They pin it up and go home. The message waits at the board, in nobody’s hands.',
      'Whoever passes next going the right way takes it on. The message moved while nobody carried it.',
    ],
  },
  {
    id: 'signal-fire',
    era: 0,
    wiki: 'Beacon',
    name: 'signal fire',
    aliases: ['signal fires', 'beacon', 'beacons'],
    what: 'A fire on high ground, visible from the next hill. Lit or unlit, and nothing else.',
    why: 'One bit of information, crossing 40 kilometres at the speed of light. It cannot say what is wrong, only that something is — and that is still faster than anything else in 2030.',
    real: 'Beacon chains, used from antiquity to the Napoleonic wars.',
    steps: [
      'The fire is lit on the hill above the village. That is the whole message.',
      'The light crosses 40 kilometres in the time it takes to blink.',
      'The next hill sees it and knows something is wrong — not what, not who, not how much.',
    ],
  },
  {
    id: 'semaphore',
    era: 0,
    wiki: 'Semaphore telegraph',
    name: 'semaphore',
    aliases: ['flag signals', 'flag telegraph'],
    what: 'Arms, flags or shutters in agreed positions, read through a telescope from the next tower.',
    why: 'The first system that could send any message rather than one alarm, and the first to prove the real cost is not the towers but the people who have to sit in them.',
    real: 'Claude Chappe, France, 1794 — Paris to Lille, 230 km, in about half an hour.',
    steps: [
      '2 arms are set to an agreed position. Each position is 1 letter.',
      'Nothing travels but light, so the letter crosses the valley instantly.',
      'The next tower reads the arms through a telescope.',
      'It sets its own arms the same way, and the letter moves one tower on.',
    ],
  },
  {
    id: 'line-of-sight',
    era: 0,
    wiki: 'Line-of-sight propagation',
    name: 'line of sight',
    aliases: ['sight line', 'high ground'],
    what: 'Whether 2 points can see each other, once hills, the curve of the earth and everything standing in between are counted.',
    why: 'It decides which signal fires can answer each other, and later which masts can hear each other. Terrain is the constraint the player cannot argue with.',
    real: 'Radio horizon, which is about a seventh further than the visual one because the atmosphere bends the beam down.',
    steps: [
      'A mast, or a hill, or a pair of eyes — anything that has to see the other end.',
      'Ground in between blocks it. No power and no patience gets around a hill.',
      'And even with nothing in the way, the earth curves: past the horizon there is no line at all.',
    ],
  },

  // --- Era 1: AM radio --------------------------------------------------------
  {
    id: 'am-radio',
    era: 1,
    wiki: 'File:Antique_wooden_AM_radio_manufactured_in_Bharat.jpg',
    name: 'AM radio',
    aliases: ['AM', 'amplitude modulation', 'radio'],
    what: 'Speech carried by varying the strength of a radio wave.',
    why: 'It is the easiest way to send a voice that exists. A receiver needs no power supply and barely any parts, which matters enormously when the people you are trying to reach have neither.',
    real: 'Reginald Fessenden, Christmas Eve 1906 — the first voice ever broadcast, heard by ships off Massachusetts.',
    steps: [
      'Somebody speaks. The microphone turns the air pressure into a small wobbling current.',
      'That wobble is used to make a fast steady wave louder and quieter — the voice rides on the carrier.',
      'The receiver throws the carrier away and keeps the shape it was carrying.',
      'What is left is the wobble again, and a speaker turns it back into air.',
    ],
  },
  {
    id: 'transmitter',
    era: 1,
    wiki: 'Transmitter',
    name: 'transmitter',
    aliases: ['transmitters'],
    what: 'The machine that makes the radio wave and puts the voice on it.',
    why: 'The expensive half of a radio link. A village can be given a receiver; a transmitter has to be built, powered and kept working by somebody who understands it.',
    steps: [
      'An oscillator makes one steady frequency and never stops making it.',
      'A modulator bends that frequency with whatever is being said.',
      'An amplifier makes the result strong enough to be worth radiating.',
      'The antenna turns the current into a wave and lets it go.',
    ],
  },
  {
    id: 'antenna',
    era: 1,
    wiki: 'File:Ketchikan_radio_tower.jpg',
    name: 'radio tower',
    aliases: ['antenna', 'aerial', 'mast', 'masts', 'radio towers'],
    what: 'A tall structure that holds the radio antenna high above the ground.',
    why: 'The one part of a radio you cannot improvise your way around. Height is range, which is why every relay in this game sits on a hill and why the radio tower is the first thing anybody steals.',
    steps: [
      'The current runs up the metal and off the end as a wave.',
      'The length has to match the wave. A mast a quarter of a wavelength tall radiates; a random pole mostly warms up.',
      'The guys hold it against the wind, which is what actually decides whether it is still there next season.',
      'The feed comes in at the bottom, and the earth under it is the other half of the aerial.',
    ],
  },
  {
    id: 'generator',
    era: 1,
    wiki: 'File:Military_engine_generator.jpg',
    name: 'generator',
    aliases: ['generators', 'dynamo'],
    what: 'An engine turning a coil inside a magnet, making electricity.',
    why: 'Nothing else in the era works without it, and it eats fuel every hour it runs. Power, not copper, is what actually limits how long a station can stay on air.',
    steps: [
      'Something turns: water, steam, a diesel, or a person on a pedal.',
      'The turning drags a coil of wire past a magnet.',
      'A wire crossing a magnetic field has a current pushed along it. That is the whole of it.',
      'Out comes alternating current, one cycle per turn.',
    ],
  },
  {
    id: 'battery',
    era: 1,
    wiki: 'File:Photo-CarBattery.jpg',
    name: 'battery',
    aliases: ['batteries', 'truck battery', 'accumulator', 'accumulators'],
    what: 'Lead plates standing in acid. It takes current in when there is some to spare and gives it back at a steady voltage.',
    why: 'The generator only runs while there is fuel, and the bench has to work on the days there is none. Every measurement in this era is made on battery, and so is every transmission nobody could afford to run the engine for.',
    real: 'Gaston Planté, 1859 — the first cell that could be charged again instead of thrown away.',
  },
  {
    id: 'propagation',
    era: 1,
    wiki: 'Skywave',
    name: 'propagation',
    aliases: ['skywave', 'ground wave', 'interference'],
    what: 'How far a radio wave actually gets, which changes with the ground, the weather and the time of day.',
    why: 'Medium-wave AM crawls along the ground by day and bounces off the ionosphere at night, so the same station is local at noon and heard 4 provinces away at midnight. The link that worked yesterday may not work today, and nobody has done anything wrong.',
    real: 'The Kennelly–Heaviside layer, proposed in 1902 and confirmed in 1924.',
    steps: [
      'The mast radiates in every direction at once, including straight up.',
      'The part that goes up would be wasted, at noon.',
      'At night the ionosphere hardens into a mirror and bends it back down, hundreds of kilometres away.',
      'The part that hugs the ground goes further by day and dies in wet soil and hills.',
    ],
  },

  // --- Era 2: telegraph -------------------------------------------------------
  {
    id: 'telegraph',
    era: 2,
    wiki: 'File:Wallace_Study-Telegraph.jpg',
    name: 'telegraph',
    aliases: ['telegraph line', 'telegraph poles', 'poles'],  // and `tiang`, in the Indonesian list
    what: 'A wire between 2 places, and a battery that can push current down it.',
    why: 'Cheaper per kilometre than radio and far harder to jam, but it has to physically exist the whole way — which makes it the first thing the project owns that somebody can walk up to and cut.',
    real: 'Cooke and Wheatstone, 1837; Morse’s line from Washington to Baltimore, 1844.',
    steps: [
      'A battery, sitting at one end, waiting.',
      'The key is a switch. Press it and the circuit is closed.',
      'Current runs the whole length of the line at once — 10 kilometres or 1000, it makes no difference.',
      'At the far end it goes through a coil and the coil becomes a magnet.',
      'The magnet snaps an iron arm down and it clicks. Somebody is listening for that click.',
    ],
  },
  {
    id: 'telegraph-key',
    era: 2,
    wiki: 'Telegraph key',
    name: 'telegraph key',
    aliases: ['key', 'keys', 'keying', 'keyed'],
    what: 'A sprung lever. Pressing it closes the circuit; letting go opens it.',
    why: 'The whole interface. One moving part, no electronics, and anybody can be taught to use it in a week — which is the entire reason a village can be handed one and left to it.',
    steps: [
      'One contact goes to the line and the far end of the world.',
      'Press, and the 2 contacts touch. That is the entire signal: touching or not touching.',
      'A spring lifts it back up the moment the finger leaves, so the gaps are as sharp as the marks.',
      'The other contact goes to the battery. A key is a switch with a good sense of timing.',
    ],
  },
  {
    id: 'morse-code',
    era: 2,
    wiki: 'File:Dots_and_dashes_P_morse_code.svg',
    name: 'Morse code',
    aliases: ['Morse', 'dots and dashes'],
    what: 'Letters written as short and long pulses, with the commonest letters given the shortest codes.',
    why: 'It turns a wire that can only be on or off into something that can carry any sentence. The first time this project encodes language into 2 states — and it does it again in Era 5, and again in Era 7.',
    real: 'Alfred Vail and Samuel Morse, 1838. E is one dot because E is the commonest letter in English.',
    steps: [
      'A short press: 1 unit of current. A dot.',
      'A long press: 3 units. A dash. Only 2 lengths exist, ever.',
      'The gap inside a letter is 1 unit. The silences are as much of the code as the sounds.',
      'A gap of 3 ends the letter and 7 ends the word — which is why 2 operators have to agree on a speed.',
    ],
  },
  {
    id: 'electromagnet',
    era: 2,
    wiki: 'Electromagnet',
    name: 'electromagnet',
    aliases: ['electromagnets', 'coil', 'coils', 'sounder'],
    what: 'Wire wound round iron. Current makes it a magnet; no current, no magnet.',
    why: 'Every part of this era is one of these in a different shape: the sounder that clicks, the relay that repeats, the bell that rings. Learn it once and Era 3’s exchange stops being mysterious.',
    steps: [
      'Current from anywhere: a battery, a dynamo, a line 100 kilometres long.',
      'It goes round and round a coil, and every turn adds to the last.',
      'The coil throws a magnetic field, strong while the current runs and gone the instant it stops.',
      'Iron in that field is pulled. Electricity has been turned into something that moves.',
    ],
  },
  {
    id: 'relay-station',
    era: 2,
    wiki: 'File:Telegraph_relay,_1850s.jpg',
    name: 'relay',
    aliases: ['relays', 'relay station', 'relay stations', 'repeater'],
    what: 'A weak incoming signal works an electromagnet, which closes a fresh circuit with a fresh battery behind it.',
    why: 'It is what makes distance stop mattering: a line as long as you like, as long as you can put one of these every so often. It is also, quietly, the first machine in the game that makes a decision.',
    steps: [
      'The signal arrives faint. 100 kilometres of wire has eaten most of it.',
      'It is still strong enough to move a small magnet, and that is all that is asked of it.',
      'The magnet closes a switch onto a local battery that is fresh and full.',
      'What leaves is a new signal at full strength, in the shape of the old one. Repeat forever.',
    ],
  },

  // --- Era 3: telephone -------------------------------------------------------
  {
    id: 'telephone',
    era: 3,
    wiki: 'Telephone',
    name: 'telephone',
    aliases: ['telephones', 'phone', 'phones', 'calls'],
    what: 'A microphone and an earpiece on the same wire, so 2 people can simply talk.',
    why: 'It removes the operator, and with them the last person who had to be trained before 2 villages could speak. Communication stops being a message and becomes a conversation.',
    real: 'Alexander Graham Bell, 1876 — patented hours before Elisha Gray filed for much the same thing.',
    steps: [
      'A voice: air, pushed in waves against a thin metal sheet.',
      'The sheet presses on carbon grains. Squeezed hard they carry current easily; loose they resist it.',
      'A battery pushes a steady current through those grains, and the squeezing makes it wobble in the shape of the voice.',
      'The wobbling current goes down the line. It is not sound any more, it is the shape of sound.',
      'At the far end it goes round a coil and the coil pulls a second thin sheet, harder and softer.',
      'The sheet pushes air, and the air is a voice again. Nothing was carried down the wire but a shape.',
    ],
  },
  {
    id: 'switchboard',
    era: 3,
    wiki: 'Telephone switchboard',
    name: 'switchboard',
    aliases: ['switchboards', 'switchman'],
    what: 'A panel of sockets and patch cords. An operator hears who you want and joins the 2 lines by hand.',
    why: 'It is what lets 100 lines reach each other without 10,000 wires. It also puts one person in the middle of every private conversation in the province, which is the political problem this whole era is about.',
    steps: [
      'Every line in the town ends in a hole on this board. A lamp says who is asking.',
      'A cord with a plug on each end. Both ends go in and the 2 lines are 1 line.',
      'The line being called, which until this moment had nothing to do with the caller.',
      'A person, who hears every word and remembers every name. The first router was somebody’s job.',
    ],
  },
  {
    id: 'exchange',
    era: 3,
    wiki: 'Telephone exchange',
    name: 'exchange',
    aliases: ['exchanges', 'central office'],
    what: 'The building the switchboards live in, and everything that decides which line reaches which.',
    why: 'Whoever holds the exchange holds the network: the queue, the price, the order people are told things in. Handing one over is the hardest thing the project ever does on purpose.',
    steps: [
      'Wire everybody to everybody and 5 people need 10 wires. 100 people need 4950.',
      'Wire everybody to 1 building instead and 100 people need 100 wires.',
      'The building decides who is joined to whom, moment by moment. Every network since is this shape.',
    ],
  },
  {
    id: 'strowger',
    era: 3,
    wiki: 'Strowger switch',
    name: 'step-by-step switch',
    aliases: ['Strowger', 'automatic exchange', 'rotary'],
    what: 'A rotating contact arm that steps one position for each pulse the dial sends, connecting the call without an operator.',
    why: 'The first machine to take a human out of the middle of a conversation — and it was invented by an undertaker who was convinced the local operator was sending his customers to a rival.',
    real: 'Almon Strowger, 1891. The story about the undertaker is true.',
    steps: [
      'The dial does not send a number. It sends that many breaks in the current.',
      'Each break is 1 pulse. Dial 5 and the line goes dead 5 times, quickly.',
      'A magnet steps an arm up 1 notch per pulse.',
      'The arm stops on the contact you dialled, and you are connected. Nobody heard it happen.',
    ],
  },
  {
    id: 'standard',
    era: 3,
    wiki: 'File:Rjxx.jpg',
    name: 'standard',
    aliases: ['standards', 'the standard'],
    what: 'A written rule that everybody’s equipment follows, so equipment nobody coordinated still works together.',
    why: 'It is the only kind of control that survives giving the hardware away. The project keeps the standard and hands over everything else — and that decision, made here, is what Era 8 finally cashes in.',
    steps: [
      'Equipment built by one workshop, in one town, to its own taste.',
      'A sheet of paper that says what the plug is, what the voltage is, and what the tone means.',
      'Equipment built by somebody who never met them, 200 kilometres away, that works the first time.',
    ],
  },

  // --- Era 4: electronics -----------------------------------------------------
  {
    id: 'vacuum-tube',
    era: 4,
    wiki: 'File:IBMVacuumTubeModule.jpg',
    name: 'vacuum tube',
    aliases: ['valve', 'valves', 'tube', 'tubes'],
    what: 'A heated wire boils electrons across an evacuated glass envelope, and a third electrode in between controls how many get across.',
    why: 'The first component that can amplify — make a small signal into a big one — and the first that can switch without anything moving. Every amplifier, oscillator and logic gate in the next 2 eras is built out of these.',
    real: 'Lee de Forest’s Audion, 1906. He did not fully understand why it worked. IBM built whole computers out of these — the 700 series of the 1950s, thousands of valves plugged in as modules, a room of them to do what one chip does now.',
    steps: [
      'A heater, glowing. It does nothing but make the metal next to it hot.',
      'The hot metal boils electrons off its surface — but only into a vacuum, which is why the glass matters.',
      'A wire mesh sits in their path. A tiny voltage on it lets many through or almost none.',
      'The electrons that get past land on the plate.',
      'So a whisper on the mesh becomes a shout on the plate. That is amplification, and everything electronic starts here.',
    ],
  },
  {
    id: 'glassblowing',
    era: 4,
    wiki: 'Glassblowing',
    name: 'glassblowing',
    aliases: ['glass', 'glassblower'],
    what: 'Shaping molten glass by breath and hand, to a tolerance the same every time.',
    why: 'A valve is a glass problem before it is an electrical one. This is where the project stops scavenging and starts manufacturing, and it turns out the hard part is not the physics.',
    steps: [
      'A furnace hot enough to make sand behave like honey.',
      'Somebody who can shape it by breath and rotation, and who took 10 years to learn that.',
      'A pump takes the air out. A tube with air in it is a light bulb that does not light.',
      'Sealed while still soft, and the vacuum is trapped for 40 years.',
    ],
  },
  {
    id: 'sulphuric-acid',
    era: 4,
    wiki: 'File:Sulphuric_acid_96_percent_extra_pure.jpg',
    name: 'sulphuric acid',
    aliases: ['acid'],
    what: 'The most-produced industrial chemical there is, and the one everything else needs.',
    why: 'Batteries, cleaning glass, and later etching silicon. A country’s ability to make it is close to a measure of whether it has an industry at all — which is why nobody here has made it to specification in 18 years.',
    real: 'The lead chamber process, 1746; the contact process, 1831.',
    steps: [
      'A plate of lead.',
      'A plate of lead dioxide. 2 different metals is the whole requirement.',
      'Acid between them. It attacks both, and the reaction pulls electrons off one plate and onto the other.',
      'That imbalance is a voltage, and it is there whether anybody is using it or not.',
    ],
  },
  {
    id: 'oscillator',
    era: 4,
    wiki: 'File:Dynatron_signal_generator_1931.jpg',
    name: 'oscillator',
    aliases: ['oscillators', 'carrier'],
    what: 'A circuit that feeds its own output back into itself and settles into a steady tone at one frequency.',
    why: 'It is the beat everything else runs on: the carrier a radio rides, the clock a computer counts, the tone a modem speaks in. Nothing after this era works without something ticking.',
    steps: [
      'A circuit that rings at 1 frequency, the way a bell has 1 note.',
      'An amplifier, which makes anything at its input bigger at its output.',
      'Feed the output back into the input. The ringing feeds itself and never dies away.',
      'Out comes a steady tone that nobody has to keep pushing. Every transmitter needs one.',
    ],
  },
  {
    id: 'amplifier',
    era: 4,
    wiki: 'File:Vacuum_tube_HF300_shortwave_RF_power_amplifier_from_1938.jpg',
    name: 'amplifier',
    aliases: ['amplifiers', 'amplify', 'amplifies'],
    what: 'A small signal controlling a large power supply, so the shape survives and the strength grows.',
    why: 'It is what makes long distance possible without a person in the middle. A relay repeats a message; an amplifier repeats a voice, and the difference is the whole telephone network.',
    steps: [
      'A weak signal. Too weak to hear, to send, or to do anything with.',
      'A power supply, which is where all the loudness actually comes from.',
      'A valve in the middle, letting the weak signal decide how much of that power gets through.',
      'Out comes the same shape, much bigger. Nothing was added to the signal but size.',
    ],
  },

  // --- Era 5: the first machine -----------------------------------------------
  {
    id: 'logic-gate',
    era: 5,
    wiki: 'File:Bell_Labs_Model_V_relay_computer.jpg',
    name: 'logic gate',
    aliases: ['gate', 'gates', 'logic', 'and gate', 'or gate'],
    what: 'Switches wired so that the current arriving at the far end answers a question about the switches.',
    why: 'It is the whole of what a computer is made of, and there are only 3 of them. A relay was already sitting on every telegraph pole in the region for 14 years before anybody wired 2 of them in a row and noticed they had built arithmetic.',
    real: 'Relay machines came first: Zuse’s Z3 in 1941, and Bell Labs’ Model V in 1946 — 9,000 relays out of telephone exchange stock. Valves did the same job with nothing moving, which is why ENIAC beat them by a factor of 1,000.',
    steps: [
      '2 switches in a line. The lamp lights only if both are closed — that is "and".',
      'The same 2 switches side by side. The lamp lights if either one is closed — that is "or".',
      'One switch wired to break the circuit when it is fed instead of making it — that is "not".',
      'There is no fourth. Every sum, every comparison and every decision a machine ever makes is those 3, repeated.',
    ],
  },
  {
    id: 'binary',
    era: 5,
    wiki: 'Binary number',
    name: 'binary',
    aliases: ['bit', 'bits', 'binary logic', 'ones and zeroes'],
    what: 'Everything written in 2 states, because 2 states is what a wire, a switch or a magnet can reliably hold.',
    why: 'Morse already did this with dots and dashes. The machine does it with voltages, and the only real change is that nobody has to be listening.',
    real: 'Leibniz described it in 1703; Shannon showed in 1937 that it was the same thing as logic.',
    steps: [
      'Voltage present. Call it 1.',
      'Voltage absent. Call it 0. There is deliberately no third choice.',
      'Both ends agree how long 1 bit lasts, so a run of 3 zeroes is not mistaken for silence.',
      'Group them and they are a number, a letter, or an instruction. Everything after this is bookkeeping.',
    ],
  },
  // --- Era 6: computing -------------------------------------------------------
  {
    id: 'core-memory',
    era: 6,
    wiki: 'Magnetic-core memory',
    name: 'core memory',
    aliases: ['ferrite core', 'ferrite cores', 'cores', 'magnet that remembers'],
    what: 'A grid of tiny iron rings on threaded wires. Each ring is magnetised one way or the other, and stays that way with the power off.',
    why: 'Memory that survives losing power — which is exactly what the machines pulled out of ruins did not have, and why they came back empty. It was also woven by hand, ring by ring, by people paid to be patient.',
    real: 'MIT’s Whirlwind, 1953. Apollo flew on it.',
    steps: [
      'A grid of wires, with a tiny iron ring threaded on every crossing. 1 ring is 1 bit.',
      'Send half the current a ring needs down 1 wire, and half down the wire that crosses it.',
      'Only the ring at the crossing gets enough to flip. Which way it points is the bit.',
      'Cut the power and it still points that way. This is memory that survives a blackout, woven by hand.',
    ],
  },
  {
    id: 'punched-card',
    era: 6,
    wiki: 'Punched card',
    name: 'punched card',
    aliases: ['punched cards', 'punch card', 'punch cards', 'paper tape'],
    what: 'Stiff card with holes in agreed positions. A hole is a one, no hole is a zero, and a machine reads it by feeling for the light.',
    why: 'A program you can hold, correct with a pencil, post to another town and read back in 40 years. In a place with no disks and no reliable power, information on paper is not a step backwards.',
    real: 'Herman Hollerith, for the 1890 US census — borrowed from the Jacquard loom of 1804.',
    steps: [
      'One corner is cut, so a stack that has been dropped can be put back the right way round.',
      'A hole is a 1. Card where a hole could have been is a 0. You can hold a program up to the light.',
      'Brushes, or light, read a whole column at once as the card is pulled through.',
      'Out comes a row of bits, and the machine has been told something by a piece of paper.',
    ],
  },
  {
    id: 'routing-table',
    era: 6,
    wiki: 'Routing table',
    name: 'routing table',
    aliases: ['routing tables'],
    what: 'A list, held in the machine, of which way to send a message for each place it might be going.',
    why: 'The moment the network stops needing a person to know the map. Hold the message, look up the destination, decide the next hop — that is Era 7 already, running on Era 6’s hardware.',
    steps: [
      'A message arrives at a node that has no idea where its destination is.',
      'It does not need to. It looks the address up in a table it keeps locally.',
      'The table says 1 thing: which of my lines gets it closer.',
      'Send it that way and forget it. Every node doing only this adds up to a route nobody planned.',
    ],
  },
  {
    id: 'modem',
    era: 6,
    wiki: 'Modem',
    name: 'modem',
    aliases: ['modems'],
    what: 'A device that turns bits into tones a telephone line will carry, and turns them back at the far end.',
    why: 'It lets the network the project already built — wire strung for voices — carry data without a single new pole. Reusing what exists is the whole discipline of this game.',
    real: 'Bell 103, 1962. 300 bits per second, over an ordinary phone call.',
    steps: [
      'Bits out of a machine: square, sharp, and completely unable to travel on a voice line.',
      'So make them tones instead. 1 pitch means 1, another pitch means 0.',
      'The phone line carries them as if somebody were singing 2 notes very fast, which is all it knows how to do.',
      'The far modem listens for the same 2 pitches.',
      'And turns them back into square, sharp bits. Modulate, demodulate — that is the whole name.',
    ],
  },
  {
    id: 'microcomputer',
    era: 6,
    wiki: 'Radio-86RK',
    name: 'microcomputer',
    aliases: ['microcomputers', 'single-board computer'],
    what: 'A whole computer built to a published design small enough to reproduce: a salvaged processor, memory it keeps, a keypad and a screen, on one board.',
    why: 'The moment a bare salvaged chip becomes a machine a person can use and a second workshop can copy. Built from a design the old world printed complete, on purpose — which is the argument Era 8 finishes when it publishes everything the project knows.',
    real: 'The Radio-86RK, printed in full in Radio magazine, 1986, so readers could build their own. Its processor was the KR580VM80A — a Soviet copy of the Intel 8080.',
  },

  // --- Era 7: packet networks -------------------------------------------------
  {
    id: 'packet-switching',
    era: 7,
    wiki: 'Packet switching',
    name: 'packet switching',
    aliases: ['packet', 'packets'],
    what: 'Chop the message into small labelled pieces, send each one separately, and reassemble at the far end.',
    why: 'A dedicated line between every pair of towns cannot scale and cannot survive a cut. Packets share every line and route around damage — which is exactly why the idea was funded in the first place.',
    real: 'Paul Baran and Donald Davies arrived at it separately, 1964–65.',
    steps: [
      'A message. It could be 1 line or 1000.',
      'Cut it into small pieces and number them. Each piece carries its own address.',
      'Each piece takes whatever road is free at that instant, so they do not all arrive by the same route or in order.',
      'The far end sorts them by number and the message is whole again. A cut line loses a packet, not a conversation.',
    ],
  },
  {
    id: 'addressing',
    era: 7,
    wiki: 'IP address',
    name: 'addressing',
    aliases: ['address', 'addresses'],
    what: 'Every destination has a name the machines agree on, written on every packet.',
    why: 'Without it a router has nothing to decide with. It sounds like bookkeeping and it is the reason a message can reach a town nobody along the way has heard of.',
    steps: [
      'Where it is going. Every node on the way reads only this.',
      'Where it came from, so there is somewhere to send the answer and somewhere to send the complaint.',
      'Which piece of the message this is, and how many there are, so the far end can tell what is missing.',
      'The message itself, which no node in between ever needs to look at.',
    ],
  },
  {
    id: 'error-correction',
    era: 7,
    wiki: 'Error detection and correction',
    name: 'error correction',
    aliases: ['checksum', 'checksums', 'parity'],
    what: 'Extra bits sent alongside the message, chosen so the receiver can tell whether the rest arrived intact — and sometimes repair it.',
    why: 'The lines are salvaged, the weather is bad and nobody is going to rebuild them. Assume corruption, detect it, ask again. It is cheaper than perfect wire and always was.',
    real: 'Richard Hamming, 1950, after losing a weekend of computer time to a card reader.',
    steps: [
      'The bits you actually wanted to send.',
      'Plus a few extra, worked out from the others. They carry no news; they exist to be checked.',
      'Somewhere on the way, noise flips a bit. Nothing announces this. Nothing ever does.',
      'The check no longer matches, so the far end knows the block is wrong and asks for it again.',
    ],
  },
  {
    id: 'integrated-circuit',
    era: 7,
    wiki: 'File:Extron_DMP_128_-_board_-_Microchip_24LC512-9701.jpg',
    name: 'integrated circuit',
    aliases: ['chip', 'chips', 'silicon'],
    what: 'A whole circuit — thousands of components and the wiring between them — made at once on a single sliver of silicon.',
    why: 'The drawer full of these is what the network runs on, and there is no more where they came from. The die itself survives burial for decades; it is everything around it that dies.',
    real: 'Jack Kilby and Robert Noyce, 1958–59.',
    steps: [
      'A disc of silicon, polished flat enough that a scratch would be a mountain.',
      'The whole surface is patterned at once, in 1 operation, not part by part.',
      'Cut it up and each square is a complete circuit — thousands of parts, already wired to each other.',
      'Put legs on it and it is 1 component. Making 10 000 costs barely more than making 1.',
    ],
  },
  {
    id: 'electrolytic-capacitor',
    era: 7,
    wiki: 'Electrolytic capacitor',
    name: 'electrolytic capacitor',
    aliases: ['capacitor', 'capacitors'],
    what: 'A capacitor whose insulating layer is held in place by a wet chemical paste.',
    why: 'The paste dries out whether the thing is used or not. It is the single commonest reason a piece of pre-war electronics does not work, and the reason “we found a board” is never the same as “we found a working board”.',
    steps: [
      'A can, wound tight, holding 2 long strips of foil rolled up with paper between them.',
      'The foils never touch. A film thinner than a wavelength of light separates them.',
      'Charge piles up on 1 foil and is missing from the other. That imbalance is what smooths a power supply.',
      'The film is grown by the current itself and dries out with age — so this is the part that fails first, in everything.',
    ],
  },

  // --- Era 8: internetworking -------------------------------------------------
  {
    id: 'protocol',
    era: 8,
    wiki: 'File:TCPIP_Model.jpg',
    name: 'protocol',
    aliases: ['protocols', 'frame format'],
    what: 'The agreed rules for what a message looks like and what each side does next.',
    why: 'The final breakthrough of the whole game is not a machine. 2 networks nobody built together can carry each other’s traffic if, and only if, they have agreed on this.',
    steps: [
      'One end says: I want to talk, and here is where I am starting from.',
      'The other end answers: heard you, and here is where I am starting from.',
      'The first end confirms, and only now does anything real get sent.',
      'And both sides already agreed what to do when the answer never comes, which is the half that makes it work.',
    ],
  },
  {
    id: 'internetworking',
    era: 8,
    wiki: 'Internetworking',
    name: 'internetworking',
    aliases: ['internet', 'router', 'routers', 'gateway'],
    what: 'Networks that do not know anything about each other, joined by machines at their edges that translate between them.',
    why: 'It is what stops the project from having to own everything. Every province can build its own network, badly, in its own way — and it still connects.',
    real: 'Vint Cerf and Bob Kahn, 1974. The paper is 9 pages long.',
    steps: [
      'One network, with its own wires, its own speeds and its own rules.',
      'A gateway, which is not asked to understand either network fully.',
      'It only has to agree on the envelope: the address on the outside, and nothing about the inside.',
      'Another network that shares none of the first one’s equipment, now reachable anyway.',
    ],
  },
  {
    id: 'photolithography',
    era: 8,
    wiki: 'File:Cleanroom_-_photolithography_lab_(9150555748).jpg',
    name: 'photolithography',
    aliases: ['fab', 'wafer', 'wafers', 'furnace'],
    what: 'Printing a circuit onto silicon with light, then etching away what the light did not protect, dozens of times over.',
    why: 'It is the only way to make chips rather than find them, and it needs a clean room, pure water, gases and a supply chain across 9 provinces. The project spends its last decade on it because a network running on rationed scrap belongs to whoever holds the rations.',
    real: 'Jules Andrus at Bell Labs, 1955.',
    steps: [
      'A mask: the pattern of the circuit, drawn once, very large, then shrunk.',
      'Light through the mask, so the pattern lands on the wafer as light and shadow.',
      'The wafer is coated in a resist that changes where the light hit it.',
      'Wash the rest away, and the drawing is now standing on the silicon in chemicals.',
      'Etch, and the drawing is in the silicon itself. Repeat 30 times and it is a chip.',
    ],
  },
  {
    id: 'one-bit-machine',
    era: 8,
    wiki: 'File:KL_Intel_P8051.jpg',
    name: 'one-bit machine',
    aliases: ['one bit wide', 'one bit at a time', 'MC14500B', 'MC14500', '8051', 'Intel 8051'],
    what: 'A processor that handles a single bit at a time — one input, one output, a handful of instructions.',
    why: 'Embarrassing next to anything in the drawer, and it does not matter: it is the first one they can make again tomorrow. Enough to run a router, which is all a network boundary needs.',
    real: 'Motorola’s MC14500B, 1977 — a genuine one-bit industrial control unit with 16 instructions. The Intel 8051 of 1980 is the other ancestor: a whole small computer on one chip, still in production today.',
    steps: [
      'Memory: a list of instructions, and the machine reads exactly 1 of them.',
      'It fetches that 1 instruction. There is no queue and nothing happening in parallel.',
      'It does 1 bit of arithmetic. Not 32, not 8. One.',
      'It writes the answer back and moves to the next line. Slow is not the same as incapable.',
    ],
  },
  {
    id: 'open-standard',
    era: 8,
    wiki: 'File:IPv4_RFC_791_first_page.png',
    name: 'published standard',
    aliases: ['publish it', 'published'],
    what: 'The rules written down and given away, including the parts that did not work.',
    why: 'The project’s last act and its only durable defence. A network nobody can be locked out of is not worth capturing, and a standard everybody already implements cannot be taken back.',
    real: 'The RFC series, from 1969 — titled “Request for Comments” because its authors were not sure they were allowed to write it.',
    steps: [
      'The rules, written down in full: what the plug is, what the bits mean, what happens when it goes wrong.',
      'Copied, and given away to anybody who asks, for nothing.',
      'So anybody can build a machine that joins the network without permission from whoever built it first.',
      'Including the attempts that failed, written down too — which is how the next builder avoids the same 3 years.',
    ],
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

/** The glossary in the player's language, by id. Built once per language. */
const MAPS = new Map<Lang, Map<string, Term>>()

export function termMap(lang: Lang): Map<string, Term> {
  let map = MAPS.get(lang)
  if (!map) {
    map = new Map(termsIn(lang).map((t) => [t.id, t]))
    MAPS.set(lang, map)
  }
  return map
}

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
