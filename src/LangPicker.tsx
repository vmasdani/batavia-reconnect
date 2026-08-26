/**
 * EN / ID, wherever the page has a top edge.
 */

import { LANGS, type Lang } from './lang'

export function LangPicker({ lang, onPick }: { lang: Lang; onPick: (lang: Lang) => void }) {
  return (
    <div className="lang">
      {LANGS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`lang__pick${option.id === lang ? ' is-on' : ''}`}
          onClick={() => onPick(option.id)}
          aria-pressed={option.id === lang}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
