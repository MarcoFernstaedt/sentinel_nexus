import { nexusRuntimeContract } from '../../runtime/runtimeContract'
import type { ChatMessage, ChatMode, TransportPreview } from '../model/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4001'

interface SubmitResponse {
  operatorMessage: ChatMessage
  sentinelMessage: ChatMessage
}

interface StatusResponse {
  cards: Array<{ label: string; value: string; detail: string }>
  storage: { driver: string }
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/api/chat/messages`)
  if (!response.ok) throw new Error('Failed to load chat messages')
  return response.json()
}

export async function submitMessageToApi(input: string, mode: ChatMode): Promise<SubmitResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: input, modeId: mode.id, author: 'Marco' }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit message')
  }

  return response.json()
}

export async function fetchTransportPreview(): Promise<TransportPreview> {
  const response = await fetch(`${API_BASE_URL}/api/status`)
  if (!response.ok) {
    throw new Error('Failed to load runtime status')
  }

  const status = (await response.json()) as StatusResponse
  const apiCard = status.cards[0]

  return {
    provider: `Nexus API · ${status.storage.driver}`,
    state: 'ready-for-runtime',
    summary: `${apiCard.value}: ${apiCard.detail}`,
    runtimeTarget: {
      apiBasePath: nexusRuntimeContract.apiBasePath,
      eventStreamPath: nexusRuntimeContract.eventStreamPath,
      dbFilePath: nexusRuntimeContract.db.filePath,
      sessionScope: nexusRuntimeContract.surfaces.chat.scope,
    },
  }
}
