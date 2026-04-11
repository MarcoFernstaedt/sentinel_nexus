'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'
import { formatDateLabel } from '@/src/lib/date'

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

export default function SettingsPage() {
  const { agents, missionContext } = useAgentsStore()
  const { apiState } = useDashboard()

  const interfaceHeadingId   = 'settings-interface-heading'
  const apiHeadingId         = 'settings-api-heading'
  const systemHeadingId      = 'settings-system-heading'

  const agentCount = agents.length
  const targetDate = formatDateLabel(missionContext.targetDate)

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
          <SettingRow label="Version"      value="Sentinel Nexus v1"                    badge="alpha" badgeTone="pending" />
          <SettingRow label="Branch"       value="claude/nexus-platform-hardening-NNr1S" mono />
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
