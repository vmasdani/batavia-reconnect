/**
 * The dialogue player, shared by skits and story mode.
 *
 * One line at a time under a strip of portraits, revealed a character at a
 * time. The whole surface advances: these are read by tapping through them,
 * not by hunting for a "next" control, and the first tap finishes the current
 * line rather than skipping it so a fast reader never loses text.
 *
 * It owns the typing and the keys and nothing else. Where the lines come from,
 * what sits behind them and what happens at the end are the caller's business.
 */

import { useEffect, useRef, useState } from 'react'
import { castById, castColor, portraitAt, type CastMember } from './cast'
import { TermText } from './Glossary'

/** Milliseconds per character. Fast enough to read past, slow enough to hear. */
const TYPE_MS = 18

/** Keys this player answers to. Everything else belongs to the page. */
const HANDLED = new Set([' ', 'Enter', 'Escape'])

/** A focused button already turns these keys into a click; leave it alone. */
const fromControl = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('button') !== null

export interface DialogueLine {
  /** A cast id from `cast.ts`, or `narrator`. */
  who: string
  text: string
}

interface DialogueProps {
  /** Everyone whose portrait stands in the strip, in the order they stand. */
  cast: string[]
  lines: DialogueLine[]
  index: number
  /** Shown small above the speaker's name — the skit's or chapter's title. */
  label?: string
  onAdvance: () => void
  onClose: () => void
  /** Text on the button when the last line has finished revealing. */
  endLabel?: string
  closeLabel?: string
  /** Mid-scene button text. Translated by story mode; skits keep the default. */
  nextLabel?: string
  showLabel?: string
  /** `story` stands the cast taller; the map is not behind them there. */
  variant?: 'skit' | 'story'
  /** Which era this scene is in, so the founders age. See `portraitAt`. */
  era?: number
}

function Portrait({ member, speaking, era }: { member: CastMember; speaking: boolean; era: number }) {
  const className = `dialogue__portrait${speaking ? ' is-speaking' : ''}`
  const style = speaking ? { borderColor: castColor(member.id) } : undefined
  const portrait = portraitAt(member, era)
  if (portrait) {
    return <img className={className} src={portrait} alt={member.name} style={style} />
  }
  // Nobody has drawn them yet. The emoji stands in the same box at the same
  // size, so swapping a portrait in later changes nothing else.
  return (
    <span className={`${className} dialogue__portrait--emoji`} style={style} title={member.name}>
      {member.emoji ?? '🙂'}
    </span>
  )
}

export function Dialogue({
  cast,
  lines,
  index,
  label,
  onAdvance,
  onClose,
  endLabel = 'End',
  closeLabel = 'skip',
  nextLabel = 'Next',
  showLabel = 'Show',
  variant = 'skit',
  era = 0,
}: DialogueProps) {
  const [shown, setShown] = useState(0)
  /** Keys currently held that were pressed while this player was mounted. */
  const armed = useRef(new Set<string>())

  const line = lines[index]
  const full = line?.text ?? ''

  // Reveal the line a character at a time, restarting whenever the line does.
  useEffect(() => {
    setShown(0)
    if (!full) return
    const timer = window.setInterval(() => {
      setShown((n) => {
        if (n >= full.length) {
          window.clearInterval(timer)
          return n
        }
        return n + 1
      })
    }, TYPE_MS)
    return () => window.clearInterval(timer)
  }, [full])

  const done = shown >= full.length
  const last = index + 1 >= lines.length
  // First tap finishes the line rather than skipping it.
  const tap = () => (done ? onAdvance() : setShown(full.length))

  // Keys act on release, and only for a press this player saw itself.
  //
  // Advancing on keydown means a held Space auto-repeats at ~30 ms and walks
  // the whole scene in a second, which is not a skip anybody asked for. One
  // press must be one advance no matter how long it is held, so the press only
  // arms the key and the release fires it. Requiring the arm also swallows the
  // release of whatever keypress opened this dialogue in the first place.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!HANDLED.has(event.key)) return
      if (fromControl(event.target)) return
      if (event.key !== 'Escape') event.preventDefault()
      // Auto-repeat is exactly what is being refused here.
      if (event.repeat) return
      armed.current.add(event.key)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (!armed.current.delete(event.key)) return
      if (event.key === 'Escape') onClose()
      else if (shown < full.length) setShown(full.length)
      else onAdvance()
    }
    // Alt-tabbing away mid-press would otherwise leave the key armed forever.
    const disarm = () => armed.current.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', disarm)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', disarm)
    }
  }, [shown, full, onAdvance, onClose])

  if (!line) return null

  const speaker = castById(line.who)
  const narrating = line.who === 'narrator'

  return (
    <div className={`dialogue dialogue--${variant}`} onClick={tap}>
      <div className="dialogue__stage">
        {/*
          Narration has no speaker, so nobody stands over it. The strip itself
          stays, empty: story mode centres the stage vertically, so a strip that
          collapsed would shift the box half its height on every narration line
          and back again — a jump on most lines of most scenes.
        */}
        <div className="dialogue__cast">
          {!narrating &&
            cast.map((id) => {
              const member = castById(id)
              if (!member) return null
              return <Portrait key={id} member={member} speaking={id === line.who} era={era} />
            })}
        </div>

        <div
          className={`dialogue__box${narrating ? ' dialogue__box--alone' : ''}`}
          onClick={(event) => event.stopPropagation()}
          role="presentation"
        >
          <div className="dialogue__head">
            <span className="dialogue__who" style={{ color: castColor(line.who) }}>
              {narrating ? '' : (speaker?.name ?? line.who)}
            </span>
            {label && <span className="dialogue__label">{label}</span>}
            <button
              type="button"
              className="dialogue__close"
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
            >
              {closeLabel}
            </button>
          </div>

          <p className={`dialogue__text${narrating ? ' is-narration' : ''}`} onClick={tap}>
            <TermText text={full} upTo={shown} />
            <span className="dialogue__caret" aria-hidden />
          </p>

          <div className="dialogue__foot">
            <span className="dialogue__progress">
              {index + 1} / {lines.length}
            </span>
            <button type="button" className="button button--primary dialogue__next" onClick={tap}>
              {done ? (last ? endLabel : nextLabel) : showLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
