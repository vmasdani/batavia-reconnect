/**
 * The MOVE machine: one instruction, and no decoder worth the name.
 *
 * This is the processor for the era when the drawer runs out. The MC14500B next
 * door is a real chip from 1977, and a town that cannot make chips cannot make
 * another one. So the question is what is left when you delete everything that
 * needs a fab, and the answer is this: a machine whose only instruction is
 * `MOVE source, destination`.
 *
 * **Operations become places.** There is no AND instruction. There is an AND
 * *port*, and moving a bit into it ands that bit with the accumulator. Jumping
 * is moving an address into `PC`. A conditional is moving a bit into `SKZ`.
 * The entire instruction decoder is therefore two address decoders — the same
 * part twice — and a decoder is a diode matrix, which is to say a board with
 * diodes soldered onto it by somebody with a steady hand.
 *
 * Parts: a counter for `PC`, a program store, two decoders, one flip-flop for
 * the accumulator, and the board in `onebit.ts`. Every one of those is buildable
 * from gates, and Era 4 already makes valves. That is the whole argument.
 *
 * **It has XOR.** The MC14500B does not, and its adder pays for that in two
 * extra instructions per bit. This machine's logic unit is built here rather
 * than bought, so it has the gate the chip's designers left out — the clearest
 * illustration in the game of what "make, not find" actually buys you.
 */

import {
  AssemblyError,
  BOARD_PINS,
  newBoard,
  readPin,
  writePin,
  type Arch,
  type Board,
  type Compiled,
  type Line,
  type Pin,
  type Session,
} from './onebit'
import { addition, counting } from './mc14500'

/**
 * Where a bit can come from.
 *
 * Every board pin that can be read, plus the accumulator and its complement.
 * `NACC` costs nothing — it is the other side of the same flip-flop — and it
 * saves the machine ever needing a NOT instruction.
 */
export const SOURCES: Pin[] = [
  ...BOARD_PINS.filter((pin) => pin.kind !== 'out'),
  { name: 'ACC', kind: 'bit', what: 'The accumulator: one flip-flop, and the only state the processor has.' },
  { name: 'NACC', kind: 'in', what: 'The other side of the accumulator flip-flop. A free NOT.' },
]

/**
 * Where a bit can go, and what happens when it arrives.
 *
 * The four at the top are the logic unit. The rest are the board, plus the two
 * that steer the machine: an address into `PC` is a jump, a bit into `SKZ` is
 * an if.
 */
export const DESTINATIONS: { name: string; what: string }[] = [
  { name: 'ACC', what: 'Load: the accumulator takes the bit.' },
  { name: 'AND', what: 'The accumulator becomes itself AND the bit.' },
  { name: 'OR', what: 'The accumulator becomes itself OR the bit.' },
  { name: 'XOR', what: 'The accumulator becomes itself XOR the bit. The chip next door has no gate for this.' },
  { name: 'C', what: 'The carry flip-flop takes the bit.' },
  { name: 'T', what: 'Scratch takes the bit.' },
  { name: 'G', what: 'Scratch takes the bit.' },
  { name: 'S', what: 'The bit waiting to be shifted into SUM.' },
  { name: 'AIN', what: 'The bit waiting to be shifted into the top of A.' },
  { name: 'SHIFT', what: 'A 1 here pulses the shift registers.' },
  { name: 'HALT', what: 'A 1 here stops the clock.' },
  { name: 'SKZ', what: 'Skip the next instruction if the bit is 0. The whole of conditional execution.' },
  { name: 'PC', what: 'A jump: the source is a label, and the machine carries on from there.' },
]

const SOURCE_NAMES = new Set(SOURCES.map((pin) => pin.name))
const DESTINATION_NAMES = new Set(DESTINATIONS.map((port) => port.name))
/** Destinations that are the logic unit rather than a place to put a bit. */
const LOGIC = new Set(['ACC', 'AND', 'OR', 'XOR'])

interface Instruction extends Line {
  /** The pin the bit comes from, or the label being jumped to when `to` is PC. */
  from: string
  to: string
  /** Where a jump lands. -1 for everything that is not a jump. */
  target: number
}

/**
 * Assemble `MOVE source, destination`.
 *
 * The `MOVE` is optional and so is the comma, because after the third line
 * every one of them says MOVE and the word stops carrying information. An arrow
 * is accepted too: `A0 -> ACC` is how transport-triggered code is normally
 * written down, and it is the clearest thing to read.
 */
export function assemble(source: string): Compiled {
  const labels = new Map<string, number>()
  const pending: { from: string; to: string; text: string; line: number }[] = []

  source.split('\n').forEach((raw, i) => {
    const line = i + 1
    let rest = raw.replace(/;.*$/, '').trim()
    if (!rest) return

    const marked = /^([A-Za-z_]\w*)\s*:\s*(.*)$/.exec(rest)
    if (marked) {
      const label = marked[1].toLowerCase()
      if (labels.has(label)) throw new AssemblyError(`label "${label}" is already used`, line)
      labels.set(label, pending.length)
      rest = marked[2].trim()
      if (!rest) return
    }

    const words = rest
      .replace(/^move\s+/i, '')
      .split(/\s*(?:,|->)\s*|\s+/)
      .filter(Boolean)
    if (words.length !== 2) {
      throw new AssemblyError(
        words.length < 2
          ? 'every instruction is a move: a source and a destination'
          : `"${rest}" is not a move — this machine has one instruction and it takes 2 addresses`,
        line,
      )
    }
    pending.push({ from: words[0], to: words[1].toUpperCase(), text: rest, line })
  })

  const code = pending.map(({ from, to, text, line }): Instruction => {
    if (!DESTINATION_NAMES.has(to)) throw new AssemblyError(`nothing to move to called "${to}"`, line)
    if (to === 'PC') {
      const target = labels.get(from.toLowerCase())
      if (target === undefined) throw new AssemblyError(`no label called "${from}" to jump to`, line)
      return { from, to, target, text, line }
    }
    const name = from.toUpperCase()
    if (!SOURCE_NAMES.has(name)) throw new AssemblyError(`nothing to move from called "${from}"`, line)
    return { from: name, to, target: -1, text, line }
  })

  return { code, start: (a, b) => session(code, a, b) }
}

