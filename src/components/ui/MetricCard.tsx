import type { ReactNode } from 'react'
import { cn } from '@/src/lib/cn'
import { Sparkline } from './Sparkline'

type MetricCardProps = {
  label: string
  value: ReactNode
  detail?: ReactNode
  className?: string
  emphasis?: boolean
  /** Optional trend data array for sparkline (min 2 values needed to render) */
  sparkData?: number[]
  /** Sparkline label for screen readers */
  sparkLabel?: string
}

export function MetricCard({
  label,
  value,
  detail,
  className,
  emphasis = false,
  sparkData,
  sparkLabel,
}: MetricCardProps) {
  const valueString = typeof value === 'string' || typeof value === 'number' ? String(value) : label
  const groupLabel = `${label}: ${valueString}`

  return (
    <article
      role="group"
      aria-label={groupLabel}
      className={cn(
        'relative grid gap-3 overflow-hidden rounded-xl border p-4 lg:p-5',
        'shadow-panel backdrop-blur-xl',
        'transition-[transform,box-shadow,border-color] duration-200',
        'hover:scale-[1.015] hover:-translate-y-0.5',
        emphasis
          ? 'border-[rgba(0,255,179,0.26)] bg-[linear-gradient(180deg,rgba(0,32,22,0.96),rgba(2,12,20,0.94))]'
          : 'border-soft bg-[linear-gradient(180deg,rgba(8,15,26,0.90),rgba(4,10,18,0.84))]',
        className,
      )}
      style={emphasis ? { boxShadow: 'var(--shadow-panel), var(--glow-mint)' } : undefined}
    >
      {/* Top-edge shimmer line */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70"
        aria-hidden
      />
      {/* Sparkline — positioned bottom-right */}
      {sparkData && sparkData.length >= 2 && (
        <div className="absolute bottom-3 right-3 opacity-60" aria-hidden>
          <Sparkline
            data={sparkData}
            width={72}
            height={24}
            label={sparkLabel ?? `${label} trend`}
            color={emphasis ? 'var(--accent-mint)' : 'var(--accent-cyan)'}
          />
        </div>
      )}
      <span className="text-[0.64rem] uppercase tracking-[0.18em] text-[#6db89e] font-medium">
        {label}
      </span>
      <strong
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'text-[1.4rem] font-semibold text-text-0 font-mono leading-none tracking-[-0.02em]',
          emphasis && 'text-accent-mint',
        )}
      >
        {value}
      </strong>
      {detail ? (
        <small className="text-[0.72rem] text-[#7fa090] leading-relaxed font-normal max-w-[28ch]">
          {detail}
        </small>
      ) : null}
    </article>
  )
}
