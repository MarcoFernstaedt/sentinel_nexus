'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'
import { useSoundContext } from '@/src/context/SoundContext'
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  CalendarDays,
  MessageSquare,
  Activity,
  FileText,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react'
import { cn } from '@/src/lib/cn'

const navItems = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard, group: null },
  { href: '/projects',  label: 'Projects',   icon: FolderKanban,    group: 'EXECUTION' },
  { href: '/tasks',     label: 'Tasks',       icon: ListTodo,        group: 'EXECUTION' },
  { href: '/calendar',  label: 'Calendar',    icon: CalendarDays,    group: 'EXECUTION' },
  { href: '/chat',      label: 'Chat',        icon: MessageSquare,   group: 'COMMS' },
  { href: '/telemetry', label: 'Telemetry',   icon: Activity,        group: 'SYSTEMS' },
  { href: '/agents',    label: 'Agents',      icon: Radio,           group: null },
  { href: '/notes',     label: 'Notes',       icon: FileText,        group: null },
  { href: '/docs',      label: 'Docs',        icon: BookOpen,        group: null },
  { href: '/settings',  label: 'Settings',    icon: Settings,        group: null },
]

const ariaDescriptions: Record<string, string> = {
  '/':          'Mission overview — system status at a glance',
  '/projects':  'Execution layer — all active projects',
  '/tasks':     'Task board — granular execution tracking',
  '/calendar':  'Mission schedule and milestones',
  '/chat':      'Command interface — issue directives to agents',
  '/telemetry': 'Systems telemetry — health and metrics',
  '/agents':    'Agent roster — supervise AI agents',
  '/notes':     'Operator notes and field observations',
  '/docs':      'Artifact vault — mission documents',
  '/settings':  'System configuration and preferences',
}

interface NavItemProps {
  href: string
  label: string
  icon: React.ElementType
  collapsed: boolean
  active: boolean
  onNavigate?: () => void
}

function NavItem({ href, label, icon: Icon, collapsed, active, onNavigate }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        'relative flex items-center gap-3 rounded-[10px] transition-all duration-150',
        'border-l-2 text-sm font-medium',
        collapsed ? 'justify-center px-0 py-2.5 mx-1' : 'px-4 py-2.5',
        active
          ? 'border-accent-mint bg-[rgba(14,45,33,0.52)] text-text-0'
          : 'border-transparent text-text-2 hover:text-text-1 hover:bg-white/[0.03]',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        size={16}
        className={cn(
          'flex-shrink-0 transition-colors duration-150',
          active ? 'text-accent-mint' : 'text-text-2',
        )}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span className="leading-none tracking-[0.01em]">{label}</span>
          <span className="sr-only"> — {ariaDescriptions[href]}</span>
        </>
      )}
      {active && !collapsed && (
        <span
          className="absolute right-3 w-1 h-1 rounded-full bg-accent-mint opacity-80"
          aria-hidden
        />
      )}
    </Link>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { apiState, mobileNavOpen, setMobileNavOpen } = useDashboard()
  const { play } = useSoundContext()
  const isOnline = apiState === 'connected'

  const toggle = useCallback(() => {
    play('sidebar-toggle')
    setCollapsed((c) => !c)
  }, [play])

  // Keyboard shortcut: [ to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
        toggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}

    <aside
      id="sidebar"
      className={cn(
        'h-dvh flex-shrink-0 flex-col',
        'border-r border-soft',
        'bg-gradient-to-b from-[rgba(3,9,13,0.97)] to-[rgba(5,11,16,0.90)]',
        'backdrop-blur-[20px]',
        'overflow-hidden',
        // Mobile: overlay when open, hidden when closed
        mobileNavOpen
          ? 'flex fixed inset-y-0 left-0 z-50 w-[240px] shadow-elevated'
          : 'hidden',
        // Desktop: always shown, width based on collapsed state
        'md:flex md:relative md:transition-[width] md:duration-200 md:ease-out md:shadow-none',
        collapsed ? 'md:w-[56px]' : 'md:w-[220px]',
      )}
      aria-label="Sentinel Nexus mission control navigation"
    >
      {/* Header */}
      <div
        className={cn(
          'flex flex-shrink-0 items-center border-b border-soft',
          collapsed ? 'justify-center px-0 py-4' : 'px-5 py-4 gap-3',
        )}
      >
        {/* Logo mark */}
        <div
          className="flex-shrink-0 w-7 h-7 rounded-[8px] border border-[rgba(126,255,210,0.28)] bg-gradient-to-br from-[rgba(36,255,156,0.18)] to-[rgba(83,201,255,0.14)] flex items-center justify-center"
          aria-hidden
        >
          <span className="logo-glow text-[10px] font-bold text-accent-mint font-mono leading-none">SN</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-accent-mint-dim font-medium leading-none mb-0.5">
              Sentinel Nexus
            </p>
            <p className="text-[0.72rem] font-semibold text-text-0 leading-none truncate">
              Mission Control
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-px overflow-y-auto py-3 px-2 min-h-0">
        {navItems.map((item, i) => {
          const prevItem = navItems[i - 1]
          const showGroup = !collapsed && item.group && item.group !== prevItem?.group

          return (
            <div key={item.href}>
              {showGroup && (
                <p className="px-4 pb-1 pt-3 text-[0.6rem] uppercase tracking-[0.18em] text-text-3 font-medium" aria-hidden>
                  {item.group}
                </p>
              )}
              <NavItem
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
                active={isActive(item.href)}
                onNavigate={() => {
                  play('nav')
                  setMobileNavOpen(false)
                }}
              />
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'flex-shrink-0 border-t border-soft',
        collapsed ? 'flex flex-col items-center gap-2 py-3' : 'flex items-center justify-between px-4 py-3',
      )}>
        {/* Connection indicator */}
        <div className={cn(
          'flex items-center gap-2',
          collapsed && 'flex-col gap-1',
        )}>
          <span className="relative flex h-2 w-2" aria-hidden>
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7ef7cd] opacity-50" />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                isOnline ? 'bg-[#7ef7cd]' : 'bg-accent-warn',
              )}
            />
          </span>
          {!collapsed && (
            <span className={cn(
              'text-[0.66rem] uppercase tracking-[0.1em] font-medium',
              isOnline ? 'text-text-2' : 'text-accent-warn',
            )} aria-hidden>
              {isOnline ? 'API' : 'Local'}
            </span>
          )}
        </div>
        {/* Screen-reader connection status */}
        <span className="sr-only">
          {isOnline ? 'Connection status: nominal — API online' : 'Connection status: local mode — API offline'}
        </span>

        {/* Toggle button */}
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex items-center justify-center rounded-[8px] w-7 h-7',
            'border border-soft bg-surface-0',
            'text-text-3 hover:text-text-1 hover:border-med',
            'transition-colors duration-150',
          )}
          aria-label={
            collapsed
              ? 'Expand navigation panel — keyboard shortcut: open bracket'
              : 'Collapse navigation panel — keyboard shortcut: open bracket'
          }
          title={`Press [ to toggle (${collapsed ? 'expand' : 'collapse'})`}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </aside>
    </>
  )
}