function session(code: Instruction[], a: number, b: number): Session {
  const board: Board = newBoard(a, b)
  let acc = false
  let skip = false
  let pc = 0
  let clocks = 0

  const clock = () => {
    if (board.halted) return
    const instruction = code[pc]
    if (!instruction) {
      board.halted = true
      return
    }

    pc += 1
    clocks += 1
    if (skip) {
      skip = false
      return
    }

    // A jump reads no source at all: the address is in the instruction, which
    // is the only asymmetry in the machine and the reason PC is a destination
    // rather than a register you can read.
    if (instruction.to === 'PC') {
      pc = instruction.target
      return
    }

    const bit = instruction.from === 'ACC' ? acc : instruction.from === 'NACC' ? !acc : readPin(board, instruction.from)

    if (LOGIC.has(instruction.to)) {
      acc = instruction.to === 'ACC' ? bit : instruction.to === 'AND' ? acc && bit : instruction.to === 'OR' ? acc || bit : acc !== bit
      return
    }
    if (instruction.to === 'SKZ') {
      skip = !bit
      return
    }
    writePin(board, instruction.to, bit)
  }

  return {
    clock,
    view: () => ({
      pc,
      clocks,
      cycles: clocks,
      halted: board.halted,
      board,
      lamps: [
        { label: 'ACC', on: acc, hint: 'The accumulator. One flip-flop, and the only state the processor has.' },
        { label: 'C', on: board.bits.C ?? false, hint: 'The carry, kept on the board between passes.' },
        { label: 'SKIP', on: skip, hint: 'The next instruction will be fetched and thrown away.' },
        { label: 'HALT', on: board.halted, hint: 'The program stopped the clock.' },
      ],
    }),
  }
}

/**
 * The same addition as next door, in a machine with one instruction.
 *
 * Shorter than the MC14500B's version, and the reason is one gate: this board
 * has an XOR port, so a sum bit is a move rather than an XNOR and a complement
 * store. Read the two listings side by side — that difference is the entire
 * argument for building your own logic unit instead of hunting for a chip.
 */
export const ADDER = `; 4-bit adder. One instruction: MOVE source, destination.
; Operations are places here — moving a bit into XOR xors it into the accumulator.

loop:  DONE  -> SKZ      ; out of bits? no -> skip the jump below
       stop  -> PC

       A0    -> ACC
       B0    -> XOR      ; ACC = A xor B
       ACC   -> T
       C     -> XOR      ; ACC = A xor B xor carry
       ACC   -> S        ; the sum bit for this pass

       A0    -> ACC
       B0    -> AND      ; ACC = A and B
       ACC   -> G
       C     -> ACC
       T     -> AND      ; ACC = carry and (A xor B)
       G     -> OR       ; ACC = A.B + carry.(A xor B)
       ACC   -> C

       ONE   -> SHIFT    ; move A and B down, move the sum bit in
       loop  -> PC

stop:  ONE   -> HALT
`

/**
 * Count: add 1 to A, for ever.
 *
 * A is wired as a ring — what falls off the bottom is pushed back in at the top
 * through AIN — so after 4 shifts the word is back where it started, one
 * greater. ROUND is the board saying that moment has arrived, and the carry is
 * set again to add the next 1.
 */
export const COUNTER = `; Add 1 to A over and over, in a machine with one instruction.
; A is a ring: what falls off the bottom goes back in at the top through AIN.

       ONE   -> C        ; the 1 being added

loop:  A0    -> ACC
       C     -> XOR
       ACC   -> AIN      ; next bit of A = A0 xor carry

       A0    -> ACC
       C     -> AND
       ACC   -> C        ; carry on to the next bit

       ONE   -> SHIFT
       ROUND -> SKZ      ; whole word back where it started?
       ONE   -> C        ; yes -> start the next +1
       loop  -> PC
`

export const MOVE: Arch = {
  id: 'move',
  // Valves and relays, wound and blown in a shed. A tenth of a millisecond per
  // instruction is generous for that, and it is the price of owning the design.
  hz: 10_000,
  rate: '10 kHz — valves and relays, made here rather than found.',
  words: [
    { name: 'MOVE src, dst', what: 'The instruction. There is one, and this is it. Written src -> dst as often as not.' },
    { name: 'ACC, NACC', what: 'Sources as well as state: the accumulator, and the other side of the same flip-flop.' },
    ...DESTINATIONS.map((port) => ({ name: `-> ${port.name}`, what: port.what })),
  ],
  // The board, same as the chip next door. The accumulator is a lamp rather
  // than a pin here: it is inside the processor, not addressable memory.
  pins: BOARD_PINS,
  assemble,
  programs: [
    { id: 'adder', source: ADDER, summary: addition },
    { id: 'counter', source: COUNTER, summary: counting },
  ],
}
