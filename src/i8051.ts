/**
 * An Intel 8051, on the same board as the two 1-bit machines.
 *
 * This is the chip in the drawer. Era 6 counts them — 311, then 40, then 9 —
 * and Era 7's glossary calls it what it is: a whole small computer on one chip,
 * better than anything the project can build by every measure anybody can take.
 * This file is here to make that sentence uncomfortable rather than abstract.
 *
 * Put the same addition on all three machines and the argument is over before
 * it starts. The MC14500B needs 21 instructions and 5 passes; the MOVE machine
 * needs 17; the 8051 needs 4, because it has an 8-bit adder inside it and the
 * whole number arrives in one instruction:
 *
 *     MOV  A, P0
 *     ADD  A, P2
 *     MOV  P1, A
 *     HALT
 *
 * That is the loss Era 6 is about. Not that the old chips were faster — that
 * everything the project can still make has to spell out, one bit at a time,
 * work this chip does without being asked.
 *
 * **What this is not.** A documented subset, not an 8051: no DPTR or `MOVC`, no
 * bit-addressable SFRs, no interrupts, no timers, no external memory, and a
 * `HALT` that a real 8051 does not have (it would sit on `SJMP $` instead) — the
 * board needs a stop line and every machine here reaches it the same way. What
 * is here is enough to write a third program without hitting a wall in the
 * first five minutes.
 *
 * Cycles are counted the way the real chip counts them: 1 machine cycle for
 * most instructions, 2 for jumps and the compare-and-branch pair, 12 crystal
 * periods to a cycle, which at a 12 MHz crystal is 1 µs.
 */

import {
  AssemblyError,
  PORTS,
  newBoard,
  readByte,
  writeByte,
  type Arch,
  type Board,
  type Compiled,
  type Line,
  type Session,
} from './onebit'
import { addition, counting } from './mc14500'

/** The instructions this subset understands, and what each costs. */
export const WORDS: { name: string; what: string }[] = [
  { name: 'MOV A, #n', what: 'Load a number straight into the accumulator. 1 cycle.' },
  { name: 'MOV A, Rn', what: 'Load from one of the 8 registers. R0 to R7. 1 cycle.' },
  { name: 'MOV A, Pn', what: 'Read a whole register off the board through a port. 1 cycle.' },
  { name: 'MOV Rn, A', what: 'Keep the accumulator somewhere. 1 cycle.' },
  { name: 'MOV Pn, A', what: 'Write a whole register back to the board. Ports are memory here; there is no OUT. 1 cycle.' },
  { name: 'ADD A, x', what: 'Add a number, a register or a port to the accumulator, 8 bits at once. 1 cycle.' },
  { name: 'ADDC A, x', what: 'Add with the carry from last time. 1 cycle.' },
  { name: 'SUBB A, x', what: 'Subtract, borrowing through the carry. 1 cycle.' },
  { name: 'INC / DEC', what: 'One more, or one less: A or any register. 1 cycle.' },
  { name: 'ANL / ORL / XRL', what: 'And, or, exclusive-or into the accumulator — all 8 bits in one instruction. 1 cycle.' },
  { name: 'CJNE A, #n, label', what: 'Compare and branch if it does not match. 2 cycles.' },
  { name: 'DJNZ Rn, label', what: 'Count a register down and loop while it is not 0. 2 cycles.' },
  { name: 'SJMP label', what: 'Jump. 2 cycles.' },
  { name: 'JC / JNC label', what: 'Jump on the carry, or on no carry. 2 cycles.' },
  { name: 'NOP', what: 'Nothing, for 1 cycle.' },
  { name: 'HALT', what: 'Stop the clock. The real chip has no such instruction; the board does.' },
]

const PORT_NAMES = new Set<string>(PORTS.map((port) => port.name))
/** What the accumulator physically is. The board's registers are narrower. */
const BYTE = 0xff

type Kind = 'imm' | 'reg' | 'port' | 'acc'
interface Operand {
  kind: Kind
  /** The number, the register index, or the port name. */
  value: number
  port: string
}

interface Instruction extends Line {
  op: string
  args: Operand[]
  /** Where a jump lands, or -1. */
  target: number
  cycles: number
}

/** Jumps and the compare-and-branch pair take 2 machine cycles; the rest take 1. */
const TWO_CYCLES = new Set(['SJMP', 'DJNZ', 'CJNE', 'JC', 'JNC'])

