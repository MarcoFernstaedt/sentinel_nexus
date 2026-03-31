'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/cn'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'

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
  const { apiState } = useDashboard()
  const isOnline = apiState === 'connected'

  const routeKey = Object.keys(routeLabels)
    .filter((k) => k !== '/')
    .find((k) => pathname.startsWith(k)) ?? '/'
  const route = routeLabels[routeKey] ?? routeLabels['/']

  return (
    <header
      className={cn(
        'flex h-11 flex-shrink-0 items-center px-5 gap-4',
        'border-b border-soft',
        'bg-gradient-to-b from-[rgba(7,14,20,0.96)] to-[rgba(5,10,14,0.88)]',
        'backdrop-blur-sm',
      )}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-[0.62rem] uppercase tracking-[0.16em] text-text-3 font-medium leading-none">
          {route.eyebrow}
        </span>
        <span className="text-text-3 text-[10px]">/</span>
        <span className="text-[0.75rem] font-medium text-text-1 leading-none">
          {route.label}
        </span>
      </div>

      {/* Right: clock + status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* UTC Clock */}
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] uppercase tracking-[0.12em] text-text-3">UTC</span>
          <span className="text-[0.72rem] font-mono text-text-2 tabular-nums">
            {time || '--:--:--'}
          </span>
        </div>

        <span className="w-px h-3 bg-border-soft" aria-hidden />

        {/* Status chip */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-[0.22rem] rounded-full border',
            isOnline
              ? 'border-[rgba(98,255,196,0.18)] bg-[rgba(14,40,28,0.40)]'
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
          )}>
            {isOnline ? 'Nominal' : 'Local Mode'}
          </span>
        </div>
      </div>
    </header>
  )
}
