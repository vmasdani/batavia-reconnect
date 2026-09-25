/**
 * Three processors on one board, one clock at a time.
 *
 * Era 7 hands the network to a machine with almost nothing in it and says that
 * is enough. This is where that is shown rather than asserted. Three processors
 * drive the same shift registers — the MC14500B, a real chip from 1977; the
 * MOVE machine, which is what is left when you delete everything that needs a
 * factory; and the Intel 8051, which is what was in the drawer before the
 * drawer ran out — so the listings can be read against each other, and the
 * strip under the clock says what each of them cost.
 *
 * A button labelled "clock" advances the machine by one instruction. On the
 * 1-bit machines that is also one clock edge; on the 8051 an instruction is 1
 * or 2 machine cycles, which is why the time on screen comes from cycles and
 * not from clicks. Everything the machines do is in `onebit.ts`, `mc14500.ts`,
 * `move.ts` and `i8051.ts`, none of which know that React exists;
 * `npm run check:onebit` proves every adder over every input pair.
 *
 * The running machine is a ref rather than state: a board has one set of
 * flip-flops, not a fresh one per render, and running at 4 Hz should not
 * allocate a machine every quarter second.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { ARCHS, costs, programOf, tookSeconds } from './machines'
import {
  AssemblyError,
  WIDTH,
  readByte,
  readPin,
  valueOf,
  type Compiled,
  type Session,
  type View,
} from './onebit'
import { UI, type Lang } from './lang'

/** How fast the automatic clock runs. The middle one is the default. */
const SPEEDS = [250, 1000, 2000]

