import { Target, Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import type { Agent, MissionContext } from '@/src/types/agents'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

type AlignmentSummary = {
  label: string
  dotClass: string
  chipClass: string
}

function deriveAlignment(agents: Agent[]): AlignmentSummary {
  if (agents.length === 0) {
    return {
      label: 'Unknown',
      dotClass: 'bg-white/30',
      chipClass: 'border-white/10 bg-white/5 text-text-2',
    }
  }
  const blocked   = agents.filter((a) => a.alignmentStatus === 'blocked').length
  const offTrack  = agents.filter((a) => a.alignmentStatus === 'off-track').length
  const idle      = agents.filter((a) => a.alignmentStatus === 'idle').length

  if (blocked > 0) {
    return {
      label: 'Attention Needed',
      dotClass: 'bg-accent-warn',
      chipClass: 'border-[rgba(255,203,97,0.25)] bg-[rgba(255,203,97,0.10)] text-accent-warn',
    }
  }
  if (offTrack > 0) {
    return {
      label: 'At Risk',
      dotClass: 'bg-[rgba(255,112,112,0.9)]',
      chipClass: 'border-[rgba(255,112,112,0.25)] bg-[rgba(255,112,112,0.10)] text-[rgba(255,112,112,1)]',
    }
  }
  if (idle > agents.length / 2) {
    return {
      label: 'Standby',
      dotClass: 'bg-white/30',
      chipClass: 'border-soft bg-surface-1 text-text-2',
    }
  }
  return {
    label: 'On Track',
    dotClass: 'bg-accent-mint opacity-80',
    chipClass: 'border-[rgba(98,255,196,0.22)] bg-[rgba(14,40,28,0.50)] text-[#a8e8ca]',
  }
}

export function MissionBanner({ ctx, agents = [] }: { ctx: MissionContext; agents?: Agent[] }) {
  const pct       = Math.min(100, Math.max(0, ctx.progressPercent))
  const alignment = deriveAlignment(agents)

  return (
    <div className={cn(
      'rounded-lg border border-[rgba(126,255,210,0.18)] bg-[rgba(7,22,16,0.55)]',
      'shadow-panel backdrop-blur-sm',
    )}>
      {/* Top strip */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-5 p-5">
        {/* Left: mission statement + objective */}
        <div className="flex-1 min-w-0 grid gap-3">
          <div className="flex items-start gap-2">
            <Target size={13} className="text-accent-mint flex-shrink-0 mt-[2px]" aria-hidden />
            <div className="min-w-0">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-accent-mint-dim font-medium mb-1.5">
                Mission Statement
              </p>
              <p className="text-[0.78rem] text-text-1 leading-relaxed italic">
                {ctx.statement}
              </p>
            </div>
          </div>

          <div className="pl-[21px]">
            <p className="text-[0.6rem] uppercase tracking-[0.16em] text-text-3 font-medium mb-1">
              Team Objective
            </p>
            <p className="text-[0.72rem] text-text-2 leading-relaxed">
              {ctx.teamObjective}
            </p>
          </div>
        </div>

        {/* Right: progress + target date */}
        <div className="flex flex-col gap-3 lg:min-w-[160px] lg:items-end">
          {/* Progress */}
          <div className="flex flex-col gap-1.5 w-full lg:items-end">
            <div className="flex items-center justify-between lg:justify-end gap-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-accent-mint" aria-hidden />
                <span className="text-[0.6rem] uppercase tracking-[0.12em] text-text-3 font-medium">Progress</span>
              </div>
              <span className="text-[0.8rem] font-mono font-semibold text-accent-mint tabular-nums">{pct}%</span>
            </div>
            <div className="w-full lg:w-[140px] h-[4px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-mint to-accent-cyan transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Target date + alignment */}
          <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={10} className="text-text-3" aria-hidden />
              <span className="text-[0.64rem] font-mono text-text-2">{formatDate(ctx.targetDate)}</span>
            </div>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-[0.22rem] rounded-full text-[0.62rem] font-medium tracking-[0.04em] border',
              alignment.chipClass,
            )}>
              <span className={cn('w-[5px] h-[5px] rounded-full', alignment.dotClass)} aria-hidden />
              {alignment.label}
            </span>
          </div>
        </div>
      </div>

      {/* Command intent strip */}
      <div className="border-t border-[rgba(126,255,210,0.10)] px-5 py-3">
        <div className="flex items-start gap-2">
          <span className="text-[0.6rem] uppercase tracking-[0.16em] text-text-3 font-medium flex-shrink-0 mt-[1px]">
            Commander's Intent
          </span>
          <span className="text-text-3 text-[10px] flex-shrink-0">/</span>
          <p className="text-[0.7rem] text-text-2 leading-relaxed">{ctx.commandIntent}</p>
        </div>
      </div>
    </div>
  )
}
