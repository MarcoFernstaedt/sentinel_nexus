'use client'

import { useCallback, useEffect } from 'react'
import { getSoundEngine, type SoundEvent } from '@/src/lib/sounds'
import { useLocalStorageState } from './useLocalStorageState'

export function useSoundEngine() {
  const [soundEnabled, setSoundEnabled] = useLocalStorageState<boolean>(
    'sn:sound-enabled',
    () => {
      if (typeof window === 'undefined') return true
      // Default to off if the user prefers reduced motion (reduced sensory stimulation)
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
  )

  useEffect(() => {
    getSoundEngine()?.setEnabled(soundEnabled)
  }, [soundEnabled])

  const play = useCallback((event: SoundEvent) => {
    getSoundEngine()?.play(event)
  }, [])

  return { play, soundEnabled, setSoundEnabled }
}