export function Simulator({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const t = UI[lang]
  const [archId, setArchId] = useState(ARCHS[0].id)
  const [programId, setProgramId] = useState('adder')
  const arch = ARCHS.find((one) => one.id === archId) ?? ARCHS[0]
  const program = programOf(arch, programId)

  const [source, setSource] = useState(program.source)
  const [a, setA] = useState(0b1011)
  const [b, setB] = useState(0b0110)
  const [speed, setSpeed] = useState(1000)
  const [running, setRunning] = useState(false)

  // Picking a machine or a program loads its listing. Anything typed into the
  // box is thereby thrown away, which is the correct reading of "give me the
  // counter" and the reason the picker is not also an undo.
  const load = (nextArch: string, nextProgram: string) => {
    setArchId(nextArch)
    setProgramId(nextProgram)
    setSource(programOf(ARCHS.find((one) => one.id === nextArch) ?? ARCHS[0], nextProgram).source)
  }

  /**
   * The assembled program, or the reason it would not assemble.
   *
   * Kept as a value rather than thrown: a half-typed instruction is the normal
   * state of a program being written, and the machine beside it should keep its
   * last good listing rather than the screen going blank.
   */
  const built = useMemo((): { code: Compiled; error?: undefined } | { code?: undefined; error: AssemblyError } => {
    try {
      return { code: arch.assemble(source) }
    } catch (err) {
      return { error: err instanceof AssemblyError ? err : new AssemblyError(String(err), 0) }
    }
  }, [arch, source])

  const session = useRef<Session | null>(null)
  const [view, setView] = useState<View | null>(null)

  const reset = () => {
    session.current = built.code ? built.code.start(a, b) : null
    setRunning(false)
    setView(session.current?.view() ?? null)
  }

  // A retyped program, or new operands, is a different machine: a program
  // counter pointing into code that no longer exists is worse than a restart.
  useEffect(reset, [built.code, a, b])

  const tick = () => {
    session.current?.clock()
    const next = session.current?.view() ?? null
    setView(next ? { ...next } : null)
    if (next?.halted) setRunning(false)
  }

  useEffect(() => {
    if (!running) return
    const timer = setInterval(tick, speed)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed])

  // Cheap enough to work out on every render — 3 short programs, run to a halt
  // — and it has to follow the operands, which change under the buttons.
  const race = useMemo(() => costs(program.id, a, b), [program.id, a, b])
  const longest = Math.max(...race.map((cost) => Math.log10(cost.seconds * 1e6)), 1)

  const listing = built.code?.code ?? []
  const at = view ? listing[view.pc] : undefined
  const answer = view ? program.summary(view) : undefined
  const stuck = !view || view.halted

  return (
    <div className="sim">
      <header className="sim__bar">
        <button type="button" className="button" onClick={onExit}>
          ← {t.mainMenu}
        </button>
        <h1 className="sim__title">{t.sim}</h1>
        <span className="sim__note">{t.simNote}</span>
      </header>

      <div className="sim__body">
        <section className="sim__panel sim__code">
          <div className="sim__picks">
            {ARCHS.map((one) => (
              <button
                key={one.id}
                type="button"
                className={`sim__pick${one.id === arch.id ? ' is-on' : ''}`}
                onClick={() => load(one.id, programId)}
              >
                {t[one.id === 'move' ? 'simMove' : one.id === 'i8051' ? 'sim8051' : 'simMc']}
              </button>
            ))}
            <span className="sim__picks-gap" />
            {arch.programs.map((one) => (
              <button
                key={one.id}
                type="button"
                className={`sim__pick${one.id === program.id ? ' is-on' : ''}`}
                onClick={() => load(arch.id, one.id)}
              >
                {t[one.id === 'counter' ? 'simCounter' : 'simAdder']}
              </button>
            ))}
          </div>
          <p className="sim__blurb">{t[arch.id === 'move' ? 'simMoveNote' : arch.id === 'i8051' ? 'sim8051Note' : 'simMcNote']}</p>

          {/* The listing and the editor are the same program, one above the
              other: the listing is what you read while it runs, and the moment
              you want to change it you are already looking at the right lines. */}
          <ol className="sim__listing">
            {listing.map((instruction, i) => (
              <li key={i} className={view && i === view.pc && !view.halted ? 'is-at' : undefined}>
                <span className="sim__addr">{String(i).padStart(2, '0')}</span>
                <code>{instruction.text}</code>
              </li>
            ))}
          </ol>

          <label className="sim__editor">
            <span>{t.simSource}</span>
            <textarea spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)} rows={12} />
          </label>
          {built.error && (
            <p className="sim__error">
              {t.simLine} {built.error.line}: {built.error.message}
            </p>
          )}

          <details className="sim__words">
            <summary>{t.simWords}</summary>
            <ul>
              {arch.words.map((word) => (
                <li key={word.name}>
                  <code>{word.name}</code>
                  <span>{word.what}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="sim__panel sim__machine">
          <h2>{t.simMachine}</h2>

          <div className="sim__regs">
            {(view?.lamps ?? []).map((lamp) => (
              <span key={lamp.label} className={`sim__lamp${lamp.on ? ' is-on' : ''}`} title={lamp.hint}>
                <span className="sim__lamp-dot" />
                {lamp.label}
              </span>
            ))}
          </div>

          <p className="sim__now">
            <span className="sim__addr">{String(view?.pc ?? 0).padStart(2, '0')}</span>
            <code>{view?.halted ? '—' : (at?.text ?? '—')}</code>
            <span className="sim__clocks">
              {view?.clocks ?? 0} {t.simClocks} · {took(view?.cycles ?? 0, arch.hz)}
            </span>
          </p>

          <h3>{t.simRegisters}</h3>
          <Register label="A" bits={view?.board.a ?? []} note={`${valueOf(view?.board.a ?? [])}`} />
          <Register label="B" bits={view?.board.b ?? []} note={`${valueOf(view?.board.b ?? [])}`} />
          <Register label="SUM" bits={view?.board.sum ?? []} note={`${valueOf(view?.board.sum ?? [])}`} />

          {answer && (
            <p className={`sim__sum${answer.done ? ' is-done' : ''}`}>
              {answer.text}
              {answer.wrong && <em> ({t.simWrong})</em>}
            </p>
          )}

          <h3>{arch.ports ? t.simPorts : t.simPins}</h3>
          {/* A bit machine addresses bits and a byte machine addresses latches.
              Showing the wrong one would be the screen lying about the chip. */}
          <ul className="sim__pins">
            {arch.pins.map((pin) => {
              const on = view ? readPin(view.board, pin.name) : false
              return (
                <li key={pin.name} title={pin.what}>
                  <span className={`sim__bit${on ? ' is-on' : ''}`}>{on ? '1' : '0'}</span>
                  <code>{pin.name}</code>
                  <span className="sim__kind">{pin.kind}</span>
                </li>
              )
            })}
            {(arch.ports ?? []).map((port) => (
              <li key={port.name} title={port.what}>
                <span className="sim__byte">{view ? readByte(view.board, port.name) : 0}</span>
                <code>{port.name}</code>
                <span className="sim__kind">byte</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sim__panel sim__controls">
          <h2>{t.simControls}</h2>

          <div className="sim__buttons">
            <button type="button" className="button button--primary" onClick={tick} disabled={stuck}>
              {t.simClock}
            </button>
            <button type="button" className="button" onClick={() => setRunning(!running)} disabled={stuck}>
              {running ? t.simStop : t.simRun}
            </button>
            <button type="button" className="button" onClick={reset}>
              {t.simReset}
            </button>
          </div>

          <div className="sim__speed">
            <span>{t.simSpeed}</span>
            {SPEEDS.map((ms) => (
              <button
                key={ms}
                type="button"
                className={`sim__speed-pick${ms === speed ? ' is-on' : ''}`}
                onClick={() => setSpeed(ms)}
              >
                {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
              </button>
            ))}
          </div>

          <h3>{t.simInputs}</h3>
          <Dial label="A" value={a} onChange={setA} />
          <Dial label="B" value={b} onChange={setB} />

          <h3>{t.simRace}</h3>
          {/* The same program on all 3 machines. This is the argument the
              screen exists to make, and it is measured, not asserted. */}
          <ul className="sim__race">
            {race.map((cost) => (
              <li key={cost.arch.id} className={cost.arch.id === arch.id ? 'is-on' : undefined} title={cost.arch.rate}>
                <code>{t[cost.arch.id === 'move' ? 'simMove' : cost.arch.id === 'i8051' ? 'sim8051' : 'simMc']}</code>
                <span className="sim__race-bar">
                  <span style={{ width: `${Math.max(2, (Math.log10(cost.seconds * 1e6) / longest) * 100)}%` }} />
                </span>
                <span className="sim__race-time">{took(cost.cycles, cost.arch.hz)}</span>
                <span className="sim__race-size">
                  {cost.instructions} {t.simInstructions}
                </span>
              </li>
            ))}
          </ul>

          <p className="sim__aside">{t.simAside}</p>
        </section>
      </div>
    </div>
  )
}

/** Cycles are what a machine charges; seconds are what a person reads. */
function took(cycles: number, hz: number): string {
  return tookSeconds(cycles / hz)
}

/** A shift register, bottom bit on the right, the way the number is written. */
function Register({ label, bits, note }: { label: string; bits: boolean[]; note: string }) {
  return (
    <div className="sim__reg">
      <span className="sim__reg-name">{label}</span>
      <span className="sim__reg-bits">
        {[...bits].reverse().map((bit, i) => (
          <span key={i} className={`sim__bit${bit ? ' is-on' : ''}`}>
            {bit ? '1' : '0'}
          </span>
        ))}
      </span>
      <span className="sim__reg-note">{note}</span>
    </div>
  )
}

/** Set an operand by its bits, because bits are what the machine is going to see. */
function Dial({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <div className="sim__reg">
      <span className="sim__reg-name">{label}</span>
      <span className="sim__reg-bits">
        {Array.from({ length: WIDTH }, (_, i) => WIDTH - 1 - i).map((bit) => (
          <button
            key={bit}
            type="button"
            className={`sim__bit sim__bit--set${(value >> bit) & 1 ? ' is-on' : ''}`}
            onClick={() => onChange(value ^ (1 << bit))}
          >
            {(value >> bit) & 1}
          </button>
        ))}
      </span>
      <span className="sim__reg-note">{value}</span>
    </div>
  )
}
