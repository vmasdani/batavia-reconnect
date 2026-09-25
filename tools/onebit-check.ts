/**
 * Prove both 1-bit machines, without a browser.
 *
 * The claim the simulator makes is that a processor with one bit of state and
 * no arithmetic unit can still add — and that a processor with *one instruction*
 * can do the same work on the same board. Both are checked here over every
 * input pair there is, rather than by clicking through one addition and
 * believing the rest. What is left for the browser is whether the screen is
 * legible, which is the only part a person has to look at.
 *
 * The instruction-level checks matter as much as the adder: a machine that is
 * right about the 6 opcodes one program happens to use and wrong about the rest
 * is a trap for whoever writes the second program.
 *
 *   npm run check:onebit
 */

import { I8051 } from '../src/i8051'
import { MC14500 } from '../src/mc14500'
import { MOVE } from '../src/move'
import { costs } from '../src/machines'
import { AssemblyError, PASSES, WIDTH, runTo, valueOf, type Arch } from '../src/onebit'

let bad = 0
const fail = (what: string) => {
  console.log(`  ✗ ${what}`)
  bad += 1
}
const ok = (what: string) => console.log(`  ✓ ${what}`)

const top = (1 << WIDTH) - 1
const source = (arch: Arch, id: string) => arch.programs.find((program) => program.id === id)!.source

// --- both adders, every pair --------------------------------------------------

for (const arch of [MC14500, MOVE, I8051]) {
  const compiled = arch.assemble(source(arch, 'adder'))
  console.log(`\n${arch.id} adder: ${compiled.code.length} instructions`)

  let wrong = 0
  let worst = 0
  for (let a = 0; a <= top; a++) {
    for (let b = 0; b <= top; b++) {
      const view = runTo(compiled, a, b)
      const got = valueOf(view.board.sum)
      worst = Math.max(worst, view.clocks)
      if (!view.halted) {
        fail(`${a} + ${b} never halted`)
        wrong += 1
      } else if (got !== a + b) {
        fail(`${a} + ${b} = ${got}`)
        wrong += 1
      }
    }
  }
  if (!wrong) ok(`every pair from 0+0 to ${top}+${top} adds up (${(top + 1) ** 2} of them)`)

  // The sum register has to be wide enough for the carry out of the top bit,
  // which is the one width mistake that only shows at the extremes.
  if (valueOf(runTo(compiled, top, top).board.sum) === 2 * top) ok(`${top} + ${top} carries into bit ${WIDTH}`)
  else fail(`${top} + ${top} loses the top carry`)

  // A serial machine earns the answer a pass at a time; the byte machine writes
  // it in one go and the board reports the work as finished. Both must end up
  // saying the addition is done, or the screen's answer line lies.
  const passes = runTo(compiled, 9, 6).board.passes
  if (passes === PASSES) ok(`${PASSES} passes per addition`)
  else fail(`ran ${passes} passes, expected ${PASSES}`)

  console.log(`  longest run: ${worst} clocks`)
}

// One instruction, and it still costs fewer of them: the MOVE machine has the
// XOR gate the chip lacks. If this ever inverts, the adders have drifted apart.
const chipAdder = MC14500.assemble(source(MC14500, 'adder'))
const moveAdder = MOVE.assemble(source(MOVE, 'adder'))
if (runTo(moveAdder, 11, 6).clocks < runTo(chipAdder, 11, 6).clocks) {
  ok(`the MOVE adder is shorter than the chip's (${runTo(moveAdder, 11, 6).clocks} clocks against ${runTo(chipAdder, 11, 6).clocks})`)
} else {
  fail('the MOVE adder is no shorter than the chip’s, which was the whole point of the XOR port')
}

// --- both counters ------------------------------------------------------------

/**
 * The counter has no halt: it adds 1 to A for ever. So it is clocked for a
 * fixed budget and A is read at word boundaries, which is the only time the
 * ring is back where it started and the number in it means anything.
 */
for (const arch of [MC14500, MOVE]) {
  console.log(`\n${arch.id} counter`)
  const compiled = arch.assemble(source(arch, 'counter'))

  for (const from of [0, 5, 14, 15]) {
    const session = compiled.start(from, 0)
    let view = session.view()
    // Run until the word has gone round once: that is one +1, wrap included.
    for (let i = 0; i < 2000 && view.board.passes < WIDTH; i++) {
      session.clock()
      view = session.view()
    }
    const got = valueOf(view.board.a)
    const want = (from + 1) % (top + 1)
    if (got === want) ok(`${from} + 1 = ${want}${want === 0 ? ' (wraps)' : ''}`)
    else fail(`${from} + 1 came out as ${got}`)
  }

  // And it keeps going: 4 words round from 6 is 10, with nothing reset in
  // between. A counter that only works once is a decrementing bug in waiting.
  const session = compiled.start(6, 0)
  let view = session.view()
  for (let i = 0; i < 8000 && view.board.passes < WIDTH * 4; i++) {
    session.clock()
    view = session.view()
  }
  const got = valueOf(view.board.a)
  if (got === 10) ok('counts 4 times over without being reset (6 -> 10)')
  else fail(`4 increments from 6 came out as ${got}`)
}

