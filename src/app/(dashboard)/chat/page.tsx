'use client'

import { useCallback } from 'react'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'
import { ConversationView } from '@/src/features/chat/components/ConversationView'
import { Composer } from '@/src/features/chat/components/Composer'
import { ModeSwitch } from '@/src/features/chat/components/ModeSwitch'
import { PersonaPanel } from '@/src/features/chat/components/PersonaPanel'

export default function ChatPage() {
  const {
    messages,
    draft,
    setDraft,
    submitMessage,
    isResponding,
    historyCursorLabel,
    cycleHistory,
    suggestedPrompts,
    inputHistory,
    activeMode,
    activeModeId,
    modes,
    setActiveModeId,
    transportPreview,
    runtimeContext,
    runtimeStatus,
    recentActivity,
  } = useDashboard()

  const handleSubmit = useCallback(() => {
    void submitMessage(draft.value)
  }, [draft.value, submitMessage])

  const handlePromptSelect = useCallback((prompt: string) => {
    setDraft({ value: prompt, historyIndex: null })
  }, [setDraft])

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Main chat column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mode selector strip */}
        <ModeSwitch
          modes={modes}
          activeModeId={activeModeId}
          onSelect={setActiveModeId}
        />

        {/* Conversation — scrollable middle */}
        <ConversationView messages={messages} />

        {/* Composer — pinned bottom */}
        <Composer
          draft={draft}
          historyCursorLabel={historyCursorLabel}
          isResponding={isResponding}
          activeModeLabel={activeMode.label}
          onDraftChange={(value) => setDraft((prev) => ({ ...prev, value }))}
          onSubmit={handleSubmit}
          onHistory={cycleHistory}
        />
      </div>

      {/* Persona panel — right sidebar, hidden on small screens */}
      <div className="hidden xl:flex xl:w-[280px] xl:flex-shrink-0 overflow-hidden">
        <PersonaPanel
          activeMode={activeMode}
          transportPreview={transportPreview}
          runtimeContext={runtimeContext}
          runtimeStatus={runtimeStatus}
          suggestedPrompts={suggestedPrompts}
          historyCount={inputHistory.length}
          recentActivity={recentActivity}
          onPromptSelect={handlePromptSelect}
        />
      </div>
    </div>
  )
}
