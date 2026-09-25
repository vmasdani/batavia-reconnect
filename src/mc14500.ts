/**
 * A Motorola MC14500B: 16 instructions, one bit of state.
 *
 * Era 7's glossary entry names this chip — a real 1-bit industrial control unit
 * from 1977. The game says the survivors could build one again, and this is
 * that claim running, so it can be checked rather than believed.
 *
 * **What the chip is.** One bit of state, the result register `rr`, and 16
 * opcodes that combine it with one addressed bit of memory. No accumulator
 * wider than a bit, no arithmetic unit, no stack — and no program counter: the
 * real chip puts an address on its pins and expects the board to hold a counter
 * and a ROM. So `pc` here belongs to the board, not the chip, and `JMP` is that
 * board's address latch being loaded. Every real MC14500 design worked this way.
 *
 * **No XOR.** The instruction set has `XNOR` and no `XOR`, which is the shape of
 * every program written for it: compute the complement of what you want, and
 * store it with `STOC`. That single missing gate is the clearest demonstration
 * of what "one bit at a time" costs, and it is why the MOVE machine next door —
 * whose logic unit the project builds itself — has an XOR port and this does not.
 *
 * The board it drives is in `onebit.ts` and is shared with that machine.
 * `npm run check:onebit` proves the arithmetic without a browser.
 */

import {
  AssemblyError,
  BOARD_PINS,
  PASSES,
  WIDTH,
  newBoard,
  readPin,
  valueOf,
  writePin,
  type Arch,
  type Board,
  type Compiled,
  type Line,
  type Session,
  type View,
} from './onebit'

/** The 16 opcodes, in their real numeric order. */
export const OPS = [
  'NOPO',
  'LD',
  'LDC',
  'AND',
  'ANDC',
  'OR',
  'ORC',
  'XNOR',
  'STO',
  'STOC',
  'IEN',
  'OEN',
  'JMP',
  'RTN',
  'SKZ',
  'NOPF',
] as const

export type Op = (typeof OPS)[number]

/** What each instruction does, in one line, for the panel that lists them. */
export const OP_HELP: Record<Op, string> = {
  NOPO: 'Nothing. Pulses the O flag, which a board can use as a marker.',
  LD: 'rr ← the addressed bit.',
  LDC: 'rr ← NOT the addressed bit.',
  AND: 'rr ← rr AND the bit.',
  ANDC: 'rr ← rr AND NOT the bit.',
  OR: 'rr ← rr OR the bit.',
  ORC: 'rr ← rr OR NOT the bit.',
  XNOR: 'rr ← 1 when rr and the bit agree. There is no XOR; this and STOC are how you get one.',
  STO: 'Write rr to the addressed pin, if outputs are enabled.',
  STOC: 'Write NOT rr to the pin. The other half of the missing XOR.',
  IEN: 'Inputs enabled ← the bit. While 0, every read comes back 0.',
  OEN: 'Outputs enabled ← the bit. While 0, every write is dropped.',
  JMP: 'Load the address latch: the board carries on from there.',
  RTN: 'Return, and skip the instruction after it.',
  SKZ: 'Skip the next instruction when rr is 0.',
  NOPF: 'Nothing. Pulses the F flag.',
}

const PIN_INDEX = new Map(BOARD_PINS.map((pin, i) => [pin.name, i]))
const OP_SET = new Set<string>(OPS)
/** Opcodes that address memory. The rest ignore their operand entirely. */
const NEEDS_PIN = new Set<string>(['LD', 'LDC', 'AND', 'ANDC', 'OR', 'ORC', 'XNOR', 'STO', 'STOC', 'IEN', 'OEN'])

interface Instruction extends Line {
  op: Op
  /** Pin index, or an instruction address for JMP. */
  operand: number
}

/** The chip's own state, plus the board's program counter. */
interface Cpu {
  rr: boolean
  /** Set by SKZ and RTN: the next instruction is fetched and thrown away. */
  skip: boolean
  ien: boolean
  oen: boolean
  pc: number
  flagO: boolean
  flagF: boolean
}

