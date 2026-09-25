/**
 * The board both 1-bit processors are bolted onto.
 *
 * Era 6 runs out of chips nobody can make, and the answer is not a better chip
 * — it is a machine with so little inside it that valves and relays are enough.
 * There are two of those in this game, and the interesting thing about them is
 * that they are *the same hardware with a different processor on it*: the same
 * shift registers, the same carry flip-flop, the same pins. Only the thing that
 * decides what to do next differs.
 *
 * So the board lives here and the processors live next door. A processor is
 * whatever can drive these pins: `mc14500.ts` does it with 16 opcodes,
 * `move.ts` does it with one.
 *
 * **Two widths onto one memory.** The 1-bit processors see the bottom bit of a
 * register and a pulse to shift it. A byte-wide processor cannot work that way,
 * so the board also carries a parallel latch across each register — `P0` is A,
 * `P2` is B, `P1` is the sum — which is exactly the part a real board puts
 * between a byte CPU and a serial register. Same flip-flops, two ways in.
 *
 * **Memory is shift registers.** There is no RAM. A and B shift down a bit at a
 * time, the answer is shifted into SUM from the top, and the only thing that
 * survives a shift is the carry. That is not a simplification for the screen —
 * it is what a machine built out of what this town can make would actually
 * have, and it is why every program here is written one bit at a time.
 */

/** Bits per operand. Small enough to watch, wide enough for the carry to matter. */
export const WIDTH = 4
/** One pass per bit, and one more to shift the last carry into the sum. */
export const PASSES = WIDTH + 1

export interface Pin {
  name: string
  /** `in` is driven by the board, `out` is driven by the program, `bit` is a flip-flop the program owns. */
  kind: 'in' | 'out' | 'bit'
  what: string
}

/**
 * Every addressable bit on the board.
 *
 * Both processors see exactly this. A processor may add pins of its own — the
 * MOVE machine's accumulator is one — but nothing here is optional.
 */
export const BOARD_PINS: Pin[] = [
  { name: 'A0', kind: 'in', what: 'Bottom bit of shift register A — the bit of A being worked on right now.' },
  { name: 'B0', kind: 'in', what: 'Bottom bit of shift register B.' },
  { name: 'ONE', kind: 'in', what: 'Wired high. Every board has one.' },
  { name: 'ZERO', kind: 'in', what: 'Wired low.' },
  { name: 'DONE', kind: 'in', what: 'The bit-time counter has run a pass per bit, plus one for the last carry.' },
  { name: 'ROUND', kind: 'in', what: `1 on the shift that brings a whole word round — every ${WIDTH} shifts.` },
  { name: 'C', kind: 'bit', what: 'The carry. The only thing that survives a shift.' },
  { name: 'T', kind: 'bit', what: 'Scratch.' },
  { name: 'G', kind: 'bit', what: 'Scratch.' },
  { name: 'S', kind: 'out', what: 'The bit shifted into the top of SUM on the next pulse.' },
  { name: 'AIN', kind: 'out', what: 'The bit shifted into the top of A on the next pulse. Leave it 0 and A empties; feed it and A rotates.' },
  { name: 'SHIFT', kind: 'out', what: 'A pulse: A and B move down one, S moves into SUM, AIN moves into A.' },
  { name: 'HALT', kind: 'out', what: 'Stop the clock. The program is finished.' },
]

/**
 * The parallel latches, for a processor that thinks in bytes.
 *
 * Deliberately the same registers the 1-bit machines shift through, so the two
 * kinds of program are doing the same work to the same hardware and their costs
 * can be compared without an argument about whether it was a fair race.
 */
export const PORTS = [
  { name: 'P0', what: 'Shift register A, all bits at once. Readable and writable.' },
  { name: 'P1', what: 'The sum register. Writing it puts the answer there in one go.' },
  { name: 'P2', what: 'Shift register B, all bits at once.' },
] as const

export interface Board {
  /** Bottom bit first, which is the order the machine consumes them in. */
  a: boolean[]
  b: boolean[]
  /** What A and B were loaded with. The registers are consumed; the question is not. */
  inA: number
  inB: number
  /** The answer, filled from the top as bits are shifted in. */
  sum: boolean[]
  bits: Record<string, boolean>
  /** Shifts so far. The bit-time counter every serial machine needs. */
  passes: number
  halted: boolean
}

const bitsOf = (value: number, width: number) =>
  Array.from({ length: width }, (_, i) => Boolean((value >> i) & 1))

export const valueOf = (bits: boolean[]) => bits.reduce((n, bit, i) => n + (bit ? 1 << i : 0), 0)

export function newBoard(a: number, b: number): Board {
  return {
    a: bitsOf(a, WIDTH),
    b: bitsOf(b, WIDTH),
    inA: a,
    inB: b,
    sum: Array.from({ length: PASSES }, () => false),
    bits: { C: false, T: false, G: false, S: false, AIN: false },
    passes: 0,
    halted: false,
  }
}

