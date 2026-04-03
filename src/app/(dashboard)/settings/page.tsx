'use client'

import React, { useEffect, useState } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'
import { useSoundContext } from '@/src/context/SoundContext'
import { cn } from '@/src/lib/cn'

function SettingRow({
  label,
  value,
  badge,
  badgeTone = 'subtle',
  mono = false,
}: {
  label: string
  value: string
  badge?: string
  badgeTone?: 'live' | 'warning' | 'critical' | 'subtle' | 'pending' | 'default'
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-soft last:border-0">
      <span className="text-[0.74rem] text-text-2 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-[0.74rem] text-text-0 truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
        {badge && <StatusBadge tone={badgeTone} className="flex-shrink-0">{badge}</StatusBadge>}
      </div>
    </div>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[0.62rem] font-medium text-text-3 uppercase tracking-wider mb-3 ${className ?? ''}`}>{children}</p>
  )
}

function ApiKeyRow() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/key')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { apiKey?: string } | null) => {
        if (data?.apiKey) setApiKey(data.apiKey)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCopy() {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskedKey = apiKey ? `${apiKey.slice(0, 8)}${'•'.repeat(24)}` : '—'
  const displayKey = revealed ? (apiKey ?? '—') : maskedKey

  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-soft last:border-0">
      <div className="grid gap-0.5 min-w-0 flex-1">
        <span className="text-[0.74rem] text-text-2">Agent API Key</span>
        <span className="text-[0.62rem] text-text-3">Use as <code className="font-mono text-[#53c9ff]">X-Nexus-Key</code> header for direct API access</span>
        {!loading && (
          <code className="text-[0.7rem] font-mono text-[rgba(126,247,205,0.8)] mt-1 break-all leading-relaxed">
            {displayKey}
          </code>
        )}
        {loading && <span className="text-[0.7rem] text-text-3 font-mono mt-1">Loading…</span>}
      </div>
      {apiKey && (
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className={cn(
              'px-2 py-1 rounded-[6px] text-[0.6rem] font-medium uppercase tracking-[0.06em]',
              'border border-[rgba(126,255,210,0.18)] bg-[rgba(36,255,156,0.05)]',
              'text-[rgba(126,247,205,0.6)] hover:text-[rgba(126,247,205,0.9)] hover:bg-[rgba(36,255,156,0.1)] transition-colors duration-150',
            )}
            aria-label={revealed ? 'Hide API key' : 'Reveal API key'}
          >
            {revealed ? 'Hide' : 'Reveal'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'px-2 py-1 rounded-[6px] text-[0.6rem] font-medium uppercase tracking-[0.06em]',
              'border transition-all duration-150',
              copied
                ? 'border-[rgba(65,255,165,0.45)] bg-[rgba(65,255,165,0.12)] text-[#41ffa5]'
                : 'border-[rgba(126,255,210,0.18)] bg-[rgba(36,255,156,0.05)] text-[rgba(126,247,205,0.6)] hover:bg-[rgba(36,255,156,0.1)]',
            )}
            aria-label={copied ? 'Copied' : 'Copy API key'}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}

function SoundSettingRow() {
  const { soundEnabled, setSoundEnabled, play } = useSoundContext()

  function handleToggle() {
    const next = !soundEnabled
    setSoundEnabled(next)
    // Play a preview sound when enabling
    if (next) setTimeout(() => play('action-click'), 50)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-soft last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[0.74rem] text-text-2 flex-shrink-0">Sound Effects</span>
        <span className="text-[0.62rem] text-text-3">UI audio feedback — startup chime, clicks, approvals</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors duration-200',
          soundEnabled
            ? 'bg-[rgba(36,255,156,0.18)] border-[rgba(126,255,210,0.35)]'
            : 'bg-surface-0 border-soft',
        )}
      >
        <span className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-accent-mint transition-transform duration-200',
          soundEnabled ? 'translate-x-4' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { agents, missionContext } = useAgentsStore()
  const { apiState } = useDashboard()

  const interfaceHeadingId   = 'settings-interface-heading'
  const apiHeadingId         = 'settings-api-heading'
  const authHeadingId        = 'settings-auth-heading'
  const systemHeadingId      = 'settings-system-heading'

  const agentCount = agents.length
  const parsedTargetDate = missionContext.targetDate ? new Date(missionContext.targetDate) : null
  const targetDate = parsedTargetDate && !Number.isNaN(parsedTargetDate.getTime())
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(parsedTargetDate)
    : '—'

  return (
    <div className="px-5 py-5 space-y-5">
      <SectionHeading
        eyebrow="Configuration"
        title="Settings"
        description="Runtime configuration and system information. All values are read-only."
      />

      <div className="grid gap-4 max-w-2xl">

        {/* Interface */}
        <Surface
          header={<SectionHeading id={interfaceHeadingId} eyebrow="Display" title="Interface" />}
          labelledBy={interfaceHeadingId}
        >
          <SectionLabel>Appearance</SectionLabel>
          <SettingRow label="Theme"         value="Dark"     badge="System Default" badgeTone="subtle" />
          <SettingRow label="Accent color"  value="Mint"     badge="Locked"         badgeTone="subtle" />
          <SettingRow label="Clock format"  value="UTC 24h"  badge="System Default" badgeTone="subtle" />
          <SettingRow label="Sidebar"       value="Expanded" badge="System Default" badgeTone="subtle" />
          <SectionLabel className="mt-4">Audio</SectionLabel>
          <SoundSettingRow />
        </Surface>

        {/* Auth & Access */}
        <Surface
          header={<SectionHeading id={authHeadingId} eyebrow="Security" title="Auth & Access" />}
          labelledBy={authHeadingId}
        >
          <SectionLabel>Agent Access</SectionLabel>
          <ApiKeyRow />
        </Surface>

        {/* API Connection */}
        <Surface
          header={<SectionHeading id={apiHeadingId} eyebrow="Network" title="API Connection" />}
          labelledBy={apiHeadingId}
        >
          <SectionLabel>Gateway</SectionLabel>
          <SettingRow
            label="Status"
            value={apiState === 'connected' ? 'Connected' : 'Offline — local fallback'}
            badge={apiState === 'connected' ? 'Connected' : 'Offline'}
            badgeTone={apiState === 'connected' ? 'live' : 'warning'}
          />
          <SettingRow label="Endpoint"   value="localhost:3001"              mono />
          <SettingRow label="Proxy path" value="/api/* → localhost:3001/api/*" mono />
          <SettingRow
            label="Last sync"
            value={apiState === 'connected' ? 'Active' : 'Not connected'}
            badgeTone="subtle"
          />
        </Surface>

        {/* System Information */}
        <Surface
          header={<SectionHeading id={systemHeadingId} eyebrow="System" title="Information" />}
          labelledBy={systemHeadingId}
        >
          <SectionLabel>Build</SectionLabel>
          <SettingRow label="Version"      value="Mission Control v1.0"              badge="dev" badgeTone="pending" />
          <SettingRow label="Branch"       value="claude/mission-control-foundation-pdjBS" mono />
          <SettingRow label="Stack"        value="Next.js 15 · React 19 · Tailwind CSS v4" />
          <SettingRow label="Runtime"      value="Node.js 20 · Edge-ready"           />

          <SectionLabel className="mt-4">Mission</SectionLabel>
          <SettingRow label="Target date"  value={targetDate}                        mono />
          <SettingRow label="Agent count"  value={`${agentCount} active agents`}     />
          <SettingRow label="Progress"     value={`${missionContext.progressPercent}%`} mono />
        </Surface>

      </div>
    </div>
  )
}