// --- the 8051 -----------------------------------------------------------------

console.log('\ni8051 counter')
{
  const compiled = I8051.assemble(source(I8051, 'counter'))
  for (const from of [0, 5, 14, 15]) {
    const session = compiled.start(from, 0)
    // MOV A,P0 / INC A / MOV P0,A — 3 instructions and the register is written.
    for (let i = 0; i < 3; i++) session.clock()
    const got = valueOf(session.view().board.a)
    const want = (from + 1) % (top + 1)
    if (got === want) ok(`${from} + 1 = ${want}${want === 0 ? ' (wraps)' : ''}`)
    else fail(`${from} + 1 came out as ${got}`)
  }
  const session = compiled.start(6, 0)
  for (let i = 0; i < 16; i++) session.clock()
  const got = valueOf(session.view().board.a)
  if (got === 10) ok('counts 4 times over without being reset (6 -> 10)')
  else fail(`4 increments from 6 came out as ${got}`)
}

console.log('\ni8051 instructions')
const chip8051 = (src: string, a = 0, b = 0) => {
  const compiled = I8051.assemble(src)
  const session = compiled.start(a, b)
  // Run to the halt, or off the end of the program, which also halts. The cap
  // is generous because a fragment with DJNZ in it loops before it gets there.
  for (let i = 0; i < 200 && !session.view().halted; i++) session.clock()
  return session.view()
}
/** The accumulator, read off the lamp the screen shows it on. */
const accOf = (view: ReturnType<typeof chip8051>) => Number(view.lamps[0].label.split('=')[1])
const cases8051: [string, boolean][] = [
  ['MOV A,#n loads a number', accOf(chip8051('MOV A, #42')) === 42],
  ['hex immediates', accOf(chip8051('MOV A, #2AH')) === 42],
  ['0x immediates', accOf(chip8051('MOV A, #0x2A')) === 42],
  ['MOV through a register', accOf(chip8051('MOV A, #7\nMOV R3, A\nMOV A, #0\nMOV A, R3')) === 7],
  ['ADD is 8 bits wide, not 1', accOf(chip8051('MOV A, #9\nADD A, #6')) === 15],
  ['ADD wraps at 255 and sets the carry', chip8051('MOV A, #255\nADD A, #2').lamps[1].on],
  ['ADDC picks the carry up', accOf(chip8051('MOV A, #255\nADD A, #2\nMOV A, #0\nADDC A, #0')) === 1],
  ['SUBB', accOf(chip8051('MOV A, #9\nSUBB A, #4')) === 5],
  ['ANL', accOf(chip8051('MOV A, #12\nANL A, #10')) === 8],
  ['ORL', accOf(chip8051('MOV A, #12\nORL A, #3')) === 15],
  ['XRL', accOf(chip8051('MOV A, #12\nXRL A, #10')) === 6],
  ['INC and DEC', accOf(chip8051('MOV A, #5\nINC A\nINC A\nDEC A')) === 6],
  ['DJNZ loops the right number of times', accOf(chip8051('MOV R0, #3\nMOV A, #0\nloop: INC A\nDJNZ R0, loop')) === 3],
  ['CJNE branches when they differ', accOf(chip8051('MOV A, #1\nCJNE A, #2, away\nMOV A, #9\naway: NOP')) === 1],
  ['CJNE falls through when they match', accOf(chip8051('MOV A, #2\nCJNE A, #2, away\nMOV A, #9\naway: NOP')) === 9],
  ['JC jumps on the carry', accOf(chip8051('MOV A, #255\nADD A, #1\nJC away\nMOV A, #9\naway: NOP')) === 0],
  ['P0 reads the whole of A', accOf(chip8051('MOV A, P0', 11, 6)) === 11],
  ['P2 reads the whole of B', accOf(chip8051('MOV A, P2', 11, 6)) === 6],
  ['writing P0 loads the register', valueOf(chip8051('MOV A, #9\nMOV P0, A').board.a) === 9],
  ['a port write is masked to the register width', valueOf(chip8051('MOV A, #255\nMOV P0, A').board.a) === 15],
  ['HALT stops the machine', chip8051('HALT').halted],
  ['jumps cost 2 machine cycles, moves cost 1', chip8051('MOV A, #1\nSJMP on\non: NOP').cycles === 4],
]
for (const [what, passed] of cases8051) (passed ? ok : fail)(what)

