import { chatModes } from '../data/mockChat'
import type { ChatMessage, ChatModeId } from '../model/types'

const MAX_STORED_MESSAGES = 60
const MAX_HISTORY_ITEMS = 20
const MAX_MESSAGE_LENGTH = 1200
const chatModeIds = new Set<ChatModeId>(chatModes.map((mode) => mode.id))

const isChatModeId = (value: unknown): value is ChatModeId =>
  typeof value === 'string' && chatModeIds.has(value as ChatModeId)

const isMessageRole = (value: unknown): value is ChatMessage['role'] =>
  value === 'sentinel' || value === 'operator' || value === 'system'

const isMessageStatus = (value: unknown): value is NonNullable<ChatMessage['status']> =>
  value === 'ready' || value === 'queued'

const isRecordSource = (value: unknown): value is ChatMessage['source'] =>
  value === 'runtime' || value === 'seeded-demo'

const clampText = (value: string, maxLength: number) => value.trim().slice(0, maxLength)

export function parseStoredModeId(value: unknown): ChatModeId {
  return isChatModeId(value) ? value : 'build'
}

export function parseStoredInputHistory(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => clampText(entry, MAX_MESSAGE_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_HISTORY_ITEMS)
}

export function parseStoredMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return []
  }

  const parsed = value
    .map((entry): ChatMessage | null => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const candidate = entry as Partial<ChatMessage>

      if (
        typeof candidate.id !== 'string' ||
        !isMessageRole(candidate.role) ||
        typeof candidate.author !== 'string' ||
        typeof candidate.body !== 'string' ||
        typeof candidate.timestamp !== 'string' ||
        !isChatModeId(candidate.modeId)
      ) {
        return null
      }

      return {
        id: candidate.id,
        role: candidate.role,
        author: clampText(candidate.author, 80),
        body: clampText(candidate.body, MAX_MESSAGE_LENGTH),
        timestamp: clampText(candidate.timestamp, 32),
        modeId: candidate.modeId,
        status: isMessageStatus(candidate.status) ? candidate.status : 'ready',
        source: isRecordSource(candidate.source) ? candidate.source : 'runtime',
      }
    })
    .filter((entry): entry is ChatMessage => Boolean(entry))
    .slice(-MAX_STORED_MESSAGES)

  return parsed
}

export function pushHistoryEntry(history: string[], value: string) {
  const normalized = clampText(value, MAX_MESSAGE_LENGTH)

  if (!normalized) {
    return history
  }

  return [normalized, ...history.filter((entry) => entry !== normalized)].slice(0, MAX_HISTORY_ITEMS)
}

export function pushMessage(messages: ChatMessage[], message: ChatMessage) {
  return [...messages, message].slice(-MAX_STORED_MESSAGES)
}
