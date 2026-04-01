'use client'

import { useMemo } from 'react'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { MissionBanner } from '@/src/components/agents/MissionBanner'
import { AgentCard } from '@/src/components/agents/AgentCard'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'

export default function AgentsPage() {
  const { agents, missionContext } = useAgentsStore()

  const stats = useMemo(() => ({
    total:   agents.length,
    active:  agents.filter((a) => a.status === 'active').length,
    standby: agents.filter((a) => a.status === 'standby').length,
    blocked: agents.filter((a) => a.status === 'blocked').length,
  }), [agents])

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1400px]">
      <SectionHeading
        eyebrow="Agent Roster"
        title="Agents"
        description="Live operations layer — agent team status, current tasking, and mission alignment"
      />

      <MissionBanner ctx={missionContext} agents={agents} />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total" value={String(stats.total)} detail="Agents in roster" />
        <MetricCard label="Active" value={String(stats.active)} detail="Currently executing" emphasis={stats.active > 0} />
        <MetricCard label="Standby" value={String(stats.standby)} detail="Ready, awaiting tasking" />
        <MetricCard label="Blocked" value={String(stats.blocked)} detail="Needs intervention" />
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
