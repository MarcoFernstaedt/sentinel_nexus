import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { cn } from '../../lib/cn'

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
      className={cn('ui-surface', `ui-surface--${tone}`, className)}
      aria-labelledby={labelledBy}
      {...props}
    >
      {header ? <div className="ui-surface__header">{header}</div> : null}
      <div className="ui-surface__body">{children}</div>
      {footer ? <div className="ui-surface__footer">{footer}</div> : null}
    </Component>
  )
}
