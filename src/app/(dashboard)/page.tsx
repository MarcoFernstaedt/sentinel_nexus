'use client'

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
import { GoalProgressPanel } from '@/src/components/dashboard/GoalProgressPanel'
import { HabitTrackerPanel } from '@/src/components/dashboard/HabitTrackerPanel'
import { WelcomePanel } from '@/src/components/dashboard/WelcomePanel'
import { useDashboard } from '@/src/components/dashboard/DashboardDataProvider'

export default function DashboardPage() {
  const { runtimeTasks, missionCommand, apiState } = useDashboard()
  const isFirstRun =
    apiState === 'connected' &&
    runtimeTasks.length === 0 &&
    (missionCommand.goals ?? []).length === 0 &&
    (missionCommand.habits ?? []).length === 0

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1600px]">

      {/* First-run onboarding — shown until operator creates first task or goal */}
      {isFirstRun && <WelcomePanel />}

      {/* Row 1: Key metrics */}
      <MetricRibbon />

      {/* Row 2: Mission progress banner */}
      <MissionProgressPanel />

      {/* Row 2.5: Operator queue — tasks assigned to operator or pending approval */}
      <OperatorQueue />

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

      {/* Row 5: Goals + Habits */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <GoalProgressPanel />
        <HabitTrackerPanel />
      </div>

    </div>
  )
}
