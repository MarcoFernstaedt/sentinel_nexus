import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { SqliteStore } from '../infrastructure/sqliteStore.js'
import type { TaskRecord, GoalRecord, AgentRecord, NoteRecord, ProjectRecord } from '../domain/models.js'

// ── Helpers ───────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-test-'))
}

const SCHEMA_PATH = path.resolve(process.cwd(), 'nexus.schema.sql')

function makeTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    title: 'Test task',
    owner: 'test-agent',
    due: '2026-06-01',
    status: 'Queued',
    stage: 'queued',
    lane: 'engineering',
    needsUserInput: false,
    needsApproval: false,
    readyToReport: false,
    source: 'runtime',
    ...overrides,
  }
}

function makeGoal(overrides: Partial<GoalRecord> = {}): GoalRecord {
  return {
    id: `goal-${Math.random().toString(36).slice(2)}`,
    title: 'Test goal',
    category: 'execution',
    status: 'on-track',
    progressPercent: 0,
    targetDate: '2026-12-31',
    summary: 'Test summary',
    source: 'runtime',
    ...overrides,
  }
}

function makeAgent(overrides: Partial<AgentRecord> = {}): AgentRecord {
  return {
    id: `agent-${Math.random().toString(36).slice(2)}`,
    name: 'Test Agent',
    role: 'engineering',
    missionResponsibility: 'Test responsibility',
    currentTask: 'Standby',
    currentMode: 'supervised',
    model: 'claude-sonnet-4-6',
    status: 'standby',
    alignmentStatus: 'on-track',
    lastActivityAt: new Date().toISOString(),
    subAgents: [],
    contributingTo: [],
    linkedMissionArea: 'engineering',
    load: 0,
    source: 'runtime',
    ...overrides,
  }
}

// ── Test suite ────────────────────────────────────────────────────

