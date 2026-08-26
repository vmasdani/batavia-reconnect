/**
 * Story mode: the whole arc with no gameplay under it.
 *
 * A chapter runs in four beats — title card, opening dialogue, a card naming
 * the work, closing dialogue — which is the shape a played era has. The middle
 * card stands where that era's gameplay will, so reading the script front to
 * back feels like the pacing of the finished game rather than one long scene.
 *
 * Cards are the only place the era number and year appear, so the forty-one
 * years the project takes are legible as you walk through them; that span is
 * the point of the ending.
 *
 * The era list stays reachable at all times because this is a draft that gets
 * re-read out of order far more often than it gets played start to finish.
 */

import { useEffect, useMemo, useState } from 'react'
import { Dialogue } from './Dialogue'
import { castOf, type Chapter } from './story'
import { Backdrop } from './backdrops'
import { TermText } from './Glossary'
import { LangPicker } from './LangPicker'
import { UI, chaptersIn, type Lang } from './lang'

/** Where in a chapter the reader is. Halves are dialogue; the rest are cards. */
type Beat = 'title' | 'opening' | 'work' | 'closing'

/**
 * A full-bleed title card: era, year, name, and one line of premise.
 *
 * Exported because a playable era opens with the same card before its own
 * chapter plays — see `EraOpening.tsx`. There should be one of these, not two
 * that drift apart.
 */
export function Card({
  era,
  eyebrow,
  title,
  body,
  action,
  onAction,
}: {
  era: number
  eyebrow: React.ReactNode
  title: string
  body: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="story-card" onClick={onAction}>
      <Backdrop era={era} />
      <p className="story-card__era">{eyebrow}</p>
      <h1 className="story-card__title">{title}</h1>
      <p className="story-card__premise">
        <TermText text={body} />
      </p>
      <button type="button" className="button button--primary story-card__begin" onClick={onAction}>
        {action}
      </button>
    </div>
  )
}

function EndCard({
  lang,
  onRestart,
  onExit,
}: {
  lang: Lang
  onRestart: () => void
  onExit: () => void
}) {
  const t = UI[lang]
  return (
    <div className="story-card">
      <Backdrop era={7} />
      <p className="story-card__era">2027 <span>·</span> 2068</p>
      <h1 className="story-card__title">{t.endTitle}</h1>
      <p className="story-card__premise">{t.endPremise}</p>
      <div className="story-card__buttons">
        <button type="button" className="button" onClick={onRestart}>{t.readAgain}</button>
        <button type="button" className="button button--primary" onClick={onExit}>{t.mainMenu}</button>
      </div>
    </div>
  )
}

export function Story({
  lang,
  onLang,
  onExit,
}: {
  lang: Lang
  onLang: (lang: Lang) => void
  onExit: () => void
}) {
  const [chapter, setChapter] = useState(0)
  const [beat, setBeat] = useState<Beat>('title')
  const [line, setLine] = useState(0)
  const [ended, setEnded] = useState(false)

  const t = UI[lang]
  const chapters = useMemo(() => chaptersIn(lang), [lang])
  const current: Chapter = chapters[chapter]
  const speaking = beat === 'opening' || beat === 'closing'
  const lines = beat === 'closing' ? current.closing : current.opening

  // Escape leaves the mode from a card; while dialogue is up, Dialogue's own
  // handler owns Escape and steps back to the card instead.
  useEffect(() => {
    if (speaking) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [speaking, onExit])

  const open = (index: number, at: Beat = 'title') => {
    setEnded(false)
    setChapter(index)
    setBeat(at)
    setLine(0)
  }

  const start = (at: Beat) => {
    setBeat(at)
    setLine(0)
  }

  const advance = () => {
    if (line + 1 < lines.length) {
      setLine(line + 1)
      return
    }
    if (beat === 'opening') {
      setBeat('work')
      return
    }
    if (chapter + 1 < chapters.length) open(chapter + 1)
    else setEnded(true)
  }

  return (
    <div className="story">
      <header className="story__bar">
        <button type="button" className="button story__back" onClick={onExit}>
          ← {t.mainMenu}
        </button>
        <ol className="story__eras">
          {chapters.map((c, i) => (
            <li key={c.era}>
              <button
                type="button"
                className={`story__era${i === chapter && !ended ? ' is-current' : ''}`}
                onClick={() => open(i)}
                title={`${c.title} — ${c.year}`}
              >
                {c.era}
              </button>
            </li>
          ))}
        </ol>
        <span className="story__note">{t.draft}</span>
        <LangPicker lang={lang} onPick={onLang} />
      </header>

      {ended ? (
        <EndCard lang={lang} onRestart={() => open(0)} onExit={onExit} />
      ) : beat === 'title' ? (
        <Card
          era={current.era}
          eyebrow={<>{t.era} {current.era} <span>·</span> {current.year}</>}
          title={current.title}
          body={current.premise}
          action={t.begin}
          onAction={() => start('opening')}
        />
      ) : beat === 'work' ? (
        <Card
          era={current.era}
          eyebrow={<>{t.era} {current.era} <span>·</span> {t.theWork}</>}
          title={current.title}
          body={current.interlude}
          action={t.yearsLater}
          onAction={() => start('closing')}
        />
      ) : (
        <>
          <Backdrop era={current.era} />
          <Dialogue
            cast={castOf(lines)}
            lines={lines}
            index={line}
            label={`${t.era} ${current.era} · ${current.title} · ${beat === 'closing' ? t.ending : t.opening}`}
            onAdvance={advance}
            onClose={() => setBeat(beat === 'closing' ? 'work' : 'title')}
            endLabel={
              beat === 'opening'
                ? t.theWork
                : chapter + 1 < chapters.length
                  ? `${t.era} ${current.era + 1}`
                  : t.finish
            }
            closeLabel={t.back}
            nextLabel={t.next}
            showLabel={t.show}
            variant="story"
            era={current.era}
          />
        </>
      )}
    </div>
  )
}
