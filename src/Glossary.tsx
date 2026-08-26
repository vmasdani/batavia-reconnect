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

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { findTerms, termsByEra, termsIn, type Term } from './glossary'
import { UI, type Lang } from './lang'

interface GlossaryHandle {
  lang: Lang
  terms: Map<string, Term>
  open: (id: string) => void
}

const GlossaryContext = createContext<GlossaryHandle | null>(null)

export function GlossaryProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const terms = useMemo(() => new Map(termsIn(lang).map((t) => [t.id, t])), [lang])
  const handle = useMemo<GlossaryHandle>(() => ({ lang, terms, open: setOpenId }), [lang, terms])
  const showing = openId ? terms.get(openId) : undefined

  return (
    <GlossaryContext.Provider value={handle}>
      {children}
      {showing && <TermPanel term={showing} lang={lang} onClose={() => setOpenId(null)} />}
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

/** What a term is, why the project needed it, and who did it first. */
function TermBody({ term, lang }: { term: Term; lang: Lang }) {
  const t = UI[lang]
  return (
    <>
      <p className="term-card__what">{term.what}</p>
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
    <div className="modal-backdrop" onClick={onClose}>
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
                  <TermBody term={term} lang={lang} />
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
const ERA_NAME: Record<Lang, string[]> = {
  en: [
    'Before telecommunications',
    'AM radio',
    'Telegraph',
    'Telephone',
    'Electronics',
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
    'Komputasi',
    'Jaringan paket',
    'Antarjaringan',
  ],
}
