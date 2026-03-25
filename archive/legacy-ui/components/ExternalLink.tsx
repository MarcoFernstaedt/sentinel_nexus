import type { PropsWithChildren } from 'react'

type ExternalLinkProps = PropsWithChildren<{
  href: string
  className?: string
}>

export function ExternalLink({
  href,
  className,
  children,
}: ExternalLinkProps) {
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  )
}
