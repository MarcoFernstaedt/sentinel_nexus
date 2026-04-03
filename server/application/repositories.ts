import type {
  ActivityRecord,
  CalendarEventRecord,
  ChatMessageRecord,
  GoalRecord,
  HabitRecord,
  MemoryRecord,
  MissionRecord,
  NexusDataStore,
  NoteRecord,
  ProjectRecord,
  TaskRecord,
  TeamMemberRecord,
} from '../domain/models.js'
import type { FileBackedStore } from '../infrastructure/fileStore.js'
import type { SqliteStore } from '../infrastructure/sqliteStore.js'

type StorageDriver = FileBackedStore | SqliteStore

export class ChatRepository {
  constructor(private readonly store: StorageDriver) {}

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
  constructor(private readonly store: StorageDriver) {}

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
  constructor(private readonly store: StorageDriver) {}

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
  constructor(private readonly store: StorageDriver) {}

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
  constructor(private readonly store: StorageDriver) {}

  snapshot(): Promise<NexusDataStore> {
    return this.store.read()
  }
}

export class MissionCommandRepository {
  constructor(private readonly store: StorageDriver) {}

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

export class GoalsRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(): Promise<GoalRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.goals
  }

  async create(goal: GoalRecord): Promise<GoalRecord> {
    const data = await this.store.read()
    data.missionCommand.goals = [goal, ...data.missionCommand.goals]
    await this.store.write(data)
    return goal
  }

  async update(id: string, patch: Partial<GoalRecord>): Promise<GoalRecord | null> {
    const data = await this.store.read()
    const index = data.missionCommand.goals.findIndex((g) => g.id === id)
    if (index === -1) return null
    data.missionCommand.goals[index] = { ...data.missionCommand.goals[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.goals[index]!
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.store.read()
    const before = data.missionCommand.goals.length
    data.missionCommand.goals = data.missionCommand.goals.filter((g) => g.id !== id)
    await this.store.write(data)
    return data.missionCommand.goals.length < before
  }
}

export class HabitsRepository {
  constructor(private readonly store: StorageDriver) {}

  private getAll(data: NexusDataStore): HabitRecord[] {
    return data.missionCommand.habits ?? []
  }

  async list(): Promise<HabitRecord[]> {
    const data = await this.store.read()
    return this.getAll(data)
  }

  async create(habit: HabitRecord): Promise<HabitRecord> {
    const data = await this.store.read()
    data.missionCommand.habits = [habit, ...this.getAll(data)]
    await this.store.write(data)
    return habit
  }

  async update(id: string, patch: Partial<HabitRecord>): Promise<HabitRecord | null> {
    const data = await this.store.read()
    const habits = this.getAll(data)
    const index = habits.findIndex((h) => h.id === id)
    if (index === -1) return null
    habits[index] = { ...habits[index]!, ...patch }
    data.missionCommand.habits = habits
    await this.store.write(data)
    return habits[index]!
  }

  async complete(id: string, date: string): Promise<HabitRecord | null> {
    const data = await this.store.read()
    const habits = this.getAll(data)
    const index = habits.findIndex((h) => h.id === id)
    if (index === -1) return null

    const habit = { ...habits[index]! }
    if (!habit.completedDates.includes(date)) {
      habit.completedDates = [...habit.completedDates, date].sort()
    }

    // Recompute streak (consecutive daily completions ending today or yesterday)
    habit.currentStreak = computeCurrentStreak(habit.completedDates)
    habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak)

    habits[index] = habit
    data.missionCommand.habits = habits
    await this.store.write(data)
    return habit
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.store.read()
    const habits = this.getAll(data)
    const before = habits.length
    data.missionCommand.habits = habits.filter((h) => h.id !== id)
    await this.store.write(data)
    return data.missionCommand.habits.length < before
  }
}

function computeCurrentStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0
  const today = todayIso()
  const yesterday = offsetIso(today, -1)
  // Streak must include today or yesterday to be considered active
  const latest = sortedDates[sortedDates.length - 1]!
  if (latest !== today && latest !== yesterday) return 0

  let streak = 0
  let cursor = latest === today ? today : yesterday
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    if (sortedDates[i] === cursor) {
      streak++
      cursor = offsetIso(cursor, -1)
    } else if (sortedDates[i]! < cursor) {
      break
    }
  }
  return streak
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function offsetIso(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
