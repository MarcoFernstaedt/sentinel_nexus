import './App.css'
import { Composer } from './features/chat/components/Composer'
import { ConversationView } from './features/chat/components/ConversationView'
import { ModeSwitch } from './features/chat/components/ModeSwitch'
import { PersonaPanel } from './features/chat/components/PersonaPanel'
import { useLocalChat } from './features/chat/hooks/useLocalChat'
import type { RuntimeTask, RuntimeWorkstream, TaskStage } from './features/chat/model/types'

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

function summarizeWorkstream(workstream: RuntimeWorkstream) {
  const parts = [
    `${workstream.activeCount} active`,
    `${workstream.waitingCount} waiting`,
    `${workstream.blockedCount} blocked`,
    `${workstream.completedCount} done`,
  ]

  if (workstream.readyToReportCount > 0) {
    parts.push(`${workstream.readyToReportCount} ready to report`)
  }

  return parts.join(' · ')
}

function determineWorkstreamTone(workstream: RuntimeWorkstream) {
  if (workstream.blockedCount > 0) return 'blocked'
  if (workstream.waitingCount > 0) return 'waiting'
  if (workstream.activeCount > 0) return 'active'
  if (workstream.readyToReportCount > 0) return 'ready'
  if (workstream.completedCount > 0) return 'completed'
  return 'queued'
}

