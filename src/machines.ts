/**
 * The processors the simulator offers, in the order the game meets them.
 *
 * The MC14500B is Era 7's chip: real, findable, and gone the moment the drawer
 * is empty. The MOVE machine is what the same board runs when nobody can find
 * another chip — one instruction, buildable from gates the project already
 * makes. The 8051 is what was in the drawer to begin with, and the reason the
 * loss hurts. All three drive the board in `onebit.ts`, so the listings are the
 * same work done three ways, which is the only reason to have them on one
 * screen.
 */

import { I8051 } from './i8051'
import { MC14500 } from './mc14500'
import { MOVE } from './move'
import { runTo, type Arch, type ProgramDef } from './onebit'

export const ARCHS: Arch[] = [MC14500, MOVE, I8051]

/** A program by name, falling back to the machine's first — every machine has one. */
export function programOf(arch: Arch, id: string): ProgramDef {
  return arch.programs.find((program) => program.id === id) ?? arch.programs[0]
}

/** What one program costs on one machine: instructions, cycles, and seconds. */
export interface Cost {
  arch: Arch
  instructions: number
  cycles: number
  seconds: number
  /** False when it ran past the budget instead of finishing — a counter never stops. */
  finished: boolean
}

/**
 * The same job on every machine, for the strip that compares them.
 *
 * A program that halts is run to its halt. A counter does not halt, so it is
 * run until the board says a whole word has gone round — one increment — which
 * is the only comparable unit of work it has.
 */
export function costs(programId: string, a: number, b: number): Cost[] {
  return ARCHS.map((arch) => {
    const program = programOf(arch, programId)
    const compiled = arch.assemble(program.source)
    if (programId === 'counter') {
      const session = compiled.start(a, b)
      let view = session.view()
      const before = view.board.inA
      // One increment, however each machine gets there: the byte machine writes
      // the register back, the bit machines rotate it past themselves.
      for (let i = 0; i < 4000; i++) {
        session.clock()
        view = session.view()
        const now = view.board.a.reduce((n, bit, k) => n + (bit ? 1 << k : 0), 0)
        if (now === (before + 1) % 16 && view.board.passes % 4 === 0) break
      }
      return { arch, instructions: compiled.code.length, cycles: view.cycles, seconds: view.cycles / arch.hz, finished: true }
    }
    const view = runTo(compiled, a, b)
    return { arch, instructions: compiled.code.length, cycles: view.cycles, seconds: view.cycles / arch.hz, finished: view.halted }
  })
}

/**
 * How long that took, in the largest unit that keeps it readable.
 *
 * The machines on this board are 3 orders of magnitude apart, so a fixed unit
 * prints either 0.000004 s or 8300000 µs and neither reads as a duration. Both
 * the workbench and the routing screen report times, so they report them the
 * same way.
 */
export function tookSeconds(seconds: number): string {
  if (seconds < 0.001) return `${(seconds * 1e6).toFixed(0)} µs`
  if (seconds < 1) return `${(seconds * 1000).toFixed(1)} ms`
  return `${seconds.toFixed(2)} s`
}