/** What a program sees when it reads a pin. */
export function readPin(board: Board, name: string): boolean {
  switch (name) {
    case 'A0':
      return board.a[0]
    case 'B0':
      return board.b[0]
    case 'ONE':
      return true
    case 'ZERO':
      return false
    case 'DONE':
      return board.passes >= PASSES
    case 'ROUND':
      return board.passes > 0 && board.passes % WIDTH === 0
    case 'HALT':
      return board.halted
    default:
      return board.bits[name] ?? false
  }
}

/**
 * A write, and the hardware that answers it.
 *
 * `SHIFT` is deliberately edge-like: writing 0 does nothing, which is why every
 * program has to put a 1 somewhere before it stores. That is not pedantry, it
 * is what a pulse into a clock line does.
 */
export function writePin(board: Board, name: string, value: boolean): void {
  if (name === 'SHIFT') {
    if (!value) return
    board.sum = [...board.sum.slice(1), board.bits.S ?? false]
    board.a = [...board.a.slice(1), board.bits.AIN ?? false]
    board.b = [...board.b.slice(1), false]
    board.passes += 1
    return
  }
  if (name === 'HALT') {
    if (value) board.halted = true
    return
  }
  board.bits[name] = value
}

/** A whole register at once, for the byte-wide processor. */
export function readByte(board: Board, name: string): number {
  switch (name) {
    case 'P0':
      return valueOf(board.a)
    case 'P1':
      return valueOf(board.sum)
    case 'P2':
      return valueOf(board.b)
    default:
      return 0
  }
}

/**
 * Write a whole register at once.
 *
 * The value is masked to what the register physically holds — 4 bits for the
 * operands, 5 for the sum — because a latch wider than its register is a lie
 * about the hardware, and the wrap it causes is the same wrap the 1-bit counter
 * gets by shifting.
 */
export function writeByte(board: Board, name: string, value: number): void {
  const bits = (n: number, width: number) => Array.from({ length: width }, (_, i) => Boolean((n >> i) & 1))
  if (name === 'P0') board.a = bits(value, WIDTH)
  else if (name === 'P2') board.b = bits(value, WIDTH)
  else if (name === 'P1') {
    board.sum = bits(value, PASSES)
    // The answer arrived in one instruction rather than a pass per bit. Say the
    // work is finished, so the screen reads the same for every processor.
    board.passes = PASSES
  }
}

// --- what a processor has to offer the screen --------------------------------

/** One lit or unlit thing in the machine, named. */
export interface Lamp {
  label: string
  on: boolean
  hint: string
}

/** Everything the screen draws, so it never has to know which processor it is. */
export interface View {
  pc: number
  clocks: number
  /**
   * Machine cycles, which is what a clock actually costs.
   *
   * On the 1-bit machines this is the clock count: one edge, one instruction.
   * On the 8051 an instruction is 1 or 2 machine cycles, and a cycle is 12
   * crystal periods — so this is the number that turns into a time.
   */
  cycles: number
  halted: boolean
  board: Board
  lamps: Lamp[]
}

/** A running machine. Mutates in place: a board has one set of flip-flops. */
export interface Session {
  clock(): void
  view(): View
}

export interface Line {
  text: string
  line: number
}

export interface Compiled {
  code: Line[]
  start(a: number, b: number): Session
}

export interface ProgramDef {
  id: string
  source: string
  /** The one-line answer under the registers: what this program is for. */
  summary(view: View): { text: string; done: boolean; wrong?: boolean }
}

/**
 * A processor: an instruction set, the pins it can reach, and the programs
 * written for it. The screen renders one of these without knowing which.
 */
export interface Arch {
  id: string
  /** Machine cycles per second, for turning a run into a wall-clock time. */
  hz: number
  /** Where that rate comes from, since it is an assumption and not a fact. */
  rate: string
  /** The words the machine understands, for the panel that lists them. */
  words: { name: string; what: string }[]
  /** The bits this processor can address one at a time. Empty for a byte machine. */
  pins: Pin[]
  /** The parallel latches it reads and writes whole. Empty for a bit machine. */
  ports?: readonly { name: string; what: string }[]
  programs: ProgramDef[]
  assemble(source: string): Compiled
}

export class AssemblyError extends Error {
  constructor(
    message: string,
    readonly line: number,
  ) {
    super(message)
    this.name = 'AssemblyError'
  }
}

/** Run to the end, or to the cap — a jump to itself must not lock the tab. */
export function runTo(compiled: Compiled, a: number, b: number, cap = 5000): View {
  const session = compiled.start(a, b)
  let view = session.view()
  while (!view.halted && view.clocks < cap) {
    session.clock()
    view = session.view()
  }
  return view
}