for (const [src, what] of [
  ['MVI A, #2', 'an 8085 instruction'],
  ['MOV A', 'a move with one operand'],
  ['MOV #2, A', 'a move into a number'],
  ['ADD R0, #2', 'arithmetic that does not go through the accumulator'],
  ['MOV A, R9', 'a register that does not exist'],
  ['SJMP nowhere', 'a jump to a label nobody wrote'],
] as [string, string][]) {
  try {
    I8051.assemble(src)
    fail(`i8051 accepted ${what}`)
  } catch (err) {
    if (err instanceof AssemblyError && err.line > 0) ok(`i8051 refuses ${what} (line ${err.line})`)
    else fail(`i8051 refused ${what} with the wrong kind of error: ${(err as Error).message}`)
  }
}

// --- the comparison the screen makes -----------------------------------------

console.log('\nsame job, 3 machines')
for (const programId of ['adder', 'counter']) {
  const ranked = costs(programId, 11, 6)
  const by = (id: string) => ranked.find((cost) => cost.arch.id === id)!
  const chip = by('i8051')
  const mc = by('mc14500')
  const mv = by('move')
  console.log(
    `  ${programId}: 8051 ${chip.instructions} instructions / ${(chip.seconds * 1e6).toFixed(0)} µs · ` +
      `MC14500B ${mc.instructions} / ${(mc.seconds * 1e6).toFixed(0)} µs · ` +
      `MOVE ${mv.instructions} / ${(mv.seconds * 1e6).toFixed(0)} µs`,
  )
  // The screen's entire argument, in 2 assertions. If either ever inverts, the
  // strip is drawing a comparison that is no longer true.
  if (chip.instructions < mv.instructions && mv.instructions < mc.instructions) ok(`${programId}: 8051 < MOVE < MC14500B in instructions`)
  else fail(`${programId}: the listings no longer rank 8051 < MOVE < MC14500B`)
  if (chip.seconds < mc.seconds && mc.seconds < mv.seconds) ok(`${programId}: the 8051 is quickest and the hand-built machine slowest`)
  else fail(`${programId}: the times no longer rank 8051 < MC14500B < MOVE`)
}

// --- the instructions the programs happen not to use --------------------------

console.log('\nMC14500B instructions')
const chip = (src: string, a = 0, b = 0) => {
  const compiled = MC14500.assemble(src)
  const session = compiled.start(a, b)
  for (let i = 0; i < compiled.code.length; i++) session.clock()
  return session.view()
}
const chipCases: [string, boolean][] = [
  ['LDC on a 1 loads 0', !chip('LD ONE\nLDC ONE').lamps[0].on],
  ['ANDC', chip('LD ONE\nANDC ZERO').lamps[0].on],
  ['ORC', chip('LD ZERO\nORC ZERO').lamps[0].on],
  ['XNOR is 1 when both agree', chip('LD ZERO\nXNOR ZERO').lamps[0].on],
  ['XNOR is 0 when they differ', !chip('LD ONE\nXNOR ZERO').lamps[0].on],
  ['SKZ skips when rr is 0', !chip('LD ZERO\nSKZ\nLD ONE').lamps[0].on],
  ['SKZ does not skip when rr is 1', chip('LD ONE\nSKZ\nLD ONE').lamps[0].on],
  ['RTN skips the instruction after it', !chip('RTN\nLD ONE').lamps[0].on],
  ['a skipped instruction still costs a clock', chip('LD ZERO\nSKZ\nLD ONE').clocks === 3],
  ['IEN 0 makes every read come back 0', !chip('IEN ZERO\nLD ONE').lamps[0].on],
  ['OEN 0 drops every write', !chip('OEN ZERO\nLD ONE\nSTO T').board.bits.T],
  ['STOC writes the complement', !chip('LD ONE\nSTOC T').board.bits.T],
  ['HALT stops the machine', chip('LD ONE\nSTO HALT').halted],
  ['SHIFT moves A down', chip('LD ONE\nSTO SHIFT', 0b0010, 0).board.a[0]],
  ['SHIFT does nothing when 0 is stored', !chip('LD ZERO\nSTO SHIFT', 0b0010, 0).board.a[0]],
  ['AIN feeds the top of A on a shift', chip('LD ONE\nSTO AIN\nLD ONE\nSTO SHIFT').board.a[WIDTH - 1]],
  ['running off the end of the program halts', chip('LD ONE\nLD ONE').halted === false],
]
for (const [what, passed] of chipCases) (passed ? ok : fail)(what)

