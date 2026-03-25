import type { ChatMode, RuntimeContext, RuntimeStatusSnapshot, TransportPreview } from '../model/types'

type PersonaPanelProps = {
  activeMode: ChatMode
  transportPreview: TransportPreview
  runtimeContext: RuntimeContext | null
  runtimeStatus: RuntimeStatusSnapshot | null
  suggestedPrompts: string[]
  historyCount: number
  onPromptSelect: (prompt: string) => void
}

export function PersonaPanel({
  activeMode,
  transportPreview,
  runtimeContext,
  runtimeStatus,
  suggestedPrompts,
  historyCount,
  onPromptSelect,
}: PersonaPanelProps) {
  const runtimeLabel = runtimeContext
    ? `${runtimeContext.session.hostLabel} · ${runtimeContext.session.serviceKind}`
    : 'Runtime context unavailable'

  const lastSyncLabel = runtimeStatus
    ? new Date(runtimeStatus.capturedAt).toLocaleTimeString([], { hour12: false })
    : 'Waiting for API'

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
            ? `Messages ${runtimeContext.chat.messageCount} · Notes ${runtimeContext.surfaces.notesCount} · Tasks ${runtimeContext.surfaces.tasksCount}`
            : 'No server-derived session data yet. The shell will keep running locally.'}
        </p>
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
