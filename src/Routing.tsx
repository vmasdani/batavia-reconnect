/**
 * One message, one network, and every decision it takes on the way.
 *
 * Era 6 is the era where the network stops being a set of circuits and starts
 * being a *system*: nobody at either end knows the route, and nobody in the
 * middle knows the message. Each node holds a table, answers one question from
 * it, and hands the packet on. This screen is that, slowed down until it can
 * be watched — the frame going onto the message, the table being read, the
 * bits crossing the line, the frame coming back off at the far end.
 *
 * The second thing it shows is the price. The same delivery is modelled on
 * every processor the workbench offers, and the cost of thinking is measured
 * from that machine's own adder rather than asserted, so the strip on the
 * right is reporting the same numbers `npm run check:onebit` proves. With the
 * chip out of the drawer the line is the bottleneck and the thinking is free;
 * with the machine the project can actually build, thinking costs about as
 * much as talking. That is the whole argument of the era, on one screen.
 *
 * All the logic is in `routing.ts`, which knows nothing about React and is
 * checked by `npm run check:routing`.
 */

import { useEffect, useMemo, useState } from 'react'
import { ARCHS, tookSeconds } from './machines'
import {
  CIRCUITS, HEADER_BYTES, LINE_BPS, SITE, circuitKey, deliver, explain, race, tableFor, unframe, type Step,
} from './routing'
import {
  TEMPLATES, asWritten, fieldOf, maxValue, packReadings, packText, unpack,
  type Reading, type Template,
} from './telegram'
import { H, LABEL_BELOW, W, anchorAt, dotSize, xy } from './region'
import { SETTLEMENTS } from './world'
import { UI, type Lang } from './lang'

/** How much slower than real time to play it, so the µs steps can be seen. */
const SPEEDS = [1, 4, 10]

/** The three things a message can be, in the order they are worth seeing. */
const KINDS: Template[] = ['stock', 'weather', 'text']

