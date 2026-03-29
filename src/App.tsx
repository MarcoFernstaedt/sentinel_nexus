import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { Composer } from './features/chat/components/Composer'
import { ConversationView } from './features/chat/components/ConversationView'
import { ModeSwitch } from './features/chat/components/ModeSwitch'
import { PersonaPanel } from './features/chat/components/PersonaPanel'
import { useLocalChat } from './features/chat/hooks/useLocalChat'
import type { RuntimeTask, TaskStage } from './features/chat/model/types'

type TaskStatus = RuntimeTask['status']

type ProjectSummary = {
  id: string
  label: string
  total: number
  active: number
  blocked: number
  waiting: number
  done: number
  completion: number | null
  nextTask: RuntimeTask | undefined
  source: 'live' | 'baseline-only' | 'mixed'
}

const taskStatusOrder: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done']

function formatLastEventLabel(timestamp: string | undefined) {
  if (!timestamp) return 'Awaiting first packet'
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

function formatRelativeLabel(timestamp: string | undefined) {
  if (!timestamp) return 'No recent signal'
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp

  const diffMs = Date.now() - parsed
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes <= 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function formatStageLabel(stage: TaskStage) {
  return stage.charAt(0).toUpperCase() + stage.slice(1)
}

function describeTask(task: RuntimeTask) {
  const parts = [
    `${formatStageLabel(task.stage)} stage`,
    task.lane,
    task.owner,
    `due ${task.due}`,
  ]

  if (task.needsUserInput) parts.push('waiting on user')
  if (task.readyToReport) parts.push('ready to report')

  return parts.join(' · ')
}

function defaultStageForStatus(status: TaskStatus): TaskStage {
  if (status === 'In Progress') return 'editing'
  if (status === 'Blocked') return 'validating'
  if (status === 'Done') return 'done'
  return 'queued'
}

function calculateProjectSummaries(tasks: RuntimeTask[]): ProjectSummary[] {
  const projects = new Map<string, RuntimeTask[]>()

  for (const task of tasks) {
    const key = task.lane?.trim() || 'Unassigned'
    const current = projects.get(key) ?? []
    current.push(task)
    projects.set(key, current)
  }

  return [...projects.entries()]
    .map(([label, projectTasks]) => {
      const active = projectTasks.filter((task) => task.status !== 'Blocked' && task.status !== 'Done' && !task.needsUserInput).length
      const blocked = projectTasks.filter((task) => task.status === 'Blocked').length
      const waiting = projectTasks.filter((task) => task.needsUserInput && task.status !== 'Done').length
      const done = projectTasks.filter((task) => task.status === 'Done').length
      const runtimeCount = projectTasks.filter((task) => task.source === 'runtime').length
      const completion = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : null
      const nextTask = projectTasks.find((task) => task.status !== 'Done')

      const source: ProjectSummary['source'] =
        runtimeCount === 0 ? 'baseline-only' : runtimeCount === projectTasks.length ? 'live' : 'mixed'

      return {
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        total: projectTasks.length,
        active,
        blocked,
        waiting,
        done,
        completion,
        nextTask,
        source,
      }
    })
    .sort((left, right) => {
      const leftPressure = left.blocked + left.waiting + left.active
      const rightPressure = right.blocked + right.waiting + right.active
      return rightPressure - leftPressure || left.label.localeCompare(right.label)
    })
}

function App() {
  const {
    activeMode,
    activeModeId,
    apiState,
    createNote,
    createTask,
    draft,
    historyCursorLabel,
    inputHistory,
    isResponding,
    isSyncingRuntime,
    messages,
    modes,
    rawMessages,
    recentActivity,
    refreshRuntime,
    runtimeContext,
    runtimeNotes,
    runtimeStatus,
    runtimeTasks,
    suggestedPrompts,
    transportPreview,
    updateTask,
    setActiveModeId,
    setDraft,
    submitMessage,
    cycleHistory,
  } = useLocalChat()

  const [taskForm, setTaskForm] = useState({
    title: '',
    owner: 'Marco',
    due: 'Today',
    lane: 'Build',
    summary: '',
    needsUserInput: false,
  })
  const [noteForm, setNoteForm] = useState({
    title: '',
    body: '',
    tag: 'ops',
  })
  const [surfaceError, setSurfaceError] = useState<string | null>(null)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [taskActionId, setTaskActionId] = useState<string | null>(null)

  const latestMessage = rawMessages[rawMessages.length - 1]
  const systemMessages = rawMessages.filter((message) => message.role === 'system').length
  const taskStageBreakdown = runtimeContext?.surfaces.taskStageBreakdown
  const attentionCounts = runtimeContext?.surfaces.attentionCounts
  const runtimeCards = runtimeStatus?.cards ?? []
  const environmentLabel = runtimeStatus?.environment ?? 'offline'
  const lastEventLabel = formatLastEventLabel(latestMessage?.timestamp)
  const runtimeRecentActivity = recentActivity.filter((item) => item.source === 'runtime')
  const seededRecentActivity = recentActivity.filter((item) => item.source === 'seeded-demo')
  const runtimeNotesLive = runtimeNotes.filter((note) => note.source === 'runtime')
  const seededNotes = runtimeNotes.filter((note) => note.source === 'seeded-demo')
  const runtimeTasksLive = runtimeTasks.filter((task) => task.source === 'runtime')
  const seededTasks = runtimeTasks.filter((task) => task.source === 'seeded-demo')
  const activeExecutionTasks = runtimeTasks.filter((task) => task.status !== 'Blocked' && task.status !== 'Done' && !task.needsUserInput)
  const waitingOnUserTasks = runtimeTasks.filter((task) => task.needsUserInput && task.status !== 'Done')
  const blockedTasks = runtimeTasks.filter((task) => task.status === 'Blocked')
  const readyToReportTasks = runtimeTasks.filter((task) => task.readyToReport)
  const completedTasks = runtimeTasks.filter((task) => task.status === 'Done')
  const modeCoverage = runtimeContext?.chat.modes.length ?? modes.length
  const activeModeSurface = activeMode.label
  const modelLaneLabel =
    apiState === 'connected'
      ? 'Server stub response'
      : transportPreview.provider === 'Local simulator'
        ? 'Local simulator'
        : transportPreview.provider
  const modelTruthLabel =
    apiState === 'connected'
      ? 'Model identity not yet exposed by backend. Current replies are honest server-side placeholder responses.'
      : 'No backend model truth available. Responses are generated by the local simulator seam.'

  const projectAreas = [
    {
      id: 'delivery',
      title: 'Active execution',
      value: `${activeExecutionTasks.length} tasks`,
      detail:
        activeExecutionTasks[0]?.title ?? 'No active runtime tasks yet. The board is ready when real task state appears.',
    },
    {
      id: 'waiting',
      title: 'Waiting on user',
      value: `${waitingOnUserTasks.length} items`,
      detail:
        waitingOnUserTasks[0]?.title ?? 'Nothing is currently marked as needing operator input.',
    },
    {
      id: 'blocked',
      title: 'Blocked work',
      value: `${blockedTasks.length} items`,
      detail:
        blockedTasks[0]?.title ?? 'No blocked tasks are exposed right now.',
    },
    {
      id: 'reporting',
      title: 'Completed',
      value: `${completedTasks.length} items`,
      detail:
        completedTasks[0]?.title ?? 'No completed tasks are visible yet.',
    },
  ]

  const liveNowFeed = [
    ...runtimeRecentActivity.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      status: item.status,
      meta: `${item.type} · ${formatRelativeLabel(item.timestamp)}`,
      source: item.source,
    })),
    ...runtimeNotesLive.map((note) => ({
      id: note.id,
      title: note.title,
      detail: note.body,
      status: 'logged' as const,
      meta: `[${note.tag}] ${formatRelativeLabel(note.updatedAt)}`,
      source: note.source,
    })),
  ].slice(0, 8)
  const baselineFeed = [
    ...seededRecentActivity.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      status: item.status,
      meta: `seeded baseline · ${formatLastEventLabel(item.timestamp)}`,
      source: item.source,
    })),
    ...seededNotes.map((note) => ({
      id: note.id,
      title: note.title,
      detail: note.body,
      status: 'logged' as const,
      meta: `[${note.tag}] seeded baseline`,
      source: note.source,
    })),
  ].slice(0, 4)

  const projectSummaries = useMemo(() => calculateProjectSummaries(runtimeTasks), [runtimeTasks])
  const completionRate = runtimeTasks.length > 0 ? Math.round((completedTasks.length / runtimeTasks.length) * 100) : null
  const truthfulProjectLabel = projectSummaries.length > 0 ? `${projectSummaries.length} active lanes` : 'No project lanes exposed'
  const topProject = projectSummaries[0]

  const boardGroups = [
    {
      id: 'active',
      title: 'Active now',
      tone: 'live',
      description: 'Work currently in motion without a user dependency or hard block.',
      tasks: activeExecutionTasks,
    },
    {
      id: 'waiting',
      title: 'Waiting on user',
      tone: 'subtle',
      description: 'Items explicitly marked as needing Marco before they can move.',
      tasks: waitingOnUserTasks,
    },
    {
      id: 'blocked',
      title: 'Blocked',
      tone: 'warn',
      description: 'Work the runtime knows is blocked. No fake ETA, just visible friction.',
      tasks: blockedTasks,
    },
    {
      id: 'report',
      title: 'Completed / ready to report',
      tone: 'subtle',
      description: 'Done work stays visible so execution history does not vanish.',
      tasks: readyToReportTasks.length > 0 ? readyToReportTasks : completedTasks,
    },
  ] as const

  const stageCards: Array<{ id: TaskStage; value: number; detail: string }> = [
    { id: 'queued', value: taskStageBreakdown?.queued ?? 0, detail: 'Captured, not started' },
    { id: 'inspecting', value: taskStageBreakdown?.inspecting ?? 0, detail: 'Reading or diagnosing' },
    { id: 'editing', value: taskStageBreakdown?.editing ?? 0, detail: 'Making changes' },
    { id: 'validating', value: taskStageBreakdown?.validating ?? 0, detail: 'Checking correctness' },
    { id: 'committing', value: taskStageBreakdown?.committing ?? 0, detail: 'Preparing local commit' },
    { id: 'pushing', value: taskStageBreakdown?.pushing ?? 0, detail: 'Ready for remote push' },
    { id: 'done', value: taskStageBreakdown?.done ?? 0, detail: 'Execution finished' },
  ]

  async function handleTaskCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSurfaceError(null)
    setIsSavingTask(true)

    try {
      await createTask({
        title: taskForm.title,
        owner: taskForm.owner,
        due: taskForm.due,
        lane: taskForm.lane,
        summary: taskForm.summary || undefined,
        needsUserInput: taskForm.needsUserInput,
        status: taskForm.needsUserInput ? 'Queued' : 'In Progress',
        stage: taskForm.needsUserInput ? 'queued' : 'editing',
      })
      setTaskForm({
        title: '',
        owner: taskForm.owner,
        due: 'Today',
        lane: taskForm.lane,
        summary: '',
        needsUserInput: false,
      })
    } catch {
      setSurfaceError('Task write failed. Nexus API is likely offline.')
    } finally {
      setIsSavingTask(false)
    }
  }

  async function handleNoteCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSurfaceError(null)
    setIsSavingNote(true)

    try {
      await createNote(noteForm)
      setNoteForm({ title: '', body: '', tag: noteForm.tag })
    } catch {
      setSurfaceError('Note write failed. Nexus API is likely offline.')
    } finally {
      setIsSavingNote(false)
    }
  }

  async function handleTaskStatusChange(task: RuntimeTask, status: TaskStatus) {
    setSurfaceError(null)
    setTaskActionId(task.id)

    try {
      await updateTask(task.id, {
        status,
        stage: defaultStageForStatus(status),
        needsUserInput: status === 'Done' ? false : task.needsUserInput,
        readyToReport: status === 'Done' ? true : task.readyToReport,
      })
    } catch {
      setSurfaceError(`Could not update ${task.title}.`)
    } finally {
      setTaskActionId(null)
    }
  }

  async function handleTaskFlagToggle(task: RuntimeTask, field: 'needsUserInput' | 'readyToReport') {
    setSurfaceError(null)
    setTaskActionId(task.id)

    try {
      await updateTask(task.id, { [field]: !task[field] })
    } catch {
      setSurfaceError(`Could not update ${task.title}.`)
    } finally {
      setTaskActionId(null)
    }
  }

  async function handleRefresh() {
    setSurfaceError(null)
    const ok = await refreshRuntime()
    if (!ok) {
      setSurfaceError('Refresh failed. Local fallback remains active.')
    }
  }

  return (
    <div className="app-shell">
      <div className="shell-backdrop" aria-hidden="true">
        <div className="shell-backdrop__grid" />
        <div className="shell-backdrop__glow shell-backdrop__glow--one" />
        <div className="shell-backdrop__glow shell-backdrop__glow--two" />
      </div>

      <aside className="left-rail">
        <div className="brand-block">
          <p className="eyebrow">Sentinel Nexus // Command Center</p>
          <h1>Operator shell for decisive work, truthful visibility, and controlled execution.</h1>
          <p className="muted-copy">
            Real task and note state comes from the Nexus API when online. Seeded baseline remains labeled instead of being passed off as live truth.
          </p>
        </div>

        <div className="rail-card rail-card--accent">
          <div className="rail-card__header">
            <p className="eyebrow">System posture</p>
            <span className={`status-pill ${isResponding || isSyncingRuntime ? 'status-pill--live' : ''}`}>
              {isResponding ? 'LIVE TRAFFIC' : isSyncingRuntime ? 'SYNCING' : apiState === 'connected' ? 'SYNCED' : 'LOCAL FALLBACK'}
            </span>
          </div>
          <strong>{activeMode.label}</strong>
          <p className="muted-copy">{activeMode.intent}</p>
          <div className="rail-signal">
            <span className="rail-signal__label">Model lane</span>
            <span>{modelLaneLabel}</span>
          </div>
          <div className="rail-signal">
            <span className="rail-signal__label">Runtime truth</span>
            <span>{runtimeTasksLive.length > 0 || runtimeNotesLive.length > 0 ? 'Live records present' : 'Baseline / unknown only'}</span>
          </div>
        </div>

        <div className="rail-grid">
          <div className="rail-metric rail-metric--emphasis">
            <span>Project lanes</span>
            <strong>{projectSummaries.length.toString().padStart(2, '0')}</strong>
            <small>{truthfulProjectLabel}</small>
          </div>
          <div className="rail-metric rail-metric--emphasis">
            <span>Completion</span>
            <strong>{completionRate === null ? '—' : `${completionRate}%`}</strong>
            <small>{completionRate === null ? 'No task baseline yet' : `${completedTasks.length}/${runtimeTasks.length} done`}</small>
          </div>
          <div className="rail-metric">
            <span>History</span>
            <strong>{inputHistory.length.toString().padStart(2, '0')}</strong>
            <small>prompt recalls</small>
          </div>
          <div className="rail-metric">
            <span>Runtime</span>
            <strong>{environmentLabel}</strong>
            <small>{apiState === 'connected' ? 'API present' : 'simulated adapter'}</small>
          </div>
        </div>

        <div className="rail-card">
          <p className="eyebrow">Primary project lane</p>
          <strong>{topProject?.label ?? 'No lane data yet'}</strong>
          <p className="muted-copy">
            {topProject
              ? `${topProject.active} active · ${topProject.waiting} waiting · ${topProject.blocked} blocked · ${topProject.done} done`
              : 'Project grouping appears when tasks exist.'}
          </p>
        </div>

        <div className="rail-card">
          <p className="eyebrow">Operator board</p>
          <div className="stack-list">
            {projectAreas.map((area) => (
              <div key={area.id} className="stack-list__item">
                <span>{area.title}</span>
                <strong>{area.value}</strong>
                <small>{area.detail}</small>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="workspace">
        <section className="command-deck panel">
          <div>
            <p className="eyebrow">Command deck</p>
            <h2>Truthful execution monitor</h2>
            <p className="muted-copy">
              Projects, todos, execution stages, completed work, and operator notes all stay visible. Unknowns remain labeled as unknown.
            </p>
          </div>

          <div className="command-ribbon" aria-label="Active mode and model ribbon">
            <article className="command-ribbon__card command-ribbon__card--mode">
              <span className="command-ribbon__label">Active mode</span>
              <strong>{activeModeSurface}</strong>
              <small>{activeMode.intent}</small>
            </article>
            <article className="command-ribbon__card command-ribbon__card--model">
              <span className="command-ribbon__label">Active model</span>
              <strong>{modelLaneLabel}</strong>
              <small>{modelTruthLabel}</small>
            </article>
            <article className="command-ribbon__card">
              <span className="command-ribbon__label">Runtime truth</span>
              <strong>{runtimeRecentActivity.length > 0 || runtimeTasksLive.length > 0 || runtimeNotesLive.length > 0 ? 'Live signals present' : 'Baseline only'}</strong>
              <small>
                {runtimeRecentActivity.length > 0 || runtimeTasksLive.length > 0 || runtimeNotesLive.length > 0
                  ? `${runtimeRecentActivity.length} recent runtime events, ${runtimeTasksLive.length} runtime tasks, ${runtimeNotesLive.length} runtime notes`
                  : 'Current server data is seeded/demo baseline only; the UI labels it explicitly instead of implying live execution.'}
              </small>
            </article>
            <article className="command-ribbon__card">
              <span className="command-ribbon__label">Mode coverage</span>
              <strong>{modeCoverage.toString().padStart(2, '0')} profiles</strong>
              <small>{runtimeContext ? 'derived from runtime context' : 'falling back to local mode registry'}</small>
            </article>
          </div>

          <div className="deck-banner">
            <div className="deck-banner__callout">
              <span className="deck-banner__label">Command state</span>
              <strong>{isResponding ? 'Directive in motion' : 'Ready for directive'}</strong>
              <small>{activeMode.label} · {modelLaneLabel}</small>
            </div>
            <div className="deck-banner__meta">
              <span>{transportPreview.runtimeTarget.apiBasePath}</span>
              <span>{transportPreview.runtimeTarget.eventStreamPath}</span>
              <span>{runtimeContext?.session.persistenceDriver ?? 'local-memory'} persistence</span>
            </div>
          </div>

          <section className="overview-strip" aria-label="Command overview">
            <div className="overview-card overview-card--hot">
              <span>Thread state</span>
              <strong>{isResponding ? 'Sentinel composing' : 'Ready for directive'}</strong>
              <small>{messages.length} visible packets</small>
            </div>
            <div className="overview-card">
              <span>Active work</span>
              <strong>{attentionCounts?.active ?? activeExecutionTasks.length}</strong>
              <small>{attentionCounts?.blocked ?? blockedTasks.length} blocked · {attentionCounts?.waitingOnUser ?? waitingOnUserTasks.length} waiting</small>
            </div>
            <div className="overview-card">
              <span>Runtime notices</span>
              <strong>{systemMessages.toString().padStart(2, '0')} signals</strong>
              <small>{apiState === 'connected' ? 'server-derived context' : 'local continuity'}</small>
            </div>
            <div className="overview-card">
              <span>Latest event</span>
              <strong>{latestMessage?.author ?? 'Waiting'}</strong>
              <small>{lastEventLabel}</small>
            </div>
          </section>

          <section className="telemetry-grid" aria-label="Runtime telemetry cards">
            {runtimeCards.length > 0 ? (
              runtimeCards.map((card) => (
                <article key={card.id} className={`telemetry-card telemetry-card--${card.severity}`}>
                  <div className="telemetry-card__header">
                    <span>{card.label}</span>
                    <span className="telemetry-card__status">{card.severity}</span>
                  </div>
                  <strong>{card.value}</strong>
                  <p>{card.detail}</p>
                </article>
              ))
            ) : (
              <article className="telemetry-card telemetry-card--placeholder">
                <div className="telemetry-card__header">
                  <span>Telemetry link</span>
                  <span className="telemetry-card__status">standby</span>
                </div>
                <strong>Awaiting API snapshot</strong>
                <p>Command deck will hydrate from /api/status and /api/runtime/context when the server is reachable.</p>
              </article>
            )}
          </section>

          <section className="ops-grid ops-grid--command" aria-label="Operations overview">
            <article className="panel ops-panel ops-panel--wide">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Projects board</p>
                  <h2>Truthful lane visibility</h2>
                </div>
                <span className="status-pill status-pill--subtle">{projectSummaries.length} lanes</span>
              </div>
              <div className="project-board-grid">
                {projectSummaries.length > 0 ? (
                  projectSummaries.map((project) => (
                    <article key={project.id} className="project-card">
                      <div className="stack-list__row">
                        <strong>{project.label}</strong>
                        <span className="status-pill status-pill--subtle">{project.source}</span>
                      </div>
                      <div className="project-card__metrics">
                        <span>{project.total} total</span>
                        <span>{project.active} active</span>
                        <span>{project.waiting} waiting</span>
                        <span>{project.blocked} blocked</span>
                        <span>{project.done} done</span>
                      </div>
                      <p className="muted-copy">
                        {project.completion === null ? 'Baseline unknown' : `${project.completion}% complete`} · Next focus: {project.nextTask?.title ?? 'no open task'}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="task-board-card task-board-card--empty">
                    <strong>No project lanes yet</strong>
                    <small>Create a task and Nexus will group it into a project lane immediately.</small>
                  </div>
                )}
              </div>
            </article>

            <article className="panel ops-panel">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Task progress board</p>
                  <h2>Stage-based workflow</h2>
                </div>
                <span className="status-pill status-pill--subtle">truthful stages</span>
              </div>
              <div className="stage-board">
                {stageCards.map((stage) => (
                  <div key={stage.id} className="stage-chip">
                    <span>{formatStageLabel(stage.id)}</span>
                    <strong>{stage.value}</strong>
                    <small>{stage.detail}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel ops-panel">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Execution dashboard</p>
                  <h2>Pressure and throughput</h2>
                </div>
                <span className="status-pill status-pill--subtle">operator metrics</span>
              </div>
              <div className="task-matrix">
                <div className="task-cell task-cell--live">
                  <span>Active</span>
                  <strong>{attentionCounts?.active ?? activeExecutionTasks.length}</strong>
                </div>
                <div className="task-cell">
                  <span>Waiting</span>
                  <strong>{attentionCounts?.waitingOnUser ?? waitingOnUserTasks.length}</strong>
                </div>
                <div className="task-cell task-cell--warn">
                  <span>Blocked</span>
                  <strong>{attentionCounts?.blocked ?? blockedTasks.length}</strong>
                </div>
                <div className="task-cell">
                  <span>Completed</span>
                  <strong>{completedTasks.length}</strong>
                </div>
              </div>
              <div className="detail-stack muted-copy">
                <span>{completionRate === null ? 'Completion baseline appears after the first task exists.' : `Completion rate: ${completionRate}% across ${runtimeTasks.length} tracked tasks.`}</span>
                <span>{runtimeRecentActivity.length > 0 ? `${runtimeRecentActivity.length} live activity records exist.` : 'No live activity records yet; current view is baseline only.'}</span>
              </div>
            </article>

            <article className="panel ops-panel ops-panel--wide">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Execution surfaces</p>
                  <h2>Operator attention board</h2>
                </div>
                <span className="status-pill status-pill--subtle">{runtimeTasksLive.length} live · {seededTasks.length} baseline</span>
              </div>
              <div className="board-grid">
                {boardGroups.map((group) => (
                  <section key={group.id} className={`board-column board-column--${group.tone}`}>
                    <div className="board-column__header">
                      <div>
                        <strong>{group.title}</strong>
                        <small>{group.description}</small>
                      </div>
                      <span className="status-pill status-pill--subtle">{group.tasks.length}</span>
                    </div>
                    <div className="board-column__body">
                      {group.tasks.length > 0 ? (
                        group.tasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="task-board-card task-board-card--interactive">
                            <div className="stack-list__row">
                              <strong>{task.title}</strong>
                              <span className="status-pill status-pill--subtle">{formatStageLabel(task.stage)}</span>
                            </div>
                            <small>{describeTask(task)}</small>
                            {task.summary ? <p className="muted-copy">{task.summary}</p> : null}
                            <div className="task-action-row" role="group" aria-label={`Task controls for ${task.title}`}>
                              {taskStatusOrder.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className={`mini-button ${task.status === status ? 'mini-button--active' : ''}`}
                                  disabled={taskActionId === task.id}
                                  onClick={() => handleTaskStatusChange(task, status)}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                            <div className="task-action-row" role="group" aria-label={`Task flags for ${task.title}`}>
                              <button
                                type="button"
                                className={`mini-button ${task.needsUserInput ? 'mini-button--active' : ''}`}
                                disabled={taskActionId === task.id}
                                onClick={() => handleTaskFlagToggle(task, 'needsUserInput')}
                              >
                                Waiting on user
                              </button>
                              <button
                                type="button"
                                className={`mini-button ${task.readyToReport ? 'mini-button--active' : ''}`}
                                disabled={taskActionId === task.id}
                                onClick={() => handleTaskFlagToggle(task, 'readyToReport')}
                              >
                                Ready to report
                              </button>
                            </div>
                            <div className="task-board-card__footer">
                              <span className="status-pill status-pill--subtle">{task.source === 'runtime' ? 'live' : 'seeded baseline'}</span>
                              <span className="status-pill status-pill--subtle">{task.status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="task-board-card task-board-card--empty">
                          <strong>No items in this surface</strong>
                          <small>The runtime is not exposing anything here right now.</small>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel ops-panel">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Todo capture</p>
                  <h2>Add operator work</h2>
                </div>
                <span className="status-pill status-pill--subtle">API-backed</span>
              </div>
              <form className="form-stack" onSubmit={handleTaskCreate}>
                <label className="form-field">
                  <span>Task title</span>
                  <input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ship the operator dashboard" />
                </label>
                <div className="form-split">
                  <label className="form-field">
                    <span>Owner</span>
                    <input value={taskForm.owner} onChange={(event) => setTaskForm((current) => ({ ...current, owner: event.target.value }))} />
                  </label>
                  <label className="form-field">
                    <span>Due</span>
                    <input value={taskForm.due} onChange={(event) => setTaskForm((current) => ({ ...current, due: event.target.value }))} />
                  </label>
                </div>
                <div className="form-split">
                  <label className="form-field">
                    <span>Project lane</span>
                    <input value={taskForm.lane} onChange={(event) => setTaskForm((current) => ({ ...current, lane: event.target.value }))} />
                  </label>
                  <label className="form-field form-checkbox">
                    <input
                      type="checkbox"
                      checked={taskForm.needsUserInput}
                      onChange={(event) => setTaskForm((current) => ({ ...current, needsUserInput: event.target.checked }))}
                    />
                    <span>Starts as waiting on user</span>
                  </label>
                </div>
                <label className="form-field">
                  <span>Summary</span>
                  <textarea rows={3} value={taskForm.summary} onChange={(event) => setTaskForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Why this matters / what done means" />
                </label>
                <div className="panel-actions">
                  <button type="submit" className="primary-button" disabled={isSavingTask || apiState !== 'connected'}>
                    {isSavingTask ? 'Saving task…' : 'Create todo'}
                  </button>
                  <button type="button" className="ghost-button" disabled={isSyncingRuntime} onClick={handleRefresh}>
                    {isSyncingRuntime ? 'Refreshing…' : 'Refresh runtime'}
                  </button>
                </div>
              </form>
            </article>

            <article className="panel ops-panel">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Completed-state visibility</p>
                  <h2>Recently finished work</h2>
                </div>
                <span className="status-pill status-pill--subtle">{completedTasks.length} done</span>
              </div>
              <div className="event-list muted-copy">
                {completedTasks.length > 0 ? (
                  completedTasks.slice(0, 6).map((task) => (
                    <div key={task.id} className="event-item">
                      <div className="stack-list__row">
                        <strong>{task.title}</strong>
                        <span className="status-pill status-pill--subtle">{task.readyToReport ? 'ready to report' : 'done'}</span>
                      </div>
                      <span>{describeTask(task)}</span>
                      <small>{task.summary ?? 'No completion summary captured.'}</small>
                    </div>
                  ))
                ) : (
                  <div className="event-item">
                    <strong>No completed tasks yet</strong>
                    <span>Finished work will remain visible here instead of disappearing from the board.</span>
                  </div>
                )}
              </div>
            </article>

            <article className="panel ops-panel ops-panel--wide">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Progress feed</p>
                  <h2>What is happening now vs seeded baseline</h2>
                </div>
                <span className="status-pill status-pill--subtle">{liveNowFeed.length} live · {baselineFeed.length} baseline</span>
              </div>
              <div className="event-list muted-copy">
                {liveNowFeed.length > 0 ? (
                  liveNowFeed.map((item) => (
                    <div key={item.id} className="event-item">
                      <div className="stack-list__row">
                        <strong>{item.title}</strong>
                        <span className="status-pill status-pill--subtle">live</span>
                      </div>
                      <span>{item.detail}</span>
                      {'meta' in item && item.meta ? <small>{item.meta}</small> : null}
                    </div>
                  ))
                ) : (
                  <div className="event-item">
                    <strong>No live runtime events yet</strong>
                    <span>The API is online, but this instance has not recorded fresh activity/notes/tasks beyond the seeded baseline.</span>
                  </div>
                )}
                {baselineFeed.length > 0 ? (
                  baselineFeed.map((item) => (
                    <div key={item.id} className="event-item">
                      <div className="stack-list__row">
                        <strong>{item.title}</strong>
                        <span className="status-pill status-pill--subtle">seeded baseline</span>
                      </div>
                      <span>{item.detail}</span>
                      {'meta' in item && item.meta ? <small>{item.meta}</small> : null}
                    </div>
                  ))
                ) : null}
              </div>
            </article>
          </section>
        </section>

        <section className="workspace-grid">
          <section className="chat-surface panel">
            <header className="surface-header">
              <div>
                <p className="eyebrow">Primary channel</p>
                <h2>Operator ↔ Sentinel</h2>
                <p className="muted-copy">
                  Terminal-weight composition, mode-specific replies, and visible transport state for every exchange.
                </p>
              </div>
              <div className="header-badges">
                <span className="status-pill">MODE · {activeModeId.toUpperCase()}</span>
                <span className="status-pill">MODEL · {apiState === 'connected' ? 'SERVER STUB' : 'LOCAL SIM'}</span>
                <span className="status-pill status-pill--subtle">{runtimeContext?.session.hostLabel ?? 'host pending'}</span>
              </div>
            </header>

            <ModeSwitch modes={modes} activeModeId={activeModeId} onSelect={setActiveModeId} />
            <ConversationView messages={messages} />
            <Composer
              draft={draft}
              historyCursorLabel={historyCursorLabel}
              isResponding={isResponding}
              activeModeLabel={activeMode.label}
              onDraftChange={(value) => setDraft({ value, historyIndex: null })}
              onSubmit={() => submitMessage(draft.value)}
              onHistory={cycleHistory}
            />
          </section>

          <aside className="right-stack">
            <section className="panel tactical-panel">
              <div className="panel-block">
                <p className="eyebrow">Operator attention</p>
                <strong>Task routing surfaces</strong>
                <div className="task-matrix">
                  <div className="task-cell task-cell--live">
                    <span>Active</span>
                    <strong>{attentionCounts?.active ?? activeExecutionTasks.length}</strong>
                  </div>
                  <div className="task-cell">
                    <span>Waiting on user</span>
                    <strong>{attentionCounts?.waitingOnUser ?? waitingOnUserTasks.length}</strong>
                  </div>
                  <div className="task-cell task-cell--warn">
                    <span>Blocked</span>
                    <strong>{attentionCounts?.blocked ?? blockedTasks.length}</strong>
                  </div>
                  <div className="task-cell">
                    <span>Ready to report</span>
                    <strong>{attentionCounts?.readyToReport ?? readyToReportTasks.length}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel tactical-panel">
              <div className="panel-block">
                <p className="eyebrow">Field notes</p>
                <strong>Capture operator memory</strong>
                <form className="form-stack" onSubmit={handleNoteCreate}>
                  <label className="form-field">
                    <span>Title</span>
                    <input value={noteForm.title} onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))} placeholder="What changed?" />
                  </label>
                  <label className="form-field">
                    <span>Body</span>
                    <textarea rows={4} value={noteForm.body} onChange={(event) => setNoteForm((current) => ({ ...current, body: event.target.value }))} placeholder="Capture the decision, risk, or next move" />
                  </label>
                  <label className="form-field">
                    <span>Tag</span>
                    <input value={noteForm.tag} onChange={(event) => setNoteForm((current) => ({ ...current, tag: event.target.value }))} />
                  </label>
                  <button type="submit" className="primary-button" disabled={isSavingNote || apiState !== 'connected'}>
                    {isSavingNote ? 'Saving note…' : 'Save note'}
                  </button>
                </form>
                <div className="detail-stack muted-copy">
                  {runtimeNotes.length > 0 ? (
                    runtimeNotes.slice(0, 4).map((note) => (
                      <span key={note.id}>
                        [{note.tag}] {note.title} — {note.body} ({note.source === 'runtime' ? 'live' : 'seeded baseline'})
                      </span>
                    ))
                  ) : (
                    <span>No runtime notes are visible yet.</span>
                  )}
                </div>
              </div>
            </section>

            {surfaceError ? (
              <section className="panel tactical-panel tactical-panel--error">
                <div className="panel-block">
                  <p className="eyebrow">Surface error</p>
                  <strong>{surfaceError}</strong>
                  <p className="muted-copy">Writes require the Nexus API. When offline, the dashboard remains readable but not authoritative for new changes.</p>
                </div>
              </section>
            ) : null}

            <PersonaPanel
              activeMode={activeMode}
              transportPreview={transportPreview}
              runtimeContext={runtimeContext}
              runtimeStatus={runtimeStatus}
              suggestedPrompts={suggestedPrompts}
              historyCount={inputHistory.length}
              recentActivity={recentActivity}
              onPromptSelect={(prompt) => setDraft({ value: prompt, historyIndex: null })}
            />
          </aside>
        </section>
      </main>
    </div>
  )
}

export default App
