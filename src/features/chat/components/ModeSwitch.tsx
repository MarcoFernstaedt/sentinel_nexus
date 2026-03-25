import type { ChatMode, ChatModeId } from '../model/types'

type ModeSwitchProps = {
  modes: ChatMode[]
  activeModeId: ChatModeId
  onSelect: (modeId: ChatModeId) => void
}

export function ModeSwitch({ modes, activeModeId, onSelect }: ModeSwitchProps) {
  return (
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
            <small>{mode.accent}</small>
          </button>
        )
      })}
    </div>
  )
}
