import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type MetricCardProps = {
  label: string
  value: ReactNode
  detail?: ReactNode
  className?: string
  emphasis?: boolean
}

export function MetricCard({ label, value, detail, className, emphasis = false }: MetricCardProps) {
  return (
    <article className={cn('ui-metric-card', emphasis && 'ui-metric-card--emphasis', className)}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}
