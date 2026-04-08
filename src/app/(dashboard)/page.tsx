import { MetricRibbon } from '@/src/components/dashboard/MetricRibbon'
import { MissionProgressPanel } from '@/src/components/dashboard/MissionProgressPanel'
import { OperatorQueue } from '@/src/components/dashboard/OperatorQueue'
import { BlockersAlertsPanel } from '@/src/components/dashboard/BlockersAlertsPanel'
import { RecentCompletionsPanel } from '@/src/components/dashboard/RecentCompletionsPanel'
import { SuggestionPanel } from '@/src/components/dashboard/SuggestionPanel'
import { NextActionsPanel } from '@/src/components/dashboard/NextActionsPanel'
import { AttentionBoard } from '@/src/components/dashboard/AttentionBoard'
import { RecentActivity } from '@/src/components/dashboard/RecentActivity'
import { AgentStatusList } from '@/src/components/dashboard/AgentStatusList'
import { ScheduleHealthPanel } from '@/src/components/dashboard/ScheduleHealthPanel'
import { ExecutionProofPanel } from '@/src/components/dashboard/ExecutionProofPanel'
import { RuntimePulsePanel } from '@/src/components/dashboard/RuntimePulsePanel'

export default function DashboardPage() {
  return (
    <div className="mx-auto grid max-w-[1680px] gap-5 px-4 py-4 md:px-5 md:py-5 2xl:px-7 2xl:py-6">

      {/* Row 1: Key metrics */}
      <MetricRibbon />

      {/* Row 2: Mission progress banner */}
      <MissionProgressPanel />

      {/* Row 2.5: Operator queue — tasks assigned to operator or pending approval */}
      <OperatorQueue />

      {/* Row 2.75: Reminder / schedule truth surfaces */}
      <ScheduleHealthPanel />

      {/* Row 2.9: Current mission and proof */}
      <ExecutionProofPanel />

      {/* Row 2.95: Small runtime truth strip */}
      <RuntimePulsePanel />

      {/* Row 3: Immediate operator guidance + intelligence */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-4 items-start">
        <NextActionsPanel />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <BlockersAlertsPanel />
          <RecentCompletionsPanel />
          <SuggestionPanel />
        </div>
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
