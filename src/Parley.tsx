/**
 * Era 0 — the exchange at the gate, on screen.
 *
 * The rules are in `parley.ts` and none of them are here. One line saying what
 * this village needs, four things the crew could offer, and one click.
 *
 * Deliberately the smallest screen in the era. The player reaches it in the
 * middle of planning who walks where and where the wood goes, so it has to be
 * readable in a glance and finished in one — an earlier version asked them to
 * decode two clues and spend three offers against a running score, which is a
 * game to sit down with rather than a stop on the way through a day.
 */

import { useMemo, useState } from 'react'
import { useGame } from './store'
import { SURVEY_CREW } from './era0'
import type { Lang } from './lang'
import {
  CARDS,
  blindCard,
  isRight,
  openParley,
  parleyResult,
  parleyText,
  playCard,
  rationsCost,
  type ParleySeat,
} from './parley'

export function ParleyDialog({ lang }: { lang: Lang }) {
  const seat = useGame((s) => s.parleys[0] ?? null)
  const queued = useGame((s) => s.parleys.length)
  const settle = useGame((s) => s.settleParley)
  if (!seat) return null
  // Keyed on the seat, so walking into the next gate is a fresh table rather
  // than the last one with its offer cleared — three people can be at three
  // different gates on the same night.
  return (
    <Exchange
      key={`${seat.memberId}|${seat.target}|${seat.attempts}`}
      seat={seat}
      queued={queued}
      lang={lang}
      onDone={settle}
    />
  )
}

function Exchange({
  seat,
  queued,
  lang,
  onDone,
}: {
  seat: ParleySeat
  queued: number
  lang: Lang
  onDone: (result: ReturnType<typeof parleyResult>) => void
}) {
  const text = useMemo(() => parleyText(lang), [lang])
  const [state, setState] = useState(() => openParley(seat))
  const [auto, setAuto] = useState(false)
  const member = SURVEY_CREW.find((m) => m.id === seat.memberId)
  const picked = state.picked
  const won = picked !== null && isRight(state, picked)

  return (
    <div className="modal-backdrop modal-backdrop--over">
      <div className="modal modal--parley">
        <header className="parley__head">
          {member && (
            <img className="parley__who" src={member.portrait} alt={member.name} width={40} height={40} />
          )}
          <div>
            <h2>{seat.targetName}</h2>
            <p className="parley__lead">{text.lead}</p>
          </div>
        </header>

        {/* What they need. The whole puzzle, said plainly. */}
        <p className="parley__tell">{text.wants[state.want]}</p>

        {picked === null ? (
          <div className="parley__hand">
            {CARDS.map((id) => (
              <button
                key={id}
                type="button"
                className="parley__card"
                onClick={() => setState(playCard(state, id))}
              >
                <span className="parley__card-label">{text.cards[id].label}</span>
                <span className="parley__card-note">{text.cards[id].note}</span>
                {/* The two offers that name something outside themselves: where
                    a courier would go, and what a sack costs the store. */}
                {id === 'letter' && <span className="parley__card-where">{seat.kinName}</span>}
                {id === 'rations' && (
                  <span className="parley__card-where">−{rationsCost(seat.rations)}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className={`parley__said parley__said--${won ? 'good' : 'bad'}`}>
              <span className="parley__said-card">{text.cards[picked].label}</span>
              {text.replies[picked][won ? 'good' : 'bad']}
            </p>
            <p className={`parley__verdict${won ? ' is-good' : ''}`}>
              {won ? text.verdict.talking : text.verdict.wary}
              {auto && <em> {text.autoNote}</em>}
            </p>
          </>
        )}

        <div className="modal__buttons">
          {picked === null ? (
            <button
              type="button"
              className="button"
              title={text.handOverNote}
              onClick={() => {
                setAuto(true)
                setState(playCard(state, blindCard(state)))
              }}
            >
              {text.handOver}
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              onClick={() => onDone(parleyResult(state, auto))}
            >
              {queued > 1 ? `${text.done} (${queued - 1})` : text.done}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
