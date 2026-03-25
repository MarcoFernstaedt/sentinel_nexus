import { useMemo, useState } from 'react'
import { chatModes, initialMessages, suggestedPrompts, transportPreview } from '../data/mockChat'
import { simulateLocalReply } from '../lib/localTransport'
import type { ChatMessage, ChatModeId, ComposerDraft } from '../model/types'

function createTimestamp() {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date()) + ' UTC'
}

export function useLocalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [activeModeId, setActiveModeId] = useState<ChatModeId>('build')
  const [draft, setDraft] = useState<ComposerDraft>({ value: '', historyIndex: null })
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [isResponding, setIsResponding] = useState(false)

  const activeMode = useMemo(
    () => chatModes.find((mode) => mode.id === activeModeId) ?? chatModes[0],
    [activeModeId],
  )

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role === 'system' || message.modeId === activeModeId),
    [activeModeId, messages],
  )

  const historyCursorLabel =
    draft.historyIndex === null || inputHistory.length === 0
      ? 'Live draft'
      : `History ${inputHistory.length - draft.historyIndex}/${inputHistory.length}`

  async function submitMessage(rawValue: string) {
    const value = rawValue.trim()

    if (!value || isResponding) {
      return
    }

    const operatorMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'operator',
      author: 'Marco',
      body: value,
      timestamp: createTimestamp(),
      modeId: activeMode.id,
      status: 'ready',
    }

    setMessages((current) => [...current, operatorMessage])
    setInputHistory((current) => [value, ...current])
    setDraft({ value: '', historyIndex: null })
    setIsResponding(true)

    const reply = await simulateLocalReply(value, activeMode)

    const sentinelMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'sentinel',
      author: 'Sentinel',
      body: reply,
      timestamp: createTimestamp(),
      modeId: activeMode.id,
      status: 'ready',
    }

    setMessages((current) => [...current, sentinelMessage])
    setIsResponding(false)
  }

  function cycleHistory(direction: 'older' | 'newer') {
    if (inputHistory.length === 0) {
      return
    }

    if (direction === 'older') {
      const nextIndex = draft.historyIndex === null ? 0 : Math.min(draft.historyIndex + 1, inputHistory.length - 1)
      setDraft({ value: inputHistory[nextIndex], historyIndex: nextIndex })
      return
    }

    if (draft.historyIndex === null) {
      return
    }

    const nextIndex = draft.historyIndex - 1

    if (nextIndex < 0) {
      setDraft({ value: '', historyIndex: null })
      return
    }

    setDraft({ value: inputHistory[nextIndex], historyIndex: nextIndex })
  }

  return {
    activeMode,
    activeModeId,
    draft,
    historyCursorLabel,
    inputHistory,
    isResponding,
    messages: visibleMessages,
    modes: chatModes,
    suggestedPrompts,
    transportPreview,
    setActiveModeId,
    setDraft,
    submitMessage,
    cycleHistory,
  }
}
