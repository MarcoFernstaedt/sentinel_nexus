'use client'

import React, { useState } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { useDashboard } from './DashboardDataProvider'
import { cn } from '@/src/lib/cn'
import { patchGoalInApi, createGoalInApi } from '@/src/features/chat/lib/apiTransport'
import type { GoalRecord } from '@/src/features/chat/model/types'
import { Target } from 'lucide-react'

const STATUS_TONE: Record<GoalRecord['status'], 'live' | 'warning' | 'critical'> = {
  'on-track': 'live',
  'at-risk': 'warning',
  'blocked': 'critical',
}

const STATUS_LABEL: Record<GoalRecord['status'], string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'blocked': 'Blocked',
}

const CATEGORY_LABELS: Record<GoalRecord['category'], string> = {
  income: 'Revenue',
  career: 'Career',
  acquisition: 'Growth',
  fitness: 'Fitness',
  execution: 'Execution',
}

function GoalRow({
  goal,
  onUpdate,
  linkedProjects,
}: {
  goal: GoalRecord
  onUpdate: (id: string, patch: Partial<GoalRecord>) => Promise<void>
  linkedProjects: { id: string; name: string }[]
}) {
  const [updating, setUpdating] = useState(false)

  async function nudgeProgress(delta: number) {
    const next = Math.min(100, Math.max(0, goal.progressPercent + delta))
    setUpdating(true)
    try {
      await onUpdate(goal.id, { progressPercent: next })
    } finally {
      setUpdating(false)
    }
  }

  const pct = goal.progressPercent ?? 0

  return (
    <div
      className="py-3 border-b border-soft last:border-0 grid gap-2"
      role="listitem"
      aria-label={`Goal: ${goal.title}, ${pct}% complete, status ${STATUS_LABEL[goal.status]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.78rem] font-medium text-text-0 truncate leading-tight">{goal.title}</p>
          <p className="text-[0.62rem] text-text-2 mt-0.5 uppercase tracking-[0.08em]">
            {CATEGORY_LABELS[goal.category] ?? goal.category}
          </p>
        </div>
        <StatusBadge tone={STATUS_TONE[goal.status]} className="flex-shrink-0">
          {STATUS_LABEL[goal.status]}
        </StatusBadge>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full bg-[rgba(126,255,210,0.07)] overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.title} progress`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 70
                ? 'linear-gradient(90deg, #24ff9c, #53c9ff)'
                : pct >= 40
                  ? 'linear-gradient(90deg, #f5c842, #f5a623)'
                  : 'linear-gradient(90deg, #ff7070, #ff4d4d)',
            }}
          />
        </div>
        <span className="text-[0.68rem] text-text-2 font-mono w-8 text-right flex-shrink-0">{pct}%</span>
      </div>

      {/* Quick update buttons */}
      <div className="flex items-center gap-1.5">
        {[5, 10, 25].map((delta) => (
          <button
            key={delta}
            onClick={() => nudgeProgress(delta)}
            disabled={updating || pct >= 100}
            className={cn(
              'px-2 py-0.5 rounded-[5px] text-[0.6rem] font-medium uppercase tracking-[0.06em]',
              'border border-[rgba(126,255,210,0.18)] bg-[rgba(36,255,156,0.05)]',
              'text-[rgba(126,247,205,0.6)] transition-colors duration-100',
              'hover:bg-[rgba(36,255,156,0.12)] hover:text-[rgba(126,247,205,0.9)]',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
            aria-label={`Increase ${goal.title} progress by ${delta}%`}
          >
            +{delta}%
          </button>
        ))}
        {pct >= 100 && (
          <span className="text-[0.6rem] text-[#41ffa5] font-medium uppercase tracking-[0.08em] ml-1">Complete</span>
        )}
      </div>

      {/* Linked projects */}
      {linkedProjects.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5" aria-label={`Projects aligned to this goal: ${linkedProjects.map(p => p.name).join(', ')}`}>
          {linkedProjects.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[0.6rem] font-medium border border-[rgba(83,201,255,0.2)] bg-[rgba(83,201,255,0.06)] text-[rgba(83,201,255,0.8)]"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden><rect x="0.5" y="0.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeOpacity="0.7"/></svg>
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AddGoalForm({ onAdd, onCancel }: { onAdd: (goal: Omit<GoalRecord, 'id' | 'source' | 'progressPercent' | 'status'>) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalRecord['category']>('execution')
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onAdd({ title: title.trim(), category, targetDate, summary: '' } as Parameters<typeof onAdd>[0])
      setTitle('')
      setTargetDate('')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = cn(
    'w-full px-2.5 py-1.5 rounded-[7px] text-[0.75rem] font-mono',
    'bg-[rgba(6,12,18,0.80)] border border-[rgba(126,255,210,0.14)]',
    'text-[rgba(233,255,246,0.9)] placeholder:text-[rgba(155,185,170,0.35)]',
    'outline-none focus:border-[rgba(126,255,210,0.35)] transition-colors duration-150',
  )

  return (
    <form onSubmit={handleAdd} className="mt-3 grid gap-2 pt-3 border-t border-soft" aria-label="Add new goal">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mission objective…"
        required
        autoFocus
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalRecord['category'])}
          className={inputCls}
          aria-label="Goal category"
        >
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className={inputCls}
          aria-label="Target date"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className={cn(
            'flex-1 py-1.5 rounded-[7px] text-[0.72rem] font-semibold uppercase tracking-[0.06em]',
            'border border-[rgba(126,255,210,0.32)] bg-[rgba(36,255,156,0.10)] text-[#7ef7cd]',
            'hover:bg-[rgba(36,255,156,0.18)] transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {submitting ? 'Adding…' : 'Add Goal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-[7px] text-[0.72rem] text-text-2 border border-soft hover:text-text-0 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function GoalProgressPanel() {
  const { missionCommand, refreshRuntime } = useDashboard()
  const goals = missionCommand.goals ?? []
  const projects = missionCommand.projects ?? []

  const getLinkedProjects = (goalId: string) =>
    projects.filter((p) => p.goalIds?.includes(goalId)).map((p) => ({ id: p.id, name: p.name }))
  const [showAdd, setShowAdd] = useState(false)

  async function handleUpdate(id: string, patch: Partial<GoalRecord>) {
    await patchGoalInApi(id, patch)
    await refreshRuntime()
  }

  async function handleAdd(input: Parameters<typeof createGoalInApi>[0]) {
    await createGoalInApi(input)
    await refreshRuntime()
    setShowAdd(false)
  }

  return (
    <Surface
      header={
        <div className="flex items-center justify-between gap-2">
          <SectionHeading eyebrow="Mission" title="Goals" id="goals-progress-heading" />
          <button
            onClick={() => setShowAdd((v) => !v)}
            className={cn(
              'px-2.5 py-1 rounded-[7px] text-[0.65rem] font-medium uppercase tracking-[0.06em]',
              'border border-[rgba(126,255,210,0.22)] bg-[rgba(36,255,156,0.06)] text-[rgba(126,247,205,0.65)]',
              'hover:bg-[rgba(36,255,156,0.12)] hover:text-[rgba(126,247,205,0.9)] transition-all duration-150',
            )}
            aria-expanded={showAdd}
            aria-label={showAdd ? 'Cancel adding goal' : 'Add new goal'}
          >
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        </div>
      }
      aria-labelledby="goals-progress-heading"
    >
      {goals.length === 0 && !showAdd ? (
        <EmptyState icon={Target} title="No goals tracked" description="Add your first mission objective" />
      ) : (
        <div role="list" aria-label="Mission goals">
          {goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} onUpdate={handleUpdate} linkedProjects={getLinkedProjects(goal.id)} />
          ))}
        </div>
      )}
      {showAdd && (
        <AddGoalForm
          onAdd={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </Surface>
  )
}
