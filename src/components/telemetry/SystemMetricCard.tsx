import { cn } from '@/src/lib/cn'

interface SystemMetricCardProps {
  label: string
  value: number
  unit?: string
  max?: number
  tone?: 'default' | 'warn' | 'critical'
  className?: string
}

export function SystemMetricCard({
  label,
  value,
  unit = '%',
  max = 100,
  tone = 'default',
  className,
}: SystemMetricCardProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  const barColor =
    tone === 'critical' ? 'bg-[rgba(255,112,112,0.7)]' :
    tone === 'warn'     ? 'bg-accent-warn/70'           :
    pct > 80            ? 'bg-accent-warn/70'           :
    pct > 60            ? 'bg-accent-cyan-dim'          :
                          'bg-gradient-to-r from-accent-mint to-accent-cyan'

  const valueColor =
    tone === 'critical' ? 'text-[rgba(255,112,112,0.9)]' :
    tone === 'warn'     ? 'text-accent-warn'              :
    pct > 80            ? 'text-accent-warn'              :
                          'text-text-0'

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.67rem] font-medium text-text-2 uppercase tracking-wider">{label}</span>
        <span className={cn('text-[0.9rem] font-mono font-semibold tabular-nums leading-none', valueColor)}>
          {value}<span className="text-[0.62rem] text-text-3 ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-[3px] rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
