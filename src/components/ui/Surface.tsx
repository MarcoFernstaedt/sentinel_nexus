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
  accent:  'bg-[image:var(--surface-glass-strong)] border-[rgba(0,255,179,0.22)] shadow-elevated',
  subtle:  'bg-gradient-to-b from-[rgba(6,12,22,0.94)] to-[rgba(3,8,16,0.88)] border-[rgba(255,255,255,0.05)]',
  success: 'bg-[image:var(--surface-glass)] border-[rgba(0,255,179,0.26)]',
  warning: 'bg-[image:var(--surface-glass)] border-[rgba(255,170,0,0.26)]',
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
        'before:pointer-events-none before:absolute before:inset-px before:rounded-[calc(var(--radius-xl)-1px)] before:border before:border-white/[0.05] before:content-[""]',
        'relative transition-[transform,box-shadow,border-color] duration-200',
        toneClasses[tone],
        className,
      )}
      aria-labelledby={labelledBy}
      {...props}
    >
      {header ? (
        <div className="px-5 pt-4 pb-3 border-b border-soft bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]">
          {header}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="px-5 pb-4 pt-3 border-t border-soft bg-[linear-gradient(0deg,rgba(255,255,255,0.025),transparent)]">
          {footer}
        </div>
      ) : null}
    </Component>
  )
}
