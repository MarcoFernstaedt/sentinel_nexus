import type { ActivityRecord, ChatMessageRecord, NexusDataStore, NoteRecord, TaskRecord } from './models.js'

export const seededMessages: ChatMessageRecord[] = [
  {
    id: 'msg-1',
    role: 'system',
    author: 'Nexus Runtime',
    body: 'Backend transport is now present. Chat can persist through the API while agent execution remains a controlled stub.',
    timestamp: '02:16 UTC',
    modeId: 'command',
    status: 'ready',
  },
  {
    id: 'msg-2',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Nexus command spine is online. Give me an objective and I will force it into sequence.',
    timestamp: '02:17 UTC',
    modeId: 'command',
    status: 'ready',
  },
]

export const seededNotes: NoteRecord[] = [
  {
    id: 'note-operator-doctrine',
    title: 'Operator doctrine',
    body: 'Keep Nexus useful before the full runtime is present. Backend seams must be explicit, not magical.',
    tag: 'architecture',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-db-boundary',
    title: 'Persistence boundary',
    body: 'All API writes flow through a repository layer so Nexus DB can move from JSON files to SQLite or Postgres without rewriting route logic.',
    tag: 'platform',
    updatedAt: new Date().toISOString(),
  },
]

export const seededTasks: TaskRecord[] = [
  {
    id: 'task-api-status',
    title: 'Expose runtime status snapshot from backend',
    owner: 'Platform',
    due: 'Now',
    status: 'Done',
    lane: 'Ops',
  },
  {
    id: 'task-api-chat',
    title: 'Persist chat messages and server replies through API seam',
    owner: 'Runtime',
    due: 'Now',
    status: 'Done',
    lane: 'Build',
  },
  {
    id: 'task-api-notes',
    title: 'Create notes repository endpoint boundary',
    owner: 'Platform',
    due: 'Now',
    status: 'Done',
    lane: 'Build',
  },
  {
    id: 'task-real-db',
    title: 'Attach real Nexus DB runtime on host',
    owner: 'Infra',
    due: 'Next',
    status: 'Blocked',
    lane: 'Ops',
  },
]

export const seededActivity: ActivityRecord[] = [
  {
    id: 'activity-affirmations-wireup',
    type: 'status',
    title: 'Affirmation tracking surface requested',
    detail: 'Command center should show visible progress around affirmations and platform work.',
    timestamp: new Date().toISOString(),
    status: 'watch',
  },
  {
    id: 'activity-runtime-online',
    type: 'status',
    title: 'Nexus backend online',
    detail: 'Bootstrap, task, note, and chat seams are active through the local API.',
    timestamp: new Date().toISOString(),
    status: 'done',
  },
]

export const createSeedData = (): NexusDataStore => ({
  chatMessages: seededMessages,
  notes: seededNotes,
  tasks: seededTasks,
  activity: seededActivity,
})
