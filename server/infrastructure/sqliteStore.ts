import Database from 'better-sqlite3'
import fs from 'node:fs'
import fsAsync from 'node:fs/promises'
import path from 'node:path'
import { createSeedData } from '../domain/seeds.js'
import type {
  ActivityRecord,
  AgentRecord,
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
  SubAgentRecord,
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
    projectId: row['project_id'] ? toStr(row['project_id']) : undefined,
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

function rowToAgent(row: Record<string, unknown>): AgentRecord {
  return {
    id: toStr(row['id']),
    name: toStr(row['name']),
    role: toStr(row['role']),
    missionResponsibility: toStr(row['mission_responsibility']),
    currentTask: toStr(row['current_task']),
    currentMode: toStr(row['current_mode'], 'supervised') as AgentRecord['currentMode'],
    model: toStr(row['model']),
    status: toStr(row['status'], 'standby') as AgentRecord['status'],
    alignmentStatus: toStr(row['alignment_status'], 'on-track') as AgentRecord['alignmentStatus'],
    lastActivityAt: toStr(row['last_activity_at']),
    subAgents: toArr(row['sub_agents']) as SubAgentRecord[],
    contributingTo: toArr(row['contributing_to']) as string[],
    linkedProjectId: row['linked_project_id'] ? toStr(row['linked_project_id']) : undefined,
    linkedMissionArea: toStr(row['linked_mission_area']),
    load: toInt(row['load']),
    notes: row['notes'] ? toStr(row['notes']) : undefined,
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

function agentToRow(r: AgentRecord): Record<string, unknown> {
  return {
    id: r.id, name: r.name, role: r.role,
    mission_responsibility: r.missionResponsibility,
    current_task: r.currentTask, current_mode: r.currentMode,
    model: r.model, status: r.status, alignment_status: r.alignmentStatus,
    last_activity_at: r.lastActivityAt,
    sub_agents: JSON.stringify(r.subAgents),
    contributing_to: JSON.stringify(r.contributingTo),
    linked_project_id: r.linkedProjectId ?? null,
    linked_mission_area: r.linkedMissionArea,
    load: r.load, notes: r.notes ?? null, source: r.source,
  }
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

function upsertOne(db: Database.Database, table: string, row: Record<string, unknown>): void {
  upsertAll(db, table, [row])
}

function deleteById(db: Database.Database, table: string, id: string): boolean {
  const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
  return result.changes > 0
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

  open(): Database.Database {
    if (this.db) return this.db
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true })
    const db = new Database(this.dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('synchronous = NORMAL')

    // Apply schema (idempotent — uses CREATE TABLE IF NOT EXISTS)
    const schema = fs.readFileSync(this.schemaPath, 'utf8')
    db.exec(schema)

    this.db = db
    return db
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  // ── Full snapshot read ────────────────────────────────────────

  async read(): Promise<NexusDataStore> {
    const db = this.open()

    // Auto-migrate from JSON file if DB is empty
    await this.migrateFromJsonIfNeeded(db)

    const chatMessages = (db.prepare('SELECT * FROM chat_messages ORDER BY timestamp ASC').all() as Record<string, unknown>[]).map(rowToMessage)
    const notes = (db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as Record<string, unknown>[]).map(rowToNote)
    const tasks = (db.prepare('SELECT * FROM tasks').all() as Record<string, unknown>[]).map(rowToTask)
    const activity = (db.prepare('SELECT * FROM activity ORDER BY timestamp DESC').all() as Record<string, unknown>[]).map(rowToActivity)

    const missionRows = db.prepare('SELECT * FROM mission LIMIT 1').all() as Record<string, unknown>[]
    const seed = createSeedData()
    const mission: MissionRecord = missionRows.length > 0
      ? rowToMission(missionRows[0]!)
      : seed.missionCommand.mission

    const goals = (db.prepare('SELECT * FROM goals').all() as Record<string, unknown>[]).map(rowToGoal)
    const projects = (db.prepare('SELECT * FROM projects').all() as Record<string, unknown>[]).map(rowToProject)
    const calendar = (db.prepare('SELECT * FROM calendar ORDER BY starts_at ASC').all() as Record<string, unknown>[]).map(rowToCalendar)
    const memories = (db.prepare('SELECT * FROM memories ORDER BY updated_at DESC').all() as Record<string, unknown>[]).map(rowToMemory)
    const artifacts = (db.prepare('SELECT * FROM artifacts ORDER BY updated_at DESC').all() as Record<string, unknown>[]).map(rowToArtifact)
    const team = (db.prepare('SELECT * FROM team').all() as Record<string, unknown>[]).map(rowToTeam)
    const agents = (db.prepare('SELECT * FROM agents').all() as Record<string, unknown>[]).map(rowToAgent)
    const office = (db.prepare('SELECT * FROM office').all() as Record<string, unknown>[]).map(rowToOffice)
    const searchIndex = (db.prepare('SELECT * FROM search_index').all() as Record<string, unknown>[]).map(rowToSearchEntry)
    const habits = (db.prepare('SELECT * FROM habits').all() as Record<string, unknown>[]).map(rowToHabit)

    return {
      chatMessages,
      notes,
      tasks,
      activity,
      missionCommand: { mission, goals, projects, calendar, memories, artifacts, team, agents, office, searchIndex, habits },
    }
  }

  // ── Bulk write (used for seeding and migration) ───────────────

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
      db.exec('DELETE FROM agents')
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
      upsertAll(db, 'agents', (mc.agents ?? []).map(agentToRow))
      upsertAll(db, 'office', mc.office.map(officeToRow))
      upsertAll(db, 'search_index', mc.searchIndex.map(searchEntryToRow))
      upsertAll(db, 'habits', (mc.habits ?? []).map(habitToRow))
    })()
  }

  // ── Targeted entity methods (no full read/write cycle) ────────

  // Chat
  insertMessages(messages: ChatMessageRecord[]): void {
    const db = this.open()
    db.transaction(() => { upsertAll(db, 'chat_messages', messages.map(messageToRow)) })()
  }

  // Notes
  insertNote(note: NoteRecord): void {
    upsertOne(this.open(), 'notes', noteToRow(note))
  }

  // Tasks
  insertTask(task: TaskRecord): void {
    upsertOne(this.open(), 'tasks', taskToRow(task))
  }

  updateTask(id: string, patch: Partial<TaskRecord>): TaskRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: TaskRecord = { ...rowToTask(existing), ...patch }
    upsertOne(db, 'tasks', taskToRow(merged))
    return merged
  }

  // Activity
  insertActivity(entry: ActivityRecord): void {
    upsertOne(this.open(), 'activity', activityToRow(entry))
  }

  trimActivity(limit: number): void {
    const db = this.open()
    db.prepare(`
      DELETE FROM activity WHERE id NOT IN (
        SELECT id FROM activity ORDER BY timestamp DESC LIMIT ?
      )
    `).run(limit)
  }

  // Mission
  upsertMission(mission: MissionRecord): void {
    upsertOne(this.open(), 'mission', missionToRow(mission))
  }

  // Goals
  insertGoal(goal: GoalRecord): void {
    upsertOne(this.open(), 'goals', goalToRow(goal))
  }

  updateGoal(id: string, patch: Partial<GoalRecord>): GoalRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: GoalRecord = { ...rowToGoal(existing), ...patch }
    upsertOne(db, 'goals', goalToRow(merged))
    return merged
  }

  deleteGoal(id: string): boolean {
    return deleteById(this.open(), 'goals', id)
  }

  // Projects
  insertProject(project: ProjectRecord): void {
    upsertOne(this.open(), 'projects', projectToRow(project))
  }

  updateProject(id: string, patch: Partial<ProjectRecord>): ProjectRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: ProjectRecord = { ...rowToProject(existing), ...patch }
    upsertOne(db, 'projects', projectToRow(merged))
    return merged
  }

  deleteProject(id: string): boolean {
    return deleteById(this.open(), 'projects', id)
  }

  // Calendar
  insertCalendarEvent(event: CalendarEventRecord): void {
    upsertOne(this.open(), 'calendar', calendarToRow(event))
  }

  updateCalendarEvent(id: string, patch: Partial<CalendarEventRecord>): CalendarEventRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM calendar WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: CalendarEventRecord = { ...rowToCalendar(existing), ...patch }
    upsertOne(db, 'calendar', calendarToRow(merged))
    return merged
  }

  // Memories
  insertMemory(memory: MemoryRecord): void {
    upsertOne(this.open(), 'memories', memoryToRow(memory))
  }

  updateMemory(id: string, patch: Partial<MemoryRecord>): MemoryRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: MemoryRecord = { ...rowToMemory(existing), ...patch }
    upsertOne(db, 'memories', memoryToRow(merged))
    return merged
  }

  deleteMemory(id: string): boolean {
    return deleteById(this.open(), 'memories', id)
  }

  // Artifacts
  insertArtifact(artifact: ArtifactRecord): void {
    upsertOne(this.open(), 'artifacts', artifactToRow(artifact))
  }

  updateArtifact(id: string, patch: Partial<ArtifactRecord>): ArtifactRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: ArtifactRecord = { ...rowToArtifact(existing), ...patch }
    upsertOne(db, 'artifacts', artifactToRow(merged))
    return merged
  }

  deleteArtifact(id: string): boolean {
    return deleteById(this.open(), 'artifacts', id)
  }

  // Team
  insertTeamMember(member: TeamMemberRecord): void {
    upsertOne(this.open(), 'team', teamToRow(member))
  }

  updateTeamMember(id: string, patch: Partial<TeamMemberRecord>): TeamMemberRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM team WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: TeamMemberRecord = { ...rowToTeam(existing), ...patch }
    upsertOne(db, 'team', teamToRow(merged))
    return merged
  }

  deleteTeamMember(id: string): boolean {
    return deleteById(this.open(), 'team', id)
  }

  // Agents
  insertAgent(agent: AgentRecord): void {
    upsertOne(this.open(), 'agents', agentToRow(agent))
  }

  updateAgent(id: string, patch: Partial<AgentRecord>): AgentRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: AgentRecord = { ...rowToAgent(existing), ...patch }
    upsertOne(db, 'agents', agentToRow(merged))
    return merged
  }

  deleteAgent(id: string): boolean {
    return deleteById(this.open(), 'agents', id)
  }

  // Habits
  insertHabit(habit: HabitRecord): void {
    upsertOne(this.open(), 'habits', habitToRow(habit))
  }

  updateHabit(id: string, patch: Partial<HabitRecord>): HabitRecord | null {
    const db = this.open()
    const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(id) as Record<string, unknown> | undefined
    if (!existing) return null
    const merged: HabitRecord = { ...rowToHabit(existing), ...patch }
    upsertOne(db, 'habits', habitToRow(merged))
    return merged
  }

  deleteHabit(id: string): boolean {
    return deleteById(this.open(), 'habits', id)
  }

  // Search
  searchEntities(query: string, limit = 20): SearchEntryRecord[] {
    const db = this.open()
    const q = `%${query.toLowerCase()}%`
    return (db.prepare(`
      SELECT * FROM search_index
      WHERE lower(title) LIKE ? OR lower(summary) LIKE ?
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(q, q, limit) as Record<string, unknown>[]).map(rowToSearchEntry)
  }

  upsertSearchEntry(entry: SearchEntryRecord): void {
    upsertOne(this.open(), 'search_index', searchEntryToRow(entry))
  }

  // ── Migration ──────────────────────────────────────────────────

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
