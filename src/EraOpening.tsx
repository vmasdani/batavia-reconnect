/**
 * The chapter that opens a playable era, before the map is ever shown.
 *
 * Era 0 and Era 1 both used to drop the player straight onto the board with no
 * idea who anybody was or what the year's work is. Story mode had the scene all
 * along; this is the same text, presented the same way — title card, drawn
 * backdrop, dialogue — and then the game begins. The map does not appear until
 * the scene is over, because a chapter opening is not something happening on
 * the map.
 *
 * Three beats, the same shape a chapter has in story mode: the title card, the
 * scene, and then the card naming the work — which here is a real briefing,
 * because this era is about to be played rather than read.
 *
 * It shows once per run. `store.opening` holds which era is still owed its
 * scene, so re-entering an era that is already going does not replay it, and
 * the run Era 0 hands to Era 1 gets Era 1's opening because that is a fresh
 * run of Era 1 by any measure.
 */

import { useEffect, useMemo, useState } from 'react'
import { Dialogue } from './Dialogue'
import { Backdrop } from './backdrops'
import { EraRelay } from './EraRelay'
import { Card } from './Story'
import { castOf } from './story'
import { briefingFor } from './briefings'
import { TermText, subjectsOf } from './Glossary'
import { TechFigure } from './figures'
import { photoFor } from './photos'
import type { Term } from './glossary'
import { UI, chaptersIn, type Lang } from './lang'
import { useGame } from './store'

/**
 * Title card, the errand, the scene, how communication works here, then the
 * work. Then the game.
 *
 * The errand comes second, before anybody has spoken: the same message crossing
 * the same nine places it crosses in every other chapter, and the number it
 * takes this time. It is the premise of the era stated in one figure, and it is
 * the figure the era exists to bring down. The primer comes before the
 * objective for the same kind of reason — a player who does not know what a
 * notice board is cannot be told to go and build one.
 */
type Beat = 'title' | 'relay' | 'scene' | 'primer' | 'briefing'