/** `#20`, `#14H`, `#0x0E` — all of them mean twenty. */
function immediate(word: string, line: number): number {
  const text = word.slice(1)
  const value = /^0x/i.test(text) ? Number(text) : /h$/i.test(text) ? parseInt(text.slice(0, -1), 16) : Number(text)
  if (!Number.isFinite(value)) throw new AssemblyError(`"${word}" is not a number`, line)
  return value & BYTE
}

function operand(word: string, line: number): Operand {
  const text = word.toUpperCase()
  if (text.startsWith('#')) return { kind: 'imm', value: immediate(word, line), port: '' }
  if (text === 'A') return { kind: 'acc', value: 0, port: '' }
  if (/^R[0-7]$/.test(text)) return { kind: 'reg', value: Number(text[1]), port: '' }
  if (PORT_NAMES.has(text)) return { kind: 'port', value: 0, port: text }
  throw new AssemblyError(`"${word}" is not a register, a port or a number`, line)
}

export function assemble(source: string): Compiled {
  const labels = new Map<string, number>()
  const pending: { op: string; words: string[]; text: string; line: number }[] = []

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

    const [op, ...args] = rest.split(/\s*,\s*|\s+/).filter(Boolean)
    pending.push({ op: op.toUpperCase(), words: args, text: rest, line })
  })

  const code = pending.map(({ op, words, text, line }): Instruction => {
    const cycles = TWO_CYCLES.has(op) ? 2 : 1
    const jump = (word: string) => {
      const target = labels.get(word?.toLowerCase() ?? '')
      if (target === undefined) throw new AssemblyError(`no label called "${word ?? ''}"`, line)
      return target
    }
    const want = (n: number) => {
      if (words.length !== n) throw new AssemblyError(`${op} takes ${n} operand${n === 1 ? '' : 's'}, not ${words.length}`, line)
    }

    switch (op) {
      case 'NOP':
      case 'HALT':
        want(0)
        return { op, args: [], target: -1, text, line, cycles }
      case 'INC':
      case 'DEC': {
        want(1)
        const to = operand(words[0], line)
        if (to.kind !== 'acc' && to.kind !== 'reg') throw new AssemblyError(`${op} works on A or a register`, line)
        return { op, args: [to], target: -1, text, line, cycles }
      }
      case 'SJMP':
      case 'JC':
      case 'JNC':
        want(1)
        return { op, args: [], target: jump(words[0]), text, line, cycles }
      case 'DJNZ': {
        want(2)
        const counter = operand(words[0], line)
        if (counter.kind !== 'reg') throw new AssemblyError('DJNZ counts a register down: DJNZ R0, label', line)
        return { op, args: [counter], target: jump(words[1]), text, line, cycles }
      }
      case 'CJNE': {
        want(3)
        const left = operand(words[0], line)
        const right = operand(words[1], line)
        if (left.kind !== 'acc') throw new AssemblyError('this subset compares the accumulator: CJNE A, #n, label', line)
        return { op, args: [left, right], target: jump(words[2]), text, line, cycles }
      }
      case 'MOV':
      case 'ADD':
      case 'ADDC':
      case 'SUBB':
      case 'ANL':
      case 'ORL':
      case 'XRL': {
        want(2)
        const to = operand(words[0], line)
        const from = operand(words[1], line)
        if (op !== 'MOV' && to.kind !== 'acc') throw new AssemblyError(`${op} works into the accumulator: ${op} A, x`, line)
        if (op === 'MOV' && to.kind === 'imm') throw new AssemblyError('a number is not somewhere to put a value', line)
        if (op === 'MOV' && to.kind !== 'acc' && from.kind !== 'acc' && from.kind !== 'imm') {
          throw new AssemblyError('a move that is not through the accumulator needs a number: MOV R0, #2', line)
        }
        return { op, args: [to, from], target: -1, text, line, cycles }
      }
      default:
        throw new AssemblyError(`"${op}" is not in this 8051 subset`, line)
    }
  })

  return { code, start: (a, b) => session(code, a, b) }
}

