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
import { Card } from './Story'
import { castOf } from './story'
import { briefingFor } from './briefings'
import { TermText } from './Glossary'
import { UI, chaptersIn, type Lang } from './lang'
import { useGame } from './store'

/**
 * Title card, the scene, how communication works here, then the work. Then the
 * game. The primer comes before the objective on purpose: a player who does
 * not know what a notice board is cannot be told to go and build one.
 */
type Beat = 'title' | 'scene' | 'primer' | 'briefing'

export function EraOpening({ era, lang }: { era: number; lang: Lang }) {
  const owed = useGame((s) => s.opening)
  const dismiss = useGame((s) => s.dismissOpening)
  const [beat, setBeat] = useState<Beat>('title')
  const [line, setLine] = useState(0)
  const chapter = useMemo(() => chaptersIn(lang).find((c) => c.era === era), [lang, era])
  const briefing = useMemo(() => briefingFor(era, lang), [era, lang])

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
      {beat === 'scene' ? (
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
              {briefing.primer.things.map((thing) => (
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
                </li>
              ))}
            </ol>

            <div className="briefing__stakes briefing__stakes--one">
              <section>
                <h2>{t.soWhat}</h2>
                <p>
                  <TermText text={briefing.primer.upshot} />
                </p>
              </section>
            </div>

            <button
              type="button"
              className="button button--primary briefing__begin"
              onClick={() => setBeat('briefing')}
            >
              {t.toTheWork}
            </button>
          </div>
        </>
      ) : beat === 'briefing' && briefing ? (
        <>
          <Backdrop era={era} />
          <div className="briefing">
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

            <h2 className="briefing__how-head">{t.howToPlay}</h2>
            <ol className="briefing__how">
              {briefing.how.map((point) => (
                <li key={point.what}>
                  <strong>{point.what}</strong>
                  <span>{point.note}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              className="button button--primary briefing__begin"
              onClick={dismiss}
            >
              {t.startEra}
            </button>
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
            onAction={() => setBeat('scene')}
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
