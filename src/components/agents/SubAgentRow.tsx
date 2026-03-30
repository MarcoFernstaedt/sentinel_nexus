import { cn } from '@/src/lib/cn'
import type { SubAgent } from '@/src/types/agents'

const STATUS_DOT: Record<SubAgent['status'], string> = {
  active:  'bg-accent-mint shadow-[0_0_4px_rgba(126,255,210,0.7)]',
  standby: 'bg-[rgba(126,255,210,0.35)]',
  blocked: 'bg-accent-warn',
  offline: 'bg-[rgba(255,255,255,0.15)]',
  idle:    'bg-[rgba(126,255,210,0.18)]',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function SubAgentRow({ agent }: { agent: SubAgent }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-[8px] hover:bg-white/[0.02] transition-colors duration-100">
      {/* Status dot */}
      <span
        className={cn('flex-shrink-0 w-[6px] h-[6px] rounded-full', STATUS_DOT[agent.status])}
        aria-hidden
      />

      {/* Name + role */}
      <div className="flex items-baseline gap-2 min-w-0 flex-1">
        <span className="text-[0.72rem] font-medium text-text-1 flex-shrink-0">{agent.name}</span>
        <span className="text-[0.64rem] text-text-3 truncate">{agent.role}</span>
      </div>

      {/* Current task */}
      {agent.currentTask && (
        <span className="text-[0.64rem] text-text-2 truncate max-w-[180px] hidden sm:block">
          {agent.currentTask}
        </span>
      )}

      {/* Last activity */}
      <span className="text-[0.6rem] font-mono text-text-3 flex-shrink-0 tabular-nums">
        {formatRelativeTime(agent.lastActivityAt)}
      </span>
    </div>
  )
}
