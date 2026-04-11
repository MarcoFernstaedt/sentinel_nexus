'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'

const routeLabels: Record<string, { label: string; eyebrow: string }> = {
  '/':           { label: 'Dashboard',  eyebrow: 'Overview' },
  '/projects':   { label: 'Projects',   eyebrow: 'Execution' },
  '/tasks':      { label: 'Tasks',      eyebrow: 'Execution Board' },
  '/calendar':   { label: 'Calendar',   eyebrow: 'Schedule' },
  '/tracking':   { label: 'Tracking',   eyebrow: 'Execution Enforcement' },
  '/chat':       { label: 'Chat',       eyebrow: 'Command Interface' },
  '/agents':     { label: 'Agents',     eyebrow: 'Agent Roster' },
  '/notes':      { label: 'Notes',      eyebrow: 'Operator Notes' },
  '/docs':       { label: 'Docs',       eyebrow: 'Artifact Vault' },
  '/settings':   { label: 'Settings',   eyebrow: 'Configuration' },
}

function useUtcClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const hh = now.getUTCHours().toString().padStart(2, '0')
      const mm = now.getUTCMinutes().toString().padStart(2, '0')
      const ss = now.getUTCSeconds().toString().padStart(2, '0')
      setTime(`${hh}:${mm}:${ss}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

export function TopBar() {
  const pathname = usePathname()
  const time = useUtcClock()
  const { apiState, mobileNavOpen, setMobileNavOpen } = useDashboard()
  const isOnline = apiState === 'connected'

  const routeKey = Object.keys(routeLabels)
    .filter((k) => k !== '/')
    .find((k) => pathname.startsWith(k)) ?? '/'
  const route = routeLabels[routeKey] ?? routeLabels['/']

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex min-h-14 flex-shrink-0 flex-wrap items-center gap-3 px-3 py-2 sm:flex-nowrap sm:px-4 md:px-5',
        'border-b border-soft',
        'bg-[linear-gradient(180deg,rgba(9,16,23,0.96),rgba(5,10,15,0.86))]',
        'backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.18)]',
      )}
    >
      {/* Mobile nav toggle */}
      <button
        type="button"
        onClick={() => setMobileNavOpen((v) => !v)}
        className={cn(
          'flex md:hidden items-center justify-center w-7 h-7 flex-shrink-0',
          'rounded-[8px] border border-soft bg-surface-0',
          'text-text-2 hover:text-text-1 hover:border-med transition-colors duration-150',
        )}
        aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
      </button>

      {/* Left: breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-3 basis-0">
        <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-[10px] border border-[rgba(126,255,210,0.16)] bg-[rgba(126,255,210,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <span className="text-[0.62rem] font-mono font-semibold tracking-[0.08em] text-accent-mint">SN</span>
        </div>
        <div className="min-w-0 grid gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.18em] text-text-3 font-medium leading-none">
            {route.eyebrow}
          </span>
          <span className="text-[0.88rem] font-semibold text-text-0 leading-none truncate">
            {route.label}
          </span>
        </div>
      </div>

      {/* Right: clock + status */}
      <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto md:gap-3 flex-shrink-0">
        <div className="hidden sm:grid gap-0.5 rounded-full border border-soft bg-[rgba(255,255,255,0.03)] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <span className="text-[0.54rem] uppercase tracking-[0.18em] text-text-3">Reference Time</span>
          <span className="text-[0.72rem] font-mono text-text-2 tabular-nums">
            UTC {time || '--:--:--'}
          </span>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
            isOnline
              ? 'border-[rgba(98,255,196,0.18)] bg-[rgba(14,40,28,0.38)]'
              : 'border-[rgba(255,203,97,0.20)] bg-[rgba(40,28,10,0.38)]',
          )}
        >
          <span
            className={cn(
              'w-[6px] h-[6px] rounded-full opacity-90 shadow-[0_0_10px_currentColor]',
              isOnline ? 'bg-accent-mint text-accent-mint' : 'bg-accent-warn text-accent-warn',
            )}
            aria-hidden
          />
          <span className="text-[0.54rem] uppercase tracking-[0.18em] text-text-3 hidden md:inline">
            Runtime
          </span>
          <span className={cn(
            'text-[0.64rem] uppercase tracking-[0.12em] font-semibold',
            isOnline ? 'text-[#a8e8ca]' : 'text-accent-warn',
          )}>
            {isOnline ? 'Nominal' : 'Local Mode'}
          </span>
        </div>
      </div>
    </header>
  )
}
