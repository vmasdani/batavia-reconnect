/**
 * The glossary: blue terms in the script, and the page that explains them.
 *
 * This is the educational half of the game. Every era rebuilds one real step
 * in the history of telecommunication, and the script says the names out loud
 * — but a name is not an explanation, so the names are made clickable and the
 * explanation is one tap away without leaving the scene.
 *
 * The open term is held in a context rather than passed down, because the text
 * it is reached from is rendered in four different places (`Story`, `Prologue`,
 * `SkitOverlay`, and the story cards) and none of them should have to know that
 * a glossary exists. `Root` provides it once, around everything.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { findTerms, termMap, termsByEra, termsIn, type Term } from './glossary'
import { TechFigure, figureFor } from './figures'
import { photoFor } from './photos'
import { UI, type Lang } from './lang'

interface GlossaryHandle {
  lang: Lang
  terms: Map<string, Term>
  open: (id: string) => void
  hover: (id: string | null) => void
}

const GlossaryContext = createContext<GlossaryHandle | null>(null)

/**
 * Which term the pointer is resting on, kept apart from the handle above.
 *
 * Deliberately a second context. The handle has to stay identical from one
 * render to the next — every marked-up word in the script reads it, and a word
 * that re-renders on hover cannot also clean up after itself when it is taken
 * away. The value that does change every hover is read by one component.
 */
const HoverContext = createContext<string | null>(null)

export function GlossaryProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  /**
   * Which term the pointer is resting on.
   *
   * Held here rather than by the text that owns the word, because the thing
   * that answers a hover — the photograph over the dialogue box — is nowhere
   * near the word being hovered.
   */
  const [hovered, hover] = useState<string | null>(null)
  const terms = termMap(lang)
  const handle = useMemo<GlossaryHandle>(() => ({ lang, terms, open: setOpenId, hover }), [lang, terms])
  const showing = openId ? terms.get(openId) : undefined

  return (
    <GlossaryContext.Provider value={handle}>
      <HoverContext.Provider value={hovered}>
        {children}
        {showing && <TermPanel term={showing} lang={lang} onClose={() => setOpenId(null)} />}
      </HoverContext.Provider>
    </GlossaryContext.Provider>
  )
}

/**
 * Script text with its technologies lit up.
 *
 * `upTo` exists for the dialogue player, which reveals a line a character at a
 * time: the terms are found in the whole line and then clipped, so a term goes
 * blue as it is typed rather than snapping when the line finishes.
 */
export function TermText({ text, upTo }: { text: string; upTo?: number }) {
  const glossary = useContext(GlossaryContext)
  const hits = useMemo(() => findTerms(text), [text])
  const end = upTo ?? text.length

  // A word the pointer is resting on can be taken away underneath it — the
  // dialogue player advances to the next line, and the button unmounts without
  // ever firing a leave. Clearing when the text changes is the only way the
  // hover ends, and without it the picture stays up over an unrelated line.
  useEffect(() => () => glossary?.hover(null), [text, glossary])

  // No provider, or nothing to mark: the plain string, which is what every
  // caller rendered before this file existed.
  if (!glossary || hits.length === 0) return <>{text.slice(0, end)}</>

  const parts: ReactNode[] = []
  let at = 0
  for (const hit of hits) {
    if (hit.start >= end) break
    if (hit.start > at) parts.push(text.slice(at, Math.min(hit.start, end)))
    const shown = text.slice(hit.start, Math.min(hit.end, end))
    parts.push(
      <button
        key={hit.start}
        type="button"
        className="term"
        title={glossary.terms.get(hit.id)?.name}
        // Resting on the word puts the photograph up; clicking it opens the
        // whole entry. Focus counts as hover so the keyboard sees it too.
        onPointerEnter={() => glossary.hover(hit.id)}
        onPointerLeave={() => glossary.hover(null)}
        onFocus={() => glossary.hover(hit.id)}
        onBlur={() => glossary.hover(null)}
        onClick={(event) => {
          // The dialogue player advances on a click anywhere in the box.
          event.stopPropagation()
          glossary.open(hit.id)
        }}
      >
        {shown}
      </button>,
    )
    at = Math.min(hit.end, end)
  }
  if (at < end) parts.push(text.slice(at, end))
  return <>{parts}</>
}

/**
 * One term in the player's language, by id.
 *
 * For the callers that already know which term they want and only need its
 * words — the dialogue player, which is told an id by the text it is revealing.
 */
export function useTerm(id: string | null | undefined): Term | undefined {
  const glossary = useContext(GlossaryContext)
  return id ? glossary?.terms.get(id) : undefined
}

/**
 * Several terms by id, in the player's language, skipping any that do not
 * exist. For a script line that names what the era is about to build.
 */
export function useTermsByIds(ids: string[] | undefined): Term[] {
  const glossary = useContext(GlossaryContext)
  return useMemo(
    () => (ids ?? []).map((id) => glossary?.terms.get(id)).filter((term): term is Term => !!term),
    [ids, glossary],
  )
}