/**
 * Assemble source into instructions.
 *
 * Two passes, because a program with no forward jump is a program with no loop.
 * Errors carry a line number and say what was expected: a simulator you cannot
 * mistype into teaches nobody anything.
 */
export function assemble(source: string): Compiled {
  const labels = new Map<string, number>()
  const pending: { op: Op; word: string; text: string; line: number }[] = []

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

    const [word, operand, extra] = rest.split(/\s+/)
    const op = word.toUpperCase()
    if (!OP_SET.has(op)) throw new AssemblyError(`"${word}" is not one of the 16 instructions`, line)
    if (extra) throw new AssemblyError(`"${extra}" is one word too many — an instruction takes at most one address`, line)
    pending.push({ op: op as Op, word: operand ?? '', text: rest, line })
  })

  const code = pending.map(({ op, word, text, line }): Instruction => {
    if (op === 'JMP') {
      if (!word) throw new AssemblyError('JMP needs a label to jump to', line)
      const target = labels.get(word.toLowerCase())
      if (target === undefined) throw new AssemblyError(`no label called "${word}"`, line)
      return { op, operand: target, text, line }
    }
    if (!NEEDS_PIN.has(op)) return { op, operand: 0, text, line }
    const pin = PIN_INDEX.get(word?.toUpperCase() ?? '')
    if (pin === undefined) throw new AssemblyError(word ? `no pin called "${word}"` : `${op} needs a pin`, line)
    return { op, operand: pin, text, line }
  })

  return { code, start: (a, b) => session(code, a, b) }
}

/**
 * One clock edge: one instruction, always, including the ones that are skipped.
 *
 * The chip has no multi-cycle instruction and no pipeline. That is why the
 * button on screen says "clock" and not "step".
 */
function session(code: Instruction[], a: number, b: number): Session {
  const cpu: Cpu = { rr: false, skip: false, ien: true, oen: true, pc: 0, flagO: false, flagF: false }
  const board: Board = newBoard(a, b)
  let clocks = 0

  const clock = () => {
    if (board.halted) return
    const instruction = code[cpu.pc]
    if (!instruction) {
      board.halted = true
      return
    }

    cpu.pc += 1
    cpu.flagO = false
    cpu.flagF = false
    clocks += 1

    if (cpu.skip) {
      cpu.skip = false
      return
    }

    const name = BOARD_PINS[instruction.operand]?.name ?? 'ZERO'
    const bit = () => (cpu.ien ? readPin(board, name) : false)
    switch (instruction.op) {
      case 'NOPO':
        cpu.flagO = true
        break
      case 'LD':
        cpu.rr = bit()
        break
      case 'LDC':
        cpu.rr = !bit()
        break
      case 'AND':
        cpu.rr = cpu.rr && bit()
        break
      case 'ANDC':
        cpu.rr = cpu.rr && !bit()
        break
      case 'OR':
        cpu.rr = cpu.rr || bit()
        break
      case 'ORC':
        cpu.rr = cpu.rr || !bit()
        break
      case 'XNOR':
        cpu.rr = cpu.rr === bit()
        break
      case 'STO':
        if (cpu.oen) writePin(board, name, cpu.rr)
        break
      case 'STOC':
        if (cpu.oen) writePin(board, name, !cpu.rr)
        break
      case 'IEN':
        cpu.ien = readPin(board, name)
        break
      case 'OEN':
        cpu.oen = readPin(board, name)
        break
      case 'JMP':
        cpu.pc = instruction.operand
        break
      case 'RTN':
        cpu.skip = true
        break
      case 'SKZ':
        cpu.skip = !cpu.rr
        break
      case 'NOPF':
        cpu.flagF = true
        break
    }
  }

  const view = (): View => ({
    pc: cpu.pc,
    clocks,
    // One clock edge is one instruction on this chip, so there is nothing to
    // divide: a cycle count and a clock count are the same number.
    cycles: clocks,
    halted: board.halted,
    board,
    lamps: [
      { label: 'RR', on: cpu.rr, hint: 'The result register. One bit, and the only state the chip has.' },
      { label: 'C', on: board.bits.C ?? false, hint: 'The carry, kept on the board between passes.' },
      { label: 'SKIP', on: cpu.skip, hint: 'The next instruction will be fetched and thrown away.' },
      { label: 'IEN', on: cpu.ien, hint: 'Inputs enabled. While off, every read comes back 0.' },
      { label: 'OEN', on: cpu.oen, hint: 'Outputs enabled. While off, every write is dropped.' },
      { label: 'HALT', on: board.halted, hint: 'The program stopped the clock.' },
    ],
  })

  return { clock, view }
}

