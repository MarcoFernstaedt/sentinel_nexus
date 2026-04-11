'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import type { TrackingCategory, TrackingPeriod } from '@/src/types/tracking'
import { TRACKING_CATEGORY_LABEL } from '@/src/types/tracking'
import type { AddTargetInput } from '@/src/hooks/useTrackedTargets'

const ALL_CATEGORIES = Object.keys(TRACKING_CATEGORY_LABEL) as TrackingCategory[]

const PERIOD_OPTIONS: { value: TrackingPeriod; label: string; desc: string }[] = [
  { value: 'daily',  label: 'Daily',  desc: 'Resets every day at midnight' },
  { value: 'weekly', label: 'Weekly', desc: 'Resets every Monday' },
]

interface AddTargetSheetProps {
  onClose: () => void
  onAdd: (input: AddTargetInput) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[0.66rem] uppercase tracking-[0.12em] text-text-3 font-medium">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  min?: number
  max?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg text-[0.78rem]',
        'bg-surface-0 border border-soft',
        'text-text-1 placeholder:text-text-3',
        'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
        'transition-colors duration-150',
      )}
    />
  )
}

export function AddTargetSheet({ onClose, onAdd }: AddTargetSheetProps) {
  const [title,    setTitle]    = useState('')
  const [category, setCategory] = useState<TrackingCategory>('custom')
  const [period,   setPeriod]   = useState<TrackingPeriod>('daily')
  const [target,   setTarget]   = useState('5')
  const [notes,    setNotes]    = useState('')
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) { setError('Title is required.'); return }
    const count = parseInt(target, 10)
    if (!Number.isFinite(count) || count < 1) { setError('Target must be a number ≥ 1.'); return }
    onAdd({ title: trimmed, category, period, targetCount: count, notes })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add tracked target"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:fixed md:top-1/2 md:left-1/2',
          'md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px]',
          'rounded-t-2xl md:rounded-2xl',
          'bg-[linear-gradient(180deg,rgba(9,16,24,0.98),rgba(7,12,18,0.98))]',
          'border border-soft shadow-elevated',
          'max-h-[90dvh] overflow-y-auto',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.18em] text-accent-mint-dim font-medium">
              Tracking
            </p>
            <h3 className="text-[0.9rem] font-semibold text-text-0 leading-tight mt-0.5">
              Add Tracked Target
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-[8px] border border-soft text-text-3 hover:text-text-1 hover:border-med transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5">
          {/* Title */}
          <div className="grid gap-1.5">
            <FieldLabel>Title</FieldLabel>
            <TextInput
              value={title}
              onChange={(v) => { setTitle(v); setError(null) }}
              placeholder="e.g. Dev Applications, Outreach Touches, Workouts…"
            />
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <FieldLabel>Category</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-2.5 py-[0.28rem] rounded-full text-[0.62rem] font-medium border transition-all duration-100 whitespace-nowrap',
                    category === cat
                      ? 'border-[rgba(126,255,210,0.40)] bg-[rgba(126,255,210,0.10)] text-accent-mint'
                      : 'border-soft bg-surface-1 text-text-2 hover:border-med hover:text-text-1',
                  )}
                >
                  {TRACKING_CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div className="grid gap-1.5">
            <FieldLabel>Period</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    'flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-100',
                    period === opt.value
                      ? 'border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.06)] text-text-0'
                      : 'border-soft bg-surface-0 text-text-2 hover:border-med',
                  )}
                >
                  <span className="text-[0.75rem] font-semibold">{opt.label}</span>
                  <span className="text-[0.6rem] text-text-3">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target count */}
          <div className="grid gap-1.5">
            <FieldLabel>Target Count</FieldLabel>
            <TextInput
              type="number"
              value={target}
              onChange={(v) => { setTarget(v); setError(null) }}
              placeholder="e.g. 5"
              min={1}
              max={9999}
            />
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <FieldLabel>Notes <span className="normal-case text-text-3">(optional)</span></FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What counts, when to update, any rules…"
              rows={2}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-[0.78rem] resize-none',
                'bg-surface-0 border border-soft',
                'text-text-1 placeholder:text-text-3',
                'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
                'transition-colors duration-150',
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[0.68rem] text-[rgba(255,112,112,0.85)] font-medium">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-[0.74rem] font-medium text-text-2 border border-soft hover:text-text-1 hover:border-med transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                'px-4 py-2 rounded-lg text-[0.74rem] font-semibold transition-all duration-150',
                'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.10)] text-accent-mint',
                'hover:bg-[rgba(126,255,210,0.18)] hover:border-[rgba(126,255,210,0.50)]',
              )}
            >
              Add Target
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
