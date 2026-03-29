import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import type {
  ChatModeId,
  ChatMessageRecord,
  MissionCommandSnapshot,
  NexusStatusSnapshot,
  NoteRecord,
  RuntimeContextSnapshot,
  RuntimeDocumentSurface,
  RuntimeScheduleVisibility,
  RuntimeVisibilitySurface,
  RuntimeWorkstreamSnapshot,
  TaskRecord,
  TaskStage,
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

const defaultStageByStatus: Record<TaskStatus, TaskStage> = {
  Queued: 'queued',
  'In Progress': 'editing',
  Blocked: 'validating',
  Done: 'done',
}

function timestampNow() {
  return new Date().toISOString()
}

function describeTaskState(task: TaskRecord) {
  if (task.status === 'Blocked') return task.blockedReason?.trim() || 'Blocked without a recorded reason yet.'
  if (task.needsUserInput) return task.waitingFor?.trim() || 'Waiting on operator input.'
  if (task.status === 'Done') return task.readyToReport ? 'Completed and marked ready to report.' : 'Completed.'
  return task.summary?.trim() || `${task.stage} stage in ${task.lane}.`
}

function createDocumentSurface(path: string, label: string, summary: string): RuntimeDocumentSurface {
  const exists = existsSync(path)
  const updatedAt = exists ? statSync(path).mtime.toISOString() : null

  return {
    id: `document-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label,
    path,
    exists,
    summary,
    updatedAt,
  }
}

function createScheduleVisibility(mission: MissionCommandSnapshot, documents: RuntimeDocumentSurface[]): RuntimeScheduleVisibility {
  const upcoming = mission.calendar.filter((item) => item.status !== 'done')
  const meetings = upcoming.filter((item) => item.type === 'meeting')
  const heartbeatVisible = documents.some((document) => document.path.endsWith('HEARTBEAT.md') && document.exists)

  return {
    calendar: {
      id: 'calendar',
      label: 'Calendar visibility',
      state: upcoming.length > 0 ? 'derived' : 'not-connected',
      summary: upcoming.length > 0 ? `${upcoming.length} scheduled items in mission memory` : 'No upcoming calendar records are stored in Nexus mission memory.',
      detail: upcoming[0]?.detail ?? 'Direct external calendar integration is not connected yet.',
    },
    scheduledAutomation: {
      id: 'scheduled-automation',
      label: 'Scheduled automation',
      state: heartbeatVisible ? 'derived' : 'not-connected',
      summary: heartbeatVisible
        ? 'Workspace heartbeat instructions are visible, but host cron/job inventory is not.'
        : 'No heartbeat file is visible, and host cron/job inventory is not attached.',
      detail: 'Nexus can see HEARTBEAT.md presence in the workspace, but it cannot yet enumerate OpenClaw cron jobs or host schedulers truthfully.',
    },
    meetings: {
      id: 'meetings',
      label: 'Meeting readiness',
      state: meetings.length > 0 ? 'derived' : 'not-connected',
      summary: meetings.length > 0 ? `${meetings.length} meeting records are present in mission memory.` : 'No meeting feed is connected right now.',
      detail: meetings[0]?.title ?? 'Meeting telemetry must come from a real calendar integration before this becomes live.',
    },
  }
}

async function collectWorkspaceDocuments(workspaceRoot: string): Promise<RuntimeDocumentSurface[]> {
  return [
    createDocumentSurface(join(workspaceRoot, 'README.md'), 'README', 'Primary repo readme and operator-facing overview.'),
    createDocumentSurface(join(workspaceRoot, 'docs', 'ui-architecture-roadmap.md'), 'UI roadmap', 'Transitional direction toward a future Next.js + Tailwind + shadcn-style shell.'),
    createDocumentSurface(join(workspaceRoot, 'HEARTBEAT.md'), 'Heartbeat', 'Workspace heartbeat checklist and proactive operating instructions.'),
    createDocumentSurface(join(workspaceRoot, 'USER.md'), 'User context', 'Operator priorities, constraints, and execution bias.'),
  ]
}

function buildVisibilitySurfaces(
  tasks: TaskRecord[],
  workstreams: RuntimeWorkstreamSnapshot[],
  documents: RuntimeDocumentSurface[],
): RuntimeVisibilitySurface[] {
  const runtimeTasks = tasks.filter((task) => task.source === 'runtime').length
  const seededTasks = tasks.filter((task) => task.source === 'seeded-demo').length
  const visibleDocuments = documents.filter((document) => document.exists).length

  return [
    {
      id: 'sentinel',
      label: 'Sentinel',
      state: runtimeTasks > 0 ? 'live' : 'baseline-only',
      detail: runtimeTasks > 0 ? 'Runtime task truth is reaching the shell.' : 'Shell is active but currently leaning on seeded/baseline task truth.',
    },
    {
      id: 'task-visibility',
      label: 'Task visibility',
      state: runtimeTasks > 0 ? 'live' : seededTasks > 0 ? 'baseline-only' : 'quiet',
      detail: `${tasks.length} tracked tasks across ${workstreams.length} task-derived work cells.`,
    },
    {
      id: 'workspace-documents',
      label: 'Workspace documents',
      state: visibleDocuments > 0 ? 'partial' : 'not-exposed',
      detail: `${visibleDocuments} of ${documents.length} continuity surfaces are visible from the workspace root.`,
    },
    {
      id: 'agent-roster',
      label: 'Sub-agent roster',
      state: 'not-exposed',
      detail: 'No runtime event/session feed exists yet, so Nexus does not invent sub-agent presence.',
    },
  ]
}

async function buildMissionAlignment(workspaceRoot: string) {
  const userPath = join(workspaceRoot, 'USER.md')
  const userVisible = existsSync(userPath)

  return {
    sourceDocument: userVisible ? 'USER.md' : 'not exposed',
    priorities: [
      'Increase income fast',
      'Ship stronger software systems',
      'Improve execution discipline',
    ],
    executionBias: [
      'Action first',
      'Low clutter',
      'Truthful runtime state',
      'Accessibility-aware surfaces',
    ],
    caution: userVisible ? 'Do not present fake certainty or clutter-heavy UI.' : 'Mission source file is not visible from the current workspace root.',
  }
}

function buildSuggestions(
  tasks: TaskRecord[],
  documents: RuntimeDocumentSurface[],
  workstreams: RuntimeWorkstreamSnapshot[],
): string[] {
  const suggestions: string[] = []

  if (!documents.some((document) => document.path.endsWith('docs/ui-architecture-roadmap.md') && document.exists)) {
    suggestions.push('Publish a UI architecture roadmap before attempting a framework migration.')
  }
  if (tasks.some((task) => task.status === 'Blocked')) {
    suggestions.push('Expose blocked-task reasons higher in the command deck to reduce operator scanning cost.')
  }
  if (workstreams.length > 4) {
    suggestions.push('Add workstream filtering and density controls before increasing dashboard surface area further.')
  }
  if (suggestions.length === 0) {
    suggestions.push('Decompose App.tsx into command-center sections before adding more visual complexity.')
  }

  return suggestions.slice(0, 3)
}

function createWorkstreams(tasks: TaskRecord[]): RuntimeWorkstreamSnapshot[] {
  const grouped = new Map<string, RuntimeWorkstreamSnapshot>()

  for (const task of tasks) {
    const key = `${task.owner}::${task.lane}`
    const current = grouped.get(key) ?? {
      id: `workstream-${task.owner.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${task.lane.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      owner: task.owner,
      lane: task.lane,
      taskCount: 0,
      activeCount: 0,
      waitingCount: 0,
      blockedCount: 0,
      completedCount: 0,
      readyToReportCount: 0,
      latestTaskTitle: null,
      latestUpdateAt: null,
      truthLabel: 'task-derived' as const,
    }

    current.taskCount += 1
    if (task.status !== 'Blocked' && task.status !== 'Done' && !task.needsUserInput) current.activeCount += 1
    if (task.needsUserInput && task.status !== 'Done') current.waitingCount += 1
    if (task.status === 'Blocked') current.blockedCount += 1
    if (task.status === 'Done') current.completedCount += 1
    if (task.readyToReport) current.readyToReportCount += 1

    const candidateTimestamp = task.lastUpdatedAt ?? task.completedAt ?? null
    if (!current.latestUpdateAt || (candidateTimestamp && candidateTimestamp > current.latestUpdateAt)) {
      current.latestUpdateAt = candidateTimestamp
      current.latestTaskTitle = task.title
    }

    grouped.set(key, current)
  }

  return [...grouped.values()].sort((left, right) => {
    const score = (item: RuntimeWorkstreamSnapshot) => item.blockedCount * 4 + item.waitingCount * 3 + item.activeCount * 2 + item.readyToReportCount
    const scoreDiff = score(right) - score(left)
    if (scoreDiff !== 0) return scoreDiff
    return (right.latestUpdateAt ?? '').localeCompare(left.latestUpdateAt ?? '')
  })
}

function countBySource(missionCommand: MissionCommandSnapshot) {
  const collections = [
    missionCommand.goals,
    missionCommand.projects,
    missionCommand.calendar,
    missionCommand.memories,
    missionCommand.artifacts,
    missionCommand.team,
    missionCommand.office,
    missionCommand.searchIndex,
  ]

  let runtime = missionCommand.mission.source === 'runtime' ? 1 : 0
  let seeded = missionCommand.mission.source === 'seeded-demo' ? 1 : 0

  for (const collection of collections) {
    for (const item of collection) {
      if (item.source === 'runtime') runtime += 1
      if (item.source === 'seeded-demo') seeded += 1
    }
  }

  return { runtime, seeded }
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
      timestamp: timestampNow(),
      modeId: input.modeId,
      status: 'ready',
      source: 'runtime',
    }

    const sentinelMessage: ChatMessageRecord = {
      id: crypto.randomUUID(),
      role: 'sentinel',
      author: 'Sentinel',
      body: `${personaReplies[input.modeId]}\n\nCaptured request: “${body}”.`,
      timestamp: timestampNow(),
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
      timestamp: timestampNow(),
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
      updatedAt: timestampNow(),
      source: 'runtime',
    })

    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'note',
      title: `Note saved: ${note.title}`,
      detail: note.tag,
      timestamp: timestampNow(),
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
    const now = timestampNow()
    const task = await this.repository.create({
      ...input,
      id: `task-${crypto.randomUUID()}`,
      stage: input.stage ?? defaultStageByStatus[input.status],
      needsUserInput: input.needsUserInput ?? false,
      readyToReport: input.readyToReport ?? false,
      blockedReason: input.blockedReason?.trim() || undefined,
      waitingFor: input.waitingFor?.trim() || undefined,
      lastUpdatedAt: now,
      completedAt: input.status === 'Done' ? now : undefined,
      source: 'runtime',
    })

    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'task',
      title: `Task created: ${task.title}`,
      detail: describeTaskState(task),
      timestamp: now,
      status: task.status === 'Done' ? 'done' : task.status === 'Blocked' ? 'watch' : 'logged',
      source: 'runtime',
    })

    return task
  }

  async update(taskId: string, patch: Partial<TaskRecord>) {
    const now = timestampNow()
    const normalizedPatch: Partial<TaskRecord> = {
      ...patch,
      blockedReason: patch.blockedReason?.trim() || undefined,
      waitingFor: patch.waitingFor?.trim() || undefined,
      summary: patch.summary?.trim() || undefined,
      lastUpdatedAt: now,
    }

    if (patch.status === 'Done') {
      normalizedPatch.completedAt = patch.completedAt ?? now
    } else if (patch.status) {
      normalizedPatch.completedAt = undefined
    }

    const updated = await this.repository.update(taskId, normalizedPatch)

    if (updated) {
      await this.activityRepository.append({
        id: `activity-${crypto.randomUUID()}`,
        type: 'task',
        title: `Task state: ${updated.title}`,
        detail: describeTaskState(updated),
        timestamp: now,
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
    const taskStageBreakdown = counts.tasks.reduce<Record<TaskStage, number>>(
      (accumulator, task) => {
        accumulator[task.stage] += 1
        return accumulator
      },
      {
        queued: 0,
        inspecting: 0,
        editing: 0,
        validating: 0,
        committing: 0,
        pushing: 0,
        done: 0,
      },
    )
    const attentionCounts = counts.tasks.reduce(
      (accumulator, task) => {
        if (task.status !== 'Blocked' && task.status !== 'Done' && !task.needsUserInput) accumulator.active += 1
        if (task.needsUserInput && task.status !== 'Done') accumulator.waitingOnUser += 1
        if (task.status === 'Blocked') accumulator.blocked += 1
        if (task.readyToReport) accumulator.readyToReport += 1
        return accumulator
      },
      {
        active: 0,
        waitingOnUser: 0,
        blocked: 0,
        readyToReport: 0,
      },
    )
    const lastMessage = counts.chatMessages.at(-1) ?? null
    const workstreams = createWorkstreams(counts.tasks)
    const documents = await collectWorkspaceDocuments(this.config.workspaceRoot)
    const visibility = buildVisibilitySurfaces(counts.tasks, workstreams, documents)
    const missionAlignment = await buildMissionAlignment(this.config.workspaceRoot)
    const schedule = createScheduleVisibility(counts.missionCommand, documents)

    return {
      capturedAt: timestampNow(),
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
        taskStageBreakdown,
        attentionCounts,
        activityCount: counts.activity.length,
        latestActivityAt: counts.activity[0]?.timestamp ?? null,
        workstreams,
        visibility,
        documents,
        schedule,
        missionAlignment,
        suggestions: buildSuggestions(counts.tasks, documents, workstreams),
      },
    }
  }

  async missionCommand() {
    const data = await this.repository.snapshot()
    return data.missionCommand
  }

  async snapshot(): Promise<NexusStatusSnapshot> {
    const runtime = await this.runtimeContext()
    const data = await this.repository.snapshot()
    const runtimeActivityCount = data.activity.filter((item) => item.source === 'runtime').length
    const seededActivityCount = data.activity.filter((item) => item.source === 'seeded-demo').length
    const missionEntityCounts = countBySource(data.missionCommand)

    return {
      capturedAt: timestampNow(),
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
          id: 'mission-progress',
          label: 'Mission progress',
          value: `${data.missionCommand.mission.progressPercent}%`,
          detail: `${data.missionCommand.projects.length} projects · ${data.missionCommand.goals.length} goals aligned to command intent.`,
          severity: data.missionCommand.mission.progressPercent >= 50 ? 'stable' : 'watch',
        },
        {
          id: 'chat-count',
          label: 'Chat Records',
          value: String(runtime.chat.messageCount),
          detail: 'Conversation state now lives behind the server API for this Nexus session.',
          severity: 'stable',
        },
        {
          id: 'tasks-count',
          label: 'Task Board',
          value: `${runtime.surfaces.attentionCounts.active} active · ${runtime.surfaces.attentionCounts.waitingOnUser} waiting`,
          detail: `Stages: queued ${runtime.surfaces.taskStageBreakdown.queued} · inspecting ${runtime.surfaces.taskStageBreakdown.inspecting} · editing ${runtime.surfaces.taskStageBreakdown.editing} · validating ${runtime.surfaces.taskStageBreakdown.validating} · committing ${runtime.surfaces.taskStageBreakdown.committing} · pushing ${runtime.surfaces.taskStageBreakdown.pushing} · done ${runtime.surfaces.taskStageBreakdown.done}`,
          severity: runtime.surfaces.attentionCounts.blocked > 0 ? 'watch' : 'stable',
        },
        {
          id: 'command-surfaces',
          label: 'Command surfaces',
          value: `${data.missionCommand.calendar.length} calendar · ${data.missionCommand.memories.length} memory · ${data.missionCommand.artifacts.length} docs`,
          detail: `${data.missionCommand.team.length} team entries · ${data.missionCommand.office.length} office facts · ${data.missionCommand.searchIndex.length} search records.`,
          severity: 'stable',
        },
        {
          id: 'recent-activity',
          label: 'Recent Activity',
          value: `${runtimeActivityCount} runtime · ${seededActivityCount} seeded`,
          detail:
            runtimeActivityCount > 0
              ? 'Recent movement includes genuine server-recorded activity from this Nexus instance.'
              : 'Only seeded/demo activity is present so far. UI should not present it as live execution.',
          severity: runtimeActivityCount > 0 ? 'stable' : 'watch',
        },
        {
          id: 'mission-source',
          label: 'Mission data source',
          value: `${missionEntityCounts.runtime} runtime · ${missionEntityCounts.seeded} seeded`,
          detail: 'Mission-command surfaces use the same truth boundary model as tasks, notes, and activity.',
          severity: missionEntityCounts.runtime > 0 ? 'stable' : 'placeholder',
        },
      ],
    }
  }
}
