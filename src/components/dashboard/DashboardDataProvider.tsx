'use client'

import { createContext, useContext } from 'react'
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
import type { ChatMode, ChatModeId } from '@/src/features/chat/model/types'

interface DashboardContextValue {
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
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const chat = useLocalChat()

  const value: DashboardContextValue = {
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
