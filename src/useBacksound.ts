/**
 * The looping backing track.
 *
 * Browsers refuse to start audio before the user has interacted with the page,
 * and that refusal is a rejected promise rather than an error you can catch on
 * the element. So: try to play immediately, and if the attempt is blocked, arm
 * a one-shot listener that starts the track on the first real interaction.
 *
 * The on/off choice is remembered per browser, because a game that reinstates
 * music you switched off is an unkind game.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import backsound from '../assets/backsound.ogg'

const STORAGE_KEY = 'reconnect:sound'

function storedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    // Private windows and blocked site data both throw here; default to on.
    return true
  }
}

export function useBacksound(volume = 0.35) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [wanted, setWanted] = useState(storedPreference)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = new Audio(backsound)
    audio.loop = true
    audio.volume = volume
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!wanted) {
      audio.pause()
      setPlaying(false)
      return
    }

    let armed = false
    const start = () => {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Blocked until the user does something. Wait for them to.
          if (armed) return
          armed = true
          const onGesture = () => {
            audio.play().then(() => setPlaying(true)).catch(() => undefined)
          }
          window.addEventListener('pointerdown', onGesture, { once: true })
          window.addEventListener('keydown', onGesture, { once: true })
        })
    }
    start()
  }, [wanted])

  const toggle = useCallback(() => {
    setWanted((on) => {
      const next = !on
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        // Nothing to do; the session still honours the choice in memory.
      }
      return next
    })
  }, [])

  return { wanted, playing, toggle }
}
