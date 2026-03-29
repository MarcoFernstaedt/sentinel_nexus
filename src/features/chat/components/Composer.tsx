import type { KeyboardEvent } from 'react'
import type { ComposerDraft } from '../model/types'

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

  return (
    <section className="composer-shell" aria-labelledby="composer-heading">
      <h3 id="composer-heading">Message Sentinel</h3>
      <div className="composer-shell__meta" aria-live="polite">
        <span>{historyCursorLabel}</span>
        <span>{activeModeLabel} engaged</span>
      </div>
      <label className="sr-only" htmlFor="sentinel-composer-input">Message input</label>
      <textarea
        id="sentinel-composer-input"
        rows={4}
        value={draft.value}
        placeholder="Give Sentinel an objective, a decision, or a build constraint."
        aria-describedby="composer-help composer-count"
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="composer-shell__footer">
        <span id="composer-help" className="muted-copy">Enter to send · Shift+Enter for newline · Up and down arrows recall prompt history</span>
        <span id="composer-count" className="composer-shell__count" aria-live="polite">{draft.value.length}/1200</span>
      </div>
      <div className="composer-shell__actions">
        <button type="button" className="ghost-button" onClick={() => onHistory('older')} aria-describedby="composer-help">
          Recall older
        </button>
        <button type="button" className="primary-button" onClick={onSubmit} disabled={isResponding} aria-live="polite">
          {isResponding ? 'Sentinel is thinking…' : 'Send to Sentinel'}
        </button>
      </div>
    </section>
  )
}
