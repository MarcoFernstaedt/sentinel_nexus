import type { PropsWithChildren } from 'react'
import { cn } from '@/src/lib/cn'

type BadgeTone = 'default' | 'subtle' | 'live' | 'warning' | 'critical' | 'pending'

const toneClasses: Record<BadgeTone, string> = {
  default:
    'bg-[rgba(0,32,22,0.40)] border-[rgba(0,255,179,0.22)] text-[#ccfff0]',
  live:
    'bg-gradient-to-br from-[rgba(0,255,179,0.16)] to-[rgba(0,212,255,0.18)] border-[rgba(0,255,179,0.34)] text-[#a0ffe4]',
  warning:
    'bg-[rgba(255,170,0,0.12)] border-[rgba(255,170,0,0.30)] text-[#ffaa00]',
  critical:
    'bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.32)] text-[#ff3d3d]',
  subtle:
    'bg-white/[0.04] border-white/[0.09] text-[#96b8ac]',
  pending:
    'bg-[rgba(10,20,34,0.72)] border-[rgba(0,255,179,0.10)] text-[#8aaa9f]',
}

export function StatusBadge({
  children,
  tone = 'default',
  className,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  const isDynamic = tone === 'live' || tone === 'critical'

  return (
    <span
      role={isDynamic ? 'status' : undefined}
      className={cn(
        'inline-flex w-fit items-center gap-1.5 px-[0.58rem] py-[0.26rem]',
        'rounded-full border text-[0.7rem] tracking-[0.04em] font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {tone === 'live' && (
        <span
          className="w-[5px] h-[5px] rounded-full bg-[#00ffb3] shadow-[0_0_6px_rgba(0,255,179,0.90)] motion-safe:animate-pulse"
          aria-hidden
        />
      )}
      {tone === 'critical' && (
        <span
          className="w-[5px] h-[5px] rounded-full bg-[#ff3d3d] shadow-[0_0_6px_rgba(255,61,61,0.90)]"
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
