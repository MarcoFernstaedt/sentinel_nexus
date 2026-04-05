import type {
  ActivityRecord,
  AgentRecord,
  ArtifactRecord,
  CalendarEventRecord,
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
import type { SqliteStore } from '../infrastructure/sqliteStore.js'
import type { FileBackedStore } from '../infrastructure/fileStore.js'

type StorageDriver = FileBackedStore | SqliteStore

// ── Type guard: does this driver expose targeted methods? ─────────
function isSqlite(driver: StorageDriver): driver is SqliteStore {
  return 'insertTask' in driver
}

// ── Chat ──────────────────────────────────────────────────────────

export class ChatRepository {
  constructor(private readonly store: StorageDriver) {}

  async list() {
    const data = await this.store.read()
    return data.chatMessages
  }

  async append(messages: import('../domain/models.js').ChatMessageRecord[]) {
    if (isSqlite(this.store)) {
      this.store.insertMessages(messages)
      return messages
    }
    const data = await this.store.read()
    data.chatMessages = [...data.chatMessages, ...messages]
    await this.store.write(data)
    return messages
  }
}

// ── Notes ─────────────────────────────────────────────────────────

export class NotesRepository {
  constructor(private readonly store: StorageDriver) {}

  async list() {
    const data = await this.store.read()
    return data.notes
  }

  async create(note: NoteRecord) {
    if (isSqlite(this.store)) {
      this.store.insertNote(note)
      return note
    }
    const data = await this.store.read()
    data.notes = [note, ...data.notes]
    await this.store.write(data)
    return note
  }
}

// ── Tasks ─────────────────────────────────────────────────────────

export class TasksRepository {
  constructor(private readonly store: StorageDriver) {}

  async list() {
    const data = await this.store.read()
    return data.tasks
  }

  async create(task: TaskRecord) {
    if (isSqlite(this.store)) {
      this.store.insertTask(task)
      return task
    }
    const data = await this.store.read()
    data.tasks = [task, ...data.tasks]
    await this.store.write(data)
    return task
  }

  async update(taskId: string, patch: Partial<TaskRecord>) {
    if (isSqlite(this.store)) {
      return this.store.updateTask(taskId, patch)
    }
    const data = await this.store.read()
    const updatedTasks = data.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    data.tasks = updatedTasks
    await this.store.write(data)
    return updatedTasks.find((t) => t.id === taskId) ?? null
  }
}

// ── Activity ──────────────────────────────────────────────────────

export class ActivityRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(limit?: number) {
    const data = await this.store.read()
    const activity = [...(data.activity ?? [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return typeof limit === 'number' ? activity.slice(0, limit) : activity
  }

  async append(entry: ActivityRecord) {
    if (isSqlite(this.store)) {
      this.store.insertActivity(entry)
      this.store.trimActivity(40)
      return entry
    }
    const data = await this.store.read()
    data.activity = [entry, ...(data.activity ?? [])].slice(0, 40)
    await this.store.write(data)
    return entry
  }
}

// ── Status ────────────────────────────────────────────────────────

export class StatusRepository {
  constructor(private readonly store: StorageDriver) {}

  snapshot(): Promise<NexusDataStore> {
    return this.store.read()
  }
}

// ── Mission Command ───────────────────────────────────────────────

export class MissionCommandRepository {
  constructor(private readonly store: StorageDriver) {}

  async patchMission(patch: Partial<MissionRecord>): Promise<MissionRecord> {
    if (isSqlite(this.store)) {
      const data = await this.store.read()
      const merged = { ...data.missionCommand.mission, ...patch }
      this.store.upsertMission(merged)
      return merged
    }
    const data = await this.store.read()
    data.missionCommand.mission = { ...data.missionCommand.mission, ...patch }
    await this.store.write(data)
    return data.missionCommand.mission
  }

  async patchProject(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateProject(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.projects.findIndex((p) => p.id === id)
    if (index === -1) return null
    data.missionCommand.projects[index] = { ...data.missionCommand.projects[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.projects[index]!
  }

  async patchTeamMember(id: string, patch: Partial<TeamMemberRecord>): Promise<TeamMemberRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateTeamMember(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.team.findIndex((t) => t.id === id)
    if (index === -1) return null
    data.missionCommand.team[index] = { ...data.missionCommand.team[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.team[index]!
  }

  async createCalendarEvent(event: CalendarEventRecord): Promise<CalendarEventRecord> {
    if (isSqlite(this.store)) {
      this.store.insertCalendarEvent(event)
      return event
    }
    const data = await this.store.read()
    data.missionCommand.calendar = [event, ...data.missionCommand.calendar]
    await this.store.write(data)
    return event
  }

  async updateCalendarEvent(id: string, patch: Partial<CalendarEventRecord>): Promise<CalendarEventRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateCalendarEvent(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.calendar.findIndex((c) => c.id === id)
    if (index === -1) return null
    data.missionCommand.calendar[index] = { ...data.missionCommand.calendar[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.calendar[index]!
  }

  async listCalendarEvents(): Promise<CalendarEventRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.calendar
  }

  async createMemory(memory: MemoryRecord): Promise<MemoryRecord> {
    if (isSqlite(this.store)) {
      this.store.insertMemory(memory)
      return memory
    }
    const data = await this.store.read()
    data.missionCommand.memories = [memory, ...data.missionCommand.memories]
    await this.store.write(data)
    return memory
  }

  async updateMemory(id: string, patch: Partial<MemoryRecord>): Promise<MemoryRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateMemory(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.memories.findIndex((m) => m.id === id)
    if (index === -1) return null
    data.missionCommand.memories[index] = { ...data.missionCommand.memories[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.memories[index]!
  }

  async deleteMemory(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteMemory(id)
    }
    const data = await this.store.read()
    const before = data.missionCommand.memories.length
    data.missionCommand.memories = data.missionCommand.memories.filter((m) => m.id !== id)
    await this.store.write(data)
    return data.missionCommand.memories.length < before
  }

  async listMemories(): Promise<MemoryRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.memories
  }
}

// ── Goals ─────────────────────────────────────────────────────────

export class GoalsRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(): Promise<GoalRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.goals
  }

  async create(goal: GoalRecord): Promise<GoalRecord> {
    if (isSqlite(this.store)) {
      this.store.insertGoal(goal)
      return goal
    }
    const data = await this.store.read()
    data.missionCommand.goals = [goal, ...data.missionCommand.goals]
    await this.store.write(data)
    return goal
  }

  async update(id: string, patch: Partial<GoalRecord>): Promise<GoalRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateGoal(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.goals.findIndex((g) => g.id === id)
    if (index === -1) return null
    data.missionCommand.goals[index] = { ...data.missionCommand.goals[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.goals[index]!
  }

  async delete(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteGoal(id)
    }
    const data = await this.store.read()
    const before = data.missionCommand.goals.length
    data.missionCommand.goals = data.missionCommand.goals.filter((g) => g.id !== id)
    await this.store.write(data)
    return data.missionCommand.goals.length < before
  }
}

// ── Projects ──────────────────────────────────────────────────────

export class ProjectsRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(): Promise<ProjectRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.projects
  }

  async get(id: string): Promise<ProjectRecord | null> {
    const data = await this.store.read()
    return data.missionCommand.projects.find((p) => p.id === id) ?? null
  }

  async create(project: ProjectRecord): Promise<ProjectRecord> {
    if (isSqlite(this.store)) {
      this.store.insertProject(project)
      return project
    }
    const data = await this.store.read()
    data.missionCommand.projects = [project, ...data.missionCommand.projects]
    await this.store.write(data)
    return project
  }

  async update(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateProject(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.projects.findIndex((p) => p.id === id)
    if (index === -1) return null
    data.missionCommand.projects[index] = { ...data.missionCommand.projects[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.projects[index]!
  }

  async delete(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteProject(id)
    }
    const data = await this.store.read()
    const before = data.missionCommand.projects.length
    data.missionCommand.projects = data.missionCommand.projects.filter((p) => p.id !== id)
    await this.store.write(data)
    return data.missionCommand.projects.length < before
  }
}

// ── Team ──────────────────────────────────────────────────────────

export class TeamRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(): Promise<TeamMemberRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.team
  }

  async create(member: TeamMemberRecord): Promise<TeamMemberRecord> {
    if (isSqlite(this.store)) {
      this.store.insertTeamMember(member)
      return member
    }
    const data = await this.store.read()
    data.missionCommand.team = [member, ...data.missionCommand.team]
    await this.store.write(data)
    return member
  }

  async update(id: string, patch: Partial<TeamMemberRecord>): Promise<TeamMemberRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateTeamMember(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.team.findIndex((t) => t.id === id)
    if (index === -1) return null
    data.missionCommand.team[index] = { ...data.missionCommand.team[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.team[index]!
  }

  async delete(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteTeamMember(id)
    }
    const data = await this.store.read()
    const before = data.missionCommand.team.length
    data.missionCommand.team = data.missionCommand.team.filter((t) => t.id !== id)
    await this.store.write(data)
    return data.missionCommand.team.length < before
  }
}

// ── Agents ────────────────────────────────────────────────────────

export class AgentsRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(): Promise<AgentRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.agents ?? []
  }

  async get(id: string): Promise<AgentRecord | null> {
    const agents = await this.list()
    return agents.find((a) => a.id === id) ?? null
  }

  async create(agent: AgentRecord): Promise<AgentRecord> {
    if (isSqlite(this.store)) {
      this.store.insertAgent(agent)
      return agent
    }
    const data = await this.store.read()
    data.missionCommand.agents = [agent, ...(data.missionCommand.agents ?? [])]
    await this.store.write(data)
    return agent
  }

  async update(id: string, patch: Partial<AgentRecord>): Promise<AgentRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateAgent(id, patch)
    }
    const data = await this.store.read()
    const agents = data.missionCommand.agents ?? []
    const index = agents.findIndex((a) => a.id === id)
    if (index === -1) return null
    agents[index] = { ...agents[index]!, ...patch }
    data.missionCommand.agents = agents
    await this.store.write(data)
    return agents[index]!
  }

  async delete(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteAgent(id)
    }
    const data = await this.store.read()
    const agents = data.missionCommand.agents ?? []
    const before = agents.length
    data.missionCommand.agents = agents.filter((a) => a.id !== id)
    await this.store.write(data)
    return (data.missionCommand.agents?.length ?? 0) < before
  }
}

// ── Artifacts ─────────────────────────────────────────────────────

export class ArtifactsRepository {
  constructor(private readonly store: StorageDriver) {}

  async list(): Promise<ArtifactRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.artifacts
  }

  async create(artifact: ArtifactRecord): Promise<ArtifactRecord> {
    if (isSqlite(this.store)) {
      this.store.insertArtifact(artifact)
      return artifact
    }
    const data = await this.store.read()
    data.missionCommand.artifacts = [artifact, ...data.missionCommand.artifacts]
    await this.store.write(data)
    return artifact
  }

  async update(id: string, patch: Partial<ArtifactRecord>): Promise<ArtifactRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateArtifact(id, patch)
    }
    const data = await this.store.read()
    const index = data.missionCommand.artifacts.findIndex((a) => a.id === id)
    if (index === -1) return null
    data.missionCommand.artifacts[index] = { ...data.missionCommand.artifacts[index]!, ...patch }
    await this.store.write(data)
    return data.missionCommand.artifacts[index]!
  }

  async delete(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteArtifact(id)
    }
    const data = await this.store.read()
    const before = data.missionCommand.artifacts.length
    data.missionCommand.artifacts = data.missionCommand.artifacts.filter((a) => a.id !== id)
    await this.store.write(data)
    return data.missionCommand.artifacts.length < before
  }
}

