'use client'

import { createContext, useContext, useState } from 'react'
import { useLocalChat } from '@/src/features/chat/hooks/useLocalChat'
import type {
  ActivityItem,
  MissionCommandSnapshot,
  RuntimeContext,
  RuntimeNote,
  RuntimeStatusSnapshot,
  RuntimeTask,
  TransportPreview,
} from '@/src/features/chat/model/types'
import type { ChatMessage, ChatMode, ChatModeId, ComposerDraft } from '@/src/features/chat/model/types'

interface DashboardContextValue {
  mobileNavOpen: boolean
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>
  apiState: 'connected' | 'local-fallback'
  isSyncingRuntime: boolean
  missionCommand: MissionCommandSnapshot
  recentActivity: ActivityItem[]
  runtimeNotes: RuntimeNote[]
  runtimeTasks: RuntimeTask[]
  runtimeContext: RuntimeContext | null
  runtimeStatus: RuntimeStatusSnapshot | null
  transportPreview: TransportPreview
  activeMode: ChatMode
  activeModeId: ChatModeId
  modes: ChatMode[]
  refreshRuntime: () => Promise<boolean>
  // Interactive chat state (for the /chat page)
  messages: ChatMessage[]
  draft: ComposerDraft
  setDraft: React.Dispatch<React.SetStateAction<ComposerDraft>>
  submitMessage: (value: string) => Promise<void>
  isResponding: boolean
  historyCursorLabel: string
  cycleHistory: (direction: 'older' | 'newer') => void
  suggestedPrompts: string[]
  inputHistory: string[]
  setActiveModeId: (modeId: ChatModeId) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const chat = useLocalChat()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const value: DashboardContextValue = {
    mobileNavOpen,
    setMobileNavOpen,
    apiState: chat.apiState,
    isSyncingRuntime: chat.isSyncingRuntime,
    missionCommand: chat.missionCommand,
    recentActivity: chat.recentActivity,
    runtimeNotes: chat.runtimeNotes,
    runtimeTasks: chat.runtimeTasks,
    runtimeContext: chat.runtimeContext,
    runtimeStatus: chat.runtimeStatus,
    transportPreview: chat.transportPreview,
    activeMode: chat.activeMode,
    activeModeId: chat.activeModeId,
    modes: chat.modes,
    refreshRuntime: chat.refreshRuntime,
    messages: chat.messages,
    draft: chat.draft,
    setDraft: chat.setDraft,
    submitMessage: chat.submitMessage,
    isResponding: chat.isResponding,
    historyCursorLabel: chat.historyCursorLabel,
    cycleHistory: chat.cycleHistory,
    suggestedPrompts: chat.suggestedPrompts,
    inputHistory: chat.inputHistory,
    setActiveModeId: chat.setActiveModeId,
  }

  return (
    <DashboardContext value={value}>
      {children}
    </DashboardContext>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardDataProvider')
  return ctx
}