/** Two clocks: the jump, then whatever it landed on. The HALT is jumped over. */
const jumpsPastHalt = () => {
  const compiled = MOVE.assemble('go -> PC\nONE -> HALT\ngo: ZERO -> ACC')
  const session = compiled.start(0, 0)
  session.clock()
  session.clock()
  return session.view()
}

console.log('\nMOVE instructions')
const move = (src: string, a = 0, b = 0) => {
  const compiled = MOVE.assemble(src)
  const session = compiled.start(a, b)
  for (let i = 0; i < compiled.code.length; i++) session.clock()
  return session.view()
}
const moveCases: [string, boolean][] = [
  ['a move loads the accumulator', move('ONE -> ACC').lamps[0].on],
  ['NACC is the other side of the flip-flop', !move('ONE -> ACC\nNACC -> ACC').lamps[0].on],
  ['AND', !move('ONE -> ACC\nZERO -> AND').lamps[0].on],
  ['OR', move('ZERO -> ACC\nONE -> OR').lamps[0].on],
  ['XOR of two 1s is 0', !move('ONE -> ACC\nONE -> XOR').lamps[0].on],
  ['XOR of 1 and 0 is 1', move('ONE -> ACC\nZERO -> XOR').lamps[0].on],
  ['SKZ skips on a 0', !move('ZERO -> SKZ\nONE -> ACC').lamps[0].on],
  ['SKZ does not skip on a 1', move('ONE -> SKZ\nONE -> ACC').lamps[0].on],
  ['a skipped instruction still costs a clock', move('ZERO -> SKZ\nONE -> ACC').clocks === 2],
  ['the MOVE keyword is optional', move('MOVE ONE, ACC').lamps[0].on],
  ['a jump is a move into PC, and it lands past the halt', !jumpsPastHalt().halted],
  ['scratch takes a bit', move('ONE -> ACC\nACC -> T').board.bits.T],
  ['HALT stops the machine', move('ONE -> HALT').halted],
  ['SHIFT moves A down', move('ONE -> SHIFT', 0b0010, 0).board.a[0]],
  ['AIN feeds the top of A on a shift', move('ONE -> AIN\nONE -> SHIFT').board.a[WIDTH - 1]],
]
for (const [what, passed] of moveCases) (passed ? ok : fail)(what)

// --- what the assemblers refuse -----------------------------------------------

const refusals: [Arch, string, string][] = [
  [MC14500, 'LOAD A0', 'an instruction that does not exist'],
  [MC14500, 'LD NOWHERE', 'a pin that does not exist'],
  [MC14500, 'LD', 'an addressing instruction with no address'],
  [MC14500, 'JMP nowhere', 'a jump to a label nobody wrote'],
  [MC14500, 'LD A0 B0', 'two addresses on one instruction'],
  [MC14500, 'loop: LD ONE\nloop: LD ONE', 'the same label twice'],
  [MOVE, 'ONE', 'a move with no destination'],
  [MOVE, 'ONE -> NOWHERE', 'a destination that does not exist'],
  [MOVE, 'NOWHERE -> ACC', 'a source that does not exist'],
  [MOVE, 'nowhere -> PC', 'a jump to a label nobody wrote'],
  [MOVE, 'ONE -> ACC -> T', 'three addresses on one move'],
  [MOVE, 'ACC -> ONE', 'a write to something that cannot be written'],
]
console.log('\nassemblers')
for (const [arch, src, what] of refusals) {
  try {
    arch.assemble(src)
    fail(`${arch.id} accepted ${what}`)
  } catch (err) {
    if (err instanceof AssemblyError && err.line > 0) ok(`${arch.id} refuses ${what} (line ${err.line})`)
    else fail(`${arch.id} refused ${what} with the wrong kind of error: ${(err as Error).message}`)
  }
}

// Comments, blank lines and a label alone on its line are ordinary things to
// write, and none of them are instructions.
for (const [arch, src] of [
  [MC14500, '; nothing\n\nloop:\n  LD ONE\n  JMP loop ; back round\n'],
  [MOVE, '; nothing\n\nloop:\n  ONE -> ACC\n  loop -> PC ; back round\n'],
] as [Arch, string][]) {
  const compiled = arch.assemble(src)
  if (compiled.code.length === 2) ok(`${arch.id}: comments, blank lines and a lone label assemble to nothing`)
  else fail(`${arch.id}: expected 2 instructions, got ${compiled.code.length}`)
}

console.log(bad ? `\n${bad} failed\n` : '\nAll good.\n')
process.exit(bad ? 1 : 0)
