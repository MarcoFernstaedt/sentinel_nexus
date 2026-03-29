import type { ChatMode, ChatModeId } from '../model/types'

type ModeSwitchProps = {
  modes: ChatMode[]
  activeModeId: ChatModeId
  onSelect: (modeId: ChatModeId) => void
}

export function ModeSwitch({ modes, activeModeId, onSelect }: ModeSwitchProps) {
  return (
    <section className="mode-switch-shell" aria-labelledby="mode-switch-heading">
      <div className="mode-switch-shell__header">
        <div>
          <p className="eyebrow">Mode routing</p>
          <h3 id="mode-switch-heading">Choose Sentinel’s posture</h3>
        </div>
        <span className="muted-copy">Each mode preserves a distinct voice and decision bias.</span>
      </div>
      <div className="mode-switch" role="tablist" aria-label="Sentinel chat modes">
        {modes.map((mode) => {
          const isActive = mode.id === activeModeId
          const panelId = `mode-panel-${mode.id}`
          const tabId = `mode-tab-${mode.id}`

          return (
            <button
              key={mode.id}
              id={tabId}
              type="button"
              className={`mode-switch__item ${isActive ? 'is-active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(mode.id)}
            >
              <span>{mode.label}</span>
              <strong>{mode.accent}</strong>
              <small>{mode.intent}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
