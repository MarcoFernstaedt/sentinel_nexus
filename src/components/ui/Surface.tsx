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
  default: 'bg-[image:var(--surface-glass)] border-soft',
  accent:  'bg-[image:var(--surface-glass-strong)] border-[rgba(126,255,210,0.18)]',
  subtle:  'bg-gradient-to-b from-[rgba(8,15,22,0.92)] to-[rgba(5,10,15,0.84)] border-[rgba(255,255,255,0.05)]',
  success: 'bg-[image:var(--surface-glass)] border-[rgba(98,255,196,0.22)]',
  warning: 'bg-[image:var(--surface-glass)] border-[rgba(255,203,97,0.24)]',
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
        'rounded-xl border shadow-panel backdrop-blur-xl overflow-hidden',
        'before:pointer-events-none before:absolute before:inset-px before:rounded-[calc(var(--radius-xl)-1px)] before:border before:border-white/[0.03] before:content-[""]',
        'relative transition-[transform,box-shadow,border-color] duration-200',
        toneClasses[tone],
        className,
      )}
      aria-labelledby={labelledBy}
      {...props}
    >
      {header ? (
        <div className="px-5 pt-4 pb-3 border-b border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent)]">{header}</div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="px-5 pb-4 pt-3 border-t border-soft bg-[linear-gradient(0deg,rgba(255,255,255,0.02),transparent)]">{footer}</div>
      ) : null}
    </Component>
  )
}
