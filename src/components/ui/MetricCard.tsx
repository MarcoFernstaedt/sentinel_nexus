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
        'relative grid gap-3 overflow-hidden rounded-xl border p-4 lg:p-5',
        'shadow-panel backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-200',
        emphasis
          ? 'border-[rgba(98,255,196,0.22)] bg-[linear-gradient(180deg,rgba(15,38,31,0.94),rgba(8,18,22,0.92))]'
          : 'border-soft bg-[linear-gradient(180deg,rgba(11,19,27,0.88),rgba(7,13,19,0.82))]',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" aria-hidden />
      <span className="text-[0.64rem] uppercase tracking-[0.18em] text-[#87c8b2] font-medium">
        {label}
      </span>
      <strong className="text-[1.28rem] font-semibold text-text-0 font-mono leading-none tracking-[-0.02em]">
        {value}
      </strong>
      {detail ? (
        <small className="text-[0.72rem] text-[#a9cabb] leading-relaxed font-normal max-w-[28ch]">
          {detail}
        </small>
      ) : null}
    </article>
  )
}
