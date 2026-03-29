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
    <aside className="persona-panel panel" aria-labelledby="persona-panel-heading">
      <div className="panel-block panel-block--hero">
        <p className="eyebrow">Sentinel presence</p>
        <h2 id="persona-panel-heading">{activeMode.label}</h2>
        <p className="muted-copy">{activeMode.intent}</p>
        <p className="persona-quote">{activeMode.personaLine}</p>
      </div>

      <section className="panel-block panel-block--dense" aria-labelledby="chat-transport-heading">
        <div className="split-row">
          <div>
            <p className="eyebrow">Chat transport</p>
            <strong id="chat-transport-heading">{transportPreview.provider}</strong>
          </div>
          <span className="status-pill">{transportPreview.state}</span>
        </div>
        <p className="muted-copy">{transportPreview.summary}</p>
      </section>

      <section className="panel-block panel-block--dense" aria-labelledby="runtime-session-heading">
        <div className="split-row">
          <div>
            <p className="eyebrow">Runtime session</p>
            <strong id="runtime-session-heading">{runtimeLabel}</strong>
          </div>
          <span className="status-pill status-pill--subtle">Last sync {lastSyncLabel}</span>
        </div>
        <p className="muted-copy">
          {runtimeContext
            ? `Messages ${runtimeContext.chat.messageCount} · Notes ${runtimeContext.surfaces.notesCount} · Tasks ${runtimeContext.surfaces.tasksCount} · Activity ${runtimeContext.surfaces.activityCount}`
            : 'No server-derived session data yet. The shell will keep running locally.'}
        </p>
      </section>

      <section className="panel-block panel-block--dense" aria-labelledby="progress-log-heading">
        <p className="eyebrow">Recent progress log</p>
        <strong id="progress-log-heading">{recentActivity.length.toString().padStart(2, '0')} visible updates</strong>
        <div className="detail-stack muted-copy" role="list" aria-live="polite" aria-label="Recent progress items">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 4).map((item) => (
              <span key={item.id} role="listitem">
                [{item.type}] {item.title} — {item.detail}
              </span>
            ))
          ) : (
            <span role="listitem">No activity has been logged by the backend yet.</span>
          )}
        </div>
      </section>

      <section className="panel-block" aria-labelledby="runtime-target-heading">
        <div className="split-row">
          <div>
            <p className="eyebrow">Runtime target</p>
            <strong id="runtime-target-heading">{transportPreview.runtimeTarget.apiBasePath}</strong>
          </div>
          <span className="status-pill status-pill--subtle">swap-ready</span>
        </div>
        <div className="detail-stack muted-copy" role="list" aria-label="Runtime target details">
          <span role="listitem">Session scope: {transportPreview.runtimeTarget.sessionScope}</span>
          <span role="listitem">Event stream: {transportPreview.runtimeTarget.eventStreamPath}</span>
          <span role="listitem">Nexus DB: {transportPreview.runtimeTarget.dbFilePath}</span>
        </div>
      </section>

      <section className="panel-block" aria-labelledby="prompt-memory-heading">
        <p className="eyebrow">Prompt memory</p>
        <strong id="prompt-memory-heading">{historyCount.toString().padStart(2, '0')} recalled entries available</strong>
        <p className="muted-copy">
          Prompt recall is already local, so runtime-backed chat can preserve cadence later without retraining the operator surface.
        </p>
      </section>

      <section className="panel-block" aria-labelledby="quick-injections-heading">
        <p className="eyebrow">Quick injections</p>
        <h3 id="quick-injections-heading">Suggested prompts</h3>
        <div className="prompt-stack" role="list" aria-label="Suggested prompts">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={prompt}
              type="button"
              className="prompt-chip"
              onClick={() => onPromptSelect(prompt)}
              role="listitem"
              aria-label={`Suggested prompt ${index + 1}: ${prompt}`}
            >
              <span className="prompt-chip__index">0{index + 1}</span>
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
