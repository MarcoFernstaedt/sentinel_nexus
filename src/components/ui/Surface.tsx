import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/src/lib/cn'

type SurfaceTone = 'default' | 'accent' | 'subtle' | 'success' | 'warning'
type SurfaceElement = 'article' | 'section' | 'div'

type SurfaceProps = PropsWithChildren<{
  as?: SurfaceElement
  className?: string
  tone?: SurfaceTone
  header?: ReactNode
  footer?: ReactNode
  labelledBy?: string
}> & HTMLAttributes<HTMLElement>

const toneClasses: Record<SurfaceTone, string> = {
  default: 'bg-surface-0 border-soft',
  accent:  'bg-gradient-to-b from-[rgba(10,24,20,0.98)] to-[rgba(6,15,18,0.95)] border-soft',
  subtle:  'bg-gradient-to-b from-[rgba(7,14,20,0.94)] to-[rgba(5,11,15,0.86)] border-[rgba(255,255,255,0.05)]',
  success: 'bg-surface-0 border-[rgba(98,255,196,0.22)]',
  warning: 'bg-surface-0 border-[rgba(255,203,97,0.24)]',
}

export function Surface({
  as = 'section',
  children,
  className,
  tone = 'default',
  header,
  footer,
  labelledBy,
  ...props
}: SurfaceProps) {
  const Component = as

  return (
    <Component
      className={cn(
        'rounded-lg border shadow-panel',
        toneClasses[tone],
        className,
      )}
      aria-labelledby={labelledBy}
      {...props}
    >
      {header ? (
        <div className="px-5 pt-4 pb-3 border-b border-soft">{header}</div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="px-5 pb-4 pt-3 border-t border-soft">{footer}</div>
      ) : null}
    </Component>
  )
}