function session(code: Instruction[], a: number, b: number): Session {
  const board: Board = newBoard(a, b)
  const registers = [0, 0, 0, 0, 0, 0, 0, 0]
  let acc = 0
  let carry = false
  let pc = 0
  let clocks = 0
  let cycles = 0

  const read = (from: Operand): number => {
    switch (from.kind) {
      case 'imm':
        return from.value
      case 'reg':
        return registers[from.value]
      case 'port':
        return readByte(board, from.port)
      default:
        return acc
    }
  }
  const write = (to: Operand, value: number) => {
    if (to.kind === 'reg') registers[to.value] = value & BYTE
    else if (to.kind === 'port') writeByte(board, to.port, value)
    else acc = value & BYTE
  }

  const clock = () => {
    if (board.halted) return
    const instruction = code[pc]
    if (!instruction) {
      board.halted = true
      return
    }

    pc += 1
    clocks += 1
    cycles += instruction.cycles

    const [first, second] = instruction.args
    switch (instruction.op) {
      case 'NOP':
        break
      case 'HALT':
        board.halted = true
        break
      case 'MOV':
        write(first, read(second))
        break
      case 'ADD':
      case 'ADDC': {
        const total = acc + read(second) + (instruction.op === 'ADDC' && carry ? 1 : 0)
        carry = total > BYTE
        acc = total & BYTE
        break
      }
      case 'SUBB': {
        const total = acc - read(second) - (carry ? 1 : 0)
        carry = total < 0
        acc = total & BYTE
        break
      }
      case 'ANL':
        acc &= read(second)
        break
      case 'ORL':
        acc |= read(second)
        break
      case 'XRL':
        acc ^= read(second)
        break
      case 'INC':
        write(first, read(first) + 1)
        break
      case 'DEC':
        write(first, read(first) - 1)
        break
      case 'SJMP':
        pc = instruction.target
        break
      case 'JC':
        if (carry) pc = instruction.target
        break
      case 'JNC':
        if (!carry) pc = instruction.target
        break
      case 'DJNZ': {
        const left = (registers[first.value] - 1) & BYTE
        registers[first.value] = left
        if (left !== 0) pc = instruction.target
        break
      }
      case 'CJNE': {
        const other = read(second)
        carry = acc < other
        if (acc !== other) pc = instruction.target
        break
      }
    }
  }

  return {
    clock,
    view: () => ({
      pc,
      clocks,
      cycles,
      halted: board.halted,
      board,
      lamps: [
        { label: `A=${acc}`, on: acc !== 0, hint: 'The accumulator. 8 bits of it, which is the whole argument.' },
        { label: 'C', on: carry, hint: 'The carry flag, set by the last add or subtract.' },
        { label: `R0=${registers[0]}`, on: registers[0] !== 0, hint: 'The first of 8 registers. There are 7 more.' },
        { label: 'HALT', on: board.halted, hint: 'The program stopped the clock.' },
      ],
    }),
  }
}

/**
 * The addition, on a chip that already has an adder.
 *
 * 4 instructions against the MC14500B's 21, and no passes at all: the board's
 * parallel latch hands over the whole register, the chip adds it in one cycle,
 * and the answer goes back the same way. There is nothing to explain, which is
 * exactly what the other two listings are for.
 */
export const ADDER = `; The same 4-bit addition the 1-bit machines spend 100 clocks on.
; This chip has an 8-bit adder in it, so the whole thing is 4 instructions.

      MOV  A, P0      ; the whole of A, through the board's latch
      ADD  A, P2      ; + the whole of B, in one cycle
      MOV  P1, A      ; and the answer back to the sum register
      HALT
`

/** Count: no ring, no carry bit, no bit-time counter. Add one and put it back. */
export const COUNTER = `; Add 1 to A over and over. The 1-bit machines need a ring
; and a bit counter for this; here it is 3 instructions.

loop: MOV  A, P0
      INC  A
      MOV  P0, A
      SJMP loop
`

export const I8051: Arch = {
  id: 'i8051',
  // 12 crystal periods to a machine cycle, 12 MHz crystal: 1 µs a cycle. The
  // number every 8051 data sheet of the era quotes, and the one the project's
  // routers would have run at.
  hz: 1_000_000,
  rate: '1 MHz of machine cycles — a 12 MHz crystal, 12 periods to a cycle.',
  words: WORDS,
  // A byte machine cannot address a bit, so it has no pins — it reaches the
  // same registers through the board's parallel latches instead.
  pins: [],
  ports: PORTS,
  assemble,
  programs: [
    { id: 'adder', source: ADDER, summary: addition },
    { id: 'counter', source: COUNTER, summary: counting },
  ],
}
