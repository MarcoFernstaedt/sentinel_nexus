import { DashboardDataProvider } from '@/src/components/dashboard/DashboardDataProvider'
import { MetricRibbon } from '@/src/components/dashboard/MetricRibbon'
import { SystemStatusGrid } from '@/src/components/dashboard/SystemStatusGrid'
import { AttentionBoard } from '@/src/components/dashboard/AttentionBoard'
import { RecentActivity } from '@/src/components/dashboard/RecentActivity'
import { AgentStatusList } from '@/src/components/dashboard/AgentStatusList'

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <div className="px-5 py-5 grid gap-5 max-w-[1600px]">
        <MetricRibbon />
        <SystemStatusGrid />
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)] gap-5 items-start">
          <div className="grid gap-5">
            <AttentionBoard />
            <AgentStatusList />
          </div>
          <RecentActivity />
        </div>
      </div>
    </DashboardDataProvider>
  )
}
