/**
 * Skits: the chip that offers one, and the player that runs it over the map.
 *
 * Deliberately not a modal. A skit is a scene the crew is having while the
 * region carries on behind them, so the map stays visible and only dims.
 *
 * The dialogue itself is `Dialogue.tsx`, shared with story mode.
 */

import { useGame } from './store'
import { Dialogue } from './Dialogue'
import type { Scene } from './skits'

/**
 * The chip in the top bar. It only exists when somebody has something to say,
 * and it is the only way into a skit — nothing opens one on the player.
 *
 * `label` is a word, not a sentence, because Era 0 is played in either language
 * and "Skit" is not one of them in Indonesian.
 */
export function SkitChip({ skits, label = 'Skit' }: { skits: Scene[]; label?: string }) {
  const openSkit = useGame((s) => s.openSkit)
  const playing = useGame((s) => s.skit)
  if (skits.length === 0 || playing) return null

  const next = skits[0]
  return (
    <button type="button" className="skit-chip" onClick={() => openSkit(next)}>
      <span className="skit-chip__pip" aria-hidden />
      <span className="skit-chip__label">{label}</span>
      <span className="skit-chip__title">{next.title}</span>
      {skits.length > 1 && <span className="skit-chip__count">+{skits.length - 1}</span>}
    </button>
  )
}

export function SkitOverlay() {
  const skit = useGame((s) => s.skit)
  const index = useGame((s) => s.skitLine)
  const advance = useGame((s) => s.advanceSkit)
  const close = useGame((s) => s.closeSkit)
  if (!skit) return null

  return (
    <Dialogue
      cast={skit.cast}
      lines={skit.lines}
      index={index}
      label={skit.title}
      onAdvance={advance}
      onClose={close}
    />
  )
}
