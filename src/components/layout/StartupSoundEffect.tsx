'use client'

import { useEffect, useRef } from 'react'
import { useSoundContext } from '@/src/context/SoundContext'

/**
 * Fires the startup chime once on first mount.
 * Renders nothing — exists only to trigger the sound after the first user gesture
 * has unlocked the AudioContext. We defer by 400ms to let the page settle.
 * A ref guards against double-fire in React Strict Mode.
 */
export function StartupSoundEffect() {
  const { play } = useSoundContext()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const id = setTimeout(() => play('startup'), 400)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
