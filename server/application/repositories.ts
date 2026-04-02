import type {
  ActivityRecord,
  CalendarEventRecord,
  ChatMessageRecord,
  MemoryRecord,
  MissionRecord,
  NexusDataStore,
  NoteRecord,
  ProjectRecord,
  TaskRecord,
  TeamMemberRecord,
} from '../domain/models.js'
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

export class MissionCommandRepository {
  constructor(private readonly store: FileBackedStore) {}

  async patchMission(patch: Partial<MissionRecord>): Promise<MissionRecord> {
    const data = await this.store.read()
    data.missionCommand.mission = { ...data.missionCommand.mission, ...patch }
    await this.store.write(data)
    return data.missionCommand.mission
  }

  async patchProject(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    const data = await this.store.read()
    const index = data.missionCommand.projects.findIndex((p) => p.id === id)
    if (index === -1) return null
    data.missionCommand.projects[index] = { ...data.missionCommand.projects[index], ...patch }
    await this.store.write(data)
    return data.missionCommand.projects[index]
  }

  async patchTeamMember(id: string, patch: Partial<TeamMemberRecord>): Promise<TeamMemberRecord | null> {
    const data = await this.store.read()
    const index = data.missionCommand.team.findIndex((t) => t.id === id)
    if (index === -1) return null
    data.missionCommand.team[index] = { ...data.missionCommand.team[index], ...patch }
    await this.store.write(data)
    return data.missionCommand.team[index]
  }

  async createCalendarEvent(event: CalendarEventRecord): Promise<CalendarEventRecord> {
    const data = await this.store.read()
    data.missionCommand.calendar = [event, ...data.missionCommand.calendar]
    await this.store.write(data)
    return event
  }

  async createMemory(memory: MemoryRecord): Promise<MemoryRecord> {
    const data = await this.store.read()
    data.missionCommand.memories = [memory, ...data.missionCommand.memories]
    await this.store.write(data)
    return memory
  }

  async listMemories(): Promise<MemoryRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.memories
  }

  async listCalendarEvents(): Promise<CalendarEventRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.calendar
  }
}
