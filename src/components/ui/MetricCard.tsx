import type { ReactNode } from 'react'
import { cn } from '@/src/lib/cn'

type MetricCardProps = {
  label: string
  value: ReactNode
  detail?: ReactNode
  className?: string
  emphasis?: boolean
}

export function MetricCard({ label, value, detail, className, emphasis = false }: MetricCardProps) {
  return (
    <article
      className={cn(
        'grid gap-2.5 rounded-lg border p-4',
        'shadow-panel transition-shadow duration-200',
        emphasis
          ? 'bg-gradient-to-br from-[rgba(13,37,29,0.94)] to-[rgba(8,18,22,0.90)] border-[rgba(98,255,196,0.22)]'
          : 'bg-surface-0 border-soft',
        className,
      )}
    >
      <span className="text-[0.68rem] uppercase tracking-[0.14em] text-[#87c8b2] font-medium">
        {label}
      </span>
      <strong className="text-[1.1rem] font-semibold text-text-0 font-mono leading-none">
        {value}
      </strong>
      {detail ? (
        <small className="text-[0.72rem] text-[#a9cabb] leading-relaxed font-normal">
          {detail}
        </small>
      ) : null}
    </article>
  )
}
