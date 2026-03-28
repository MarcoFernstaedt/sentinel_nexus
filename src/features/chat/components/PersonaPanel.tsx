import type { ActivityItem, ChatMode, RuntimeContext, RuntimeStatusSnapshot, TransportPreview } from '../model/types'

type PersonaPanelProps = {
  activeMode: ChatMode
  transportPreview: TransportPreview
  runtimeContext: RuntimeContext | null
  runtimeStatus: RuntimeStatusSnapshot | null
  suggestedPrompts: string[]
  historyCount: number
  recentActivity: ActivityItem[]
  onPromptSelect: (prompt: string) => void
}

function formatLastSyncLabel(timestamp: string | undefined) {
  if (!timestamp) {
    return 'Waiting for API'
  }

  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) {
    return timestamp
  }

  return new Date(parsed).toLocaleTimeString([], { hour12: false })
}

export function PersonaPanel({
  activeMode,
  transportPreview,
  runtimeContext,
  runtimeStatus,
  suggestedPrompts,
  historyCount,
  recentActivity,
  onPromptSelect,
}: PersonaPanelProps) {
  const runtimeLabel = runtimeContext
    ? `${runtimeContext.session.hostLabel} · ${runtimeContext.session.serviceKind}`
    : 'Runtime context unavailable'

  const lastSyncLabel = formatLastSyncLabel(runtimeStatus?.capturedAt)

  return (
    <aside className="persona-panel panel">
      <div className="panel-block panel-block--hero">
        <p className="eyebrow">Sentinel presence</p>
        <h2>{activeMode.label}</h2>
        <p className="muted-copy">{activeMode.intent}</p>
        <p className="persona-quote">{activeMode.personaLine}</p>
      </div>

      <div className="panel-block panel-block--dense">
        <div className="split-row">
          <div>
            <p className="eyebrow">Chat transport</p>
            <strong>{transportPreview.provider}</strong>
          </div>
          <span className="status-pill">{transportPreview.state}</span>
        </div>
        <p className="muted-copy">{transportPreview.summary}</p>
      </div>

      <div className="panel-block panel-block--dense">
        <div className="split-row">
          <div>
            <p className="eyebrow">Runtime session</p>
            <strong>{runtimeLabel}</strong>
          </div>
          <span className="status-pill status-pill--subtle">Last sync {lastSyncLabel}</span>
        </div>
        <p className="muted-copy">
          {runtimeContext
            ? `Messages ${runtimeContext.chat.messageCount} · Notes ${runtimeContext.surfaces.notesCount} · Tasks ${runtimeContext.surfaces.tasksCount} · Activity ${runtimeContext.surfaces.activityCount}`
            : 'No server-derived session data yet. The shell will keep running locally.'}
        </p>
      </div>

      <div className="panel-block panel-block--dense">
        <p className="eyebrow">Recent progress log</p>
        <strong>{recentActivity.length.toString().padStart(2, '0')} visible updates</strong>
        <div className="detail-stack muted-copy">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 4).map((item) => (
              <span key={item.id}>
                [{item.type}] {item.title} — {item.detail}
              </span>
            ))
          ) : (
            <span>No activity has been logged by the backend yet.</span>
          )}
        </div>
      </div>

      <div className="panel-block">
        <div className="split-row">
          <div>
            <p className="eyebrow">Runtime target</p>
            <strong>{transportPreview.runtimeTarget.apiBasePath}</strong>
          </div>
          <span className="status-pill status-pill--subtle">swap-ready</span>
        </div>
        <div className="detail-stack muted-copy">
          <span>Session scope: {transportPreview.runtimeTarget.sessionScope}</span>
          <span>Event stream: {transportPreview.runtimeTarget.eventStreamPath}</span>
          <span>Nexus DB: {transportPreview.runtimeTarget.dbFilePath}</span>
        </div>
      </div>

      <div className="panel-block">
        <p className="eyebrow">Prompt memory</p>
        <strong>{historyCount.toString().padStart(2, '0')} recalled entries available</strong>
        <p className="muted-copy">
          Prompt recall is already local, so runtime-backed chat can preserve cadence later without
          retraining the operator surface.
        </p>
      </div>

      <div className="panel-block">
        <p className="eyebrow">Quick injections</p>
        <div className="prompt-stack">
          {suggestedPrompts.map((prompt, index) => (
            <button key={prompt} type="button" className="prompt-chip" onClick={() => onPromptSelect(prompt)}>
              <span className="prompt-chip__index">0{index + 1}</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
