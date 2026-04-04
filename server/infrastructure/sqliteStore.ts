import Database from 'better-sqlite3'
import fs from 'node:fs'
import fsAsync from 'node:fs/promises'
import path from 'node:path'
import { createSeedData } from '../domain/seeds.js'
import type {
  ActivityRecord,
  ArtifactRecord,
  CalendarEventRecord,
  ChatMessageRecord,
  GoalRecord,
  HabitRecord,
  MemoryRecord,
  MissionRecord,
  NexusDataStore,
  NoteRecord,
  OfficeRecord,
  ProjectRecord,
  RecordSource,
  SearchEntryRecord,
  TaskRecord,
  TaskStage,
  TeamMemberRecord,
} from '../domain/models.js'

// ── Helpers ───────────────────────────────────────────────────────

function toArr(value: unknown): unknown[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return [] }
  }
  return []
}

function toBool(value: unknown): boolean {
  return value === 1 || value === true || value === 'true'
}

function toStr(value: unknown, fallback = ''): string {
  return value != null ? String(value) : fallback
}

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// ── Row → Record converters ───────────────────────────────────────

function rowToMessage(row: Record<string, unknown>): ChatMessageRecord {
  return {
    id: toStr(row['id']),
    role: toStr(row['role']) as ChatMessageRecord['role'],
    author: toStr(row['author']),
    body: toStr(row['body']),
    timestamp: toStr(row['timestamp']),
    modeId: toStr(row['mode_id']) as ChatMessageRecord['modeId'],
    status: (toStr(row['status'], 'ready')) as ChatMessageRecord['status'],
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToNote(row: Record<string, unknown>): NoteRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    body: toStr(row['body']),
    tag: toStr(row['tag']),
    updatedAt: toStr(row['updated_at']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToTask(row: Record<string, unknown>): TaskRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    owner: toStr(row['owner']),
    due: toStr(row['due']),
    status: toStr(row['status']) as TaskRecord['status'],
    stage: (toStr(row['stage'], 'queued')) as TaskStage,
    lane: toStr(row['lane']),
    projectId: row['project_id'] ? toStr(row['project_id']) : undefined,
    summary: row['summary'] ? toStr(row['summary']) : undefined,
    needsUserInput: toBool(row['needs_user_input']),
    needsApproval: toBool(row['needs_approval']),
    assignedBy: row['assigned_by'] ? toStr(row['assigned_by']) : undefined,
    readyToReport: toBool(row['ready_to_report']),
    blockedReason: row['blocked_reason'] ? toStr(row['blocked_reason']) : undefined,
    waitingFor: row['waiting_for'] ? toStr(row['waiting_for']) : undefined,
    lastUpdatedAt: row['last_updated_at'] ? toStr(row['last_updated_at']) : undefined,
    completedAt: row['completed_at'] ? toStr(row['completed_at']) : undefined,
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToActivity(row: Record<string, unknown>): ActivityRecord {
  return {
    id: toStr(row['id']),
    type: toStr(row['type']) as ActivityRecord['type'],
    title: toStr(row['title']),
    detail: toStr(row['detail']),
    timestamp: toStr(row['timestamp']),
    status: toStr(row['status'], 'logged') as ActivityRecord['status'],
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToMission(row: Record<string, unknown>): MissionRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    statement: toStr(row['statement']),
    commandIntent: toStr(row['command_intent']),
    progressPercent: toInt(row['progress_percent']),
    targetDate: toStr(row['target_date']),
    activeModeId: toStr(row['active_mode_id'], 'command') as MissionRecord['activeModeId'],
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToGoal(row: Record<string, unknown>): GoalRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    category: toStr(row['category']) as GoalRecord['category'],
    status: toStr(row['status'], 'on-track') as GoalRecord['status'],
    progressPercent: toInt(row['progress_percent']),
    targetDate: toStr(row['target_date']),
    summary: toStr(row['summary']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToProject(row: Record<string, unknown>): ProjectRecord {
  return {
    id: toStr(row['id']),
    name: toStr(row['name']),
    area: toStr(row['area']),
    status: toStr(row['status'], 'active') as ProjectRecord['status'],
    objective: toStr(row['objective']),
    missionAlignment: toStr(row['mission_alignment']),
    goalIds: toArr(row['goal_ids']) as string[],
    progressPercent: toInt(row['progress_percent']),
    targetDate: row['target_date'] ? toStr(row['target_date']) : undefined,
    owner: toStr(row['owner']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToCalendar(row: Record<string, unknown>): CalendarEventRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    type: toStr(row['type']) as CalendarEventRecord['type'],
    startsAt: toStr(row['starts_at']),
    endsAt: row['ends_at'] ? toStr(row['ends_at']) : undefined,
    owner: toStr(row['owner']),
    relatedProjectId: row['related_project_id'] ? toStr(row['related_project_id']) : undefined,
    status: toStr(row['status'], 'scheduled') as CalendarEventRecord['status'],
    detail: toStr(row['detail']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToMemory(row: Record<string, unknown>): MemoryRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    kind: toStr(row['kind'], 'working-memory') as MemoryRecord['kind'],
    updatedAt: toStr(row['updated_at']),
    summary: toStr(row['summary']),
    tags: toArr(row['tags']) as string[],
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToArtifact(row: Record<string, unknown>): ArtifactRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    type: toStr(row['type'], 'doc') as ArtifactRecord['type'],
    location: toStr(row['location']),
    updatedAt: toStr(row['updated_at']),
    summary: toStr(row['summary']),
    relatedProjectId: row['related_project_id'] ? toStr(row['related_project_id']) : undefined,
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToTeam(row: Record<string, unknown>): TeamMemberRecord {
  return {
    id: toStr(row['id']),
    name: toStr(row['name']),
    role: toStr(row['role']),
    status: toStr(row['status'], 'active') as TeamMemberRecord['status'],
    focus: toStr(row['focus']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToOffice(row: Record<string, unknown>): OfficeRecord {
  return {
    id: toStr(row['id']),
    label: toStr(row['label']),
    value: toStr(row['value']),
    detail: toStr(row['detail']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToSearchEntry(row: Record<string, unknown>): SearchEntryRecord {
  return {
    id: toStr(row['id']),
    entityType: toStr(row['entity_type']) as SearchEntryRecord['entityType'],
    title: toStr(row['title']),
    summary: toStr(row['summary']),
    relatedId: toStr(row['related_id']),
    updatedAt: row['updated_at'] ? toStr(row['updated_at']) : undefined,
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

function rowToHabit(row: Record<string, unknown>): HabitRecord {
  return {
    id: toStr(row['id']),
    title: toStr(row['title']),
    category: toStr(row['category'], 'work') as HabitRecord['category'],
    frequency: toStr(row['frequency'], 'daily') as HabitRecord['frequency'],
    targetPerPeriod: toInt(row['target_per_period'], 1),
    completedDates: toArr(row['completed_dates']) as string[],
    currentStreak: toInt(row['current_streak']),
    longestStreak: toInt(row['longest_streak']),
    createdAt: toStr(row['created_at']),
    source: toStr(row['source'], 'runtime') as RecordSource,
  }
}

// ── Record → SQL column maps ──────────────────────────────────────

function messageToRow(r: ChatMessageRecord): Record<string, unknown> {
  return { id: r.id, role: r.role, author: r.author, body: r.body, timestamp: r.timestamp, mode_id: r.modeId, status: r.status, source: r.source }
}

function noteToRow(r: NoteRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, body: r.body, tag: r.tag, project_id: r.projectId ?? null, updated_at: r.updatedAt, source: r.source }
}

function taskToRow(r: TaskRecord): Record<string, unknown> {
  return {
    id: r.id, title: r.title, owner: r.owner, due: r.due, status: r.status, stage: r.stage,
    lane: r.lane, project_id: r.projectId ?? null, summary: r.summary ?? null,
    needs_user_input: r.needsUserInput ? 1 : 0, needs_approval: r.needsApproval ? 1 : 0,
    assigned_by: r.assignedBy ?? null, ready_to_report: r.readyToReport ? 1 : 0,
    blocked_reason: r.blockedReason ?? null, waiting_for: r.waitingFor ?? null,
    last_updated_at: r.lastUpdatedAt ?? null, completed_at: r.completedAt ?? null,
    source: r.source,
  }
}

function activityToRow(r: ActivityRecord): Record<string, unknown> {
  return { id: r.id, type: r.type, title: r.title, detail: r.detail, timestamp: r.timestamp, status: r.status, source: r.source }
}

function missionToRow(r: MissionRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, statement: r.statement, command_intent: r.commandIntent, progress_percent: r.progressPercent, target_date: r.targetDate, active_mode_id: r.activeModeId, source: r.source }
}

function goalToRow(r: GoalRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, category: r.category, status: r.status, progress_percent: r.progressPercent, target_date: r.targetDate, summary: r.summary, source: r.source }
}

function projectToRow(r: ProjectRecord): Record<string, unknown> {
  return { id: r.id, name: r.name, area: r.area, status: r.status, objective: r.objective, mission_alignment: r.missionAlignment, goal_ids: JSON.stringify(r.goalIds), progress_percent: r.progressPercent, target_date: r.targetDate ?? null, owner: r.owner, source: r.source }
}

function calendarToRow(r: CalendarEventRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, type: r.type, starts_at: r.startsAt, ends_at: r.endsAt ?? null, owner: r.owner, related_project_id: r.relatedProjectId ?? null, status: r.status, detail: r.detail, source: r.source }
}

function memoryToRow(r: MemoryRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, kind: r.kind, updated_at: r.updatedAt, summary: r.summary, tags: JSON.stringify(r.tags), source: r.source }
}

function artifactToRow(r: ArtifactRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, type: r.type, location: r.location, updated_at: r.updatedAt, summary: r.summary, related_project_id: r.relatedProjectId ?? null, source: r.source }
}

function teamToRow(r: TeamMemberRecord): Record<string, unknown> {
  return { id: r.id, name: r.name, role: r.role, status: r.status, focus: r.focus, source: r.source }
}

function officeToRow(r: OfficeRecord): Record<string, unknown> {
  return { id: r.id, label: r.label, value: r.value, detail: r.detail, source: r.source }
}

function searchEntryToRow(r: SearchEntryRecord): Record<string, unknown> {
  return { id: r.id, entity_type: r.entityType, title: r.title, summary: r.summary, related_id: r.relatedId, updated_at: r.updatedAt ?? null, source: r.source }
}

function habitToRow(r: HabitRecord): Record<string, unknown> {
  return { id: r.id, title: r.title, category: r.category, frequency: r.frequency, target_per_period: r.targetPerPeriod, completed_dates: JSON.stringify(r.completedDates), current_streak: r.currentStreak, longest_streak: r.longestStreak, created_at: r.createdAt, source: r.source }
}

// ── Upsert helper ─────────────────────────────────────────────────

function upsertAll(db: Database.Database, table: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return
  const cols = Object.keys(rows[0]!)
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
  const stmt = db.prepare(sql)
  for (const row of rows) {
    stmt.run(Object.values(row))
  }
}

// ── SqliteStore ───────────────────────────────────────────────────

export class SqliteStore {
  private readonly dbPath: string
  private readonly schemaPath: string
  private db: Database.Database | null = null

  constructor(dataDirectory: string, schemaPath: string) {
    this.dbPath = path.join(dataDirectory, 'nexus-data.sqlite')
    this.schemaPath = schemaPath
  }

  private open(): Database.Database {
    if (this.db) return this.db
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true })
    const db = new Database(this.dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Apply schema
    const schema = fs.readFileSync(this.schemaPath, 'utf8')
    db.exec(schema)

    this.db = db
    return db
  }

  async read(): Promise<NexusDataStore> {
    const db = this.open()

    // Auto-migrate from JSON file if DB is empty
    await this.migrateFromJsonIfNeeded(db)

    const chatMessages = (db.prepare('SELECT * FROM chat_messages').all() as Record<string, unknown>[]).map(rowToMessage)
    const notes = (db.prepare('SELECT * FROM notes').all() as Record<string, unknown>[]).map(rowToNote)
    const tasks = (db.prepare('SELECT * FROM tasks').all() as Record<string, unknown>[]).map(rowToTask)
    const activity = (db.prepare('SELECT * FROM activity ORDER BY timestamp DESC').all() as Record<string, unknown>[]).map(rowToActivity)

    const missionRows = db.prepare('SELECT * FROM mission LIMIT 1').all() as Record<string, unknown>[]
    const seed = createSeedData()
    const mission: MissionRecord = missionRows.length > 0
      ? rowToMission(missionRows[0]!)
      : seed.missionCommand.mission

    const goals = (db.prepare('SELECT * FROM goals').all() as Record<string, unknown>[]).map(rowToGoal)
    const projects = (db.prepare('SELECT * FROM projects').all() as Record<string, unknown>[]).map(rowToProject)
    const calendar = (db.prepare('SELECT * FROM calendar').all() as Record<string, unknown>[]).map(rowToCalendar)
    const memories = (db.prepare('SELECT * FROM memories').all() as Record<string, unknown>[]).map(rowToMemory)
    const artifacts = (db.prepare('SELECT * FROM artifacts').all() as Record<string, unknown>[]).map(rowToArtifact)
    const team = (db.prepare('SELECT * FROM team').all() as Record<string, unknown>[]).map(rowToTeam)
    const office = (db.prepare('SELECT * FROM office').all() as Record<string, unknown>[]).map(rowToOffice)
    const searchIndex = (db.prepare('SELECT * FROM search_index').all() as Record<string, unknown>[]).map(rowToSearchEntry)
    const habits = (db.prepare('SELECT * FROM habits').all() as Record<string, unknown>[]).map(rowToHabit)

    return {
      chatMessages,
      notes,
      tasks,
      activity,
      missionCommand: { mission, goals, projects, calendar, memories, artifacts, team, office, searchIndex, habits },
    }
  }

  async write(store: NexusDataStore): Promise<void> {
    const db = this.open()
    const mc = store.missionCommand

    db.transaction(() => {
      // Full replace strategy: delete + insert in a transaction
      db.exec('DELETE FROM chat_messages')
      db.exec('DELETE FROM notes')
      db.exec('DELETE FROM tasks')
      db.exec('DELETE FROM activity')
      db.exec('DELETE FROM mission')
      db.exec('DELETE FROM goals')
      db.exec('DELETE FROM projects')
      db.exec('DELETE FROM calendar')
      db.exec('DELETE FROM memories')
      db.exec('DELETE FROM artifacts')
      db.exec('DELETE FROM team')
      db.exec('DELETE FROM office')
      db.exec('DELETE FROM search_index')
      db.exec('DELETE FROM habits')

      upsertAll(db, 'chat_messages', store.chatMessages.map(messageToRow))
      upsertAll(db, 'notes', store.notes.map(noteToRow))
      upsertAll(db, 'tasks', store.tasks.map(taskToRow))
      upsertAll(db, 'activity', store.activity.map(activityToRow))
      upsertAll(db, 'mission', [missionToRow(mc.mission)])
      upsertAll(db, 'goals', mc.goals.map(goalToRow))
      upsertAll(db, 'projects', mc.projects.map(projectToRow))
      upsertAll(db, 'calendar', mc.calendar.map(calendarToRow))
      upsertAll(db, 'memories', mc.memories.map(memoryToRow))
      upsertAll(db, 'artifacts', mc.artifacts.map(artifactToRow))
      upsertAll(db, 'team', mc.team.map(teamToRow))
      upsertAll(db, 'office', mc.office.map(officeToRow))
      upsertAll(db, 'search_index', mc.searchIndex.map(searchEntryToRow))
      upsertAll(db, 'habits', (mc.habits ?? []).map(habitToRow))
    })()
  }

  private async migrateFromJsonIfNeeded(db: Database.Database): Promise<void> {
    // Only migrate if the DB has zero tasks AND a JSON file exists
    const taskCount = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c
    if (taskCount > 0) return

    const jsonPath = path.join(path.dirname(this.dbPath), 'nexus-data.json')
    if (!fs.existsSync(jsonPath)) return

    try {
      const raw = await fsAsync.readFile(jsonPath, 'utf8')
      const jsonStore = JSON.parse(raw) as NexusDataStore
      await this.write(jsonStore)
      console.log('SqliteStore: migrated from nexus-data.json')
    } catch {
      // Non-fatal — start fresh if migration fails
      console.warn('SqliteStore: could not migrate from JSON, starting fresh')
    }
  }
}
