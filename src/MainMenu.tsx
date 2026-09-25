/**
 * Main menu.
 *
 * Six doors, and they are not the same kind of thing: one is the whole arc as
 * script with no gameplay under it, two are the eras that have actually been
 * built, one is the reference for the technology all of it is about, and the
 * last two are benches — Era 7's 1-bit machine running an adder, and Era 6's
 * network carrying one packet. Saying which is which on the buttons is cheaper
 * than explaining it afterwards.
 */

import { PARTY } from './party'
import { LangPicker } from './LangPicker'
import { ERA_NAME } from './Glossary'
import { UI, chaptersIn, type Lang } from './lang'

export type Mode = 'menu' | 'story' | 'era0' | 'game' | 'glossary' | 'sim' | 'route' | 'read'

/** The eras that are written but not built. The menu reads them, it cannot play them. */
const READABLE = [2, 3, 4, 5, 6, 7, 8]

export function MainMenu({
  lang,
  onLang,
  onPick,
  onRead,
}: {
  lang: Lang
  onLang: (lang: Lang) => void
  onPick: (mode: Mode) => void
  onRead: (era: number) => void
}) {
  const chapters = chaptersIn(lang)
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
          <button type="button" className="menu__choice" onClick={() => onPick('sim')}>
            <span className="menu__choice-name">{t.sim}</span>
            <span className="menu__choice-note">{t.simNote}</span>
          </button>
          <button type="button" className="menu__choice" onClick={() => onPick('route')}>
            <span className="menu__choice-name">{t.route}</span>
            <span className="menu__choice-note">{t.routeNote}</span>
          </button>
        </div>

        {/* The rest of the arc. Same opening a playable era gets — the scene,
            then how communication works that year, then what the era is for —
            and it stops where the map would be. */}
        <p className="menu__rest">{t.theRest}</p>
        <div className="menu__eras">
          {READABLE.map((era) => (
            <button key={era} type="button" className="menu__era" onClick={() => onRead(era)}>
              <span className="menu__era-no">{era}</span>
              <span className="menu__era-name">{chapters.find((c) => c.era === era)?.title}</span>
              <span className="menu__era-tech">{ERA_NAME[lang][era]}</span>
            </button>
          ))}
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
