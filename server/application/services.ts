import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import type {
  ActivityRecord,
  CalendarEventRecord,
  ChatModeId,
  ChatMessageRecord,
  MemoryRecord,
  MissionCommandSnapshot,
  MissionRecord,
  NexusStatusSnapshot,
  NoteRecord,
  ProjectRecord,
  RuntimeBuildHealthSnapshot,
  RuntimeContextSnapshot,
  RuntimeDocumentSurface,
  RuntimeScheduleVisibility,
  RuntimeUpstreamPresenceSnapshot,
  RuntimeUpstreamSessionSnapshot,
  RuntimeUpstreamSubagentRunSnapshot,
  RuntimeVisibilitySurface,
  RuntimeWorkstreamSnapshot,
  TaskRecord,
  TaskStage,
  TaskStatus,
  TeamMemberRecord,
} from '../domain/models.js'
import type { AppConfig } from '../config/env.js'
import { ConflictError, ValidationError } from '../api/http.js'
import { validateCalendarCreate, validateMemoryCreate, validateTaskCreate, validateTaskTransition } from '../domain/validators.js'
import { ActivityRepository, ChatRepository, MissionCommandRepository, NotesRepository, StatusRepository, TasksRepository } from './repositories.js'

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

function safeFileTimestamp(path: string): string | null {
  if (!existsSync(path)) return null

  try {
    return statSync(path).mtime.toISOString()
  } catch {
    return null
  }
}

