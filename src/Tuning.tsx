/**
 * Era 1 — the tuning bench, on screen.
 *
 * One slider, one meter, one picture, one button. Drag until the meter climbs,
 * stop on the peak, lock it in. The rules are in `tuning.ts` and the physics in
 * `sim.ts`; nothing here decides anything.
 *
 * The picture is the reason this is worth stopping for. It is drawn in units of
 * *reach* rather than kilometres, which is what makes one strip true for every
 * neighbour whatever its mast height — and it is the only place in the game
 * where the skip zone is a hole you can watch a settlement fall into.
 */

import { useMemo, useState } from 'react'
import { useGame } from './store'
import { PARTY } from './party'
import { BAND_MAX, BAND_ZONES, carry, reachMetres } from './sim'
import {
  DIAL_HIGH,
  DIAL_LOW,
  DIAL_STEP,
  GROUND_TOP,
  SKY_BOTTOM,
  autoTuning,
  bandAt,
  carriersOf,
  signalAt,
  tuningFor,
  type TuningSeat,
} from './tuning'

export function TuningBench() {
  const seat = useGame((s) => s.tunings[0] ?? null)
  const queued = useGame((s) => s.tunings.length)
  const settle = useGame((s) => s.settleTuning)
  if (!seat) return null
  // Keyed on the site, so the next set coming up is a fresh bench rather than
  // the last one with the dial left where it was.
  return <Bench key={seat.target} seat={seat} queued={queued} onDone={settle} />
}

function Bench({
  seat,
  queued,
  onDone,
}: {
  seat: TuningSeat
  queued: number
  onDone: (tuning: ReturnType<typeof tuningFor>) => void
}) {
  const carriers = useMemo(() => carriersOf(seat.target), [seat.target])
  const [khz, setKhz] = useState(DIAL_LOW)
  const signal = signalAt(carriers, khz)
  const band = bandAt(khz)
  const member = PARTY.find((m) => m.id === seat.memberId)

  return (
    <div className="modal-backdrop modal-backdrop--over">
      <div className="modal modal--bench">
        <header className="bench__head">
          {member && <img className="bench__who" src={member.portrait} alt={member.name} width={40} height={40} />}
          <div>
            <h2>{seat.targetName}</h2>
            <p className="bench__lead">The set is powered. Net it onto a channel before it transmits.</p>
          </div>
          <span className="bench__khz">
            <strong>{khz}</strong>
            kHz
          </span>
        </header>

        {/* The meter. Nothing marks the carrier: finding it is the job. */}
        <div className="bench__meter" aria-label="signal">
          <div className="bench__meter-fill" style={{ width: `${Math.round(signal * 100)}%` }} />
          <span className="bench__meter-word">
            {signal >= 0.95 ? 'locked' : signal >= 0.6 ? 'carrier' : signal >= 0.2 ? 'something there' : 'hiss'}
          </span>
        </div>

        <div className="bench__dial">
          <input
            type="range"
            min={DIAL_LOW}
            max={DIAL_HIGH}
            step={DIAL_STEP}
            value={khz}
            onChange={(event) => setKhz(Number(event.target.value))}
          />
          {/* Which half of the dial you are in is the strategic half of this
              decision, so it is labelled outright. Where the carrier sits
              inside that half is not. */}
          <div className="bench__halves">
            <span className={band === 'ground' ? 'is-on' : undefined}>
              ground wave<em>{DIAL_LOW}–{GROUND_TOP}</em>
            </span>
            <span className={band === 'sky' ? 'is-on' : undefined}>
              sky wave<em>{SKY_BOTTOM}–{DIAL_HIGH}</em>
            </span>
          </div>
        </div>

        <Reach seat={seat} band={band} />

        <div className="modal__buttons">
          <button type="button" className="button" onClick={() => onDone(autoTuning(seat))}>
            Let the operator do it
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => onDone(tuningFor(seat, khz))}
          >
            {queued > 1 ? `Lock it in (${queued - 1})` : 'Lock it in'}
          </button>
        </div>
      </div>
    </div>
  )
}

const W = 340
const H = 52
const X0 = 8
const X1 = W - 8
const AXIS = 34

