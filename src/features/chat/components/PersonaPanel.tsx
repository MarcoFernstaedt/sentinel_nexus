import type { ChatMode, TransportPreview } from '../model/types'

type PersonaPanelProps = {
  activeMode: ChatMode
  transportPreview: TransportPreview
  suggestedPrompts: string[]
  historyCount: number
  onPromptSelect: (prompt: string) => void
}

export function PersonaPanel({
  activeMode,
  transportPreview,
  suggestedPrompts,
  historyCount,
  onPromptSelect,
}: PersonaPanelProps) {
  return (
    <aside className="persona-panel panel">
      <div className="panel-block">
        <p className="eyebrow">Sentinel presence</p>
        <h2>{activeMode.label}</h2>
        <p className="muted-copy">{activeMode.intent}</p>
        <p className="persona-quote">{activeMode.personaLine}</p>
      </div>

      <div className="panel-block panel-block--dense">
        <div>
          <p className="eyebrow">Local transport</p>
          <strong>{transportPreview.provider}</strong>
        </div>
        <span className="status-pill">{transportPreview.state}</span>
        <p className="muted-copy">{transportPreview.summary}</p>
      </div>

      <div className="panel-block">
        <p className="eyebrow">Prompt history</p>
        <strong>{historyCount.toString().padStart(2, '0')} recalled entries available</strong>
        <p className="muted-copy">The shell already supports local prompt recall so runtime-backed chat can preserve operator command cadence later.</p>
      </div>

      <div className="panel-block">
        <p className="eyebrow">Quick injections</p>
        <div className="prompt-stack">
          {suggestedPrompts.map((prompt) => (
            <button key={prompt} type="button" className="prompt-chip" onClick={() => onPromptSelect(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