/** The term the pointer is resting on, in the player's language. */
export function useHoveredTerm(): Term | undefined {
  const glossary = useContext(GlossaryContext)
  const hovered = useContext(HoverContext)
  return hovered ? glossary?.terms.get(hovered) : undefined
}

/** The language the glossary is being read in, for callers not given one. */
export function useGlossaryLang(): Lang {
  return useContext(GlossaryContext)?.lang ?? 'en'
}

/** Open the glossary panel for a term. Nothing happens where there is no provider. */
export function useOpenTerm(): (id: string) => void {
  const glossary = useContext(GlossaryContext)
  return glossary?.open ?? (() => {})
}

/**
 * What a line of the primer could be illustrated with, best first.
 *
 * A primer point names several things — a radio tower is explained in terms of
 * antennas and how a wave travels — and only one of them is what the point is
 * *for*. The era's own terms come first, because a primer is introducing this
 * era's work and mentioning the last one's in passing.
 *
 * A list rather than one answer, so a caller that has already drawn the first
 * choice on an earlier point can fall through to the next instead of leaving
 * the point bare. Terms with no diagram drawn for them are left out entirely.
 */
export function subjectsOf(text: string, era: number, lang: Lang): Term[] {
  const terms = termMap(lang)
  const seen = new Set<string>()
  const found = findTerms(text)
    .map((hit) => terms.get(hit.id))
    .filter((term): term is Term => !!term && !!figureFor(term.id) && !seen.has(term.id) && !!seen.add(term.id))
  return [...found.filter((term) => term.era === era), ...found.filter((term) => term.era !== era)]
}

/**
 * What a term is, then what it looks like and how it works, then why the
 * project needed it and who did it first.
 *
 * The picture goes after the one-line definition and before the argument,
 * because the definition is what you need to know you are in the right place
 * and the argument is only worth reading once you can see the thing.
 */
function TermBody({ term, lang, compact }: { term: Term; lang: Lang; compact?: boolean }) {
  const t = UI[lang]
  return (
    <>
      <p className="term-card__what">{term.what}</p>
      <TechFigure id={term.id} steps={term.steps} photo={photoFor(term.id)} compact={compact} />
      <p className="term-card__why">{term.why}</p>
      {term.real && (
        <p className="term-card__real">
          <span>{t.inTheRealWorld}</span>
          {term.real}
        </p>
      )}
    </>
  )
}

function TermPanel({ term, lang, onClose }: { term: Term; lang: Lang; onClose: () => void }) {
  const t = UI[lang]
  return (
    // Above everything, including an era's opening overlay: a term is clickable
    // wherever it appears, so its answer has to be able to open over whatever
    // that was.
    <div className="modal-backdrop modal-backdrop--over" onClick={onClose}>
      <div className="modal modal--term" onClick={(event) => event.stopPropagation()}>
        <p className="term-card__era">
          {t.era} {term.era}
        </p>
        <h2 className="term-card__name">{term.name}</h2>
        <TermBody term={term} lang={lang} />
        <div className="modal__buttons">
          <button type="button" className="button button--primary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The whole glossary, era by era.
 *
 * Everything is open on the page rather than behind a list of headings: this is
 * eight eras of about five entries each, and a reader who came here to find out
 * what the game is about should be able to scroll it in one pass.
 */
export function GlossaryPage({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const t = UI[lang]
  const byEra = useMemo(() => termsByEra(termsIn(lang)), [lang])
  const eras = [...byEra.keys()].sort((a, b) => a - b)

  return (
    <div className="glossary">
      <header className="glossary__bar">
        <button type="button" className="button" onClick={onExit}>
          ← {t.mainMenu}
        </button>
        <h1 className="glossary__title">{t.glossary}</h1>
        <span className="glossary__note">{t.glossaryNote}</span>
      </header>

      <div className="glossary__scroll">
        {eras.map((era) => (
          <section key={era} className="glossary__era">
            <h2 className="glossary__era-head">
              <span>
                {t.era} {era}
              </span>
              {ERA_NAME[lang][era]}
            </h2>
            <div className="glossary__grid">
              {byEra.get(era)!.map((term) => (
                <article key={term.id} className="term-card">
                  <h3 className="term-card__name">{term.name}</h3>
                  <TermBody term={term} lang={lang} compact />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/**
 * What each era is about in two or three words.
 *
 * Not the chapter titles — those are the story's names for the eras ("The
 * Copper War"), and here the reader wants the technology, not the drama.
 */
export const ERA_NAME: Record<Lang, string[]> = {
  en: [
    'Before telecommunications',
    'AM radio',
    'Telegraph',
    'Telephone',
    'Electronics',
    'The first machine',
    'Computing',
    'Packet networks',
    'Internetworking',
  ],
  id: [
    'Sebelum telekomunikasi',
    'Radio AM',
    'Telegraf',
    'Telepon',
    'Elektronika',
    'Mesin pertama',
    'Komputasi',
    'Jaringan paket',
    'Antarjaringan',
  ],
}
