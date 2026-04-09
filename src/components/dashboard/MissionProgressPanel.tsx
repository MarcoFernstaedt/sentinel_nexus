'use client'

import { Calendar, Target, Users } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { formatDateLabel } from '@/src/lib/date'
import { DonutChart } from '@/src/components/ui/DonutChart'

const ALIGNMENT_DOT: Record<string, string> = {
  'on-track':  'bg-accent-mint shadow-[0_0_5px_rgba(0,255,179,0.75)]',
  'blocked':   'bg-accent-warn shadow-[0_0_5px_rgba(255,170,0,0.65)]',
  'idle':      'bg-[rgba(255,255,255,0.20)]',
  'off-track': 'bg-[#ff3d3d] shadow-[0_0_5px_rgba(255,61,61,0.65)]',
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
      'relative overflow-hidden rounded-[22px] border border-[rgba(0,255,179,0.18)] bg-[linear-gradient(135deg,rgba(0,20,14,0.92),rgba(4,10,20,0.97)_58%,rgba(2,6,14,0.99))]',
      'shadow-elevated backdrop-blur-xl p-5 md:p-6',
    )}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
      <div className="absolute right-0 top-0 h-36 w-36 translate-x-12 -translate-y-12 rounded-full bg-[rgba(0,212,255,0.07)] blur-3xl" aria-hidden />
      <div className="absolute left-0 bottom-0 h-28 w-28 -translate-x-8 translate-y-8 rounded-full bg-[rgba(0,255,179,0.05)] blur-2xl" aria-hidden />

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
              Commander&apos;s Intent
            </p>
            <p className="max-w-[64ch] text-[0.72rem] text-text-2 leading-relaxed line-clamp-3">
              {missionContext.commandIntent}
            </p>
          </div>
        </div>

        {/* Center: donut chart progress */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Mission progress: ${pct}%`}
          className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.025)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-w-[28rem] lg:min-w-[240px] lg:w-[240px] lg:max-w-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">
              Mission Progress
            </span>
          </div>

          {/* DonutChart + breakdown side by side at larger sizes */}
          <div className="flex items-center gap-4">
            <DonutChart
              value={pct}
              max={100}
              size={88}
              strokeWidth={9}
              label={`${pct}%`}
              sublabel="Progress"
            />
            {/* Project breakdown */}
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              {[
                { label: 'Active',   count: inProgress, color: 'text-accent-mint' },
                { label: 'Blocked',  count: blocked,    color: 'text-accent-warn' },
                { label: 'Pending',  count: todo,       color: 'text-text-3' },
                { label: 'Done',     count: completed,  color: 'text-text-2' },
              ].map(({ label, count, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-2 py-1 rounded-[6px] bg-surface-1 border border-soft"
                >
                  <span className="text-[0.56rem] text-text-3 uppercase tracking-[0.1em]">{label}</span>
                  <span className={cn('text-[0.72rem] font-mono font-semibold tabular-nums', color)}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: target date + agents */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.05] bg-[rgba(255,255,255,0.020)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:max-w-[24rem] lg:min-w-[190px] lg:max-w-none lg:items-end">
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
            <div className="flex flex-wrap gap-2.5 lg:justify-end" role="list" aria-label="Agent alignment statuses">
              {agents.map((a) => (
                <div
                  key={a.id}
                  role="listitem"
                  aria-label={`${a.name}: ${a.alignmentStatus.replace('-', ' ')}`}
                  className="flex items-center gap-1.5"
                >
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
