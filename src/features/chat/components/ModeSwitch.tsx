import type { ChatMode, ChatModeId } from '../model/types'
import { cn } from '@/src/lib/cn'

type ModeSwitchProps = {
  modes: ChatMode[]
  activeModeId: ChatModeId
  onSelect: (modeId: ChatModeId) => void
}

export function ModeSwitch({ modes, activeModeId, onSelect }: ModeSwitchProps) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-1 px-4 py-3 border-b border-soft overflow-x-auto"
      role="tablist"
      aria-label="Sentinel chat modes"
    >
      {modes.map((mode) => {
        const isActive = mode.id === activeModeId
        return (
          <button
            key={mode.id}
            id={`mode-tab-${mode.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`mode-panel-${mode.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(mode.id)}
            className={cn(
              'flex flex-col items-start gap-0.5 px-3 py-2 rounded-[10px]',
              'border transition-all duration-150 text-left flex-shrink-0',
              isActive
                ? 'border-[rgba(126,255,210,0.30)] bg-[rgba(126,255,210,0.07)] text-text-0'
                : 'border-transparent text-text-2 hover:text-text-1 hover:bg-white/[0.03]',
            )}
          >
            <span className="text-[0.72rem] font-semibold leading-none">{mode.label}</span>
            <span className={cn(
              'text-[0.6rem] font-medium leading-none',
              isActive ? 'text-accent-mint' : 'text-text-3',
            )}>
              {mode.accent}
            </span>
            <span className="text-[0.62rem] text-text-3 leading-tight max-w-[160px] hidden sm:block">
              {mode.intent}
            </span>
          </button>
        )
      })}
    </div>
  )
}