const ZONE_FILL = { day: '#6ee7b7', night: '#ffb347', dead: '#ff6a5a', off: '#ff6a5a' } as const
/** What each stripe of colour means, said once so the picture teaches itself. */
const ZONE_WORD = { day: 'daylight', night: 'after dark', dead: 'skips over' } as const
/** And what it means for one particular circuit out of this site. */
const LEG_WORD = {
  day: 'all day',
  night: 'after dark',
  dead: 'skipped over',
  off: 'other band',
} as const

/**
 * What this band does, and where each of this site's circuits falls in it.
 *
 * The axis is multiples of the circuit's own reach, so a neighbour with a tall
 * mast sits nearer the middle than one with a short mast at the same distance
 * — which is exactly the fact the player is being asked to trade against.
 */
function Reach({ seat, band }: { seat: TuningSeat; band: 'ground' | 'sky' }) {
  const x = (units: number) => X0 + (Math.min(units, BAND_MAX) / BAND_MAX) * (X1 - X0)
  const zones = BAND_ZONES[band]

  const legs = seat.neighbours.map((n) => {
    const reach = reachMetres(seat.metres, n.metres)
    const got = carry(band, n.km, reach)
    // Two different ways to lose a circuit, and the player has to be able to
    // tell them apart: the signal steps over them, or it arrives at a set
    // listening on the other half of the dial.
    const offChannel = n.live && !n.holdsBoth && n.band !== band
    return {
      ...n,
      units: n.km / reach,
      kind: offChannel ? 'off' : got ? (got.nightOnly ? 'night' : 'day') : 'dead',
    } as const
  })

  const skipped = legs.filter((l) => l.kind === 'dead')
  const off = legs.filter((l) => l.kind === 'off')
  const names = (list: typeof legs) => list.map((l) => l.name).join(' and ')
  const note = skipped.length
    ? `Steps clean over ${names(skipped)}.`
    : off.length
      ? `${names(off)} ${off.length > 1 ? 'are' : 'is'} already up on the other band, and will not hear this.`
      : band === 'sky'
        ? 'Every circuit still lands — and the far ones land harder.'
        : 'Every circuit this site carries lands.'

  return (
    <div className="bench__reach">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${band} wave coverage`}>
        {zones.map((zone, i) => {
          const from = i === 0 ? 0 : zones[i - 1].to
          return (
            <g key={zone.kind + i}>
              <rect
                x={x(from)}
                y={AXIS - 11}
                width={x(zone.to) - x(from)}
                height={22}
                fill={ZONE_FILL[zone.kind]}
                opacity={zone.kind === 'dead' ? 0.16 : 0.22}
              />
              <text
                x={(x(from) + x(zone.to)) / 2}
                y={AXIS - 17}
                textAnchor="middle"
                fontSize={8.5}
                letterSpacing={0.6}
                fill={ZONE_FILL[zone.kind]}
                opacity={0.85}
              >
                {ZONE_WORD[zone.kind]}
              </text>
            </g>
          )
        })}
        {/* Past the last zone there is simply nothing, and an empty strip says
            that better than another block of colour. */}
        <line x1={X0} y1={AXIS + 11} x2={X1} y2={AXIS + 11} stroke="var(--edge)" strokeWidth={1} />

        {legs.map((leg) => (
          <g key={leg.id} transform={`translate(${x(leg.units)} 0)`}>
            <line y1={AXIS - 11} y2={AXIS + 11} stroke={ZONE_FILL[leg.kind]} strokeWidth={2} />
            {/* Hollow for off channel: the propagation is fine, the station
                is not listening here. */}
            <circle
              cy={AXIS}
              r={3.4}
              fill={leg.kind === 'off' ? 'none' : ZONE_FILL[leg.kind]}
              stroke={ZONE_FILL[leg.kind]}
              strokeWidth={leg.kind === 'off' ? 1.6 : 0}
            />
          </g>
        ))}
      </svg>
      {/* Names go under the picture rather than on it. Two circuits of similar
          length land on the same millimetre of a strip this narrow, and the
          first version had them overlapping and running off the left edge. */}
      <ul className="bench__legs">
        {legs.map((leg) => (
          <li key={leg.id} className={`bench__leg is-${leg.kind}`}>
            <span className="bench__leg-dot" aria-hidden />
            {leg.name}
            <em>{LEG_WORD[leg.kind]}</em>
          </li>
        ))}
      </ul>
      <p className="bench__reach-note">{note}</p>
    </div>
  )
}
