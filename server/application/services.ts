import type { ChatModeId, ChatMessageRecord, NexusStatusSnapshot, NoteRecord, TaskRecord } from '../domain/models.js'
import type { AppConfig } from '../config/env.js'
import { ChatRepository, NotesRepository, StatusRepository, TasksRepository } from './repositories.js'

const personaReplies: Record<ChatModeId, string> = {
  command:
    'Command path locked. The backend now owns transport state, so this reply can later be swapped for a real model or execution adapter.',
  strategy:
    'Strategic posture: the route layer stays thin, the service layer owns decisions, and persistence is isolated behind the Nexus DB boundary.',
  build:
    'Build posture: this repo now has a real server spine, domain models, repositories, and a replaceable data store instead of pretending the browser is the backend.',
}

export class ChatService {
  constructor(private readonly repository: ChatRepository) {}

  list() {
    return this.repository.list()
  }

  async submit(input: { body: string; modeId: ChatModeId; author?: string }) {
    const operatorMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'operator',
      author: input.author?.trim() || 'Marco',
      body: input.body.trim(),
      timestamp: new Date().toISOString(),
      modeId: input.modeId,
      status: 'ready',
    }

    const sentinelMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'sentinel',
      author: 'Sentinel',
      body: `${personaReplies[input.modeId]}\n\nCaptured request: “${input.body.trim()}”.`,
      timestamp: new Date().toISOString(),
      modeId: input.modeId,
      status: 'ready',
    }

    await this.repository.append([operatorMessage, sentinelMessage])
    return { operatorMessage, sentinelMessage }
  }
}

export class NotesService {
  constructor(private readonly repository: NotesRepository) {}

  list() {
    return this.repository.list()
  }

  create(input: Pick<NoteRecord, 'title' | 'body' | 'tag'>) {
    return this.repository.create({
      id: `note-${crypto.randomUUID()}`,
      title: input.title.trim(),
      body: input.body.trim(),
      tag: input.tag.trim() || 'general',
      updatedAt: new Date().toISOString(),
    })
  }
}

export class TasksService {
  constructor(private readonly repository: TasksRepository) {}

  list() {
    return this.repository.list()
  }

  create(input: Omit<TaskRecord, 'id'>) {
    return this.repository.create({
      ...input,
      id: `task-${crypto.randomUUID()}`,
    })
  }

  update(taskId: string, patch: Partial<TaskRecord>) {
    return this.repository.update(taskId, patch)
  }
}

export class StatusService {
  constructor(
    private readonly repository: StatusRepository,
    private readonly config: AppConfig,
  ) {}

  async snapshot(): Promise<NexusStatusSnapshot> {
    const counts = await this.repository.counts()

    return {
      capturedAt: new Date().toISOString(),
      environment: this.config.nodeEnv,
      storage: {
        driver: this.config.database.driver,
        dataPath: this.config.database.dataDirectory,
        schemaPath: this.config.database.schemaPath,
      },
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
          value: String(counts.chatMessages.length),
          detail: 'Conversation state now lives behind the server API.',
          severity: 'stable',
        },
        {
          id: 'notes-count',
          label: 'Notes',
          value: String(counts.notes.length),
          detail: 'Notes can move from file-backed storage to a real database without route rewrites.',
          severity: 'stable',
        },
        {
          id: 'tasks-count',
          label: 'Tasks',
          value: String(counts.tasks.length),
          detail: 'Task seams are wired server-side and ready for future auth/event streaming.',
          severity: 'watch',
        },
      ],
    }
  }
}