/**
 * Add two numbers, one bit per pass.
 *
 * The sum bit is A XOR B XOR carry, and since there is no XOR, each one is an
 * XNOR whose complement is stored. The carry out is A·B + carry·(A XOR B),
 * which is why the XOR is kept in T rather than worked out twice.
 */
export const ADDER = `; 4-bit adder, one bit per pass, MC14500B style.
; There is no XOR on this chip: XNOR then STOC is how you get one.

loop:  LD   DONE      ; has the bit counter run out of bits?
       SKZ            ; no -> skip the halt and do a pass
       JMP  stop

       LD   A0
       XNOR B0
       STOC T         ; T = A xor B

       LD   T
       XNOR C
       STOC S         ; sum bit = A xor B xor carry

       LD   A0
       AND  B0
       STO  G         ; G = A and B

       LD   C
       AND  T
       OR   G
       STO  C         ; carry out = A.B + carry.(A xor B)

       LD   ONE
       STO  SHIFT     ; move A and B down, move the sum bit in
       JMP  loop

stop:  LD   ONE
       STO  HALT
`

/**
 * Count: add 1 to A, for ever.
 *
 * The trick is AIN. Left alone, a shift empties A; fed from the program, A is a
 * ring — the bit that falls off the bottom is put back on the top, so after 4
 * shifts the word is where it started, one greater. ROUND is the board saying
 * that moment has arrived, and the carry is set again to add the next 1.
 */
export const COUNTER = `; Add 1 to A over and over. A is a ring: what falls off
; the bottom is pushed back in at the top through AIN.

       LD   ONE
       STO  C         ; the 1 being added

loop:  LD   A0
       XNOR C
       STOC AIN       ; next bit of A = A0 xor carry

       LD   A0
       AND  C
       STO  C         ; carry on to the next bit

       LD   ONE
       STO  SHIFT

       LD   ROUND     ; is the whole word back where it started?
       SKZ
       JMP  again
       JMP  loop

again: LD   ONE
       STO  C         ; yes -> start the next +1
       JMP  loop
`

/**
 * The answer line under the registers.
 *
 * Shared by both processors, because both are being asked the same question and
 * a right answer looks the same whichever machine worked it out.
 */
export const addition = (view: View) => {
  const { inA, inB, sum, halted } = { ...view.board, halted: view.halted }
  const total = valueOf(sum)
  return { text: `${inA} + ${inB} = ${halted ? total : '…'}`, done: halted, wrong: halted && total !== inA + inB }
}

/**
 * The counter's answer line.
 *
 * A is a ring while the program runs, so its bits only spell the number at a
 * word boundary — halfway round they are the same bits in the wrong places.
 * The line says so rather than showing a number that is briefly a lie.
 */
export const counting = (view: View) => {
  const whole = view.board.passes % WIDTH === 0
  return { text: `A = ${valueOf(view.board.a)}${whole ? '' : ' …'}`, done: whole }
}

export const MC14500: Arch = {
  id: 'mc14500',
  hz: 1_000_000,
  rate: '1 MHz — a CMOS chip of its generation, run gently.',
  words: (Object.keys(OP_HELP) as Op[]).map((name) => ({ name, what: OP_HELP[name] })),
  pins: BOARD_PINS,
  assemble,
  programs: [
    { id: 'adder', source: ADDER, summary: addition },
    { id: 'counter', source: COUNTER, summary: counting },
  ],
}

export { WIDTH, PASSES }
