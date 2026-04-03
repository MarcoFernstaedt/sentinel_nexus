'use client'

import React, { createContext, useContext } from 'react'
import { useSoundEngine } from '@/src/hooks/useSoundEngine'
import type { SoundEvent } from '@/src/lib/sounds'

interface SoundContextValue {
  play: (event: SoundEvent) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
}

const noop = () => {/* no-op */}

const SoundContext = createContext<SoundContextValue>({
  play: noop,
  soundEnabled: false,
  setSoundEnabled: noop,
})

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const sound = useSoundEngine()
  return (
    <SoundContext value={sound}>
      {children}
    </SoundContext>
  )
}

export function useSoundContext() {
  return useContext(SoundContext)
}
