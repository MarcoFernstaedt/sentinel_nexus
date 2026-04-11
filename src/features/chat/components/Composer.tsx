import type { KeyboardEvent } from 'react'
import type { ComposerDraft } from '../model/types'
import { cn } from '@/src/lib/cn'

type ComposerProps = {
  draft: ComposerDraft
  historyCursorLabel: string
  isResponding: boolean
  activeModeLabel: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onHistory: (direction: 'older' | 'newer') => void
}

export function Composer({
  draft,
  historyCursorLabel,
  isResponding,
  activeModeLabel,
  onDraftChange,
  onSubmit,
  onHistory,
}: ComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
      return
    }
    if (event.key === 'ArrowUp' && !draft.value) {
      event.preventDefault()
      onHistory('older')
      return
    }
    if (event.key === 'ArrowDown' && draft.historyIndex !== null) {
      event.preventDefault()
      onHistory('newer')
    }
  }

  const charCount = draft.value.length
  const nearLimit = charCount > 1000

  return (
    <div className="flex-shrink-0 border-t border-soft bg-[rgba(5,10,15,0.7)] px-4 py-3">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-[0.6rem] uppercase tracking-[0.14em] text-text-3 font-medium">
          {historyCursorLabel}
        </span>
        <span className="text-[0.6rem] text-text-3 font-mono">
          {activeModeLabel} engaged
        </span>
      </div>

      <div className="relative">
        <label className="sr-only" htmlFor="sentinel-composer-input">Message input</label>
        <textarea
          id="sentinel-composer-input"
          rows={3}
          value={draft.value}
          placeholder="Give Sentinel an objective, a decision, or a build constraint."
          className={cn(
            'w-full resize-none rounded-xl px-3.5 py-2.5 pr-20',
            'bg-surface-1 border border-soft',
            'text-[0.8rem] text-text-0 placeholder:text-text-3',
            'focus:outline-none focus:border-[rgba(126,255,210,0.35)] focus:ring-1 focus:ring-[rgba(126,255,210,0.15)]',
            'transition-colors duration-150',
            'scrollbar-thin',
          )}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isResponding}
          aria-describedby="composer-help composer-count"
        />

        {/* Send button — overlaid bottom-right of textarea */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isResponding || !draft.value.trim()}
          aria-live="polite"
          className={cn(
            'absolute bottom-2 right-2',
            'px-3 py-1.5 rounded-lg text-[0.68rem] font-semibold',
            'border transition-all duration-150',
            isResponding || !draft.value.trim()
              ? 'border-soft bg-surface-0 text-text-3 cursor-not-allowed'
              : 'border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-[#7effd2] hover:bg-[rgba(126,255,210,0.16)]',
          )}
        >
          {isResponding ? 'Thinking…' : 'Send'}
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5 gap-2">
        <span id="composer-help" className="text-[0.58rem] text-text-3">
          Enter to send · Shift+Enter for newline · ↑↓ recall history
        </span>
        <span
          id="composer-count"
          aria-live="polite"
          className={cn(
            'text-[0.6rem] font-mono',
            nearLimit ? 'text-accent-warn' : 'text-text-3',
          )}
        >
          {charCount}/1200
        </span>
      </div>
    </div>
  )
}
