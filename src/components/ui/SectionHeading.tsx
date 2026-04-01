import type { ReactNode } from 'react'
import { cn } from '@/src/lib/cn'

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  id?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, description, id, className }: SectionHeadingProps) {
  return (
    <div className={cn('grid gap-1', className)}>
      <p className="text-[0.64rem] uppercase tracking-[0.18em] text-accent-mint font-medium">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="text-[0.92rem] font-semibold text-text-0 leading-tight"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-[0.78rem] text-text-2 leading-relaxed">{description}</p>
      ) : null}
    </div>
  )
}
