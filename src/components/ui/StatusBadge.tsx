import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/cn'

type BadgeTone = 'default' | 'subtle' | 'live' | 'warning'

export function StatusBadge({
  children,
  tone = 'default',
  className,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return <span className={cn('status-pill', tone !== 'default' && `status-pill--${tone}`, className)}>{children}</span>
}