export function Routing({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const t = UI[lang]
  const [from, setFrom] = useState('batavia')
  const [to, setTo] = useState('bekasi')
  const [template, setTemplate] = useState<Template>('stock')
  const [text, setText] = useState(TEMPLATES.text.text)
  const [readings, setReadings] = useState<Reading[]>(TEMPLATES.stock.readings)
  const [archId, setArchId] = useState('i8051')
  const [down, setDown] = useState<ReadonlySet<string>>(new Set())
  const [slow, setSlow] = useState(4)
  const [at, setAt] = useState(-1)
  const [playing, setPlaying] = useState(false)

  const arch = ARCHS.find((one) => one.id === archId) ?? ARCHS[0]

  // The payload, packed. Everything downstream — the frame, the times, the
  // comparison — is a function of these bytes and nothing else.
  const payload = useMemo(
    () => (template === 'text' ? packText(text) : packReadings(readings)),
    [template, text, readings],
  )
  const delivery = useMemo(() => deliver(from, to, archId, payload, down), [from, to, archId, payload, down])
  const run = useMemo(() => race(from, to, payload, down), [from, to, payload, down])
  const roles = useMemo(() => explain(delivery.bytes), [delivery.bytes])

  // What the far end makes of it, worked out from the bytes rather than from
  // the state that produced them: that is the only way this shows that both
  // ends really do hold the same table.
  const received = useMemo(() => {
    const opened = unframe(delivery.bytes)
    const read = unpack(opened.payload)
    return { ok: opened.ok, said: read.readings.length ? asWritten(read.readings) : read.text }
  }, [delivery.bytes])

  /** The same message spelled out, which is what packing it saves. */
  const written = template === 'text' ? text : asWritten(readings)

  const pick = (next: Template) => {
    setTemplate(next)
    if (next === 'text') setText(TEMPLATES.text.text)
    else setReadings(TEMPLATES[next].readings)
  }

  const setValue = (id: number, value: number) =>
    setReadings(readings.map((one) => (one.id === id ? { ...one, value } : one)))

  // Anything that changes the message changes the run, and a playhead pointing
  // into a route that no longer exists is worse than starting again.
  useEffect(() => {
    setAt(-1)
    setPlaying(false)
  }, [delivery])

  /**
   * How long to hold a step on screen.
   *
   * Simulated time scaled up, then floored: a table lookup on the 8051 takes
   * 16 µs, and there is no playback speed at which that is a thing a person
   * can see. The number printed beside the step is always the real one.
   */
  const hold = (step: Step) => Math.min(4000, Math.max(360, step.seconds * 1000 * slow))

  useEffect(() => {
    if (!playing) return
    const step = delivery.steps[at]
    if (!step) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setAt(at + 1), hold(step))
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, at, delivery, slow])

  const step = at >= 0 ? delivery.steps[at] : undefined
  const done = at >= delivery.steps.length && delivery.steps.length > 0
  const here = step?.at ?? from
  const table = useMemo(() => tableFor(here, down), [here, down])

  // The packet sits where the work is happening, and crosses the line during a
  // send — the transition is the animation, so the dot moves at exactly the
  // pace the step is being held for.
  const dot = xy(step ? (step.kind === 'send' ? step.to! : step.at) : from)
  const moving = step?.kind === 'send'
  const live = step?.kind === 'send' ? circuitKey(step.at, step.to!) : ''

  const send = () => {
    setAt(0)
    setPlaying(true)
  }

  const cut = (key: string) => {
    const next = new Set(down)
    if (!next.delete(key)) next.add(key)
    setDown(next)
  }

  const said = (one: Step) => {
    if (one.kind === 'encode') return `${t.routeEncode} — ${delivery.bytes.length} ${t.routeBytesWord}`
    if (one.kind === 'decode') return t.routeDecode
    if (one.kind === 'send') return `${t.routeSendStep} ${SITE.get(one.to!)!.name}`
    return `${t.routeLookup} ${SITE.get(one.row!.via)!.name}`
  }

  return (
    <div className="sim route">
      <header className="sim__bar">
        <button type="button" className="button" onClick={onExit}>
          ← {t.mainMenu}
        </button>
        <h1 className="sim__title">{t.route}</h1>
        <span className="sim__note">{t.routeNote}</span>
      </header>

      <div className="sim__body route__body">
        <section className="sim__panel route__map-panel">
          <h2>{t.routeNetwork}</h2>
          <svg className="route__map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.routeNetwork}>
            {CIRCUITS.map((circuit) => {
              const key = circuitKey(circuit.a, circuit.b)
              const a = xy(circuit.a)
              const b = xy(circuit.b)
              const state = down.has(key) ? ' is-down' : key === live ? ' is-live' : ''
              return <line key={key} className={`route__line${state}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            })}
            {/* The route the tables picked, drawn under the sites: not a link
                of its own, just which links today's tables agree on. */}
            {(delivery.path ?? []).slice(0, -1).map((node, i) => {
              const a = xy(node)
              const b = xy(delivery.path![i + 1])
              return <line key={node} className="route__chosen" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            })}
            {SETTLEMENTS.map((s) => {
              const p = xy(s.id)
              const mark = s.id === from ? ' is-from' : s.id === to ? ' is-to' : ''
              const anchor = anchorAt(p.x)
              return (
                <g key={s.id} className={`route__site${mark}${s.id === here && at >= 0 ? ' is-here' : ''}`}>
                  <circle cx={p.x} cy={p.y} r={dotSize(s.tier)} />
                  <text
                    x={p.x + (anchor === 'start' ? -4 : anchor === 'end' ? 4 : 0)}
                    y={p.y + (LABEL_BELOW.has(s.id) ? 17 : -9)}
                    textAnchor={anchor}
                  >
                    {s.name}
                  </text>
                </g>
              )
            })}
            {at >= 0 && (
              <g
                className="route__packet"
                style={{
                  transform: `translate(${dot.x}px, ${dot.y}px)`,
                  transitionDuration: `${moving && step ? hold(step) : 140}ms`,
                }}
              >
                <circle r="5" />
              </g>
            )}
          </svg>
        </section>

        <section className="sim__panel">
          <h2>{t.routeMessage}</h2>

          <label className="route__field">
            <span>{t.routeFrom}</span>
            <select value={from} onChange={(event) => setFrom(event.target.value)}>
              {SETTLEMENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="route__field">
            <span>{t.routeTo}</span>
            <select value={to} onChange={(event) => setTo(event.target.value)}>
              {SETTLEMENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <h3>{t.routeTemplate}</h3>
          <div className="sim__picks">
            {KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`sim__pick${kind === template ? ' is-on' : ''}`}
                onClick={() => pick(kind)}
              >
                {t[kind === 'stock' ? 'routeStock' : kind === 'weather' ? 'routeWeather' : 'routeTextKind']}
              </button>
            ))}
          </div>

          {template === 'text' ? (
            <label className="route__field">
              <span>{t.routeText}</span>
              <input
                value={text}
                maxLength={24}
                spellCheck={false}
                // The wire carries 7-bit characters, so the box only accepts
                // what the wire can carry rather than dropping it silently.
                onChange={(event) => setText(event.target.value.replace(/[^\x20-\x7e]/g, ''))}
              />
            </label>
          ) : (
            /* One row per reading. The unit is printed and never sent: it is
               in the codebook, which is the entire point of the codebook. */
            readings.map((reading) => {
              const field = fieldOf(reading.id)!
              return (
                <label key={reading.id} className="route__field route__reading">
                  <span>{field.name}</span>
                  <input
                    type="number"
                    value={reading.value}
                    step={field.step}
                    min={field.signed ? -maxValue(field) : 0}
                    max={maxValue(field)}
                    onChange={(event) => setValue(reading.id, Number(event.target.value))}
                  />
                  <em>{field.unit}</em>
                </label>
              )
            })
          )}

          <h3>{t.routeMachine}</h3>
          <div className="sim__picks">
            {ARCHS.map((one) => (
              <button
                key={one.id}
                type="button"
                className={`sim__pick${one.id === arch.id ? ' is-on' : ''}`}
                onClick={() => setArchId(one.id)}
              >
                {t[one.id === 'move' ? 'simMove' : one.id === 'i8051' ? 'sim8051' : 'simMc']}
              </button>
            ))}
          </div>
          <p className="sim__blurb">
            {t[arch.id === 'move' ? 'simMoveNote' : arch.id === 'i8051' ? 'sim8051Note' : 'simMcNote']}
          </p>

          <div className="sim__buttons">
            <button
              type="button"
              className="button button--primary"
              onClick={playing ? () => setPlaying(false) : send}
              disabled={!delivery.path}
            >
              {playing ? t.routeStop : done ? t.routeAgain : t.routeSend}
            </button>
            <button type="button" className="button" onClick={() => setAt(Math.min(at + 1, delivery.steps.length))} disabled={!delivery.path || playing || done}>
              {t.routeStep}
            </button>
          </div>

          <div className="sim__speed">
            <span>{t.routePlayback}</span>
            {SPEEDS.map((factor) => (
              <button
                key={factor}
                type="button"
                className={`sim__speed-pick${factor === slow ? ' is-on' : ''}`}
                onClick={() => setSlow(factor)}
              >
                {factor === 1 ? t.routeReal : `${factor}×`}
              </button>
            ))}
          </div>

          <h3>{t.routeBytes}</h3>
          {/* Every byte says what it is when you hover it, because the claim
              being made here — that the word "rice" is nowhere on the wire —
              is only worth anything if it can be checked byte by byte. */}
          <p className="route__wire">
            {delivery.bytes.map((byte, i) => (
              <code key={i} className={`is-${roles[i]?.role ?? 'text'}`} title={roles[i]?.what}>
                {byte.toString(16).padStart(2, '0')}
              </code>
            ))}
          </p>
          {/* Free text is already the long way round, so there is nothing to
              strike out: the saving only exists where a codebook does. */}
          <p className="route__saving">
            <strong>{delivery.bytes.length}</strong> {t.routePacked}
            {template !== 'text' && (
              <>
                {' · '}
                <span>
                  {written.length + HEADER_BYTES + 2} {t.routeAsText}
                </span>
              </>
            )}
          </p>
          {template !== 'text' && <p className="route__written">“{written}”</p>}
          <p className="sim__aside">{t.routeFrameNote}</p>
        </section>

        <section className="sim__panel">
          <h2>{t.routeSteps}</h2>
          <ol className="route__steps">
            {delivery.steps.map((one, i) => (
              <li key={i} className={i === at ? 'is-at' : i < at ? 'is-past' : undefined}>
                <span className="route__at">{SITE.get(one.at)!.name}</span>
                <span className="route__what">{said(one)}</span>
                <span className="route__cost">{tookSeconds(one.seconds)}</span>
              </li>
            ))}
          </ol>
          {!delivery.path && <p className="sim__error">{t.routeNoRoute}</p>}
          {done && (
            <p className="sim__sum is-done">
              {t.routeDelivered} “{received.said}” — {SITE.get(to)!.name}, {tookSeconds(delivery.seconds)}
            </p>
          )}
        </section>

        <section className="sim__panel">
          <h2>{t.routeTable}</h2>
          <p className="sim__blurb">{SITE.get(here)!.name}</p>
          {/* Only the first hop is in the table. That is the thing worth
              noticing: no node on the path knows the route, and the row lit up
              is the entire decision that node makes. */}
          <ul className="route__table">
            <li className="is-head">
              <code>{t.routeDest}</code>
              <code>{t.routeVia}</code>
              <span>{t.routeHops}</span>
            </li>
            {table.map((row) => (
              <li key={row.dest} className={row.dest === to ? 'is-on' : undefined}>
                <code>{SITE.get(row.dest)!.name}</code>
                <code>{SITE.get(row.via)!.name}</code>
                <span>{row.hops}</span>
              </li>
            ))}
          </ul>

          <h3>{t.routeRace}</h3>
          <ul className="sim__race">
            {run.map((one) => (
              <li key={one.arch.id} className={one.arch.id === arch.id ? 'is-on' : undefined} title={one.arch.rate}>
                <code>{t[one.arch.id === 'move' ? 'simMove' : one.arch.id === 'i8051' ? 'sim8051' : 'simMc']}</code>
                <span className="sim__race-bar">
                  <span
                    className="route__bar-line"
                    style={{ width: `${(one.lineSeconds / Math.max(...run.map((r) => r.seconds))) * 100}%` }}
                  />
                  <span
                    className="route__bar-think"
                    style={{ width: `${(one.machineSeconds / Math.max(...run.map((r) => r.seconds))) * 100}%` }}
                  />
                </span>
                <span className="sim__race-time">{tookSeconds(one.seconds)}</span>
                <span className="sim__race-size">
                  {t.routeThink} {tookSeconds(one.machineSeconds)}
                </span>
              </li>
            ))}
          </ul>
          <p className="sim__aside">
            {t.routeLine} {tookSeconds(delivery.lineSeconds)} · {t.routeThink} {tookSeconds(delivery.machineSeconds)} ·{' '}
            {LINE_BPS} bit/s
          </p>

          <h3>{t.routeCircuits}</h3>
          <ul className="route__cuts">
            {CIRCUITS.map((circuit) => {
              const key = circuitKey(circuit.a, circuit.b)
              const isDown = down.has(key)
              return (
                <li key={key}>
                  <button type="button" className={`route__cut${isDown ? ' is-down' : ''}`} onClick={() => cut(key)}>
                    {SITE.get(circuit.a)!.name} — {SITE.get(circuit.b)!.name}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="sim__aside">{t.routeAside}</p>
        </section>
      </div>
    </div>
  )
}
