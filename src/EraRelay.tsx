/**
 * The animation every chapter opens with: one message, the whole region.
 *
 * Serang wants to tell Bogor something. The camera sits on Serang, follows the
 * message the eight legs to Bogor, waits with it at every place it has to be
 * handed on, and then says how long the whole thing took. Next chapter, same
 * errand, same nine places — and a smaller number.
 *
 * That repetition is the point. An era's briefing can say "the telegraph was
 * an improvement" and a reader will believe it and feel nothing. Nine days
 * becoming six minutes becoming seventy-four milliseconds, on the same map,
 * with the same eight stops, is the entire arc of the game in one number that
 * changes eight times.
 *
 * The times are in `relay.ts` and are none of this file's business; the camera
 * is a CSS transform transition, so the pan and the message move on the same
 * clock and cannot drift apart. `npm run check:relay` proves the numbers fall
 * every era, which is the one claim the card actually makes.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { H, LABEL_BELOW, W, anchorAt, dotSize, xy } from './region'
import { errandFor, span, type Unit } from './relay'
import { ROADS, SETTLEMENTS } from './world'
import { UI, chaptersIn, type Lang } from './lang'

/**
 * How long each kind of beat is held on screen. Simulated time is not playable,
 * and the line rides in on a typewriter, so each beat has to sit long enough for
 * its words to finish arriving before the camera leaves.
 */
const MOVING = 1300
const WAITING = 800
const OPENING = 1900

/** Milliseconds per character as the line types itself out under the message. */
const TYPE_MS = 26

/** Close enough to read the names, wide enough to see where it is going. */
const ZOOM = 2.6

/**
 * The accent for one era, walked from red at the first chapter to green at the
 * last. The whole card — the trail, the dot, the number the reader carries out
 * — is coloured by how far along the arc this era sits, so nine days in 2030
 * reads as red and a heartbeat in 2068 reads as green without a word about it.
 */
function eraColor(era: number): string {
  const p = Math.max(0, Math.min(1, era / 8))
  return `hsl(${Math.round(4 + p * (142 - 4))} 70% 60%)`
}

/** A beat of the animation: the camera is somewhere, and time is passing. */
interface Beat {
  /** Where the camera looks. Two places means it travels between them. */
  from: string
  to: string
  /** Simulated seconds this beat costs. */
  seconds: number
  /** Wall-clock milliseconds it is held for. */
  hold: number
  kind: 'open' | 'move' | 'wait'
  /** The line under the map. */
  said: string
}