export function EraOpening({
  era,
  lang,
  onDone,
}: {
  era: number
  lang: Lang
  /** Where to go when the scene is over. A playable era falls through to its map. */
  onDone?: () => void
}) {
  const owed = useGame((s) => s.opening)
  const close = useGame((s) => s.dismissOpening)
  const dismiss = () => {
    close()
    onDone?.()
  }
  const [beat, setBeat] = useState<Beat>('title')
  const [line, setLine] = useState(0)
  const chapter = useMemo(() => chaptersIn(lang).find((c) => c.era === era), [lang, era])
  const briefing = useMemo(() => briefingFor(era, lang), [era, lang])
  /**
   * The photograph for each point of the primer, keyed by the point it belongs to.
   *
   * A name in a paragraph teaches nobody what a switchboard is. The first time
   * an era's primer names one of its technologies, a photograph of the real
   * object is put on the page, so the paragraph has something to be about. The
   * drawn diagram is not shown here: a primer is read straight through, and a
   * schematic with numbered pins is a thing to study. It lives in the glossary,
   * one click away, where studying it is the point.
   *
   * First mention only: a primer that says "antenna" in 3 consecutive points
   * should not show the same antenna 3 times. A point whose best subject has
   * already been shown — or has no photograph — falls through to the next
   * technology it names, so it gets a picture of its own rather than none.
   */
  const plates = useMemo(() => {
    const drawn = new Set<string>()
    const found = new Map<string, Term>()
    for (const thing of briefing?.primer.things ?? []) {
      const term = subjectsOf(`${thing.name}. ${thing.plain}`, era, lang).find(
        (t) => !drawn.has(t.id) && !!photoFor(t.id),
      )
      if (!term) continue
      drawn.add(term.id)
      found.set(thing.name, term)
    }
    return found
  }, [briefing, era, lang])

  // A new run of the same era starts its scene from the top.
  useEffect(() => {
    setBeat('title')
    setLine(0)
  }, [owed])

  if (owed !== era || !chapter) return null
  const t = UI[lang]
  const lines = chapter.opening
  // An era with no briefing written yet hands straight to the map.
  const afterScene = () => (briefing ? setBeat('primer') : dismiss())

  return (
    <div className="story story--opening">
      {beat === 'relay' ? (
        <>
          <Backdrop era={era} />
          <EraRelay era={era} lang={lang} onDone={() => setBeat('scene')} />
        </>
      ) : beat === 'scene' ? (
        <>
          <Backdrop era={era} />
          <Dialogue
            cast={castOf(lines)}
            lines={lines}
            index={line}
            label={`${t.era} ${era} · ${chapter.title} · ${t.opening}`}
            onAdvance={() => (line + 1 < lines.length ? setLine(line + 1) : afterScene())}
            onClose={afterScene}
            endLabel={t.theWork}
            closeLabel={t.skip}
            nextLabel={t.next}
            showLabel={t.show}
            variant="story"
            era={era}
          />
        </>
      ) : beat === 'primer' && briefing ? (
        <>
          <Backdrop era={era} />
          <div className="briefing">
            <div className="briefing__scroll">
            <p className="briefing__era">
              {t.era} {era} <span>·</span> {t.primer}
            </p>
            <h1 className="briefing__title">{chapter.title}</h1>

            <div className="briefing__stakes briefing__stakes--one">
              <section className="briefing__from">
                <h2>{t.primerLead}</h2>
                <p>
                  <TermText text={briefing.primer.problem} />
                </p>
              </section>
            </div>

            <ol className="briefing__how briefing__how--primer">
              {briefing.primer.things.map((thing) => {
                const shown = plates.get(thing.name)
                return (
                  <li key={thing.name}>
                    <strong>{thing.name}</strong>
                    <span>
                      <TermText text={thing.plain} />
                    </span>
                    {thing.catch && (
                      <span className="briefing__catch">
                        <em>{t.butNot}</em>
                        <TermText text={thing.catch} />
                      </span>
                    )}
                    {shown && (
                      <div className="briefing__plate">
                        <TechFigure id={shown.id} photo={photoFor(shown.id)} photoOnly />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="briefing__stakes briefing__stakes--one">
              <section>
                <h2>{t.soWhat}</h2>
                <p>
                  <TermText text={briefing.primer.upshot} />
                </p>
              </section>
            </div>

            </div>
            <div className="briefing__foot">
              <button
                type="button"
                className="button button--primary briefing__begin"
                onClick={() => setBeat('briefing')}
              >
                {t.toTheWork}
              </button>
            </div>
          </div>
        </>
      ) : beat === 'briefing' && briefing ? (
        <>
          <Backdrop era={era} />
          <div className={`briefing${briefing.how ? '' : ' briefing--short'}`}>
            <div className="briefing__scroll">
            <p className="briefing__era">
              {t.era} {era} <span>·</span> {t.briefing}
            </p>
            <h1 className="briefing__title">{chapter.title}</h1>
            <p className="briefing__objective">{briefing.objective}</p>

            <div className="briefing__stakes">
              <section>
                <h2>{t.toWin}</h2>
                <p>{briefing.win}</p>
              </section>
              <section className="briefing__against">
                <h2>{t.pushingBack}</h2>
                <p>{briefing.pressure}</p>
              </section>
            </div>

            {/* Only an era that is actually played has a loop to explain. The
                rest are read: the objective and the end of the era are the
                whole briefing, and there is nothing after this card. */}
            {briefing.how && (
              <>
                <h2 className="briefing__how-head">{t.howToPlay}</h2>
                <ol className="briefing__how">
                  {briefing.how.map((point) => (
                    <li key={point.what}>
                      <strong>{point.what}</strong>
                      <span>{point.note}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            </div>
            <div className="briefing__foot">
              <button
                type="button"
                className="button button--primary briefing__begin"
                onClick={dismiss}
              >
                {briefing.how ? t.startEra : t.mainMenu}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <Card
            era={era}
            eyebrow={
              <>
                {t.era} {era} <span>·</span> {chapter.year}
              </>
            }
            title={chapter.title}
            body={chapter.premise}
            action={t.begin}
            onAction={() => setBeat('relay')}
          />
          {/* The dialogue carries its own skip; the card has to offer one too,
              or a replayed era makes you sit through a card to reach it. */}
          <button type="button" className="story__skip" onClick={dismiss}>
            {t.skip}
          </button>
        </>
      )}
    </div>
  )
}
