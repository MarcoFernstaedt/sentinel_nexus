import type { ActivityRecord, ChatMessageRecord, NexusDataStore, NoteRecord, TaskRecord } from './models.js'

const seededAt = '2026-03-25T03:31:27.981Z'

export const seededMessages: ChatMessageRecord[] = [
  {
    id: 'msg-1',
    role: 'system',
    author: 'Nexus Runtime',
    body: 'Backend transport is now present. Chat can persist through the API while agent execution remains a controlled stub.',
    timestamp: seededAt,
    modeId: 'command',
    status: 'ready',
    source: 'seeded-demo',
  },
  {
    id: 'msg-2',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Nexus command spine is online. Give me an objective and I will force it into sequence.',
    timestamp: seededAt,
    modeId: 'command',
    status: 'ready',
    source: 'seeded-demo',
  },
]

export const seededNotes: NoteRecord[] = [
  {
    id: 'note-operator-doctrine',
    title: 'Operator doctrine',
    body: 'Keep Nexus useful before the full runtime is present. Backend seams must be explicit, not magical.',
    tag: 'architecture',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'note-db-boundary',
    title: 'Persistence boundary',
    body: 'All API writes flow through a repository layer so Nexus DB can move from JSON files to SQLite or Postgres without rewriting route logic.',
    tag: 'platform',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
]

export const seededTasks: TaskRecord[] = [
  {
    id: 'task-api-status',
    title: 'Expose runtime status snapshot from backend',
    owner: 'Platform',
    due: 'Now',
    status: 'Done',
    stage: 'done',
    lane: 'Ops',
    summary: 'Status and bootstrap payloads are already visible through the API.',
    readyToReport: true,
    source: 'seeded-demo',
  },
  {
    id: 'task-api-chat',
    title: 'Persist chat messages and server replies through API seam',
    owner: 'Runtime',
    due: 'Now',
    status: 'Done',
    stage: 'done',
    lane: 'Build',
    summary: 'Chat now routes through the server first and falls back locally when needed.',
    readyToReport: true,
    source: 'seeded-demo',
  },
  {
    id: 'task-board-upgrade',
    title: 'Upgrade Nexus with a truthful operator progress board',
    owner: 'Sentinel',
    due: 'Current session',
    status: 'In Progress',
    stage: 'editing',
    lane: 'Build',
    summary: 'Add workflow-stage visibility and attention surfaces without fake precision.',
    source: 'seeded-demo',
  },
  {
    id: 'task-user-clarity',
    title: 'Confirm preferred board terminology with Marco',
    owner: 'Sentinel',
    due: 'When needed',
    status: 'Queued',
    stage: 'queued',
    lane: 'Ops',
    summary: 'Only ask for naming or workflow clarifications if the runtime model truly needs them.',
    needsUserInput: true,
    source: 'seeded-demo',
  },
  {
    id: 'task-real-db',
    title: 'Attach real Nexus DB runtime on host',
    owner: 'Infra',
    due: 'Next',
    status: 'Blocked',
    stage: 'validating',
    lane: 'Ops',
    summary: 'Architecture is ready, but the host still lacks the chosen SQLite/Postgres runtime attachment.',
    source: 'seeded-demo',
  },
]

export const seededActivity: ActivityRecord[] = [
  {
    id: 'activity-affirmations-wireup',
    type: 'status',
    title: 'Affirmation tracking surface requested',
    detail: 'Command center should show visible progress around affirmations and platform work.',
    timestamp: seededAt,
    status: 'watch',
    source: 'seeded-demo',
  },
  {
    id: 'activity-runtime-online',
    type: 'status',
    title: 'Nexus backend online',
    detail: 'Bootstrap, task, note, and chat seams are active through the local API.',
    timestamp: seededAt,
    status: 'done',
    source: 'seeded-demo',
  },
]

export const createSeedData = (): NexusDataStore => ({
  chatMessages: seededMessages,
  notes: seededNotes,
  tasks: seededTasks,
  activity: seededActivity,
})
