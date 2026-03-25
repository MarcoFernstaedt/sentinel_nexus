import type { ChatMode, ChatModeId } from '../model/types'

type ModeSwitchProps = {
  modes: ChatMode[]
  activeModeId: ChatModeId
  onSelect: (modeId: ChatModeId) => void
}

export function ModeSwitch({ modes, activeModeId, onSelect }: ModeSwitchProps) {
  return (
    <div className="mode-switch-shell">
      <div className="mode-switch-shell__header">
        <div>
          <p className="eyebrow">Mode routing</p>
          <strong>Choose Sentinel’s posture</strong>
        </div>
        <span className="muted-copy">Each mode preserves a distinct voice and decision bias.</span>
      </div>
      <div className="mode-switch" role="tablist" aria-label="Sentinel chat modes">
        {modes.map((mode) => {
          const isActive = mode.id === activeModeId

          return (
            <button
              key={mode.id}
              type="button"
              className={`mode-switch__item ${isActive ? 'is-active' : ''}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(mode.id)}
            >
              <span>{mode.label}</span>
              <strong>{mode.accent}</strong>
              <small>{mode.intent}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}
