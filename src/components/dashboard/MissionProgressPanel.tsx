'use client'

import { Calendar, Target, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/src/lib/cn'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { formatDateLabel } from '@/src/lib/date'

const ALIGNMENT_DOT: Record<string, string> = {
  'on-track':  'bg-accent-mint shadow-[0_0_4px_rgba(126,255,210,0.6)]',
  'blocked':   'bg-accent-warn shadow-[0_0_4px_rgba(255,203,97,0.5)]',
  'idle':      'bg-[rgba(255,255,255,0.18)]',
  'off-track': 'bg-[rgba(255,112,112,0.85)] shadow-[0_0_4px_rgba(255,112,112,0.5)]',
}

function formatDate(iso: string): string {
  return formatDateLabel(iso, undefined, 'Pending')
}

export function MissionProgressPanel() {
  const { missionContext, agents } = useAgentsStore()
  const { projects }               = useProjectsStore()

  const pct        = Math.min(100, Math.max(0, missionContext.progressPercent))
  const inProgress = projects.filter((p) => p.status === 'in-progress').length
  const blocked    = projects.filter((p) => p.status === 'blocked').length
  const todo       = projects.filter((p) => p.status === 'todo').length
  const completed  = projects.filter((p) => p.status === 'completed').length

  return (
    <div className={cn(
      'relative overflow-hidden rounded-[22px] border border-[rgba(126,255,210,0.16)] bg-[linear-gradient(135deg,rgba(10,25,20,0.88),rgba(8,15,22,0.96)_58%,rgba(6,11,16,0.98))]',
      'shadow-elevated backdrop-blur-xl p-5 md:p-6',
    )}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[rgba(113,203,255,0.08)] blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:gap-6">

        {/* Left: mission + command intent */}
        <div className="flex-1 min-w-0 grid gap-4">
          <div className="flex items-start gap-2">
            <Target size={12} className="text-accent-mint flex-shrink-0 mt-[3px]" aria-hidden />
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-accent-mint-dim font-medium mb-1">
                Mission
              </p>
              <p className="max-w-[60ch] text-[0.84rem] text-text-1 leading-relaxed italic line-clamp-3">
                {missionContext.statement}
              </p>
            </div>
          </div>
          <div className="pl-[20px] grid gap-1">
            <p className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">
              Commander's Intent
            </p>
            <p className="max-w-[64ch] text-[0.72rem] text-text-2 leading-relaxed line-clamp-3">
              {missionContext.commandIntent}
            </p>
          </div>
        </div>

        {/* Center: progress */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.05] bg-[rgba(255,255,255,0.03)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:max-w-[28rem] lg:min-w-[240px] lg:w-[240px] lg:max-w-none">
          <div className="flex items-center justify-between">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">
              Mission Progress
            </span>
            <span className="text-[0.86rem] font-mono font-semibold text-accent-mint tabular-nums">
              {pct}%
            </span>
          </div>
          <div className="w-full h-[6px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-mint to-accent-cyan"
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.2 }}
            />
          </div>
          {/* Project breakdown */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Active',    count: inProgress, color: 'text-accent-mint' },
              { label: 'Blocked',   count: blocked,    color: 'text-accent-warn' },
              { label: 'Pending',   count: todo,       color: 'text-text-3' },
              { label: 'Done',      count: completed,  color: 'text-text-2' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between px-2 py-1 rounded-[6px] bg-surface-1 border border-soft">
                <span className="text-[0.58rem] text-text-3 uppercase tracking-[0.1em]">{label}</span>
                <span className={cn('text-[0.72rem] font-mono font-semibold tabular-nums', color)}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: target date + agents */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.05] bg-[rgba(255,255,255,0.025)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:max-w-[24rem] lg:min-w-[190px] lg:max-w-none lg:items-end">
          <div className="flex items-center gap-1.5">
            <Calendar size={10} className="text-text-3" aria-hidden />
            <span className="text-[0.62rem] font-mono text-text-2">
              {formatDate(missionContext.targetDate)}
            </span>
          </div>

          {/* Agent alignment dots */}
          <div className="flex flex-col gap-2 lg:items-end">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium flex items-center gap-1.5">
              <Users size={9} aria-hidden /> Agent Alignment
            </span>
            <div className="flex flex-wrap gap-2.5 lg:justify-end">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5" title={`${a.name}: ${a.alignmentStatus}`}>
                  <span
                    className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0', ALIGNMENT_DOT[a.alignmentStatus])}
                    aria-hidden
                  />
                  <span className="text-[0.6rem] text-text-2">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
