import type { PropsWithChildren } from 'react'
import { cn } from '@/src/lib/cn'

type BadgeTone = 'default' | 'subtle' | 'live' | 'warning' | 'critical' | 'pending'

const toneClasses: Record<BadgeTone, string> = {
  default:
    'bg-[rgba(19,56,43,0.32)] border-[rgba(127,247,205,0.18)] text-[#dbfff2]',
  live:
    'bg-gradient-to-br from-[rgba(36,255,156,0.18)] to-[rgba(83,201,255,0.20)] border-[rgba(98,255,196,0.30)] text-[#b8fff3]',
  warning:
    'bg-[rgba(255,203,97,0.12)] border-[rgba(255,203,97,0.28)] text-[#ffcb61]',
  critical:
    'bg-[rgba(255,112,112,0.12)] border-[rgba(255,112,112,0.30)] text-[rgba(255,112,112,1)]',
  subtle:
    'bg-white/[0.04] border-white/[0.08] text-[#b6d8cb]',
  pending:
    'bg-[rgba(14,25,34,0.70)] border-[rgba(126,255,210,0.10)] text-[#9fb9af]',
}

export function StatusBadge({
  children,
  tone = 'default',
  className,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 px-[0.58rem] py-[0.26rem]',
        'rounded-full border text-[0.7rem] tracking-[0.04em] font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {tone === 'live' && (
        <span
          className="w-[5px] h-[5px] rounded-full bg-[#7ef7cd] shadow-[0_0_5px_rgba(126,255,210,0.8)]"
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}