function App() {
  const {
    activeMode,
    activeModeId,
    apiState,
    draft,
    historyCursorLabel,
    inputHistory,
    isResponding,
    messages,
    modes,
    rawMessages,
    recentActivity,
    runtimeContext,
    runtimeNotes,
    runtimeStatus,
    runtimeTasks,
    suggestedPrompts,
    transportPreview,
    setActiveModeId,
    setDraft,
    submitMessage,
    cycleHistory,
  } = useLocalChat()

  const latestMessage = rawMessages[rawMessages.length - 1]
  const systemMessages = rawMessages.filter((message) => message.role === 'system').length
  const taskBreakdown = runtimeContext?.surfaces.taskBreakdown
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
  const runtimeTruthIsLive = runtimeRecentActivity.length > 0 || runtimeTasksLive.length > 0 || runtimeNotesLive.length > 0
  const trackerTimeline = [
    ...runtimeTasks
      .filter((task) => task.lastUpdatedAt || task.completedAt)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        detail: `${describeTask(task)} · ${task.status}`,
        timestamp: task.lastUpdatedAt ?? task.completedAt ?? undefined,
        source: task.source,
      })),
    ...recentActivity.map((item) => ({
      id: `activity-${item.id}`,
      title: item.title,
      detail: item.detail,
      timestamp: item.timestamp,
      source: item.source,
    })),
    ...runtimeNotes.map((note) => ({
      id: `note-${note.id}`,
      title: note.title,
      detail: `[${note.tag}] ${note.body}`,
      timestamp: note.updatedAt,
      source: note.source,
    })),
  ]
    .sort((left, right) => (right.timestamp ?? '').localeCompare(left.timestamp ?? ''))
    .slice(0, 8)
  const tasksWithoutUpdateStamp = runtimeTasks.filter((task) => !task.lastUpdatedAt && !task.completedAt).length
  const taskAgeReference = Date.parse(runtimeContext?.capturedAt ?? runtimeStatus?.capturedAt ?? latestMessage?.timestamp ?? '')
  const taskAgeHours = runtimeTasks
    .map((task) => task.lastUpdatedAt ?? task.completedAt)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .map((timestamp) => (taskAgeReference - Date.parse(timestamp)) / 36e5)
    .filter((age) => Number.isFinite(age) && age >= 0)
  const oldestTaskAgeHours = taskAgeHours.length > 0 ? Math.max(...taskAgeHours) : null
  const oldestTaskAgeLabel =
    oldestTaskAgeHours === null ? 'No task timestamps exposed yet' : `${Math.round(oldestTaskAgeHours)}h since oldest tracked update`
  const bottleneckSummary = blockedTasks[0]
    ? `Primary visible bottleneck is “${blockedTasks[0].title}”. ${blockedTasks[0].blockedReason ?? blockedTasks[0].summary ?? 'A block is present, but the runtime did not expose a richer reason.'}`
    : waitingOnUserTasks[0]
      ? `Primary visible bottleneck is operator input on “${waitingOnUserTasks[0].title}”. ${waitingOnUserTasks[0].waitingFor ?? waitingOnUserTasks[0].summary ?? 'Runtime marks it as waiting on user.'}`
      : activeExecutionTasks[0]
        ? `Execution is moving. The leading work item is “${activeExecutionTasks[0].title}” in ${activeExecutionTasks[0].stage} stage.`
        : 'No concrete runtime bottleneck is exposed right now.'
  const auditSummary = runtimeCards.find((card) => card.id === 'recent-activity')?.detail
    ?? 'Audit trail surface is limited to messages, tasks, notes, and activity records currently exposed by the Nexus API.'
  const securitySummary =
    apiState === 'connected'
      ? 'Security posture is only partially visible. The UI can truthfully show transport, host label, persistence driver, and storage path, but it does not yet have auth, permission, or audit-policy telemetry.'
      : 'Security posture cannot be assessed from the fallback shell. Backend-only security telemetry is not connected.'
  const tokenCapableMessageCount = rawMessages.filter((message) => message.role !== 'system').length
  const nonSystemCharacterCount = rawMessages
    .filter((message) => message.role !== 'system')
    .reduce((total, message) => total + message.body.length, 0)
  const averageMessageCharacters = tokenCapableMessageCount > 0 ? Math.round(nonSystemCharacterCount / tokenCapableMessageCount) : 0
  const costSummary =
    apiState === 'connected'
      ? 'The backend does not expose real token counts, model IDs, or billing data yet. This panel only shows local message volume proxies.'
      : 'Fallback mode has no model/billing telemetry. Only local message volume proxies are available.'

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
      title: 'Ready to report',
      value: `${readyToReportTasks.length} items`,
      detail:
        readyToReportTasks[0]?.title ?? 'Nothing completed is waiting for operator reporting.',
    },
  ]

  const liveNowFeed = [
    ...runtimeRecentActivity.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      meta: `${item.type} · ${formatRelativeLabel(item.timestamp)}`,
    })),
    ...runtimeNotesLive.map((note) => ({
      id: note.id,
      title: note.title,
      detail: note.body,
      meta: `[${note.tag}] ${formatRelativeLabel(note.updatedAt)}`,
    })),
  ].slice(0, 6)
  const baselineFeed = [
    ...seededRecentActivity.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      meta: `seeded baseline · ${formatLastEventLabel(item.timestamp)}`,
    })),
    ...seededNotes.map((note) => ({
      id: note.id,
      title: note.title,
      detail: note.body,
      meta: `[${note.tag}] seeded baseline`,
    })),
  ].slice(0, 4)
  const workstreams = runtimeContext?.surfaces.workstreams ?? []
  const liveWorkstreams = workstreams.filter((workstream) => workstream.latestUpdateAt)
  const topWorkstreams = workstreams.slice(0, 4)
  const visibilitySurfaces = [
    {
      id: 'sentinel',
      label: 'Sentinel',
      state: isResponding ? 'engaged' : apiState === 'connected' ? 'synced' : 'local-only',
      detail: `${activeMode.label} · ${modelLaneLabel}`,
    },
    {
      id: 'mode-registry',
      label: 'Mode registry',
      state: runtimeContext ? 'runtime-derived' : 'local-registry',
      detail: runtimeContext
        ? `${runtimeContext.chat.modes.length} runtime modes exposed`
        : `${modes.length} local modes exposed until bootstrap arrives`,
    },
    {
      id: 'task-visibility',
      label: 'Task visibility',
      state: runtimeTasksLive.length > 0 ? 'live' : seededTasks.length > 0 ? 'baseline-only' : 'quiet',
      detail: `${runtimeTasks.length} tracked tasks · ${waitingOnUserTasks.length} waiting on user · ${blockedTasks.length} blocked`,
    },
    {
      id: 'agent-roster',
      label: 'Sub-agent roster',
      state: 'not-exposed',
      detail: 'No runtime event/session feed exists yet, so Nexus does not invent sub-agent presence.',
    },
  ]

  const runtimeSummary = runtimeContext
    ? `${runtimeContext.session.hostLabel} · ${runtimeContext.chat.messageCount} persisted messages · ${runtimeTasksLive.length} live tasks / ${seededTasks.length} baseline · ${runtimeRecentActivity.length} live updates`
    : 'Server context is not available yet. Local shell remains ready.'

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
      title: 'Completed, not yet reported',
      tone: 'subtle',
      description: 'Done work flagged as ready to report back through the operator loop.',
      tasks: readyToReportTasks,
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

  const globalStatusSummary = [
    `Mode ${activeMode.label}`,
    `Model lane ${modelLaneLabel}`,
    runtimeTruthIsLive ? 'Live runtime signals present' : 'Only seeded baseline signals visible',
    `${activeExecutionTasks.length} active tasks`,
    `${waitingOnUserTasks.length} waiting on user`,
    `${blockedTasks.length} blocked`,
    `${readyToReportTasks.length} ready to report`,
    `Latest event ${latestMessage?.author ?? 'waiting'} at ${lastEventLabel}`,
  ].join('. ')

  const commandStatusItems = [
    { id: 'mode', label: 'Mode', value: activeMode.label, detail: activeMode.accent },
    { id: 'lane', label: 'Model lane', value: modelLaneLabel, detail: apiState === 'connected' ? 'backend seam visible' : 'local simulator' },
    { id: 'truth', label: 'Truth state', value: runtimeTruthIsLive ? 'Live + baseline' : 'Baseline only', detail: runtimeTruthIsLive ? 'real runtime signals exposed' : 'seeded demo data clearly labeled' },
    { id: 'last', label: 'Last event', value: lastEventLabel, detail: latestMessage?.author ?? 'Awaiting first packet' },
  ]

  return (
    <div className="app-shell">
      <a className="skip-link" href="#primary-workspace">Skip to main workspace</a>
      <a className="skip-link" href="#primary-conversation">Skip to conversation</a>
      <a className="skip-link" href="#composer-heading">Skip to message composer</a>

      <div className="shell-backdrop" aria-hidden="true">
        <div className="shell-backdrop__grid" />
        <div className="shell-backdrop__glow shell-backdrop__glow--one" />
        <div className="shell-backdrop__glow shell-backdrop__glow--two" />
      </div>

      <aside className="left-rail" aria-labelledby="site-title">
        <div className="brand-block">
          <p className="eyebrow">Sentinel Nexus // Command Center</p>
          <h1 id="site-title">Operator shell for decisive work, runtime visibility, and controlled execution.</h1>
          <p className="muted-copy">
            A local-first operator console with live backend truth when available and explicit seams when it is not.
          </p>
        </div>

        <section className="rail-card rail-card--accent" aria-labelledby="system-posture-heading">
          <div className="rail-card__header">
            <p className="eyebrow" id="system-posture-heading">System posture</p>
            <span className={`status-pill ${isResponding ? 'status-pill--live' : ''}`} aria-label={`System state ${isResponding ? 'live traffic' : apiState === 'connected' ? 'synced' : 'local fallback'}`}>
              {isResponding ? 'LIVE TRAFFIC' : apiState === 'connected' ? 'SYNCED' : 'LOCAL FALLBACK'}
            </span>
          </div>
          <strong>{activeMode.label}</strong>
          <p className="muted-copy">{activeMode.intent}</p>
          <div className="rail-signal">
            <span className="rail-signal__label">Model lane</span>
            <span>{modelLaneLabel}</span>
          </div>
          <div className="rail-signal">
            <span className="rail-signal__label">Transport</span>
            <span>{transportPreview.provider}</span>
          </div>
        </section>

        <section className="rail-grid" aria-label="Top metrics">
          <div className="rail-metric rail-metric--emphasis">
            <span>Active mode</span>
            <strong>{activeModeId.toUpperCase()}</strong>
            <small>{activeMode.accent}</small>
          </div>
          <div className="rail-metric rail-metric--emphasis">
            <span>Active model</span>
            <strong>{apiState === 'connected' ? 'SERVER STUB' : 'LOCAL SIM'}</strong>
            <small>{apiState === 'connected' ? 'backend truth boundary' : 'offline/local seam'}</small>
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
        </section>

        <section className="rail-card" aria-labelledby="runtime-sync-heading">
          <p className="eyebrow" id="runtime-sync-heading">Runtime sync</p>
          <strong>{apiState === 'connected' ? 'Backend connected' : 'Local continuity mode'}</strong>
          <p className="muted-copy">{runtimeSummary}</p>
        </section>

        <section className="rail-card" aria-labelledby="operator-board-heading">
          <p className="eyebrow" id="operator-board-heading">Operator board</p>
          <div className="stack-list" role="list">
            {projectAreas.map((area) => (
              <div key={area.id} className="stack-list__item" role="listitem">
                <span>{area.title}</span>
                <strong>{area.value}</strong>
                <small>{area.detail}</small>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="workspace" id="primary-workspace" aria-describedby="global-status-summary">
        <p id="global-status-summary" className="sr-only" aria-live="polite">
          {globalStatusSummary}
        </p>

        <section className="workspace-topbar panel" aria-label="Global command status">
          <div>
            <p className="eyebrow">Operator overview</p>
            <h2 className="workspace-topbar__title">Command state at a glance</h2>
          </div>
          <div className="workspace-topbar__grid" role="list" aria-label="Global status summaries">
            {commandStatusItems.map((item) => (
              <article key={item.id} className="workspace-topbar__card" role="listitem" aria-label={`${item.label}: ${item.value}. ${item.detail}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="truth-note" aria-labelledby="truth-note-heading">
          <div className="stack-list__row">
            <div>
              <p className="eyebrow">Truth boundary</p>
              <strong id="truth-note-heading">No fake live state</strong>
            </div>
            <span className="status-pill status-pill--subtle">{runtimeTruthIsLive ? 'live runtime present' : 'seeded baseline only'}</span>
          </div>
          <small>
            {runtimeTruthIsLive
              ? 'Runtime activity, notes, and tasks are showing alongside seeded baseline surfaces. Each record keeps its source label.'
              : 'This shell is still visually complete while the backend remains quiet, but the surfaces explicitly mark seeded demo baseline instead of implying real execution.'}
          </small>
        </section>

        <section className="command-deck panel" aria-labelledby="runtime-monitor-heading">
          <div>
            <p className="eyebrow">Command deck</p>
            <h2 id="runtime-monitor-heading">Sentinel runtime monitor</h2>
            <p className="muted-copy">
              Storage, message, task, and activity surfaces route in from the Nexus API when online. Offline, the shell stays usable and labels the seam clearly.
            </p>
          </div>

          <section className="command-ribbon" aria-label="Active mode, model, truth, and coverage">
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
              <strong>{runtimeTruthIsLive ? 'Live signals present' : 'Baseline only'}</strong>
              <small>
                {runtimeTruthIsLive
                  ? `${runtimeRecentActivity.length} recent runtime events, ${runtimeTasksLive.length} runtime tasks, ${runtimeNotesLive.length} runtime notes`
                  : 'Current server data is seeded baseline only; the UI labels it explicitly instead of implying live execution.'}
              </small>
            </article>
            <article className="command-ribbon__card">
              <span className="command-ribbon__label">Mode coverage</span>
              <strong>{modeCoverage.toString().padStart(2, '0')} profiles</strong>
              <small>{runtimeContext ? 'derived from runtime context' : 'falling back to local mode registry'}</small>
            </article>
          </section>

          <section className="deck-banner" aria-label="Command state banner">
            <div className="deck-banner__callout">
              <span className="deck-banner__label">Command state</span>
              <strong>{isResponding ? 'Directive in motion' : 'Ready for directive'}</strong>
              <small>{activeMode.label} · {modelLaneLabel}</small>
            </div>
            <div className="deck-banner__meta" aria-label="Runtime target metadata">
              <span>{transportPreview.runtimeTarget.apiBasePath}</span>
              <span>{transportPreview.runtimeTarget.eventStreamPath}</span>
              <span>{runtimeContext?.session.persistenceDriver ?? 'local-memory'} persistence</span>
            </div>
          </section>

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

          <section className="telemetry-grid" aria-labelledby="telemetry-heading">
            <h3 id="telemetry-heading" className="sr-only">Runtime telemetry cards</h3>
            {runtimeCards.length > 0 ? (
              runtimeCards.map((card) => (
                <article key={card.id} className={`telemetry-card telemetry-card--${card.severity}`} aria-label={`${card.label}: ${card.value}. ${card.detail}`}>
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
            <article className="panel ops-panel" aria-labelledby="stage-workflow-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Task progress board</p>
                  <h2 id="stage-workflow-heading">Stage-based workflow</h2>
                </div>
                <span className="status-pill status-pill--subtle">truthful stages</span>
              </div>
              <div className="stage-board" role="list" aria-label="Task stages">
                {stageCards.map((stage) => (
                  <div key={stage.id} className="stage-chip" role="listitem" aria-label={`${formatStageLabel(stage.id)}: ${stage.value}. ${stage.detail}`}>
                    <span>{formatStageLabel(stage.id)}</span>
                    <strong>{stage.value}</strong>
                    <small>{stage.detail}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel ops-panel" aria-labelledby="visibility-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Visibility map</p>
                  <h2 id="visibility-heading">What Nexus can actually see</h2>
                </div>
                <span className="status-pill status-pill--subtle">truthful only</span>
              </div>
              <div className="stack-list" role="list">
                {visibilitySurfaces.map((surface) => (
                  <div key={surface.id} className="stack-list__item stack-list__item--compact" role="listitem" aria-label={`${surface.label}: ${surface.state}. ${surface.detail}`}>
                    <div className="stack-list__row">
                      <strong>{surface.label}</strong>
                      <span className="status-pill status-pill--subtle">{surface.state}</span>
                    </div>
                    <small>{surface.detail}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel ops-panel" aria-labelledby="workstreams-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Project trackers</p>
                  <h2 id="workstreams-heading">Task-derived workstreams</h2>
                </div>
                <span className="status-pill status-pill--subtle">{workstreams.length > 0 ? 'runtime-derived' : 'awaiting runtime mix'}</span>
              </div>
              <div className="stack-list" role="list">
                {workstreams.length > 0 ? (
                  workstreams.slice(0, 4).map((stream) => (
                    <div key={stream.id} className="stack-list__item stack-list__item--compact" role="listitem" aria-label={`${stream.owner} ${stream.lane}. ${stream.taskCount} tasks. ${stream.activeCount} active, ${stream.waitingCount} waiting, ${stream.blockedCount} blocked, ${stream.readyToReportCount} ready to report.`}>
                      <div className="stack-list__row">
                        <strong>{stream.owner} · {stream.lane}</strong>
                        <span className="status-pill status-pill--subtle">{stream.taskCount} tasks</span>
                      </div>
                      <small>
                        {stream.activeCount} active · {stream.waitingCount} waiting · {stream.blockedCount} blocked · {stream.readyToReportCount} ready to report
                      </small>
                      <small>
                        Latest: {stream.latestTaskTitle ?? 'No recent task'}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="stack-list__item stack-list__item--compact" role="listitem">
                    <strong>No runtime workstreams exposed yet</strong>
                    <small>Workstream trackers appear only when the backend has enough task truth to derive them safely.</small>
                  </div>
                )}
              </div>
            </article>

            <article className="panel ops-panel ops-panel--wide" aria-labelledby="attention-board-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Execution surfaces</p>
                  <h2 id="attention-board-heading">Operator attention board</h2>
                </div>
                <span className="status-pill status-pill--subtle">{runtimeTasksLive.length} live · {seededTasks.length} baseline</span>
              </div>
              <div className="board-grid">
                {boardGroups.map((group) => (
                  <section key={group.id} className={`board-column board-column--${group.tone}`} aria-labelledby={`board-group-${group.id}`}>
                    <div className="board-column__header">
                      <div>
                        <strong id={`board-group-${group.id}`}>{group.title}</strong>
                        <small>{group.description}</small>
                      </div>
                      <span className="status-pill status-pill--subtle">{group.tasks.length}</span>
                    </div>
                    <div className="board-column__body" role="list" aria-label={`${group.title} tasks`}>
                      {group.tasks.length > 0 ? (
                        group.tasks.slice(0, 4).map((task) => (
                          <article key={task.id} className="task-board-card" role="listitem" aria-label={`${task.title}. ${describeTask(task)}. Source ${task.source === 'runtime' ? 'live' : 'seeded baseline'}. Status ${task.status}. ${task.summary ?? ''}`}>
                            <div className="stack-list__row">
                              <strong>{task.title}</strong>
                              <span className="status-pill status-pill--subtle">{formatStageLabel(task.stage)}</span>
                            </div>
                            <small>{describeTask(task)}</small>
                            {task.summary ? <p className="muted-copy">{task.summary}</p> : null}
                            <div className="task-board-card__footer">
                              <span className="status-pill status-pill--subtle">{task.source === 'runtime' ? 'live' : 'seeded baseline'}</span>
                              <span className="status-pill status-pill--subtle">{task.status}</span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="task-board-card task-board-card--empty" role="listitem">
                          <strong>No items in this surface</strong>
                          <small>The runtime is not exposing anything here right now.</small>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </article>

            <article className="panel ops-panel ops-panel--wide" aria-labelledby="tracker-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Tracker surface</p>
                  <h2 id="tracker-heading">Operator tracker timeline</h2>
                </div>
                <span className="status-pill status-pill--subtle">latest 8 records</span>
              </div>
              <div className="tracker-list" role="list" aria-label="Tracker timeline">
                {trackerTimeline.length > 0 ? (
                  trackerTimeline.map((item) => (
                    <article key={item.id} className="tracker-item" role="listitem">
                      <div className="tracker-item__rail" aria-hidden="true" />
                      <div className="tracker-item__body">
                        <div className="stack-list__row">
                          <strong>{item.title}</strong>
                          <span className="status-pill status-pill--subtle">{item.source === 'runtime' ? 'live' : 'seeded baseline'}</span>
                        </div>
                        <span>{item.detail}</span>
                        <small>{item.timestamp ? formatLastEventLabel(item.timestamp) : 'No timestamp exposed'}</small>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="tracker-item tracker-item--empty" role="listitem">
                    <div className="tracker-item__body">
                      <strong>No tracker records yet</strong>
                      <small>When the runtime logs tasks, notes, or activity, they will appear here in timestamp order.</small>
                    </div>
                  </article>
                )}
              </div>
            </article>

            <article className="panel ops-panel" aria-labelledby="workstreams-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Workstream fabric</p>
                  <h2 id="workstreams-heading">Agents and work cells</h2>
                </div>
                <span className="status-pill status-pill--subtle">{liveWorkstreams.length > 0 ? `${liveWorkstreams.length} timed cells` : `${workstreams.length} task-derived cells`}</span>
              </div>
              <div className="workstream-grid" role="list" aria-label="Task-derived workstreams">
                {topWorkstreams.length > 0 ? (
                  topWorkstreams.map((workstream) => (
                    <article key={workstream.id} className={`workstream-card workstream-card--${determineWorkstreamTone(workstream)}`} role="listitem">
                      <div className="stack-list__row">
                        <strong>{workstream.owner} · {workstream.lane}</strong>
                        <span className="status-pill status-pill--subtle">{workstream.truthLabel}</span>
                      </div>
                      <small>{summarizeWorkstream(workstream)}</small>
                      <div className="workstream-card__metrics">
                        <span>{workstream.taskCount} tasks</span>
                        <span>{workstream.latestTaskTitle ?? 'No latest task title'}</span>
                      </div>
                      <small>
                        {workstream.latestUpdateAt
                          ? `Latest update ${formatRelativeLabel(workstream.latestUpdateAt)}`
                          : 'No update timestamp exposed for this work cell yet.'}
                      </small>
                    </article>
                  ))
                ) : (
                  <article className="workstream-card workstream-card--empty" role="listitem">
                    <strong>No task-derived workstreams yet</strong>
                    <small>The backend can already derive these from task owner and lane once more runtime tasks exist.</small>
                  </article>
                )}
              </div>
            </article>

            <article className="panel ops-panel" aria-labelledby="control-surfaces-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Operator control surfaces</p>
                  <h2 id="control-surfaces-heading">Bottleneck, audit, security, and cost</h2>
                </div>
                <span className="status-pill status-pill--subtle">truthful summaries</span>
              </div>
              <div className="control-surface-grid">
                <article className="control-card control-card--warn">
                  <span className="command-ribbon__label">Bottleneck</span>
                  <strong>{blockedTasks.length > 0 ? `${blockedTasks.length} blocked` : waitingOnUserTasks.length > 0 ? `${waitingOnUserTasks.length} waiting on user` : 'No visible choke point'}</strong>
                  <p>{bottleneckSummary}</p>
                </article>
                <article className="control-card">
                  <span className="command-ribbon__label">Audit trail</span>
                  <strong>{recentActivity.length} events · {runtimeNotes.length} notes</strong>
                  <p>{auditSummary}</p>
                </article>
                <article className="control-card">
                  <span className="command-ribbon__label">Security posture</span>
                  <strong>{apiState === 'connected' ? 'Partial runtime visibility' : 'No backend security view'}</strong>
                  <p>{securitySummary}</p>
                </article>
                <article className="control-card">
                  <span className="command-ribbon__label">Cost / token awareness</span>
                  <strong>{tokenCapableMessageCount} non-system messages · ~{averageMessageCharacters} avg chars</strong>
                  <p>{costSummary}</p>
                </article>
              </div>
            </article>

            <article className="panel ops-panel" aria-labelledby="status-inventory-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Status inventory</p>
                  <h2 id="status-inventory-heading">High-level task counts</h2>
                </div>
                <span className="status-pill status-pill--subtle">task states</span>
              </div>
              <div className="task-matrix" role="list" aria-label="Task status counts">
                <div className="task-cell" role="listitem">
                  <span>Queued</span>
                  <strong>{taskBreakdown?.Queued ?? 0}</strong>
                </div>
                <div className="task-cell task-cell--live" role="listitem">
                  <span>In Progress</span>
                  <strong>{taskBreakdown?.['In Progress'] ?? 0}</strong>
                </div>
                <div className="task-cell task-cell--warn" role="listitem">
                  <span>Blocked</span>
                  <strong>{taskBreakdown?.Blocked ?? 0}</strong>
                </div>
                <div className="task-cell" role="listitem">
                  <span>Done</span>
                  <strong>{taskBreakdown?.Done ?? 0}</strong>
                </div>
              </div>
            </article>

            <article className="panel ops-panel ops-panel--wide" aria-labelledby="progress-feed-heading">
              <div className="surface-header">
                <div>
                  <p className="eyebrow">Progress feed</p>
                  <h2 id="progress-feed-heading">What is happening now vs seeded baseline</h2>
                </div>
                <span className="status-pill status-pill--subtle">{liveNowFeed.length} live · {baselineFeed.length} baseline</span>
              </div>
              <div className="event-list muted-copy" role="list" aria-live="polite" aria-label="Progress updates">
                {liveNowFeed.length > 0 ? (
                  liveNowFeed.map((item) => (
                    <article key={item.id} className="event-item" role="listitem">
                      <div className="stack-list__row">
                        <strong>{item.title}</strong>
                        <span className="status-pill status-pill--subtle">live</span>
                      </div>
                      <span>{item.detail}</span>
                      {item.meta ? <small>{item.meta}</small> : null}
                    </article>
                  ))
                ) : (
                  <article className="event-item" role="listitem">
                    <strong>No live runtime events yet</strong>
                    <span>The API is online, but this instance has not recorded fresh activity, notes, or tasks beyond the seeded baseline.</span>
                  </article>
                )}
                {baselineFeed.length > 0
                  ? baselineFeed.map((item) => (
                      <article key={item.id} className="event-item" role="listitem">
                        <div className="stack-list__row">
                          <strong>{item.title}</strong>
                          <span className="status-pill status-pill--subtle">seeded baseline</span>
                        </div>
                        <span>{item.detail}</span>
                        {item.meta ? <small>{item.meta}</small> : null}
                      </article>
                    ))
                  : null}
              </div>
            </article>
          </section>
        </section>

        <section className="workspace-grid" aria-label="Primary operator workspace">
          <section className="chat-surface panel" id="primary-conversation" aria-labelledby="conversation-heading">
            <header className="surface-header">
              <div>
                <p className="eyebrow">Primary channel</p>
                <h2 id="conversation-heading">Operator and Sentinel conversation</h2>
                <p className="muted-copy">
                  Terminal-weight composition, mode-specific replies, and clear transport state for every exchange.
                </p>
              </div>
              <div className="header-badges" aria-label="Conversation state badges">
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

          <aside className="right-stack" aria-label="Supporting operator panels">
            <section className="panel tactical-panel" aria-labelledby="operator-attention-heading">
              <div className="panel-block">
                <p className="eyebrow">Operator attention</p>
                <strong id="operator-attention-heading">Task routing surfaces</strong>
                <div className="task-matrix" role="list" aria-label="Task routing counts">
                  <div className="task-cell task-cell--live" role="listitem">
                    <span>Active</span>
                    <strong>{attentionCounts?.active ?? activeExecutionTasks.length}</strong>
                  </div>
                  <div className="task-cell" role="listitem">
                    <span>Waiting on user</span>
                    <strong>{attentionCounts?.waitingOnUser ?? waitingOnUserTasks.length}</strong>
                  </div>
                  <div className="task-cell task-cell--warn" role="listitem">
                    <span>Blocked</span>
                    <strong>{attentionCounts?.blocked ?? blockedTasks.length}</strong>
                  </div>
                  <div className="task-cell" role="listitem">
                    <span>Ready to report</span>
                    <strong>{attentionCounts?.readyToReport ?? readyToReportTasks.length}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel tactical-panel" aria-labelledby="field-notes-heading">
              <div className="panel-block">
                <p className="eyebrow">Field notes</p>
                <strong id="field-notes-heading">Project memory and operator doctrine</strong>
                <div className="detail-stack muted-copy" role="list" aria-live="polite" aria-label="Field notes">
                  {runtimeNotes.length > 0 ? (
                    runtimeNotes.slice(0, 3).map((note) => (
                      <span key={note.id} role="listitem">
                        [{note.tag}] {note.title} — {note.body} ({note.source === 'runtime' ? 'live' : 'seeded baseline'})
                      </span>
                    ))
                  ) : (
                    <span role="listitem">No runtime notes are visible yet.</span>
                  )}
                </div>
              </div>
            </section>

            <section className="panel tactical-panel" aria-labelledby="truth-hooks-heading">
              <div className="panel-block">
                <p className="eyebrow">Runtime honesty hooks</p>
                <strong id="truth-hooks-heading">What the shell can and cannot currently prove</strong>
                <div className="detail-stack muted-copy" role="list" aria-label="Truth hooks">
                  <span role="listitem">Workstreams are task-derived from owner + lane metadata, not inferred subagent state.</span>
                  <span role="listitem">{oldestTaskAgeLabel}.</span>
                  <span role="listitem">{tasksWithoutUpdateStamp} tasks have no exposed update timestamp.</span>
                  <span role="listitem">No real token, billing, auth, or permission telemetry is available yet.</span>
                </div>
              </div>
            </section>

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
