import type { ActivityRecord, ChatMessageRecord, NexusDataStore, NoteRecord, TaskRecord } from '../domain/models.js'
import { FileBackedStore } from '../infrastructure/fileStore.js'

export class ChatRepository {
  constructor(private readonly store: FileBackedStore) {}

  async list() {
    const data = await this.store.read()
    return data.chatMessages
  }

  async append(messages: ChatMessageRecord[]) {
    const data = await this.store.read()
    data.chatMessages = [...data.chatMessages, ...messages]
    await this.store.write(data)
    return messages
  }
}

export class NotesRepository {
  constructor(private readonly store: FileBackedStore) {}

  async list() {
    const data = await this.store.read()
    return data.notes
  }

  async create(note: NoteRecord) {
    const data = await this.store.read()
    data.notes = [note, ...data.notes]
    await this.store.write(data)
    return note
  }
}

export class TasksRepository {
  constructor(private readonly store: FileBackedStore) {}

  async list() {
    const data = await this.store.read()
    return data.tasks
  }

  async create(task: TaskRecord) {
    const data = await this.store.read()
    data.tasks = [task, ...data.tasks]
    await this.store.write(data)
    return task
  }

  async update(taskId: string, patch: Partial<TaskRecord>) {
    const data = await this.store.read()
    const updatedTasks = data.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    data.tasks = updatedTasks
    await this.store.write(data)
    return updatedTasks.find((task) => task.id === taskId) ?? null
  }
}

export class ActivityRepository {
  constructor(private readonly store: FileBackedStore) {}

  async list(limit?: number) {
    const data = await this.store.read()
    const activity = [...(data.activity ?? [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return typeof limit === 'number' ? activity.slice(0, limit) : activity
  }

  async append(entry: ActivityRecord) {
    const data = await this.store.read()
    data.activity = [entry, ...(data.activity ?? [])].slice(0, 40)
    await this.store.write(data)
    return entry
  }
}

export class StatusRepository {
  constructor(private readonly store: FileBackedStore) {}

  snapshot(): Promise<NexusDataStore> {
    return this.store.read()
  }
}
