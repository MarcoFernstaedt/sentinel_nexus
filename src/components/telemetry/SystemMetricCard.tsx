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
    tone === 'critical' ? '#ff3d3d' :
    tone === 'warn'     ? '#ffaa00' :
    pct > 80            ? '#ffaa00' :
    pct > 60            ? 'var(--accent-cyan)' :
                          undefined // uses gradient via className

  const barGlow =
    tone === 'critical' ? '0 0 8px rgba(255,61,61,0.70)' :
    tone === 'warn'     ? '0 0 8px rgba(255,170,0,0.65)' :
    pct > 80            ? '0 0 8px rgba(255,170,0,0.65)' :
    pct > 60            ? '0 0 8px rgba(0,212,255,0.50)' :
                          '0 0 8px rgba(0,255,179,0.45)'

  const valueColor =
    tone === 'critical' ? 'text-[#ff3d3d]' :
    tone === 'warn'     ? 'text-accent-warn' :
    pct > 80            ? 'text-accent-warn' :
                          'text-text-0'

  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${label}: ${value}${unit}`}
      className={cn('flex flex-col gap-2', className)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.67rem] font-medium text-text-2 uppercase tracking-wider">{label}</span>
        <span className={cn('text-[0.9rem] font-mono font-semibold tabular-nums leading-none', valueColor)}>
          {value}<span className="text-[0.62rem] text-text-3 ml-0.5">{unit}</span>
        </span>
      </div>
      {/* Track with tick marks at 60% and 80% */}
      <div className="relative h-[5px] rounded-full bg-white/[0.06] overflow-visible">
        {/* Tick at 60% */}
        <span
          className="absolute top-0 h-full w-px bg-white/[0.12] z-10"
          style={{ left: '60%' }}
          aria-hidden
        />
        {/* Tick at 80% */}
        <span
          className="absolute top-0 h-full w-px bg-white/[0.12] z-10"
          style={{ left: '80%' }}
          aria-hidden
        />
        {/* Filled bar */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            !barColor && 'bg-gradient-to-r from-accent-mint to-accent-cyan',
          )}
          style={{
            width: `${pct}%`,
            ...(barColor ? { backgroundColor: barColor } : {}),
            boxShadow: barGlow,
          }}
          aria-hidden
        />
      </div>
    </div>
  )
}