function createDocumentSurface(path: string, label: string, summary: string): RuntimeDocumentSurface {
  const exists = existsSync(path)
  const updatedAt = safeFileTimestamp(path)

  return {
    id: `document-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label,
    path,
    exists,
    summary,
    updatedAt,
  }
}

function isoFromEpoch(timestamp?: number): string | null {
  if (!timestamp || !Number.isFinite(timestamp)) return null
  try {
    return new Date(timestamp).toISOString()
  } catch {
    return null
  }
}

async function readJsonFileOr<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

function classifySessionKind(sessionKey: string): RuntimeUpstreamSessionSnapshot['kind'] {
  if (sessionKey.includes(':subagent:')) return 'subagent'
  if (sessionKey.includes(':cron:')) return 'cron'
  if (sessionKey.includes(':main') || sessionKey.includes(':telegram:') || sessionKey.includes(':discord:')) return 'main'
  return 'other'
}

function classifySessionStatus(value: unknown): RuntimeUpstreamSessionSnapshot['status'] {
  if (value === 'running') return 'running'
  if (value === 'done' || value === 'ended' || value === 'complete') return 'ended'
  if (typeof value === 'string' && value.length > 0) return 'idle'
  return 'unknown'
}

function classifyRunStatus(run: Record<string, unknown>): RuntimeUpstreamSubagentRunSnapshot['status'] {
  if (typeof run.endedAt !== 'number') return 'running'
  const outcome = typeof run.outcome === 'object' && run.outcome ? run.outcome as Record<string, unknown> : {}
  const outcomeStatus = typeof outcome.status === 'string' ? outcome.status : null
  if (outcomeStatus === 'ok') return 'completed'
  if (outcomeStatus === 'error' || outcomeStatus === 'failed') return 'failed'
  return 'unknown'
}

function classifyObservedActivity(eventType: string | null, messageRole: string | null): RuntimeUpstreamSessionSnapshot['lastObservedActivity'] {
  if (eventType === 'message') {
    if (messageRole === 'assistant') return 'assistant-message'
    if (messageRole === 'user') return 'operator-message'
    if (messageRole === 'toolResult') return 'tool-result'
    if (messageRole === 'system') return 'system-event'
    return 'unknown'
  }

  if (eventType) return 'non-message-event'
  return 'unknown'
}

async function readSessionTranscriptTail(
  sessionFilePath: string | null,
): Promise<Pick<RuntimeUpstreamSessionSnapshot, 'lastObservedEventAt' | 'lastObservedEventType' | 'lastObservedMessageRole' | 'lastObservedActivity'>> {
  if (!sessionFilePath || !existsSync(sessionFilePath)) {
    return {
      lastObservedEventAt: null,
      lastObservedEventType: null,
      lastObservedMessageRole: null,
      lastObservedActivity: 'unknown',
    }
  }

  try {
    const raw = await readFile(sessionFilePath, 'utf8')
    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)
    const lastLine = lines.at(-1)
    if (!lastLine) {
      return {
        lastObservedEventAt: null,
        lastObservedEventType: null,
        lastObservedMessageRole: null,
        lastObservedActivity: 'unknown',
      }
    }

    const parsed = JSON.parse(lastLine) as Record<string, unknown>
    const eventType = typeof parsed.type === 'string' ? parsed.type : null
    const message = parsed.message
    const messageRole = eventType === 'message' && message && typeof message === 'object' && typeof (message as Record<string, unknown>).role === 'string'
      ? (message as Record<string, unknown>).role
      : null

    return {
      lastObservedEventAt: typeof parsed.timestamp === 'string' ? parsed.timestamp : null,
      lastObservedEventType: eventType,
      lastObservedMessageRole:
        messageRole === 'assistant' || messageRole === 'user' || messageRole === 'toolResult' || messageRole === 'system'
          ? messageRole
          : null,
      lastObservedActivity: classifyObservedActivity(eventType, typeof messageRole === 'string' ? messageRole : null),
    }
  } catch {
    return {
      lastObservedEventAt: null,
      lastObservedEventType: null,
      lastObservedMessageRole: null,
      lastObservedActivity: 'unknown',
    }
  }
}

async function readUpstreamPresence(workspaceRoot: string): Promise<RuntimeUpstreamPresenceSnapshot> {
  const sessionIndexPath = join(workspaceRoot, '..', 'agents', 'main', 'sessions', 'sessions.json')
  const subagentRunsPath = join(workspaceRoot, '..', 'subagents', 'runs.json')

  const sessionIndexAvailable = existsSync(sessionIndexPath)
  const subagentRunsAvailable = existsSync(subagentRunsPath)
  const sessionSnapshot = sessionIndexAvailable
    ? await readJsonFileOr<Record<string, Record<string, unknown>>>(sessionIndexPath, {})
    : {}
  const subagentSnapshot = subagentRunsAvailable
    ? await readJsonFileOr<{ runs?: Record<string, Record<string, unknown>> }>(subagentRunsPath, { runs: {} })
    : { runs: {} }

  const sessions = (await Promise.all(
    Object.entries(sessionSnapshot).map(async ([sessionKey, value]) => {
      if (!value || typeof value !== 'object') return null
      const sessionId = typeof value.sessionId === 'string' ? value.sessionId : null
      if (!sessionId) return null
      const label = typeof value.label === 'string'
        ? value.label
        : typeof value.requesterDisplayKey === 'string'
          ? value.requesterDisplayKey
          : sessionKey
      const transcriptTail = await readSessionTranscriptTail(typeof value.sessionFile === 'string' ? value.sessionFile : null)
      return {
        sessionKey,
        sessionId,
        label,
        kind: classifySessionKind(sessionKey),
        status: classifySessionStatus(value.status),
        updatedAt: typeof value.updatedAt === 'number' ? isoFromEpoch(value.updatedAt) : null,
        ...transcriptTail,
        source: 'openclaw-session-index' as const,
      }
    }),
  ))
    .filter((entry): entry is RuntimeUpstreamSessionSnapshot => Boolean(entry))
    .sort((left, right) => (right.updatedAt ?? '').localeCompare(left.updatedAt ?? ''))
    .slice(0, 6)

  const subagentRuns = Object.values(subagentSnapshot.runs ?? {})
    .map((value) => {
      const runId = typeof value.runId === 'string' ? value.runId : null
      const sessionKey = typeof value.childSessionKey === 'string' ? value.childSessionKey : 'unknown-subagent-session'
      if (!runId) return null
      const label = typeof value.label === 'string'
        ? value.label
        : typeof value.task === 'string'
          ? value.task.slice(0, 72)
          : sessionKey
      return {
        runId,
        sessionKey,
        label,
        status: classifyRunStatus(value),
        startedAt: typeof value.startedAt === 'number' ? isoFromEpoch(value.startedAt) : null,
        endedAt: typeof value.endedAt === 'number' ? isoFromEpoch(value.endedAt) : null,
        source: 'openclaw-subagent-runs' as const,
      }
    })
    .filter((entry): entry is RuntimeUpstreamSubagentRunSnapshot => Boolean(entry))
    .sort((left, right) => (right.startedAt ?? '').localeCompare(left.startedAt ?? ''))
    .slice(0, 6)

  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000
  const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000
  const sessionEntries = Object.values(sessionSnapshot).filter((value) => value && typeof value === 'object') as Array<Record<string, unknown>>
  const runningSessions = sessionEntries.filter((value) => value.status === 'running').length
  const recentlyUpdatedSessions = sessionEntries.filter((value) => typeof value.updatedAt === 'number' && value.updatedAt >= fifteenMinutesAgo).length
  const runEntries = Object.values(subagentSnapshot.runs ?? {})
  const activeSubagentRuns = runEntries.filter((value) => typeof value.endedAt !== 'number').length
  const recentlyCompletedSubagentRuns = runEntries.filter((value) => typeof value.endedAt === 'number' && value.endedAt >= sixtyMinutesAgo).length

  return {
    source: sessionIndexAvailable || subagentRunsAvailable ? 'openclaw-host-files' : 'unavailable',
    sessionIndexAvailable,
    subagentRunsAvailable,
    totalSessions: sessionEntries.length,
    runningSessions,
    recentlyUpdatedSessions,
    activeSubagentRuns,
    recentlyCompletedSubagentRuns,
    latestSessionAt: sessions[0]?.updatedAt ?? null,
    latestSubagentAt: (subagentRuns.find((entry) => entry.status === 'running') ?? subagentRuns[0])?.startedAt ?? null,
    sessions,
    subagentRuns,
    caveat:
      sessionIndexAvailable || subagentRunsAvailable
        ? 'This is host-file truth from OpenClaw session and subagent registries, plus each visible session transcript tail\'s last observed event. It improves liveness posture, but it is still not a full official event API, queue-depth feed, or token-stream state.'
        : 'OpenClaw host session registries are not visible from this workspace, so upstream presence cannot be surfaced truthfully.',
  }
}

interface CronJobStateSnapshot {
  name: string
  enabled: boolean
  nextRunAtMs?: number
  lastRunAtMs?: number
  lastRunStatus?: string
  lastDeliveryStatus?: string
  consecutiveErrors?: number
}

async function readCronJobState(workspaceRoot: string): Promise<CronJobStateSnapshot[] | null> {
  const cronJobsPath = join(workspaceRoot, '..', 'cron', 'jobs.json')

  try {
    const raw = await readFile(cronJobsPath, 'utf8')
    const parsed = JSON.parse(raw) as { jobs?: Array<Record<string, unknown>> }
    if (!Array.isArray(parsed.jobs)) return []

    return parsed.jobs.map((job) => {
      const state = typeof job.state === 'object' && job.state ? job.state as Record<string, unknown> : {}
      return {
        name: typeof job.name === 'string' ? job.name : 'unnamed-job',
        enabled: job.enabled !== false,
        nextRunAtMs: typeof state.nextRunAtMs === 'number' ? state.nextRunAtMs : undefined,
        lastRunAtMs: typeof state.lastRunAtMs === 'number' ? state.lastRunAtMs : undefined,
        lastRunStatus: typeof state.lastRunStatus === 'string' ? state.lastRunStatus : undefined,
        lastDeliveryStatus: typeof state.lastDeliveryStatus === 'string' ? state.lastDeliveryStatus : undefined,
        consecutiveErrors: typeof state.consecutiveErrors === 'number' ? state.consecutiveErrors : undefined,
      }
    })
  } catch {
    return null
  }
}

function formatCronTimestamp(timestampMs?: number): string | null {
  if (!timestampMs) return null
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Phoenix',
    }).format(new Date(timestampMs))
  } catch {
    return null
  }
}

async function createScheduleVisibility(
  workspaceRoot: string,
  mission: MissionCommandSnapshot,
  documents: RuntimeDocumentSurface[],
): Promise<RuntimeScheduleVisibility> {
  const upcoming = mission.calendar.filter((item) => item.status !== 'done')
  const meetings = upcoming.filter((item) => item.type === 'meeting')
  const heartbeatVisible = documents.some((document) => document.path.endsWith('HEARTBEAT.md') && document.exists)
  const cronJobs = await readCronJobState(workspaceRoot)

  const enabledJobs = cronJobs?.filter((job) => job.enabled) ?? []
  const failingJobs = enabledJobs.filter((job) => job.lastRunStatus === 'error' || (job.consecutiveErrors ?? 0) > 0)
  const deliveryIssues = enabledJobs.filter(
    (job) => job.lastDeliveryStatus === 'not-delivered' || job.lastDeliveryStatus === 'unknown',
  )
  const nextRunJob = enabledJobs
    .filter((job) => typeof job.nextRunAtMs === 'number')
    .sort((left, right) => (left.nextRunAtMs ?? Number.MAX_SAFE_INTEGER) - (right.nextRunAtMs ?? Number.MAX_SAFE_INTEGER))[0]

  const nextRunLabel = nextRunJob ? formatCronTimestamp(nextRunJob.nextRunAtMs) : null
  const automationState: 'connected' | 'derived' | 'not-connected' = cronJobs
    ? failingJobs.length > 0 || deliveryIssues.length > 0
      ? 'connected'
      : 'connected'
    : heartbeatVisible
      ? 'derived'
      : 'not-connected'

  const automationSummary = cronJobs
    ? `${enabledJobs.length} enabled job${enabledJobs.length === 1 ? '' : 's'} · ${failingJobs.length} failing · ${deliveryIssues.length} delivery issue${deliveryIssues.length === 1 ? '' : 's'}`
    : heartbeatVisible
      ? 'Workspace heartbeat instructions are visible, but host cron/job inventory is not.'
      : 'No heartbeat file is visible, and host cron/job inventory is not attached.'

  const automationDetail = cronJobs
    ? failingJobs[0]
      ? `${failingJobs[0].name} is failing${failingJobs[0].lastRunStatus ? ` (${failingJobs[0].lastRunStatus})` : ''}.${nextRunLabel ? ` Next run ${nextRunLabel}.` : ''}`
      : deliveryIssues[0]
        ? `${deliveryIssues[0].name} last delivery was ${deliveryIssues[0].lastDeliveryStatus}.${nextRunLabel ? ` Next run ${nextRunLabel}.` : ''}`
        : nextRunJob
          ? `Next scheduled job: ${nextRunJob.name} at ${nextRunLabel ?? 'unknown time'}.`
          : 'Cron inventory is visible, but no enabled jobs currently expose a next run.'
    : 'Nexus can see HEARTBEAT.md presence in the workspace, but it cannot yet enumerate OpenClaw cron jobs or host schedulers truthfully.'

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
      state: automationState,
      summary: automationSummary,
      detail: automationDetail,
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

async function deriveBuildHealth(workspaceRoot: string): Promise<RuntimeBuildHealthSnapshot> {
  const webBuildIdPath = join(workspaceRoot, '.next', 'BUILD_ID')
  const webBuildDiagnosticsPath = join(workspaceRoot, '.next', 'diagnostics', 'build-diagnostics.json')
  const apiBuildPath = join(workspaceRoot, 'dist-server', 'index.js')

  const webBuiltAt = safeFileTimestamp(webBuildIdPath)
  const apiBuiltAt = safeFileTimestamp(apiBuildPath)

  let webBuildId: string | null = null
  if (existsSync(webBuildIdPath)) {
    try {
      webBuildId = (await readFile(webBuildIdPath, 'utf8')).trim() || null
    } catch {
      webBuildId = null
    }
  }

  let webStage: string | null = null
  if (existsSync(webBuildDiagnosticsPath)) {
    try {
      const diagnostics = JSON.parse(await readFile(webBuildDiagnosticsPath, 'utf8')) as { buildStage?: unknown }
      webStage = typeof diagnostics.buildStage === 'string' ? diagnostics.buildStage : null
    } catch {
      webStage = null
    }
  }

  const webBuilt = Boolean(webBuiltAt)
  const apiBuilt = Boolean(apiBuiltAt)

  if (webBuilt && apiBuilt) {
    return {
      state: 'healthy',
      label: 'Healthy',
      detail: `Web and API build artifacts are present.${webStage ? ` Latest Next.js stage: ${webStage}.` : ''}`,
      web: {
        built: true,
        buildId: webBuildId,
        builtAt: webBuiltAt,
        stage: webStage,
      },
      api: {
        built: true,
        builtAt: apiBuiltAt,
      },
    }
  }

  if (webBuilt || apiBuilt) {
    return {
      state: 'watch',
      label: 'Watch',
      detail: webBuilt
        ? 'Frontend build artifacts are present, but the API build artifact is missing.'
        : 'API build artifact is present, but the frontend build artifact is missing.',
      web: {
        built: webBuilt,
        buildId: webBuildId,
        builtAt: webBuiltAt,
        stage: webStage,
      },
      api: {
        built: apiBuilt,
        builtAt: apiBuiltAt,
      },
    }
  }

  return {
    state: 'unknown',
    label: 'Unknown',
    detail: 'No build artifacts are currently present, so Nexus cannot claim a verified build state.',
    web: {
      built: false,
      buildId: webBuildId,
      builtAt: webBuiltAt,
      stage: webStage,
    },
    api: {
      built: false,
      builtAt: apiBuiltAt,
    },
  }
}

async function collectWorkspaceDocuments(workspaceRoot: string): Promise<RuntimeDocumentSurface[]> {
  return [
    createDocumentSurface(join(workspaceRoot, 'README.md'), 'README', 'Primary repo readme and operator-facing overview.'),
    createDocumentSurface(join(workspaceRoot, 'docs', 'ui-architecture-roadmap.md'), 'UI roadmap', 'Transitional direction toward a future Next.js + Tailwind + shadcn-style shell.'),
    createDocumentSurface(join(workspaceRoot, 'HEARTBEAT.md'), 'Heartbeat', 'Workspace heartbeat checklist and proactive operating instructions.'),
    createDocumentSurface(join(workspaceRoot, 'USER.md'), 'User context', 'Operator priorities, constraints, and execution bias.'),
    createDocumentSurface(join(workspaceRoot, 'ops', 'execution_update_form.md'), 'Execution update form', 'Lightweight proof/blocker/waiting/handoff template for truthful Nexus task updates.'),
  ]
}

function buildVisibilitySurfaces(
  tasks: TaskRecord[],
  workstreams: RuntimeWorkstreamSnapshot[],
  documents: RuntimeDocumentSurface[],
  upstreamPresence: RuntimeUpstreamPresenceSnapshot,
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
      state: upstreamPresence.activeSubagentRuns > 0
        ? 'live'
        : upstreamPresence.sessionIndexAvailable || upstreamPresence.subagentRunsAvailable
          ? 'partial'
          : 'not-exposed',
      detail: upstreamPresence.sessionIndexAvailable || upstreamPresence.subagentRunsAvailable
        ? `${upstreamPresence.activeSubagentRuns} active subagent run${upstreamPresence.activeSubagentRuns === 1 ? '' : 's'} · ${upstreamPresence.recentlyUpdatedSessions} session${upstreamPresence.recentlyUpdatedSessions === 1 ? '' : 's'} updated in the last 15m from OpenClaw host files.`
        : 'No OpenClaw session or subagent registry is visible here, so Nexus does not invent sub-agent presence.',
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
    const needsOperator = task.needsUserInput || task.needsApproval
    if (task.status !== 'Blocked' && task.status !== 'Done' && !needsOperator) current.activeCount += 1
    if (needsOperator && task.status !== 'Done') current.waitingCount += 1
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
    const existingTasks = await this.repository.list()
    const createCheck = validateTaskCreate(
      { status: input.status, owner: input.owner, blockedReason: input.blockedReason, summary: input.summary },
      existingTasks,
    )
    if (!createCheck.ok) {
      throw new ValidationError(createCheck.code, createCheck.message, createCheck.details)
    }

    const now = timestampNow()
    const task = await this.repository.create({
      ...input,
      id: `task-${crypto.randomUUID()}`,
      stage: input.stage ?? defaultStageByStatus[input.status],
      needsUserInput: input.needsUserInput ?? false,
      needsApproval: input.needsApproval ?? false,
      assignedBy: input.assignedBy?.trim() || undefined,
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
    const allTasks = await this.repository.list()
    const existing = allTasks.find((t) => t.id === taskId)
    if (!existing) return null

    const transitionCheck = validateTaskTransition(existing, patch)
    if (!transitionCheck.ok) {
      throw new ValidationError(transitionCheck.code, transitionCheck.message, transitionCheck.details)
    }


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

  async approve(taskId: string) {
    const allTasks = await this.repository.list()
    const existing = allTasks.find((t) => t.id === taskId)
    if (!existing) return null

    const now = timestampNow()
    const updated = await this.repository.update(taskId, {
      needsApproval: false,
      lastUpdatedAt: now,
    })

    if (updated) {
      await this.activityRepository.append({
        id: `activity-${crypto.randomUUID()}`,
        type: 'task',
        title: `Task approved: ${updated.title}`,
        detail: `Operator approved task. ${describeTaskState(updated)}`,
        timestamp: now,
        status: 'logged',
        source: 'runtime',
      })
    }

    return updated
  }

  async reject(taskId: string, reason?: string) {
    const allTasks = await this.repository.list()
    const existing = allTasks.find((t) => t.id === taskId)
    if (!existing) return null

    const now = timestampNow()
    const blockedReason = reason ?? 'Rejected by operator'
    const updated = await this.repository.update(taskId, {
      status: 'Blocked',
      needsApproval: false,
      blockedReason,
      lastUpdatedAt: now,
    })

    if (updated) {
      await this.activityRepository.append({
        id: `activity-${crypto.randomUUID()}`,
        type: 'task',
        title: `Task rejected: ${updated.title}`,
        detail: `Operator rejected task. Reason: ${blockedReason}`,
        timestamp: now,
        status: 'watch',
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
        const needsOperator = task.needsUserInput || task.needsApproval

        if (task.status !== 'Blocked' && task.status !== 'Done' && !needsOperator) accumulator.active += 1
        if (needsOperator && task.status !== 'Done') accumulator.waitingOnUser += 1
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
    const upstreamPresence = await readUpstreamPresence(this.config.workspaceRoot)
    const visibility = buildVisibilitySurfaces(counts.tasks, workstreams, documents, upstreamPresence)
    const missionAlignment = await buildMissionAlignment(this.config.workspaceRoot)
    const schedule = await createScheduleVisibility(this.config.workspaceRoot, counts.missionCommand, documents)
    const buildHealth = await deriveBuildHealth(this.config.workspaceRoot)

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
        upstreamPresence,
        documents,
        schedule,
        buildHealth,
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

export class MissionCommandService {
  constructor(
    private readonly repository: MissionCommandRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async patchMission(patch: Partial<MissionRecord>): Promise<MissionRecord> {
    const updated = await this.repository.patchMission({ ...patch, source: 'runtime' })
    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'status',
      title: 'Mission updated',
      detail: patch.progressPercent !== undefined ? `Progress: ${patch.progressPercent}%` : 'Mission record patched.',
      timestamp: new Date().toISOString(),
      status: 'logged',
      source: 'runtime',
    } as ActivityRecord)
    return updated
  }

  async patchProject(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    const updated = await this.repository.patchProject(id, patch)
    if (updated) {
      await this.activityRepository.append({
        id: `activity-${crypto.randomUUID()}`,
        type: 'status',
        title: `Project updated: ${updated.name}`,
        detail: patch.status ? `Status → ${patch.status}` : patch.progressPercent !== undefined ? `Progress → ${patch.progressPercent}%` : 'Project patched.',
        timestamp: new Date().toISOString(),
        status: updated.status === 'blocked' ? 'watch' : updated.status === 'done' ? 'done' : 'logged',
        source: 'runtime',
      } as ActivityRecord)
    }
    return updated
  }

  async patchTeamMember(id: string, patch: Partial<TeamMemberRecord>): Promise<TeamMemberRecord | null> {
    const updated = await this.repository.patchTeamMember(id, patch)
    if (updated) {
      await this.activityRepository.append({
        id: `activity-${crypto.randomUUID()}`,
        type: 'status',
        title: `Agent updated: ${updated.name}`,
        detail: patch.focus ? `Focus → ${patch.focus}` : `Status → ${patch.status ?? 'updated'}`,
        timestamp: new Date().toISOString(),
        status: updated.status === 'offline' ? 'watch' : 'logged',
        source: 'runtime',
      } as ActivityRecord)
    }
    return updated
  }

  async createCalendarEvent(input: { title: string; type: CalendarEventRecord['type']; startsAt: string; owner: string; detail: string; endsAt?: string; relatedProjectId?: string }): Promise<CalendarEventRecord> {
    const existingEvents = await this.repository.listCalendarEvents()
    const check = validateCalendarCreate({ title: input.title, startsAt: input.startsAt }, existingEvents)
    if (!check.ok) {
      throw check.code === 'CALENDAR_EVENT_CONFLICT'
        ? new ConflictError(check.code, check.message, check.details)
        : new ValidationError(check.code, check.message, check.details)
    }

    const event: CalendarEventRecord = {
      id: `cal-${crypto.randomUUID()}`,
      title: input.title.trim(),
      type: input.type,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      owner: input.owner.trim(),
      relatedProjectId: input.relatedProjectId,
      status: 'scheduled',
      detail: input.detail.trim(),
      source: 'runtime',
    }
    const created = await this.repository.createCalendarEvent(event)
    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'status',
      title: `Calendar: ${created.title}`,
      detail: `${created.type} · ${created.startsAt}`,
      timestamp: new Date().toISOString(),
      status: 'logged',
      source: 'runtime',
    } as ActivityRecord)
    return created
  }

  async createMemory(input: { title: string; summary: string; kind?: MemoryRecord['kind']; tags?: string[] }): Promise<MemoryRecord> {
    const existingMemories = await this.repository.listMemories()
    const check = validateMemoryCreate({ title: input.title, summary: input.summary }, existingMemories)
    if (!check.ok) {
      throw check.code === 'MEMORY_TITLE_CONFLICT'
        ? new ConflictError(check.code, check.message, check.details)
        : new ValidationError(check.code, check.message, check.details)
    }

    const memory: MemoryRecord = {
      id: `mem-${crypto.randomUUID()}`,
      title: input.title.trim(),
      kind: input.kind ?? 'working-memory',
      updatedAt: new Date().toISOString(),
      summary: input.summary.trim(),
      tags: input.tags ?? [],
      source: 'runtime',
    }
    const created = await this.repository.createMemory(memory)
    await this.activityRepository.append({
      id: `activity-${crypto.randomUUID()}`,
      type: 'status',
      title: `Memory stored: ${created.title}`,
      detail: created.tags.length > 0 ? created.tags.join(', ') : created.kind,
      timestamp: new Date().toISOString(),
      status: 'logged',
      source: 'runtime',
    } as ActivityRecord)
    return created
  }
}
