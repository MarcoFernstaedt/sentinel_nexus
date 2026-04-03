'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'
import { useSoundContext } from '@/src/context/SoundContext'

const routeLabels: Record<string, { label: string; eyebrow: string }> = {
  '/':           { label: 'Dashboard',  eyebrow: 'Overview' },
  '/projects':   { label: 'Projects',   eyebrow: 'Execution' },
  '/tasks':      { label: 'Tasks',      eyebrow: 'Execution Board' },
  '/calendar':   { label: 'Calendar',   eyebrow: 'Schedule' },
  '/chat':       { label: 'Chat',       eyebrow: 'Command Interface' },
  '/telemetry':  { label: 'Telemetry',  eyebrow: 'System Health' },
  '/agents':     { label: 'Agents',     eyebrow: 'Agent Roster' },
  '/notes':      { label: 'Notes',      eyebrow: 'Operator Notes' },
  '/docs':       { label: 'Docs',       eyebrow: 'Artifact Vault' },
  '/settings':   { label: 'Settings',   eyebrow: 'Configuration' },
}

function useUtcClock() {
  const [time, setTime] = useState('')
  const [iso, setIso] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const hh = now.getUTCHours().toString().padStart(2, '0')
      const mm = now.getUTCMinutes().toString().padStart(2, '0')
      const ss = now.getUTCSeconds().toString().padStart(2, '0')
      setTime(`${hh}:${mm}:${ss}`)
      setIso(now.toISOString())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { time, iso }
}

export function TopBar() {
  const pathname = usePathname()
  const { time, iso } = useUtcClock()
  const { apiState, mobileNavOpen, setMobileNavOpen } = useDashboard()
  const { play } = useSoundContext()
  const isOnline = apiState === 'connected'

  const routeKey = Object.keys(routeLabels)
    .filter((k) => k !== '/')
    .find((k) => pathname.startsWith(k)) ?? '/'
  const route = routeLabels[routeKey] ?? routeLabels['/']

  return (
    <header
      role="banner"
      className={cn(
        'flex h-11 flex-shrink-0 items-center px-5 gap-4',
        'border-b border-soft',
        'bg-gradient-to-b from-[rgba(7,14,20,0.96)] to-[rgba(5,10,14,0.88)]',
        'backdrop-blur-sm',
      )}
    >
      {/* Mobile nav toggle */}
      <button
        type="button"
        onClick={() => {
          play('sidebar-toggle')
          setMobileNavOpen((v) => !v)
        }}
        className={cn(
          'flex md:hidden items-center justify-center w-7 h-7 flex-shrink-0',
          'rounded-[8px] border border-soft bg-surface-0',
          'text-text-2 hover:text-text-1 hover:border-med transition-colors duration-150',
        )}
        aria-label={mobileNavOpen ? 'Close mission control navigation' : 'Open mission control navigation'}
        aria-expanded={mobileNavOpen}
        aria-controls="sidebar"
      >
        {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
      </button>

      {/* Left: breadcrumb */}
      <nav aria-label="Current section" className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-text-3 font-medium leading-none" aria-hidden>
          {route.eyebrow}
        </span>
        <span className="text-text-3 text-[10px]" aria-hidden>/</span>
        <span className="text-[0.75rem] font-medium text-text-1 leading-none">
          {route.label}
        </span>
      </nav>

      {/* Right: clock + status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* UTC Clock */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] uppercase tracking-[0.12em] text-text-3" aria-hidden>UTC</span>
          <time
            dateTime={iso}
            aria-label={time ? `Mission clock: ${time} UTC` : 'Mission clock loading'}
            className="text-[0.72rem] font-mono text-text-2 tabular-nums"
          >
            {time || '--:--:--'}
          </time>
        </div>

        <span className="w-px h-3 bg-border-soft" aria-hidden />

        {/* Status chip */}
        <div
          role="status"
          aria-label={isOnline ? 'System status: nominal' : 'System status: local mode — API offline'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-[0.22rem] rounded-full border',
            isOnline
              ? 'status-nominal border-[rgba(98,255,196,0.18)] bg-[rgba(14,40,28,0.40)]'
              : 'border-[rgba(255,203,97,0.20)] bg-[rgba(40,28,10,0.40)]',
          )}
        >
          <span
            className={cn(
              'w-[5px] h-[5px] rounded-full opacity-80',
              isOnline ? 'bg-accent-mint' : 'bg-accent-warn',
            )}
            aria-hidden
          />
          <span className={cn(
            'text-[0.62rem] uppercase tracking-[0.1em] font-medium',
            isOnline ? 'text-[#a8e8ca]' : 'text-accent-warn',
          )} aria-hidden>
            {isOnline ? 'Nominal' : 'Local Mode'}
          </span>
        </div>
      </div>
    </header>
  )
}
