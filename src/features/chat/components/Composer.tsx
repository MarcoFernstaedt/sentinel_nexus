import type { KeyboardEvent } from 'react'
import type { ComposerDraft } from '../model/types'

type ComposerProps = {
  draft: ComposerDraft
  historyCursorLabel: string
  isResponding: boolean
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onHistory: (direction: 'older' | 'newer') => void
}

export function Composer({
  draft,
  historyCursorLabel,
  isResponding,
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

  return (
    <div className="composer-shell">
      <div className="composer-shell__meta">
        <span>{historyCursorLabel}</span>
        <span>Enter to send · Shift+Enter for newline · ↑/↓ recalls prompt history</span>
      </div>
      <textarea
        rows={4}
        value={draft.value}
        placeholder="Give Sentinel an objective, a decision, or a build constraint."
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="composer-shell__actions">
        <button type="button" className="ghost-button" onClick={() => onHistory('older')}>
          Recall older
        </button>
        <button type="button" className="primary-button" onClick={onSubmit} disabled={isResponding}>
          {isResponding ? 'Sentinel is thinking…' : 'Send to Sentinel'}
        </button>
      </div>
    </div>
  )
}
