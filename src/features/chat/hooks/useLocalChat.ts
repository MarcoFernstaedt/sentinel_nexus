import { useEffect, useMemo, useState } from 'react'
import { useLocalStorageState } from '../../../hooks/useLocalStorageState'
import {
  chatModes,
  initialMessages,
  suggestedPrompts,
  transportPreview as fallbackTransportPreview,
} from '../data/mockChat'
import {
  createTransportPreview,
  fetchBootstrap,
  fetchMessages,
  fetchRuntimeContext,
  fetchStatus,
  submitMessageToApi,
} from '../lib/apiTransport'
import {
  parseStoredInputHistory,
  parseStoredMessages,
  parseStoredModeId,
  pushHistoryEntry,
  pushMessage,
} from '../lib/chatPersistence'
import { simulateLocalReply } from '../lib/localTransport'
import type {
  ActivityItem,
  ChatMessage,
  ChatModeId,
  ComposerDraft,
  RuntimeContext,
  RuntimeNote,
  RuntimeStatusSnapshot,
  RuntimeTask,
  TransportPreview,
} from '../model/types'

const CHAT_MESSAGES_KEY = 'sentinel-nexus.chat.messages'
const CHAT_MODE_KEY = 'sentinel-nexus.chat.mode'
const CHAT_HISTORY_KEY = 'sentinel-nexus.chat.history'
const RUNTIME_SYNC_MS = 15000

export function useLocalChat() {
  const [messages, setMessages] = useLocalStorageState<ChatMessage[]>(CHAT_MESSAGES_KEY, initialMessages, {
    parse: parseStoredMessages,
  })
  const [activeModeId, setActiveModeId] = useLocalStorageState<ChatModeId>(CHAT_MODE_KEY, 'build', {
    parse: parseStoredModeId,
  })
  const [draft, setDraft] = useState<ComposerDraft>({ value: '', historyIndex: null })
  const [inputHistory, setInputHistory] = useLocalStorageState<string[]>(CHAT_HISTORY_KEY, [], {
    parse: parseStoredInputHistory,
  })
  const [isResponding, setIsResponding] = useState(false)
  const [transportPreview, setTransportPreview] = useState<TransportPreview>(fallbackTransportPreview)
  const [runtimeContext, setRuntimeContext] = useState<RuntimeContext | null>(null)
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusSnapshot | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [runtimeNotes, setRuntimeNotes] = useState<RuntimeNote[]>([])
  const [runtimeTasks, setRuntimeTasks] = useState<RuntimeTask[]>([])
  const [apiState, setApiState] = useState<'connected' | 'local-fallback'>('local-fallback')

  useEffect(() => {
    let cancelled = false

    const syncFromApi = async (preferBootstrap: boolean) => {
      try {
        if (preferBootstrap) {
          const bootstrap = await fetchBootstrap()
          if (cancelled) return

          if (bootstrap.messages.length > 0) {
            setMessages(bootstrap.messages)
          }

          setRuntimeStatus(bootstrap.status)
          setRuntimeContext(bootstrap.runtime)
          setRecentActivity(bootstrap.activity ?? [])
          setRuntimeNotes(bootstrap.notes ?? [])
          setRuntimeTasks(bootstrap.tasks ?? [])
          setTransportPreview(createTransportPreview(bootstrap.status))
          setApiState('connected')
          return
        }

        const [apiMessages, apiStatus, apiRuntimeContext, bootstrap] = await Promise.all([
          fetchMessages(),
          fetchStatus(),
          fetchRuntimeContext(),
          fetchBootstrap(),
        ])
        if (cancelled) return
        if (apiMessages.length > 0) {
          setMessages(apiMessages)
        }
        setRuntimeStatus(apiStatus)
        setRuntimeContext(apiRuntimeContext)
        setRecentActivity(bootstrap.activity ?? [])
        setRuntimeNotes(bootstrap.notes ?? [])
        setRuntimeTasks(bootstrap.tasks ?? [])
        setTransportPreview(createTransportPreview(apiStatus))
        setApiState('connected')
      } catch {
        if (cancelled) return
        setApiState('local-fallback')
        setTransportPreview({
          ...fallbackTransportPreview,
          summary: `${fallbackTransportPreview.summary} Falling back to local simulator because the API is unavailable.`,
        })
      }
    }

    void syncFromApi(true)
    const interval = window.setInterval(() => {
      void syncFromApi(false)
    }, RUNTIME_SYNC_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [setMessages])

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
    const value = rawValue.trim().slice(0, 1200)

    if (!value || isResponding) {
      return
    }

    setInputHistory((current) => pushHistoryEntry(current, value))
    setDraft({ value: '', historyIndex: null })
    setIsResponding(true)

    try {
      try {
        const response = await submitMessageToApi(value, activeMode)
        setMessages((current) => pushMessage(pushMessage(current, response.operatorMessage), response.sentinelMessage))
        setApiState('connected')
        return
      } catch {
        const operatorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'operator',
          author: 'Marco',
          body: value,
          timestamp: new Date().toISOString(),
          modeId: activeMode.id,
          status: 'ready',
        }

        setMessages((current) => pushMessage(current, operatorMessage))

        const reply = await simulateLocalReply(value, activeMode)
        const sentinelMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'sentinel',
          author: 'Sentinel',
          body: `${reply}\n\nFallback reason: Nexus API unavailable.`,
          timestamp: new Date().toISOString(),
          modeId: activeMode.id,
          status: 'ready',
        }

        setMessages((current) => pushMessage(current, sentinelMessage))
        setApiState('local-fallback')
      }
    } finally {
      setIsResponding(false)
    }
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
    apiState,
    draft,
    historyCursorLabel,
    inputHistory,
    isResponding,
    messages: visibleMessages,
    modes: chatModes,
    recentActivity,
    runtimeContext,
    runtimeNotes,
    runtimeStatus,
    runtimeTasks,
    suggestedPrompts,
    transportPreview,
    rawMessages: messages,
    setActiveModeId,
    setDraft,
    submitMessage,
    cycleHistory,
  }
}
