'use client'

import { useMemo, useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { TrackedTargetCard } from '@/src/components/tracking/TrackedTargetCard'
import { AddTargetSheet } from '@/src/components/tracking/AddTargetSheet'
import { useTrackedTargets } from '@/src/hooks/useTrackedTargets'
import { progressRatio } from '@/src/types/tracking'
import { cn } from '@/src/lib/cn'

type ViewFilter = 'all' | 'active' | 'paused'

export default function TrackingPage() {
  const {
    targets,
    totalActive,
    completedToday,
    updateCount,
    togglePause,
    deleteTarget,
    addTarget,
  } = useTrackedTargets()

  const [viewFilter, setViewFilter] = useState<ViewFilter>('active')
  const [showAdd, setShowAdd] = useState(false)

  // ── Derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active   = targets.filter((t) => t.status !== 'paused')
    const total    = targets.length
    const done     = targets.filter((t) => t.status === 'completed').length
    const noReport = targets.filter(
      (t) => t.status === 'active' && t.currentCount === 0 && t.period === 'daily',
    ).length
    return { total, active: active.length, done, noReport }
  }, [targets])

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    switch (viewFilter) {
      case 'active': return targets.filter((t) => t.status !== 'paused')
      case 'paused': return targets.filter((t) => t.status === 'paused')
      default:       return targets
    }
  }, [targets, viewFilter])

  // Sort: completed last, then by progress ratio desc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return progressRatio(b) - progressRatio(a)
    })
  }, [filtered])

  const VIEW_TABS: { key: ViewFilter; label: string; count: number }[] = [
    { key: 'active', label: 'Active',  count: targets.filter((t) => t.status !== 'paused').length },
    { key: 'paused', label: 'Paused',  count: targets.filter((t) => t.status === 'paused').length },
    { key: 'all',    label: 'All',     count: targets.length },
  ]

  return (
    <motion.div
      className="px-5 py-5 grid gap-5 max-w-[900px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >

      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Execution Enforcement"
          title="Tracked Targets"
          description="Recurring measurable execution targets — daily quotas, weekly goals, and any repeatable block you need to enforce."
        />
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.74rem] font-semibold mt-1',
            'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-accent-mint',
            'hover:bg-[rgba(126,255,210,0.16)] hover:border-[rgba(126,255,210,0.50)] transition-all duration-150',
          )}
        >
          <Plus size={13} />
          New Target
        </button>
      </div>

      {/* ── Metric strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total"
          value={String(stats.total)}
          detail="All targets"
        />
        <MetricCard
          label="Active"
          value={String(totalActive)}
          detail="Running this period"
          emphasis={totalActive > 0}
        />
        <MetricCard
          label="Completed"
          value={String(completedToday)}
          detail="Hit target today"
          emphasis={completedToday > 0}
        />
        <MetricCard
          label="Needs Report"
          value={String(stats.noReport)}
          detail="No count logged today"
        />
      </div>

      {/* ── View tabs ── */}
      <div className="flex items-center gap-1 border-b border-soft -mb-2">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setViewFilter(tab.key)}
            className={cn(
              'relative px-3.5 py-2 text-[0.72rem] font-medium transition-colors duration-150',
              'border-b-2 -mb-px',
              viewFilter === tab.key
                ? 'border-accent-mint text-text-0'
                : 'border-transparent text-text-3 hover:text-text-1',
            )}
          >
            {tab.label}
            <span className={cn(
              'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px',
              'text-[0.54rem] font-mono font-bold tabular-nums leading-none',
              viewFilter === tab.key
                ? 'bg-[rgba(126,255,210,0.15)] text-accent-mint'
                : 'bg-surface-1 text-text-3',
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Target list ── */}
      {sorted.length > 0 ? (
        <motion.div
          className="grid gap-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {sorted.map((target) => (
            <TrackedTargetCard
              key={target.id}
              target={target}
              onIncrement={() => updateCount(target.id, +1)}
              onDecrement={() => updateCount(target.id, -1)}
              onPauseToggle={() => togglePause(target.id)}
              onDelete={() => deleteTarget(target.id)}
            />
          ))}
        </motion.div>
      ) : (
        <div className="rounded-lg border border-dashed border-soft">
          <EmptyState
            icon={Target}
            title={
              viewFilter === 'paused'
                ? 'No paused targets'
                : 'No active targets'
            }
            description={
              viewFilter === 'paused'
                ? 'Pause a target to suspend it without deleting its history.'
                : 'Add your first recurring execution target to start tracking.'
            }
          />
          {viewFilter !== 'paused' && (
            <div className="flex justify-center pb-6">
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.74rem] font-semibold',
                  'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-accent-mint',
                  'hover:bg-[rgba(126,255,210,0.16)] transition-all duration-150',
                )}
              >
                <Plus size={13} />
                Add First Target
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Period guidance strip ── */}
      {targets.length > 0 && (
        <div className="rounded-lg border border-soft bg-surface-0 px-4 py-3 grid gap-1.5">
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-text-3 font-medium">
            Enforcement Notes
          </p>
          <ul className="grid gap-1">
            <li className="text-[0.68rem] text-text-2">
              · Daily targets reset at midnight local time. Update counts before end of day.
            </li>
            <li className="text-[0.68rem] text-text-2">
              · Weekly targets reset each Monday. Partial periods are recorded in history.
            </li>
            <li className="text-[0.68rem] text-text-2">
              · Paused targets retain their history and resume cleanly when unpaused.
            </li>
            <li className="text-[0.68rem] text-text-2">
              · "No Report" means the period ended with no count submitted — not zero completed.
            </li>
          </ul>
        </div>
      )}

      {/* ── Add target sheet ── */}
      {showAdd && (
        <AddTargetSheet
          onClose={() => setShowAdd(false)}
          onAdd={addTarget}
        />
      )}
    </motion.div>
  )
}
