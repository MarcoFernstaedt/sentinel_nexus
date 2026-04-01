import { MetricRibbon } from '@/src/components/dashboard/MetricRibbon'
import { MissionProgressPanel } from '@/src/components/dashboard/MissionProgressPanel'
import { BlockersAlertsPanel } from '@/src/components/dashboard/BlockersAlertsPanel'
import { RecentCompletionsPanel } from '@/src/components/dashboard/RecentCompletionsPanel'
import { SuggestionPanel } from '@/src/components/dashboard/SuggestionPanel'
import { AttentionBoard } from '@/src/components/dashboard/AttentionBoard'
import { RecentActivity } from '@/src/components/dashboard/RecentActivity'
import { AgentStatusList } from '@/src/components/dashboard/AgentStatusList'

export default function DashboardPage() {
  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1600px]">

      {/* Row 1: Key metrics */}
      <MetricRibbon />

      {/* Row 2: Mission progress banner */}
      <MissionProgressPanel />

      {/* Row 3: Intelligence layer — blockers, completions, suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <BlockersAlertsPanel />
        <RecentCompletionsPanel />
        <SuggestionPanel />
      </div>

      {/* Row 4: Task board + agent roster / activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)] gap-5 items-start">
        <div className="grid gap-5">
          <AttentionBoard />
          <AgentStatusList />
        </div>
        <RecentActivity />
      </div>

    </div>
  )
}
