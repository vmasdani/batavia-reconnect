/**
 * Which of the four things the page is showing.
 *
 * Plain state rather than a router: there are no URLs to preserve, and the map
 * costs a WebGL context to mount, so the game is only rendered while it is the
 * chosen mode.
 */

import { useState } from 'react'
import App from './App'
import { MainMenu, type Mode } from './MainMenu'
import { Story } from './Story'
import { Prologue } from './Prologue'
import { GlossaryPage, GlossaryProvider } from './Glossary'
import { useGame } from './store'
import type { Lang } from './lang'

const STORED = 'batavia.lang'

/** Remembered across reloads; a browser that refuses storage just starts in English. */
function storedLang(): Lang {
  try {
    return localStorage.getItem(STORED) === 'id' ? 'id' : 'en'
  } catch {
    return 'en'
  }
}

export function Root() {
  const [mode, setMode] = useState<Mode>('menu')
  const [lang, setLang] = useState<Lang>(storedLang)
  const enterEra = useGame((s) => s.enterEra)
  const carryIntoEra1 = useGame((s) => s.carryIntoEra1)

  // The era is loaded before the screen mounts, because the map reads the
  // world once on mount and rebuilding the scene would drop the camera.
  const pick = (next: Mode) => {
    if (next === 'era0') enterEra(0)
    if (next === 'game') enterEra(1)
    setMode(next)
  }

  const pickLang = (next: Lang) => {
    setLang(next)
    try {
      localStorage.setItem(STORED, next)
    } catch {
      // Nothing to do about it, and nothing that depends on it.
    }
  }

  // The glossary sits outside the modes rather than inside one: a technology
  // term is clickable in story mode, in Era 0 and in Era 1, and the panel that
  // explains it has to be able to open over any of them.
  const screen =
    mode === 'story' ? (
      <Story lang={lang} onLang={pickLang} onExit={() => setMode('menu')} />
    ) : mode === 'glossary' ? (
      <GlossaryPage lang={lang} onExit={() => setMode('menu')} />
    ) : mode === 'era0' ? (
      <Prologue
        lang={lang}
        onExit={() => setMode('menu')}
        // Finishing the prologue does not start Era 1 from its own opening:
        // it starts from whatever the survey left standing. See `handoff`.
        onFinish={() => {
          carryIntoEra1()
          setMode('game')
        }}
      />
    ) : mode === 'game' ? (
      <App onExit={() => setMode('menu')} />
    ) : (
      <MainMenu lang={lang} onLang={pickLang} onPick={pick} />
    )

  return <GlossaryProvider lang={lang}>{screen}</GlossaryProvider>
}
