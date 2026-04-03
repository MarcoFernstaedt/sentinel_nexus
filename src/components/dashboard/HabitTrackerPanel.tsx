'use client'

import React, { useState } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { useDashboard } from './DashboardDataProvider'
import { useSoundContext } from '@/src/context/SoundContext'
import { cn } from '@/src/lib/cn'
import { completeHabitInApi, createHabitInApi } from '@/src/features/chat/lib/apiTransport'
import type { HabitRecord } from '@/src/features/chat/model/types'
import { Flame } from 'lucide-react'

const CATEGORY_LABELS: Record<HabitRecord['category'], string> = {
  fitness: 'Fitness',
  work: 'Work',
  learning: 'Learning',
  health: 'Health',
  focus: 'Focus',
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function getThisWeekDates(): string[] {
  const today = new Date()
  const day = today.getDay() // 0=sun
  const start = new Date(today)
  start.setDate(today.getDate() - day)
  const dates: string[] = []
  for (let i = 0; i <= day; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function HabitRow({
  habit,
  onComplete,
}: {
  habit: HabitRecord
  onComplete: (id: string) => Promise<void>
}) {
  const [completing, setCompleting] = useState(false)
  const last7 = getLast7Days()
  const today = getTodayISO()
  const completedSet = new Set(habit.completedDates ?? [])
  const doneToday = completedSet.has(today)

  const weekDates = getThisWeekDates()
  const completedThisWeek = weekDates.filter((d) => completedSet.has(d)).length
  const targetThisWeek = habit.frequency === 'weekly'
    ? habit.targetPerPeriod
    : Math.min(habit.targetPerPeriod, weekDates.length)

  async function handleComplete() {
    if (doneToday || completing) return
    setCompleting(true)
    try {
      await onComplete(habit.id)
    } finally {
      setCompleting(false)
    }
  }

  const streak = habit.currentStreak ?? 0

  return (
    <div
      className="py-3 border-b border-soft last:border-0 grid gap-2"
      role="listitem"
      aria-label={`Habit: ${habit.title}, ${streak} day streak, ${doneToday ? 'completed today' : 'not done today'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.78rem] font-medium text-text-0 truncate leading-tight">{habit.title}</p>
          <p className="text-[0.62rem] text-text-2 mt-0.5 uppercase tracking-[0.08em]">
            {CATEGORY_LABELS[habit.category] ?? habit.category}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Streak counter */}
          {streak > 0 && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[rgba(255,165,0,0.08)] border border-[rgba(255,165,0,0.2)]"
              aria-label={`${streak} day streak`}
            >
              <Flame size={10} className="text-[#f5a623]" aria-hidden />
              <span className="text-[0.62rem] font-mono font-semibold text-[#f5c842]">{streak}</span>
            </div>
          )}

          {/* Check-off button */}
          <button
            onClick={handleComplete}
            disabled={doneToday || completing}
            className={cn(
              'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200',
              doneToday
                ? 'border-[rgba(65,255,165,0.6)] bg-[rgba(65,255,165,0.15)]'
                : 'border-[rgba(126,255,210,0.25)] bg-transparent hover:border-[rgba(126,255,210,0.5)] hover:bg-[rgba(36,255,156,0.08)]',
              completing && 'opacity-50',
            )}
            aria-label={doneToday ? `${habit.title} completed today` : `Mark ${habit.title} as done today`}
            aria-pressed={doneToday}
          >
            {doneToday && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 6l3 3 5-5" stroke="#41ffa5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 7-day dot grid */}
      <div className="flex items-center gap-1.5" role="img" aria-label={`Last 7 days: ${last7.filter(d => completedSet.has(d)).length} of 7 completed`}>
        {last7.map((date) => {
          const done = completedSet.has(date)
          const isToday = date === today
          return (
            <div
              key={date}
              title={date}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-200',
                done
                  ? 'bg-[#41ffa5] shadow-[0_0_4px_rgba(65,255,165,0.4)]'
                  : isToday
                    ? 'bg-transparent border border-[rgba(126,255,210,0.35)]'
                    : 'bg-[rgba(126,255,210,0.1)]',
              )}
            />
          )
        })}
        <span className="ml-1 text-[0.62rem] text-text-2 font-mono">
          {completedThisWeek}/{targetThisWeek} this week
        </span>
      </div>
    </div>
  )
}

function AddHabitForm({ onAdd, onCancel }: { onAdd: (input: Parameters<typeof createHabitInApi>[0]) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<HabitRecord['category']>('focus')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [target, setTarget] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onAdd({ title: title.trim(), category, frequency, targetPerPeriod: target })
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
    <form onSubmit={handleAdd} className="mt-3 grid gap-2 pt-3 border-t border-soft" aria-label="Add new habit">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Habit name…"
        required
        autoFocus
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as HabitRecord['category'])}
          className={inputCls}
          aria-label="Habit category"
        >
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
          className={inputCls}
          aria-label="Frequency"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[0.65rem] text-text-2 uppercase tracking-[0.08em] whitespace-nowrap">Target / period:</label>
        <input
          type="number"
          min={1}
          max={7}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className={cn(inputCls, 'w-16')}
          aria-label="Target count per period"
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
          {submitting ? 'Adding…' : 'Add Habit'}
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

export function HabitTrackerPanel() {
  const { missionCommand, refreshRuntime } = useDashboard()
  const habits = missionCommand.habits ?? []
  const [showAdd, setShowAdd] = useState(false)
  const { play } = useSoundContext()

  async function handleComplete(id: string) {
    await completeHabitInApi(id)
    play('task-complete')
    await refreshRuntime()
  }

  async function handleAdd(input: Parameters<typeof createHabitInApi>[0]) {
    await createHabitInApi(input)
    await refreshRuntime()
    setShowAdd(false)
  }

  return (
    <Surface
      header={
        <div className="flex items-center justify-between gap-2">
          <SectionHeading eyebrow="Daily" title="Habits" id="habits-tracker-heading" />
          <button
            onClick={() => setShowAdd((v) => !v)}
            className={cn(
              'px-2.5 py-1 rounded-[7px] text-[0.65rem] font-medium uppercase tracking-[0.06em]',
              'border border-[rgba(126,255,210,0.22)] bg-[rgba(36,255,156,0.06)] text-[rgba(126,247,205,0.65)]',
              'hover:bg-[rgba(36,255,156,0.12)] hover:text-[rgba(126,247,205,0.9)] transition-all duration-150',
            )}
            aria-expanded={showAdd}
            aria-label={showAdd ? 'Cancel adding habit' : 'Add new habit'}
          >
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        </div>
      }
      aria-labelledby="habits-tracker-heading"
    >
      {habits.length === 0 && !showAdd ? (
        <EmptyState icon={Flame} title="No habits tracked" description="Start building your mission cadence" />
      ) : (
        <div role="list" aria-label="Tracked habits">
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} onComplete={handleComplete} />
          ))}
        </div>
      )}
      {showAdd && (
        <AddHabitForm
          onAdd={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </Surface>
  )
}
