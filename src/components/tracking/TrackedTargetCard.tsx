'use client'

import { useState } from 'react'
import { Minus, Plus, Pause, Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/src/lib/cn'
import type { TrackedTarget } from '@/src/types/tracking'
import { progressLabel, progressRatio, TRACKING_CATEGORY_LABEL } from '@/src/types/tracking'

// ── Status visuals ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TrackedTarget['status'], {
  border: string
  bar: string
  badge: string
  label: string
}> = {
  active: {
    border: 'border-l-[2px] border-l-[rgba(126,255,210,0.35)]',
    bar:    'bg-[rgba(126,255,210,0.55)]',
    badge:  'bg-[rgba(126,255,210,0.08)] border-[rgba(126,255,210,0.2)] text-[#9cf0d0]',
    label:  'Active',
  },
  completed: {
    border: 'border-l-[2px] border-l-accent-mint',
    bar:    'bg-accent-mint',
    badge:  'bg-[rgba(36,255,156,0.12)] border-[rgba(36,255,156,0.30)] text-[#b8fff3]',
    label:  'Done',
  },
  missed: {
    border: 'border-l-[2px] border-l-[rgba(255,112,112,0.55)]',
    bar:    'bg-[rgba(255,112,112,0.55)]',
    badge:  'bg-[rgba(255,112,112,0.10)] border-[rgba(255,112,112,0.25)] text-[rgba(255,112,112,0.9)]',
    label:  'Missed',
  },
  'no-report': {
    border: 'border-l-[2px] border-l-[rgba(255,203,97,0.45)]',
    bar:    'bg-[rgba(255,203,97,0.40)]',
    badge:  'bg-[rgba(255,203,97,0.10)] border-[rgba(255,203,97,0.25)] text-[#ffcb61]',
    label:  'No Report',
  },
  paused: {
    border: 'border-l-[2px] border-l-[rgba(255,255,255,0.12)]',
    bar:    'bg-[rgba(255,255,255,0.15)]',
    badge:  'bg-white/[0.04] border-white/[0.10] text-[#7a9a8e]',
    label:  'Paused',
  },
}

const PERIOD_LABEL: Record<TrackedTarget['period'], string> = {
  daily:  'Daily',
  weekly: 'Weekly',
  custom: 'Custom',
}

function formatRelativeDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 2)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  } catch {
    return ''
  }
}

// ── History row ────────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: TrackedTarget['history'][number] }) {
  const pct = entry.targetCount > 0 ? Math.min(1, entry.count / entry.targetCount) : 0
  const statusColors: Record<string, string> = {
    completed: 'text-[#9cf0d0]',
    partial:   'text-[#ffcb61]',
    missed:    'text-[rgba(255,112,112,0.85)]',
    'no-report': 'text-text-3',
  }
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-soft last:border-0">
      <span className="text-[0.62rem] font-mono text-text-3 w-[80px] flex-shrink-0 tabular-nums">
        {entry.periodKey}
      </span>
      <div className="flex-1 h-1 rounded-full bg-surface-1 overflow-hidden">
        <div
          className="h-full rounded-full bg-[rgba(126,255,210,0.40)] transition-all"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
      <span className={cn('text-[0.62rem] font-mono tabular-nums w-[44px] text-right', statusColors[entry.status] ?? 'text-text-3')}>
        {entry.count}/{entry.targetCount}
      </span>
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface TrackedTargetCardProps {
  target: TrackedTarget
  onIncrement: () => void
  onDecrement: () => void
  onPauseToggle: () => void
  onDelete: () => void
}