describe('SqliteStore', () => {
  let store: SqliteStore
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()
    store = new SqliteStore(tmpDir, SCHEMA_PATH)
  })

  afterEach(() => {
    store.close()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  // ── read/write ────────────────────────────────────────────────

  it('returns empty store on first read', async () => {
    const data = await store.read()
    expect(data.tasks).toEqual([])
    expect(data.notes).toEqual([])
    expect(data.chatMessages).toEqual([])
    expect(data.missionCommand.goals).toEqual([])
    expect(data.missionCommand.agents).toEqual([])
  })

  it('bulk write + read round-trips data', async () => {
    const task = makeTask({ id: 'task-1', title: 'Hello world' })
    const goal = makeGoal({ id: 'goal-1', title: 'Big goal' })
    const data = await store.read()
    data.tasks = [task]
    data.missionCommand.goals = [goal]
    await store.write(data)

    const reloaded = await store.read()
    expect(reloaded.tasks).toHaveLength(1)
    expect(reloaded.tasks[0]!.title).toBe('Hello world')
    expect(reloaded.missionCommand.goals[0]!.title).toBe('Big goal')
  })

  // ── Targeted task methods ─────────────────────────────────────

  it('insertTask then read returns the task', async () => {
    const task = makeTask({ id: 'task-abc', title: 'Targeted insert' })
    store.insertTask(task)
    const data = await store.read()
    const found = data.tasks.find((t) => t.id === 'task-abc')
    expect(found).toBeDefined()
    expect(found!.title).toBe('Targeted insert')
  })

  it('updateTask modifies specific fields', async () => {
    const task = makeTask({ id: 'task-upd' })
    store.insertTask(task)
    const updated = store.updateTask('task-upd', { status: 'In Progress', summary: 'Working on it' })
    expect(updated).not.toBeNull()
    expect(updated!.status).toBe('In Progress')
    expect(updated!.summary).toBe('Working on it')
  })

  it('updateTask returns null for unknown id', () => {
    const result = store.updateTask('nonexistent', { status: 'Done' })
    expect(result).toBeNull()
  })

  // ── Goals ─────────────────────────────────────────────────────

  it('insertGoal, updateGoal, deleteGoal', async () => {
    const goal = makeGoal({ id: 'goal-x' })
    store.insertGoal(goal)

    const updated = store.updateGoal('goal-x', { progressPercent: 50 })
    expect(updated!.progressPercent).toBe(50)

    const deleted = store.deleteGoal('goal-x')
    expect(deleted).toBe(true)

    const data = await store.read()
    expect(data.missionCommand.goals.find((g) => g.id === 'goal-x')).toBeUndefined()
  })

  it('deleteGoal returns false for unknown id', () => {
    expect(store.deleteGoal('nope')).toBe(false)
  })

  // ── Projects ──────────────────────────────────────────────────

  it('insertProject, updateProject, deleteProject', async () => {
    const proj: ProjectRecord = {
      id: 'proj-test',
      name: 'Test Project',
      area: 'product',
      status: 'active',
      objective: 'Ship it',
      missionAlignment: 'Core',
      goalIds: [],
      progressPercent: 0,
      owner: 'operator',
      source: 'runtime',
    }
    store.insertProject(proj)

    const updated = store.updateProject('proj-test', { progressPercent: 30, status: 'watch' })
    expect(updated!.progressPercent).toBe(30)
    expect(updated!.status).toBe('watch')

    store.deleteProject('proj-test')
    const data = await store.read()
    expect(data.missionCommand.projects.find((p) => p.id === 'proj-test')).toBeUndefined()
  })

  // ── Agents ────────────────────────────────────────────────────

  it('insertAgent, updateAgent, deleteAgent', async () => {
    const agent = makeAgent({ id: 'agent-t1', name: 'Agent T1' })
    store.insertAgent(agent)

    const data = await store.read()
    expect(data.missionCommand.agents.find((a) => a.id === 'agent-t1')).toBeDefined()

    const updated = store.updateAgent('agent-t1', { status: 'active', load: 80 })
    expect(updated!.status).toBe('active')
    expect(updated!.load).toBe(80)

    store.deleteAgent('agent-t1')
    const reloaded = await store.read()
    expect(reloaded.missionCommand.agents.find((a) => a.id === 'agent-t1')).toBeUndefined()
  })

  it('stores and retrieves agent subAgents JSON array', async () => {
    const agent = makeAgent({
      id: 'agent-sub',
      subAgents: [{ id: 'sub-1', name: 'Sub', role: 'helper', status: 'idle', lastActivityAt: new Date().toISOString() }],
      contributingTo: ['proj-a', 'proj-b'],
    })
    store.insertAgent(agent)
    const data = await store.read()
    const found = data.missionCommand.agents.find((a) => a.id === 'agent-sub')!
    expect(found.subAgents).toHaveLength(1)
    expect(found.subAgents[0]!.name).toBe('Sub')
    expect(found.contributingTo).toEqual(['proj-a', 'proj-b'])
  })

  // ── Notes ─────────────────────────────────────────────────────

  it('insertNote preserves projectId', async () => {
    const note: NoteRecord = {
      id: 'note-1',
      title: 'Test note',
      body: 'Body text',
      tag: 'test',
      projectId: 'proj-abc',
      updatedAt: new Date().toISOString(),
      source: 'runtime',
    }
    store.insertNote(note)
    const data = await store.read()
    const found = data.notes.find((n) => n.id === 'note-1')!
    expect(found.projectId).toBe('proj-abc')
  })

  it('insertNote with no projectId stores null and reads back as undefined', async () => {
    const note: NoteRecord = {
      id: 'note-2',
      title: 'No project',
      body: 'Body',
      tag: 'general',
      updatedAt: new Date().toISOString(),
      source: 'runtime',
    }
    store.insertNote(note)
    const data = await store.read()
    const found = data.notes.find((n) => n.id === 'note-2')!
    expect(found.projectId).toBeUndefined()
  })

  // ── Activity ──────────────────────────────────────────────────

  it('insertActivity and trimActivity', () => {
    for (let i = 0; i < 50; i++) {
      store.insertActivity({
        id: `act-${i}`,
        type: 'status',
        title: `Activity ${i}`,
        detail: '',
        timestamp: new Date(Date.now() + i).toISOString(),
        status: 'logged',
        source: 'runtime',
      })
    }
    store.trimActivity(10)
    const db = store.open()
    const count = (db.prepare('SELECT COUNT(*) as c FROM activity').get() as { c: number }).c
    expect(count).toBe(10)
  })

  // ── Search ────────────────────────────────────────────────────

  it('searchEntities matches title and summary', () => {
    store.upsertSearchEntry({
      id: 'si-1',
      entityType: 'goal',
      title: 'Increase revenue',
      summary: 'Target $10K MRR',
      relatedId: 'goal-1',
      updatedAt: new Date().toISOString(),
      source: 'runtime',
    })
    store.upsertSearchEntry({
      id: 'si-2',
      entityType: 'project',
      title: 'Marketing campaign',
      summary: 'Drive signups',
      relatedId: 'proj-1',
      updatedAt: new Date().toISOString(),
      source: 'runtime',
    })
    const results = store.searchEntities('revenue')
    expect(results).toHaveLength(1)
    expect(results[0]!.title).toBe('Increase revenue')
  })

  it('searchEntities is case-insensitive', () => {
    store.upsertSearchEntry({
      id: 'si-3',
      entityType: 'memory',
      title: 'Auth Architecture',
      summary: 'scrypt + HMAC',
      relatedId: 'mem-1',
      updatedAt: new Date().toISOString(),
      source: 'runtime',
    })
    expect(store.searchEntities('AUTH')).toHaveLength(1)
    expect(store.searchEntities('hmac')).toHaveLength(1)
  })

  // ── Mission ───────────────────────────────────────────────────

  it('upsertMission saves and reads back', async () => {
    const data = await store.read()
    const mission = { ...data.missionCommand.mission, progressPercent: 42, commandIntent: 'Ship fast' }
    store.upsertMission(mission)
    const reloaded = await store.read()
    expect(reloaded.missionCommand.mission.progressPercent).toBe(42)
    expect(reloaded.missionCommand.mission.commandIntent).toBe('Ship fast')
  })

  // ── Habits ────────────────────────────────────────────────────

  it('insertHabit, updateHabit, deleteHabit', async () => {
    store.insertHabit({
      id: 'habit-1',
      title: 'Morning run',
      category: 'fitness',
      frequency: 'daily',
      targetPerPeriod: 1,
      completedDates: ['2026-04-01', '2026-04-02'],
      currentStreak: 2,
      longestStreak: 5,
      createdAt: new Date().toISOString(),
      source: 'runtime',
    })
    const updated = store.updateHabit('habit-1', { currentStreak: 3 })
    expect(updated!.currentStreak).toBe(3)
    store.deleteHabit('habit-1')
    const data = await store.read()
    expect(data.missionCommand.habits.find((h) => h.id === 'habit-1')).toBeUndefined()
  })

  // ── Memories ─────────────────────────────────────────────────

  it('insertMemory, updateMemory, deleteMemory', async () => {
    store.insertMemory({
      id: 'mem-1',
      title: 'Test memory',
      kind: 'working-memory',
      updatedAt: new Date().toISOString(),
      summary: 'A memory',
      tags: ['ops'],
      source: 'runtime',
    })
    const updated = store.updateMemory('mem-1', { summary: 'Updated summary' })
    expect(updated!.summary).toBe('Updated summary')
    store.deleteMemory('mem-1')
    const data = await store.read()
    expect(data.missionCommand.memories.find((m) => m.id === 'mem-1')).toBeUndefined()
  })

  // ── Artifacts ────────────────────────────────────────────────

  it('insertArtifact, updateArtifact, deleteArtifact', async () => {
    store.insertArtifact({
      id: 'art-1',
      title: 'Doc',
      type: 'doc',
      location: 'docs/test.md',
      updatedAt: new Date().toISOString(),
      summary: 'A doc',
      source: 'runtime',
    })
    const updated = store.updateArtifact('art-1', { summary: 'Better doc' })
    expect(updated!.summary).toBe('Better doc')
    store.deleteArtifact('art-1')
    const data = await store.read()
    expect(data.missionCommand.artifacts.find((a) => a.id === 'art-1')).toBeUndefined()
  })

  // ── Team ──────────────────────────────────────────────────────

  it('insertTeamMember, updateTeamMember, deleteTeamMember', async () => {
    store.insertTeamMember({
      id: 'team-x',
      name: 'Alice',
      role: 'Operator',
      status: 'active',
      focus: 'Sales',
      source: 'runtime',
    })
    const updated = store.updateTeamMember('team-x', { focus: 'Engineering' })
    expect(updated!.focus).toBe('Engineering')
    store.deleteTeamMember('team-x')
    const data = await store.read()
    expect(data.missionCommand.team.find((t) => t.id === 'team-x')).toBeUndefined()
  })

  // ── Calendar ─────────────────────────────────────────────────

  it('insertCalendarEvent, updateCalendarEvent', async () => {
    store.insertCalendarEvent({
      id: 'cal-1',
      title: 'Sprint review',
      type: 'meeting',
      startsAt: '2026-06-01T09:00:00.000Z',
      owner: 'operator',
      status: 'scheduled',
      detail: 'Weekly review',
      source: 'runtime',
    })
    const updated = store.updateCalendarEvent('cal-1', { status: 'done' })
    expect(updated!.status).toBe('done')
    const data = await store.read()
    expect(data.missionCommand.calendar.find((c) => c.id === 'cal-1')!.status).toBe('done')
  })
})