export function EraRelay({ era, lang, onDone }: { era: number; lang: Lang; onDone: () => void }) {
  const t = UI[lang]
  const errand = useMemo(() => errandFor(era, lang), [era, lang])
  const objective = useMemo(() => chaptersIn(lang).find((c) => c.era === era)?.interlude, [era, lang])
  const [at, setAt] = useState(0)
  /** Characters of the current beat's line revealed so far. */
  const [typed, setTyped] = useState(0)

  const name = (id: string) => SETTLEMENTS.find((s) => s.id === id)?.name ?? id

  /**
   * The whole run, worked out before it starts.
   *
   * A leg is two beats and not one: crossing the ground, and then being handed
   * on at the far end. In almost every era the second is the expensive one,
   * and an animation that folded them together would hide the only thing worth
   * noticing about pre-electronic telecommunications.
   */
  const beats = useMemo((): Beat[] => {
    if (!errand) return []
    const out: Beat[] = [
      {
        from: errand.path[0],
        to: errand.path[0],
        seconds: 0,
        hold: OPENING,
        kind: 'open',
        said: t.relayStartLine.replace('%a', name(errand.path[0])).replace('%b', name(errand.path[errand.path.length - 1])),
      },
    ]
    errand.legs.forEach((leg, i) => {
      out.push({
        from: leg.from,
        to: leg.to,
        seconds: leg.travel,
        hold: MOVING,
        kind: 'move',
        said: `${errand.carrier} — ${name(leg.to)}`,
      })
      if (leg.handoff > 0) {
        out.push({ from: leg.to, to: leg.to, seconds: leg.handoff, hold: WAITING, kind: 'wait', said: errand.handoffAt(i) })
      }
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errand, t])

  // A different era is a different run, from the top.
  useEffect(() => setAt(0), [era])

  const done = at >= beats.length
  useEffect(() => {
    if (done || !beats.length) return
    const timer = setTimeout(() => setAt((n) => n + 1), beats[at].hold)
    return () => clearTimeout(timer)
  }, [at, beats, done])

  // The line under the message types itself out, a character at a time, so the
  // words arrive at the pace someone would read them rather than all at once.
  const reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const said = beats.length ? beats[Math.min(at, beats.length - 1)].said : ''
  useEffect(() => setTyped(reduceMotion ? said.length : 0), [at, reduceMotion, said])
  useEffect(() => {
    if (done || typed >= said.length) return
    const timer = setTimeout(() => setTyped((n) => n + 1), TYPE_MS)
    return () => clearTimeout(timer)
  }, [typed, said, done])

  if (!errand) return null

  const beat = beats[Math.min(at, beats.length - 1)]
  // Everything up to and including the beat on screen. The clock is what the
  // message has cost so far, not what it will cost.
  const elapsed = beats.slice(0, Math.min(at + 1, beats.length)).reduce((n, one) => n + one.seconds, 0)
  // While a leg is being crossed the message has not arrived yet, so the line
  // behind it lights and the line under it does not: what is amber is where it
  // has been, which is the only honest reading of a trail.
  const arrived = beat.kind === 'move' && !done ? beat.from : beat.to
  const reached = new Set(errand.path.slice(0, errand.path.indexOf(arrived) + 1))

  // The message goes to the far end of the beat and the camera follows it, so
  // a move and its pan are one transition rather than two that have to agree.
  // At the end the camera pulls back to the whole region — the errand is over,
  // and what the reader should be looking at is how far it went.
  const mark = xy(beat.to)
  const look = done ? { x: W / 2, y: H / 2 } : mark
  const zoom = done ? 1 : ZOOM
  const glide = done ? 700 : beat.kind === 'move' ? beat.hold : 320
  const camera = {
    transform: `translate(${W / 2}px, ${H / 2}px) scale(${zoom}) translate(${-look.x}px, ${-look.y}px)`,
    transitionDuration: `${glide}ms`,
  }

  const total = span(errand.seconds)
  const now = span(elapsed)

  return (
    <div className={`relay${done ? ' is-done' : ''}`} style={{ '--relay-accent': eraColor(era) } as CSSProperties}>
      <header className="relay__bar">
        <p className="relay__era">
          {t.era} {era} <span>·</span> {t.relayErrand}
        </p>
        <p className="relay__carrier">{errand.carrier}</p>
        {!done && (
          <button type="button" className="button relay__skip" onClick={() => setAt(beats.length)}>
            {t.skip}
          </button>
        )}
      </header>

      {/* Centre-top: what this era is actually for. It frames the speed demo —
          the number below is why the thing named here is worth building. */}
      {objective && (
        <div className="relay__intro">
          <p className="relay__intro-label">{t.relayBuildLabel}</p>
          <p className="relay__intro-obj">{objective}</p>
        </div>
      )}

      <div className="relay__stage">
      {/* A margin around the region, because Serang sits on the left edge of
          the projection and its name would be written off the side of it. */}
      <svg className="relay__map" viewBox={`-24 -14 ${W + 48} ${H + 28}`} role="img" aria-label={t.relayErrand}>
        <g className="relay__camera" style={camera}>
          {ROADS.map(([a, b]) => {
            const p = xy(a)
            const q = xy(b)
            return <line key={`${a}|${b}`} className="relay__road" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
          })}
          {/* The part of the errand already done, drawn over the roads: the
              message has been there, and the map should look like it. */}
          {errand.path.slice(0, -1).map((from, i) => {
            const p = xy(from)
            const q = xy(errand.path[i + 1])
            const crossed = reached.has(errand.path[i + 1])
            return (
              <line
                key={from}
                className={`relay__leg${crossed ? ' is-crossed' : ''}`}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
              />
            )
          })}
          {SETTLEMENTS.map((s) => {
            const p = xy(s.id)
            const on = errand.path.includes(s.id)
            const mark = s.id === beat.to && !done ? ' is-here' : reached.has(s.id) ? ' is-past' : ''
            return (
              <g key={s.id} className={`relay__site${on ? ' is-on' : ''}${mark}`}>
                <circle cx={p.x} cy={p.y} r={dotSize(s.tier)} />
                <text x={p.x} y={p.y + (LABEL_BELOW.has(s.id) ? 15 : -9)} textAnchor={anchorAt(p.x)}>
                  {s.name}
                </text>
              </g>
            )
          })}
          <g
            className="relay__message"
            style={{ transform: `translate(${mark.x}px, ${mark.y}px)`, transitionDuration: `${glide}ms` }}
          >
            <circle r="4.5" />
          </g>
        </g>
      </svg>

      {/* The line rides the message, typed out a character at a time so the
          words arrive with it. Keyed on the beat so each one starts fresh. */}
      {!done && (
        <p className="relay__said" key={at}>
          {said.slice(0, typed)}
          {typed < said.length && <span className="relay__caret" aria-hidden="true" />}
        </p>
      )}
      </div>

      {/* The screen goes to black before the verdict, so the number lands on
          nothing but itself rather than over a map still holding the eye. */}
      <div className={`relay__fade${done ? ' is-on' : ''}`} aria-hidden={!done} />

      {done ? (
        <div className="relay__verdict">
          <p className="relay__arrives">{t.relayArrives}</p>
          <p className="relay__number">
            <strong>{total.value}</strong>
            <span>{unitWord(total.unit, t)}</span>
          </p>
          <p className="relay__upshot">{errand.upshot}</p>
          <button type="button" className="button button--primary" onClick={onDone}>
            {t.next}
          </button>
        </div>
      ) : (
        /* The clock stays put while the line above moves with the message: one
           is a running total and should not blink, the other is this beat. */
        <p className="relay__caption">
          <span className="relay__clock">
            {now.value} {unitWord(now.unit, t)}
          </span>
        </p>
      )}
    </div>
  )
}

/** The unit as a word, which is the only part of a duration that translates. */
function unitWord(unit: Unit, t: (typeof UI)['en']): string {
  return unit === 'ms'
    ? t.relayUnitMs
    : unit === 'sec'
      ? t.relayUnitSec
      : unit === 'min'
        ? t.relayUnitMin
        : unit === 'hour'
          ? t.relayUnitHour
          : t.relayUnitDay
}