export function TrackedTargetCard({
  target,
  onIncrement,
  onDecrement,
  onPauseToggle,
  onDelete,
}: TrackedTargetCardProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const styles = STATUS_STYLES[target.status]
  const ratio  = progressRatio(target)
  const isPaused = target.status === 'paused'
  const isDone   = target.status === 'completed'

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn(
        'flex flex-col gap-0 rounded-lg overflow-hidden',
        'bg-surface-0 border-y border-r border-soft shadow-panel',
        styles.border,
        isPaused && 'opacity-60',
        'transition-opacity duration-150',
      )}
    >
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">
              {TRACKING_CATEGORY_LABEL[target.category]}
            </span>
            <span className="text-[0.58rem] text-text-3">·</span>
            <span className="text-[0.58rem] uppercase tracking-[0.12em] text-text-3 font-medium">
              {PERIOD_LABEL[target.period]}
            </span>
          </div>
          {/* Title */}
          <h4 className="text-[0.84rem] font-semibold text-text-0 leading-snug">{target.title}</h4>
        </div>

        {/* Status badge */}
        <span className={cn(
          'flex-shrink-0 inline-flex items-center px-2 py-[0.2rem] rounded-full border text-[0.58rem] font-medium tracking-[0.04em] whitespace-nowrap mt-[2px]',
          styles.badge,
        )}>
          {isDone && (
            <span className="mr-1 w-[5px] h-[5px] rounded-full bg-accent-mint shadow-[0_0_5px_rgba(126,255,210,0.8)]" aria-hidden />
          )}
          {styles.label}
        </span>
      </div>

      {/* ── Progress bar + count ── */}
      <div className="px-4 pb-3 grid gap-2">
        {/* Bar */}
        <div className="h-1.5 rounded-full bg-surface-1 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', styles.bar)}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.round(ratio * 100)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            role="progressbar"
            aria-valuenow={target.currentCount}
            aria-valuemin={0}
            aria-valuemax={target.targetCount}
            aria-label={`${target.title}: ${progressLabel(target)}`}
          />
        </div>

        {/* Count row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.78rem] font-mono font-semibold text-text-0 tabular-nums tracking-[-0.01em]">
            {progressLabel(target)}
            <span className="ml-1.5 text-[0.64rem] text-text-3 font-normal">
              ({Math.round(ratio * 100)}%)
            </span>
          </span>
          {target.lastUpdatedAt && (
            <span className="text-[0.58rem] text-text-3 font-mono tabular-nums">
              {formatRelativeDate(target.lastUpdatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* ── Notes (if any) ── */}
      {target.notes && (
        <div className="px-4 pb-3">
          <p className="text-[0.68rem] text-text-3 leading-relaxed">{target.notes}</p>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-soft bg-surface-1/40">
        {/* Quick-update controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDecrement}
            disabled={isPaused || target.currentCount === 0}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-[6px] border transition-colors duration-100',
              'border-soft bg-surface-0 text-text-2',
              'hover:border-med hover:text-text-0',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
            aria-label="Decrease count"
          >
            <Minus size={12} />
          </button>

          <span className="w-[38px] text-center text-[0.82rem] font-mono font-semibold text-text-0 tabular-nums select-none">
            {target.currentCount}
          </span>

          <button
            type="button"
            onClick={onIncrement}
            disabled={isPaused}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-[6px] border transition-colors duration-100',
              isDone
                ? 'border-[rgba(126,255,210,0.3)] bg-[rgba(126,255,210,0.08)] text-accent-mint hover:bg-[rgba(126,255,210,0.14)]'
                : 'border-soft bg-surface-0 text-text-2 hover:border-med hover:text-text-0',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
            aria-label="Increase count"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center gap-1">
          {/* History toggle */}
          {target.history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-[6px] text-[0.6rem] font-medium',
                'border border-soft bg-surface-0 text-text-3 transition-colors duration-100',
                'hover:text-text-1 hover:border-med',
              )}
            >
              {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {target.history.length}
            </button>
          )}

          {/* Pause / resume */}
          <button
            type="button"
            onClick={onPauseToggle}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-[6px] border transition-colors duration-100',
              'border-soft bg-surface-0 text-text-3 hover:text-text-1 hover:border-med',
            )}
            aria-label={isPaused ? 'Resume target' : 'Pause target'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={11} /> : <Pause size={11} />}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[0.6rem] text-text-3 hover:text-text-1 px-1.5 py-1 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-[0.6rem] text-[rgba(255,112,112,0.85)] hover:text-[rgba(255,112,112,1)] px-1.5 py-1 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-[6px] border transition-colors duration-100',
                'border-soft bg-surface-0 text-text-3 hover:text-[rgba(255,112,112,0.8)] hover:border-[rgba(255,112,112,0.3)]',
              )}
              aria-label="Delete target"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── History drawer ── */}
      {showHistory && target.history.length > 0 && (
        <div className="px-4 py-3 border-t border-soft bg-surface-1/20">
          <p className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium mb-2">
            Period History
          </p>
          <div>
            {target.history.slice(0, 14).map((entry) => (
              <HistoryRow key={entry.periodKey} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </motion.article>
  )
}