// ── Habits ────────────────────────────────────────────────────────

export class HabitsRepository {
  constructor(private readonly store: StorageDriver) {}

  private async getAll(): Promise<HabitRecord[]> {
    const data = await this.store.read()
    return data.missionCommand.habits ?? []
  }

  async list(): Promise<HabitRecord[]> {
    return this.getAll()
  }

  async create(habit: HabitRecord): Promise<HabitRecord> {
    if (isSqlite(this.store)) {
      this.store.insertHabit(habit)
      return habit
    }
    const data = await this.store.read()
    data.missionCommand.habits = [habit, ...(data.missionCommand.habits ?? [])]
    await this.store.write(data)
    return habit
  }

  async update(id: string, patch: Partial<HabitRecord>): Promise<HabitRecord | null> {
    if (isSqlite(this.store)) {
      return this.store.updateHabit(id, patch)
    }
    const data = await this.store.read()
    const habits = data.missionCommand.habits ?? []
    const index = habits.findIndex((h) => h.id === id)
    if (index === -1) return null
    habits[index] = { ...habits[index]!, ...patch }
    data.missionCommand.habits = habits
    await this.store.write(data)
    return habits[index]!
  }

  async complete(id: string, date: string): Promise<HabitRecord | null> {
    const habit = (await this.getAll()).find((h) => h.id === id)
    if (!habit) return null

    const updated = { ...habit }
    if (!updated.completedDates.includes(date)) {
      updated.completedDates = [...updated.completedDates, date].sort()
    }
    updated.currentStreak = computeCurrentStreak(updated.completedDates)
    updated.longestStreak = Math.max(updated.longestStreak, updated.currentStreak)

    if (isSqlite(this.store)) {
      return this.store.updateHabit(id, updated)
    }
    const data = await this.store.read()
    const habits = data.missionCommand.habits ?? []
    const index = habits.findIndex((h) => h.id === id)
    if (index === -1) return null
    habits[index] = updated
    data.missionCommand.habits = habits
    await this.store.write(data)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    if (isSqlite(this.store)) {
      return this.store.deleteHabit(id)
    }
    const data = await this.store.read()
    const habits = data.missionCommand.habits ?? []
    const before = habits.length
    data.missionCommand.habits = habits.filter((h) => h.id !== id)
    await this.store.write(data)
    return (data.missionCommand.habits?.length ?? 0) < before
  }
}

// ── Search ────────────────────────────────────────────────────────

export class SearchRepository {
  constructor(private readonly store: StorageDriver) {}

  async search(query: string, limit = 20): Promise<import('../domain/models.js').SearchEntryRecord[]> {
    if (isSqlite(this.store)) {
      return this.store.searchEntities(query, limit)
    }
    // File store fallback: scan all entities in memory
    const data = await this.store.read()
    const q = query.toLowerCase()
    return data.missionCommand.searchIndex
      .filter((e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q))
      .slice(0, limit)
  }
}

// ── Streak helpers ────────────────────────────────────────────────

function computeCurrentStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0
  const today = todayIso()
  const yesterday = offsetIso(today, -1)
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
