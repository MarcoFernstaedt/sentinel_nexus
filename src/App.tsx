import './App.css'
import { MetricCard } from './components/ui/MetricCard'
import { SectionHeading } from './components/ui/SectionHeading'
import { StatusBadge } from './components/ui/StatusBadge'
import { Surface } from './components/ui/Surface'
import { Composer } from './features/chat/components/Composer'
import { ConversationView } from './features/chat/components/ConversationView'
import { ModeSwitch } from './features/chat/components/ModeSwitch'
import { PersonaPanel } from './features/chat/components/PersonaPanel'
import { useLocalChat } from './features/chat/hooks/useLocalChat'
import { describeTask, determineWorkstreamTone, formatLastEventLabel, formatRelativeLabel, formatStageLabel, summarizeWorkstream } from './features/command-center/lib/formatters'
import type { GoalRecord, TaskStage } from './features/chat/model/types'

function goalTone(goal: GoalRecord) {
  if (goal.status === 'blocked') return 'warning' as const
  if (goal.status === 'at-risk') return 'subtle' as const
  return 'live' as const
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
    missionCommand,
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
  const runtimeCards = runtimeStatus?.cards ?? []
  const taskBreakdown = runtimeContext?.surfaces.taskBreakdown
  const taskStageBreakdown = runtimeContext?.surfaces.taskStageBreakdown
  const attentionCounts = runtimeContext?.surfaces.attentionCounts
  const workstreams = runtimeContext?.surfaces.workstreams ?? []
  const systemMessages = rawMessages.filter((message) => message.role === 'system').length
  const runtimeNotesLive = runtimeNotes.filter((note) => note.source === 'runtime')
  const runtimeTasksLive = runtimeTasks.filter((task) => task.source === 'runtime')
  const runtimeRecentActivity = recentActivity.filter((item) => item.source === 'runtime')
  const runtimeTruthIsLive = runtimeNotesLive.length > 0 || runtimeTasksLive.length > 0 || runtimeRecentActivity.length > 0

  const activeExecutionTasks = runtimeTasks.filter((task) => task.status !== 'Blocked' && task.status !== 'Done' && !task.needsUserInput)
  const waitingOnUserTasks = runtimeTasks.filter((task) => task.needsUserInput && task.status !== 'Done')
  const blockedTasks = runtimeTasks.filter((task) => task.status === 'Blocked')
  const readyToReportTasks = runtimeTasks.filter((task) => task.readyToReport)

  const mission = missionCommand.mission
  const topGoal = [...missionCommand.goals].sort((left, right) => right.progressPercent - left.progressPercent)[0]
  const atRiskGoalCount = missionCommand.goals.filter((goal) => goal.status !== 'on-track').length
  const activeProjectCount = missionCommand.projects.filter((project) => project.status === 'active').length
  const nextCalendarEvent = [...missionCommand.calendar].sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0]
  const longTermMemory = missionCommand.memories.find((memory) => memory.kind === 'long-term-memory')
  const searchPreview = missionCommand.searchIndex.slice(0, 6)

  const stageCards: Array<{ id: TaskStage; value: number; detail: string }> = [
    { id: 'queued', value: taskStageBreakdown?.queued ?? 0, detail: 'Captured, not started' },
    { id: 'inspecting', value: taskStageBreakdown?.inspecting ?? 0, detail: 'Reading or diagnosing' },
    { id: 'editing', value: taskStageBreakdown?.editing ?? 0, detail: 'Making changes' },
    { id: 'validating', value: taskStageBreakdown?.validating ?? 0, detail: 'Checking correctness' },
    { id: 'committing', value: taskStageBreakdown?.committing ?? 0, detail: 'Preparing commit' },
    { id: 'pushing', value: taskStageBreakdown?.pushing ?? 0, detail: 'Ready for remote push' },
    { id: 'done', value: taskStageBreakdown?.done ?? 0, detail: 'Execution finished' },
  ]

  const timeline = [
    ...runtimeTasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      detail: `${describeTask(task)} · ${task.status}`,
      timestamp: task.lastUpdatedAt ?? task.completedAt,
      source: task.source,
    })),
    ...recentActivity.map((entry) => ({
      id: `activity-${entry.id}`,
      title: entry.title,
      detail: entry.detail,
      timestamp: entry.timestamp,
      source: entry.source,
    })),
    ...missionCommand.calendar.map((entry) => ({
      id: `calendar-${entry.id}`,
      title: entry.title,
      detail: `${entry.type} · ${entry.owner} · ${entry.detail}`,
      timestamp: entry.startsAt,
      source: entry.source,
    })),
  ]
    .filter((item) => item.timestamp)
    .sort((left, right) => (right.timestamp ?? '').localeCompare(left.timestamp ?? ''))
    .slice(0, 8)

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <Surface
          tone="accent"
          header={<SectionHeading eyebrow="Sentinel Nexus" title="Mission command" description="Truthful command center for goals, projects, schedule, memory, docs, team, office, and operator execution." />}
        >
          <div className="stack-list">
            <div className="stack-list__item">
              <strong>{mission.title}</strong>
              <small>{mission.statement}</small>
            </div>
            <div className="stack-list__item stack-list__item--compact">
              <span>Command intent</span>
              <small>{mission.commandIntent}</small>
            </div>
            <div className="stack-list__row">
              <StatusBadge tone={runtimeTruthIsLive ? 'live' : 'subtle'}>{runtimeTruthIsLive ? 'live runtime present' : 'seeded baseline only'}</StatusBadge>
              <StatusBadge tone="subtle">mode {activeMode.label}</StatusBadge>
            </div>
          </div>
        </Surface>

        <div className="rail-grid">
          <MetricCard label="Mission progress" value={`${mission.progressPercent}%`} detail={`Target ${mission.targetDate}`} emphasis />
          <MetricCard label="Goals at risk" value={atRiskGoalCount} detail={`${missionCommand.goals.length} tracked`} />
          <MetricCard label="Active projects" value={activeProjectCount} detail={`${missionCommand.projects.length} total`} />
          <MetricCard label="Search records" value={missionCommand.searchIndex.length} detail="cross-surface index" />
        </div>

        <Surface header={<SectionHeading eyebrow="Office" title="Operating posture" />}>
          <div className="stack-list">
            {missionCommand.office.map((item) => (
              <div key={item.id} className="stack-list__item stack-list__item--compact">
                <strong>{item.label}</strong>
                <small>{item.value}</small>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </Surface>
      </aside>

      <main className="workspace">
        <Surface className="workspace-topbar" header={<SectionHeading eyebrow="Command overview" title="Mission, task, and runtime state" />}>
          <div className="workspace-topbar__grid">
            <MetricCard label="Mode" value={activeMode.label} detail={activeMode.intent} />
            <MetricCard label="Model lane" value={apiState === 'connected' ? 'Server stub response' : 'Local simulator'} detail={transportPreview.provider} />
            <MetricCard label="Latest event" value={latestMessage?.author ?? 'Waiting'} detail={formatLastEventLabel(latestMessage?.timestamp)} />
            <MetricCard label="Runtime cards" value={runtimeCards.length} detail={runtimeStatus?.environment ?? 'offline'} />
          </div>
        </Surface>

        <section className="command-deck panel">
          <div className="overview-strip">
            <MetricCard label="Active work" value={attentionCounts?.active ?? activeExecutionTasks.length} detail={`${attentionCounts?.blocked ?? blockedTasks.length} blocked`} emphasis />
            <MetricCard label="Waiting on user" value={attentionCounts?.waitingOnUser ?? waitingOnUserTasks.length} detail="operator dependency" />
            <MetricCard label="Ready to report" value={attentionCounts?.readyToReport ?? readyToReportTasks.length} detail="completed loopbacks" />
            <MetricCard label="System notices" value={systemMessages} detail="system messages" />
          </div>

          <div className="ops-grid ops-grid--command">
            <Surface header={<SectionHeading eyebrow="Mission alignment" title="Goals moving the platform" />}>
              <div className="stack-list">
                {missionCommand.goals.map((goal) => (
                  <div key={goal.id} className="stack-list__item">
                    <div className="stack-list__row">
                      <strong>{goal.title}</strong>
                      <StatusBadge tone={goalTone(goal)}>{goal.status}</StatusBadge>
                    </div>
                    <small>{goal.summary}</small>
                    <small>{goal.progressPercent}% · target {goal.targetDate}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Projects" title="Project board" />}>
              <div className="stack-list">
                {missionCommand.projects.map((project) => (
                  <div key={project.id} className="stack-list__item">
                    <div className="stack-list__row">
                      <strong>{project.name}</strong>
                      <StatusBadge tone={project.status === 'blocked' ? 'warning' : 'subtle'}>{project.status}</StatusBadge>
                    </div>
                    <small>{project.objective}</small>
                    <small>{project.progressPercent}% · {project.owner} · {project.area}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Calendar" title="Scheduled work and meetings" />}>
              <div className="stack-list">
                {missionCommand.calendar.map((event) => (
                  <div key={event.id} className="stack-list__item stack-list__item--compact">
                    <div className="stack-list__row">
                      <strong>{event.title}</strong>
                      <StatusBadge tone={event.status === 'next-up' ? 'live' : 'subtle'}>{event.status}</StatusBadge>
                    </div>
                    <small>{formatLastEventLabel(event.startsAt)} · {event.owner} · {event.type}</small>
                    <small>{event.detail}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="ops-panel--wide" header={<SectionHeading eyebrow="Execution" title="Task stages and attention board" />}>
              <div className="stage-board">
                {stageCards.map((stage) => (
                  <div key={stage.id} className="stage-chip">
                    <span>{formatStageLabel(stage.id)}</span>
                    <strong>{stage.value}</strong>
                    <small>{stage.detail}</small>
                  </div>
                ))}
              </div>
              <div className="board-grid">
                {[
                  { title: 'Active now', tasks: activeExecutionTasks },
                  { title: 'Waiting on user', tasks: waitingOnUserTasks },
                  { title: 'Blocked', tasks: blockedTasks },
                  { title: 'Ready to report', tasks: readyToReportTasks },
                ].map((group) => (
                  <section key={group.title} className="board-column board-column--subtle">
                    <div className="board-column__header">
                      <strong>{group.title}</strong>
                      <StatusBadge tone="subtle">{group.tasks.length}</StatusBadge>
                    </div>
                    <div className="board-column__body">
                      {group.tasks.length > 0 ? group.tasks.slice(0, 4).map((task) => (
                        <article key={task.id} className="task-board-card">
                          <div className="stack-list__row">
                            <strong>{task.title}</strong>
                            <StatusBadge tone="subtle">{formatStageLabel(task.stage)}</StatusBadge>
                          </div>
                          <small>{describeTask(task)}</small>
                          <small>{task.source === 'runtime' ? 'live runtime' : 'seeded baseline'}</small>
                        </article>
                      )) : <div className="task-board-card task-board-card--empty"><small>No items in this surface</small></div>}
                    </div>
                  </section>
                ))}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Agents" title="Agent and work-cell visibility" />}>
              <div className="workstream-grid">
                {workstreams.length > 0 ? workstreams.map((workstream) => (
                  <article key={workstream.id} className={`workstream-card workstream-card--${determineWorkstreamTone(workstream)}`}>
                    <div className="stack-list__row">
                      <strong>{workstream.owner} · {workstream.lane}</strong>
                      <StatusBadge tone="subtle">{workstream.truthLabel}</StatusBadge>
                    </div>
                    <small>{summarizeWorkstream(workstream)}</small>
                    <small>{workstream.latestUpdateAt ? formatRelativeLabel(workstream.latestUpdateAt) : 'No update timestamp yet'}</small>
                  </article>
                )) : (
                  <article className="workstream-card workstream-card--empty">
                    <strong>No real work-cell roster yet</strong>
                    <small>Sub-agent visibility stays task-derived until runtime evidence exists.</small>
                  </article>
                )}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Memory" title="Working and long-term memory" />}>
              <div className="stack-list">
                {missionCommand.memories.map((memory) => (
                  <div key={memory.id} className="stack-list__item stack-list__item--compact">
                    <div className="stack-list__row">
                      <strong>{memory.title}</strong>
                      <StatusBadge tone="subtle">{memory.kind}</StatusBadge>
                    </div>
                    <small>{memory.summary}</small>
                    <small>{memory.tags.join(' · ')}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Docs and artifacts" title="References, docs, and deliverables" />}>
              <div className="stack-list">
                {missionCommand.artifacts.map((artifact) => (
                  <div key={artifact.id} className="stack-list__item stack-list__item--compact">
                    <div className="stack-list__row">
                      <strong>{artifact.title}</strong>
                      <StatusBadge tone="subtle">{artifact.type}</StatusBadge>
                    </div>
                    <small>{artifact.location}</small>
                    <small>{artifact.summary}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Search" title="Cross-surface search index" />}>
              <div className="stack-list">
                {searchPreview.map((entry) => (
                  <div key={entry.id} className="stack-list__item stack-list__item--compact">
                    <div className="stack-list__row">
                      <strong>{entry.title}</strong>
                      <StatusBadge tone="subtle">{entry.entityType}</StatusBadge>
                    </div>
                    <small>{entry.summary}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="ops-panel--wide" header={<SectionHeading eyebrow="Tracker" title="Timeline across tasks, activity, and calendar" />}>
              <div className="tracker-list">
                {timeline.map((item) => (
                  <article key={item.id} className="tracker-item">
                    <div className="tracker-item__body">
                      <div className="stack-list__row">
                        <strong>{item.title}</strong>
                        <StatusBadge tone="subtle">{item.source === 'runtime' ? 'live' : 'seeded baseline'}</StatusBadge>
                      </div>
                      <span>{item.detail}</span>
                      <small>{formatLastEventLabel(item.timestamp)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </Surface>
          </div>
        </section>

        <section className="workspace-grid">
          <Surface className="chat-surface" header={<SectionHeading eyebrow="Conversation" title="Operator and Sentinel channel" description="Mode-scoped conversation backed by the Nexus API when available." />}>
            <div className="header-badges">
              <StatusBadge>mode {activeModeId.toUpperCase()}</StatusBadge>
              <StatusBadge tone="subtle">{runtimeTruthIsLive ? 'live + baseline' : 'baseline only'}</StatusBadge>
              <StatusBadge tone="subtle">{runtimeContext?.session.hostLabel ?? 'host pending'}</StatusBadge>
            </div>
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
          </Surface>

          <aside className="right-stack">
            <Surface header={<SectionHeading eyebrow="Mission snapshot" title="Best visible next move" />}>
              <div className="stack-list">
                <div className="stack-list__item stack-list__item--compact">
                  <strong>{topGoal?.title ?? 'No goals loaded'}</strong>
                  <small>{topGoal?.summary ?? 'Goal telemetry unavailable.'}</small>
                </div>
                <div className="stack-list__item stack-list__item--compact">
                  <strong>{nextCalendarEvent?.title ?? 'No calendar event loaded'}</strong>
                  <small>{nextCalendarEvent ? `${formatLastEventLabel(nextCalendarEvent.startsAt)} · ${nextCalendarEvent.detail}` : 'Schedule telemetry unavailable.'}</small>
                </div>
                <div className="stack-list__item stack-list__item--compact">
                  <strong>{longTermMemory?.title ?? 'No long-term memory loaded'}</strong>
                  <small>{longTermMemory?.summary ?? 'Memory telemetry unavailable.'}</small>
                </div>
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Team" title="People and execution cells" />}>
              <div className="stack-list">
                {missionCommand.team.map((member) => (
                  <div key={member.id} className="stack-list__item stack-list__item--compact">
                    <div className="stack-list__row">
                      <strong>{member.name}</strong>
                      <StatusBadge tone={member.status === 'active' ? 'live' : 'subtle'}>{member.status}</StatusBadge>
                    </div>
                    <small>{member.role}</small>
                    <small>{member.focus}</small>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface header={<SectionHeading eyebrow="Truth boundary" title="What Nexus can actually prove" />}>
              <div className="detail-stack muted-copy">
                <span>Mission, goal, project, calendar, memory, docs, team, office, and search surfaces are now first-class data models in bootstrap.</span>
                <span>Work cells remain task-derived. No invented sub-agent presence.</span>
                <span>The backend still does not expose real auth, billing, or model-identity telemetry.</span>
                <span>{taskBreakdown ? `Task counts: ${taskBreakdown.Queued} queued · ${taskBreakdown['In Progress']} in progress · ${taskBreakdown.Blocked} blocked · ${taskBreakdown.Done} done.` : 'Task counts unavailable.'}</span>
              </div>
            </Surface>

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
