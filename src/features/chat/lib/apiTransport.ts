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

interface TaskMutationInput {
  title: string
  owner: string
  due: string
  status?: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
  stage?: 'queued' | 'inspecting' | 'editing' | 'validating' | 'committing' | 'pushing' | 'done'
  lane: string
  summary?: string
  needsUserInput?: boolean
  needsApproval?: boolean
  assignedBy?: string
  readyToReport?: boolean
}

interface TaskPatchInput {
  status?: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
  stage?: 'queued' | 'inspecting' | 'editing' | 'validating' | 'committing' | 'pushing' | 'done'
  summary?: string
  needsUserInput?: boolean
  needsApproval?: boolean
  readyToReport?: boolean
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

export async function fetchActivity() {
  const response = await fetch(apiUrl('/api/activity'))
  if (!response.ok) throw new Error('Failed to load activity feed')
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

export async function createTaskInApi(input: TaskMutationInput) {
  const response = await fetch(apiUrl('/api/tasks'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('Failed to create task')
  }

  return response.json()
}

export async function patchTaskInApi(taskId: string, patch: TaskPatchInput) {
  const response = await fetch(apiUrl(`/api/tasks/${taskId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })

  if (!response.ok) {
    throw new Error('Failed to update task')
  }

  return response.json()
}

export async function approveTask(taskId: string) {
  const response = await fetch(apiUrl(`/api/tasks/${taskId}/approve`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Failed to approve task')
  }

  return response.json()
}

export async function rejectTask(taskId: string, reason?: string) {
  const response = await fetch(apiUrl(`/api/tasks/${taskId}/reject`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) {
    throw new Error('Failed to reject task')
  }

  return response.json()
}

export async function createNoteInApi(input: { title: string; body: string; tag: string }) {
  const response = await fetch(apiUrl('/api/notes'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('Failed to create note')
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
