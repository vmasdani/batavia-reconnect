/**
 * Main menu.
 *
 * Four doors, and they are not the same kind of thing: one is the whole arc as
 * script with no gameplay under it, two are the eras that have actually been
 * built, and the last is the reference for the technology all of it is about.
 * Saying which is which on the buttons is cheaper than explaining it
 * afterwards.
 */

import { PARTY } from './party'
import { LangPicker } from './LangPicker'
import { UI, type Lang } from './lang'

export type Mode = 'menu' | 'story' | 'era0' | 'game' | 'glossary'

export function MainMenu({
  lang,
  onLang,
  onPick,
}: {
  lang: Lang
  onLang: (lang: Lang) => void
  onPick: (mode: Mode) => void
}) {
  const t = UI[lang]
  return (
    <div className="menu">
      <LangPicker lang={lang} onPick={onLang} />
      <div className="menu__panel">
        <h1 className="menu__title">
          New Batavia<span>: Reconnect</span>
        </h1>
        <p className="menu__tagline">{t.tagline}</p>

        <div className="menu__choices">
          <button type="button" className="menu__choice" onClick={() => onPick('story')}>
            <span className="menu__choice-name">{t.start}</span>
            <span className="menu__choice-note">{t.startNote}</span>
          </button>
          <button type="button" className="menu__choice" onClick={() => onPick('era0')}>
            <span className="menu__choice-name">{t.era0}</span>
            <span className="menu__choice-note">{t.era0Note}</span>
          </button>
          <button type="button" className="menu__choice" onClick={() => onPick('game')}>
            <span className="menu__choice-name">{t.era1}</span>
            <span className="menu__choice-note">{t.era1Note}</span>
          </button>
          <button type="button" className="menu__choice" onClick={() => onPick('glossary')}>
            <span className="menu__choice-name">{t.glossary}</span>
            <span className="menu__choice-note">{t.glossaryNote}</span>
          </button>
        </div>

        <ul className="menu__crew">
          {PARTY.map((m) => (
            <li key={m.id}>
              <img src={m.portrait} alt="" width={38} height={38} />
              <span>{m.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
