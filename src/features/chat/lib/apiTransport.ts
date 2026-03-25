import { apiUrl } from '../../../lib/apiBaseUrl'
import { nexusRuntimeContract } from '../../runtime/runtimeContract'
import type {
  BootstrapPayload,
  ChatMessage,
  ChatMode,
  RuntimeContext,
  RuntimeStatusSnapshot,
  TransportPreview,
} from '../model/types'

interface SubmitResponse {
  operatorMessage: ChatMessage
  sentinelMessage: ChatMessage
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  const response = await fetch(apiUrl('/api/bootstrap'))
  if (!response.ok) throw new Error('Failed to load Nexus bootstrap payload')
  return response.json()
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const response = await fetch(apiUrl('/api/chat/messages'))
  if (!response.ok) throw new Error('Failed to load chat messages')
  return response.json()
}

export async function fetchRuntimeContext(): Promise<RuntimeContext> {
  const response = await fetch(apiUrl('/api/runtime/context'))
  if (!response.ok) throw new Error('Failed to load runtime context')
  return response.json()
}

export async function fetchStatus(): Promise<RuntimeStatusSnapshot> {
  const response = await fetch(apiUrl('/api/status'))
  if (!response.ok) throw new Error('Failed to load runtime status')
  return response.json()
}

export async function submitMessageToApi(input: string, mode: ChatMode): Promise<SubmitResponse> {
  const response = await fetch(apiUrl('/api/chat/messages'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: input, modeId: mode.id, author: 'Marco' }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit message')
  }

  return response.json()
}

export function createTransportPreview(status: RuntimeStatusSnapshot): TransportPreview {
  const apiCard = status.cards[0]

  return {
    provider: `Nexus API · ${status.storage.driver}`,
    state: 'ready-for-runtime',
    summary: `${apiCard.value}: ${apiCard.detail}`,
    runtimeTarget: {
      apiBasePath: nexusRuntimeContract.apiBasePath,
      eventStreamPath: nexusRuntimeContract.eventStreamPath,
      dbFilePath: nexusRuntimeContract.db.filePath,
      sessionScope: status.runtime.session.scope,
    },
  }
}
