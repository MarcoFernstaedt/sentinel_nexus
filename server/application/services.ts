import process from 'node:process'
import type {
  ChatModeId,
  ChatMessageRecord,
  NexusStatusSnapshot,
  NoteRecord,
  RuntimeContextSnapshot,
  TaskRecord,
  TaskStatus,
} from '../domain/models.js'
import type { AppConfig } from '../config/env.js'
import { ActivityRepository, ChatRepository, NotesRepository, StatusRepository, TasksRepository } from './repositories.js'

const personaReplies: Record<ChatModeId, string> = {
  command:
    'Command path locked. The backend now owns transport state, so this reply can later be swapped for a real model or execution adapter.',
  strategy:
    'Strategic posture: the route layer stays thin, the service layer owns decisions, and persistence is isolated behind the Nexus DB boundary.',
  build:
    'Build posture: this repo now has a real server spine, domain models, repositories, and a replaceable data store instead of pretending the browser is the backend.',
}

export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  list() {
    return this.repository.list()
  }

  async submit(input: { body: string; modeId: ChatModeId; author?: string }) {
    const body = input.body.trim()

    const operatorMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'operator',
      author: input.author?.trim() || 'Marco',
      body,
      timestamp: new Date().toISOString(),
      modeId: input.modeId,
      status: 'ready',
      source: 'runtime',
    }

    const sentinelMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'sentinel',
      author: 'Sentinel',
      body: `${personaReplies[input.modeId]}\n\nCaptured request: “${body}”.`,
      timestamp: new Date().toISOString(),
      modeId: input.modeId,
      status: 'ready',
      source: 'runtime',
    }

    await this.repository.append([operatorMessage, sentinelMessage])
    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'chat',
      title: `Chat routed through ${input.modeId} mode`,
      detail: body,
      timestamp: new Date().toISOString(),
      status: 'logged',
      source: 'runtime',
    })

    return { operatorMessage, sentinelMessage }
  }
}

export class NotesService {
  constructor(
    private readonly repository: NotesRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  list() {
    return this.repository.list()
  }

  async create(input: Pick<NoteRecord, 'title' | 'body' | 'tag'>) {
    const note = await this.repository.create({
      id: `note-${crypto.randomUUID()}`,
      title: input.title.trim(),
      body: input.body.trim(),
      tag: input.tag.trim() || 'general',
      updatedAt: new Date().toISOString(),
      source: 'runtime',
    })

    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'note',
      title: `Note saved: ${note.title}`,
      detail: note.tag,
      timestamp: new Date().toISOString(),
      status: 'logged',
      source: 'runtime',
    })

    return note
  }
}

export class TasksService {
  constructor(
    private readonly repository: TasksRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  list() {
    return this.repository.list()
  }

  async create(input: Omit<TaskRecord, 'id' | 'source'>) {
    const task = await this.repository.create({
      ...input,
      id: `task-${crypto.randomUUID()}`,
      source: 'runtime',
    })

    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'task',
      title: `Task created: ${task.title}`,
      detail: `${task.owner} · ${task.status}`,
      timestamp: new Date().toISOString(),
      status: task.status === 'Done' ? 'done' : 'logged',
      source: 'runtime',
    })

    return task
  }

  async update(taskId: string, patch: Partial<TaskRecord>) {
    const updated = await this.repository.update(taskId, patch)

    if (updated) {
      await this.activityRepository.append({
        id: `activity-${crypto.randomUUID()}`,
        type: 'task',
        title: `Task status: ${updated.title}`,
        detail: `${updated.status} · ${updated.owner}`,
        timestamp: new Date().toISOString(),
        status: updated.status === 'Blocked' ? 'watch' : updated.status === 'Done' ? 'done' : 'logged',
        source: 'runtime',
      })
    }

    return updated
  }
}

export class StatusService {
  constructor(
    private readonly repository: StatusRepository,
    private readonly config: AppConfig,
  ) {}

  async runtimeContext(): Promise<RuntimeContextSnapshot> {
    const counts = await this.repository.snapshot()
    const taskBreakdown = counts.tasks.reduce<Record<TaskStatus, number>>(
      (accumulator, task) => {
        accumulator[task.status] += 1
        return accumulator
      },
      {
        Queued: 0,
        'In Progress': 0,
        Blocked: 0,
        Done: 0,
      },
    )
    const lastMessage = counts.chatMessages.at(-1) ?? null

    return {
      capturedAt: new Date().toISOString(),
      session: {
        scope: 'Current Nexus API process and persisted chat/session store',
        source: 'server-derived',
        cwd: process.cwd(),
        hostLabel: process.env.HOSTNAME ?? 'unknown-host',
        nodeVersion: process.version,
        serviceKind: process.env.OPENCLAW_SERVICE_KIND ?? 'standalone-node',
        transport: 'nexus-api',
        persistenceDriver: this.config.database.driver,
      },
      chat: {
        messageCount: counts.chatMessages.length,
        lastMessageAt: lastMessage?.timestamp ?? null,
        lastMessageRole: lastMessage?.role ?? null,
        modes: ['command', 'strategy', 'build'],
        fallbackModelState: 'stubbed-server-reply',
      },
      surfaces: {
        notesCount: counts.notes.length,
        tasksCount: counts.tasks.length,
        taskBreakdown,
        activityCount: counts.activity.length,
        latestActivityAt: counts.activity[0]?.timestamp ?? null,
      },
    }
  }

  async snapshot(): Promise<NexusStatusSnapshot> {
    const runtime = await this.runtimeContext()
    const data = await this.repository.snapshot()
    const runtimeActivityCount = data.activity.filter((item) => item.source === 'runtime').length
    const seededActivityCount = data.activity.filter((item) => item.source === 'seeded-demo').length

    return {
      capturedAt: new Date().toISOString(),
      environment: this.config.nodeEnv,
      storage: {
        driver: this.config.database.driver,
        dataPath: this.config.database.dataDirectory,
        schemaPath: this.config.database.schemaPath,
      },
      runtime,
      cards: [
        {
          id: 'api-runtime',
          label: 'API Runtime',
          value: 'Online',
          detail: `Node service is listening with ${this.config.database.driver} storage configured.`,
          severity: 'stable',
        },
        {
          id: 'chat-count',
          label: 'Chat Records',
          value: String(runtime.chat.messageCount),
          detail: 'Conversation state now lives behind the server API for this Nexus session.',
          severity: 'stable',
        },
        {
          id: 'notes-count',
          label: 'Notes',
          value: String(runtime.surfaces.notesCount),
          detail: 'Notes can move from file-backed storage to a real database without route rewrites.',
          severity: 'stable',
        },
        {
          id: 'tasks-count',
          label: 'Tasks',
          value: String(runtime.surfaces.tasksCount),
          detail: `Queued ${runtime.surfaces.taskBreakdown.Queued} · In progress ${runtime.surfaces.taskBreakdown['In Progress']} · Blocked ${runtime.surfaces.taskBreakdown.Blocked} · Done ${runtime.surfaces.taskBreakdown.Done}`,
          severity: 'watch',
        },
        {
          id: 'recent-activity',
          label: 'Recent Activity',
          value: `${runtimeActivityCount} runtime · ${seededActivityCount} seeded`,
          detail: runtimeActivityCount > 0
            ? 'Recent movement includes genuine server-recorded activity from this Nexus instance.'
            : 'Only seeded/demo activity is present so far. UI should not present it as live execution.',
          severity: runtimeActivityCount > 0 ? 'stable' : 'watch',
        },
      ],
    }
  }
}
