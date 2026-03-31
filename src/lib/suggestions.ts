import type { Project, Task } from '@/src/types/projects'
import type { Agent } from '@/src/types/agents'
import type { CalendarItem } from '@/src/types/calendar'

export type SuggestionCategory =
  | 'bottleneck'
  | 'missed-opportunity'
  | 'workflow'
  | 'productivity'
  | 'app-improvement'

export type SuggestionPriority = 'critical' | 'high' | 'medium'

export interface Suggestion {
  id: string
  category: SuggestionCategory
  priority: SuggestionPriority
  title: string
  detail: string
  actionHint?: string
}

const CATEGORY_LABEL: Record<SuggestionCategory, string> = {
  bottleneck:          'Bottleneck',
  'missed-opportunity': 'Missed Opportunity',
  workflow:            'Workflow',
  productivity:        'Productivity',
  'app-improvement':   'Improvement',
}

export { CATEGORY_LABEL as SUGGESTION_CATEGORY_LABEL }

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - new Date(todayIso() + 'T00:00:00').getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function daysAgo(isoDate: string): number {
  return -daysUntil(isoDate)
}

export function deriveSuggestions(
  projects: Project[],
  tasks: Task[],
  agents: Agent[],
  calendarItems: CalendarItem[],
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const today = todayIso()

  // ── Rule 1: Critical blocked project ──────────────────────────────────────
  const criticalBlocked = projects.find(
    (p) => p.status === 'blocked' && p.priority === 'critical',
  )
  if (criticalBlocked) {
    const blockedTasks = tasks.filter(
      (t) => t.projectId === criticalBlocked.id && t.status === 'blocked',
    )
    const downstreamCount = tasks.filter(
      (t) =>
        t.projectId === criticalBlocked.id &&
        t.status === 'todo' &&
        blockedTasks.some((bt) => t.dependencies.includes(bt.id)),
    ).length
    suggestions.push({
      id: 'sug-001',
      category: 'bottleneck',
      priority: 'critical',
      title: `${criticalBlocked.title} is critically blocked at ${criticalBlocked.percentComplete}%`,
      detail: `${blockedTasks.length} task${blockedTasks.length !== 1 ? 's' : ''} blocked${downstreamCount > 0 ? `, blocking ${downstreamCount} downstream task${downstreamCount !== 1 ? 's' : ''}` : ''}. Resolve the telemetry contract dependency to resume. Owner: ${criticalBlocked.ownerAgent}.`,
      actionHint: `Review /projects → ${criticalBlocked.title}`,
    })
  }

  // ── Rule 2: Idle/standby agent with overdue tasking ───────────────────────
  const idleAgents = agents.filter(
    (a) => a.status === 'standby' || a.status === 'idle',
  )
  const overdueItems = calendarItems.filter(
    (ci) =>
      ci.status === 'overdue' ||
      (ci.date < today && ci.status !== 'completed' && ci.status !== 'cancelled'),
  )
  if (idleAgents.length > 0 && overdueItems.length > 0) {
    const agent = idleAgents[0]
    const agentOverdue = overdueItems.find(
      (ci) => ci.relatedAgent === agent.name,
    ) ?? overdueItems[0]
    const howLong = daysAgo(agentOverdue.date)
    suggestions.push({
      id: 'sug-002',
      category: 'missed-opportunity',
      priority: 'high',
      title: `${agent.name} is ${agent.status} with overdue schedule items`,
      detail: `${overdueItems.length} overdue item${overdueItems.length !== 1 ? 's' : ''} including "${agentOverdue.title}" (${howLong} day${howLong !== 1 ? 's' : ''} overdue). ${agent.name} has capacity — assign tasking now to avoid further slippage.`,
      actionHint: 'Review /calendar for overdue items',
    })
  }

  // ── Rule 3: Approaching deadline with low completion ──────────────────────
  const atRisk = projects
    .filter((p) => p.status === 'in-progress' && p.dueDate)
    .map((p) => ({ p, days: daysUntil(p.dueDate!) }))
    .filter(({ p, days }) => days <= 21 && days >= 0 && p.percentComplete < 70)
    .sort((a, b) => a.days - b.days)[0]

  if (atRisk) {
    const remaining = tasks.filter(
      (t) => t.projectId === atRisk.p.id && t.status !== 'completed',
    ).length
    suggestions.push({
      id: 'sug-003',
      category: 'workflow',
      priority: atRisk.days <= 7 ? 'critical' : 'high',
      title: `${atRisk.p.title} is ${atRisk.p.percentComplete}% complete with ${atRisk.days} days until deadline`,
      detail: `${remaining} task${remaining !== 1 ? 's' : ''} remain. At current pace, delivery is at risk. Consider sprint mode or scope reduction to hit the ${new Date(atRisk.p.dueDate! + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} target.`,
      actionHint: `Review /projects → ${atRisk.p.title}`,
    })
  }

  // ── Rule 4: High-load agent owning a blocked critical project ─────────────
  const highLoadAgent = agents.find(
    (a) => a.load >= 80 && a.linkedProjectId && projects.find(
      (p) => p.id === a.linkedProjectId && p.status === 'blocked',
    ),
  )
  if (highLoadAgent) {
    suggestions.push({
      id: 'sug-004',
      category: 'productivity',
      priority: 'high',
      title: `${highLoadAgent.name} is at ${highLoadAgent.load}% load while owning a blocked project`,
      detail: `${highLoadAgent.name} is running near capacity in ${highLoadAgent.currentMode} mode but their linked project is blocked. Consider delegating monitoring tasks to sub-agents to free up bandwidth for unblocking work.`,
      actionHint: 'Review /agents → ' + highLoadAgent.name,
    })
  }

  // ── Rule 5: Unstarted task with all dependencies met ──────────────────────
  const completedTaskIds = new Set(
    tasks.filter((t) => t.status === 'completed').map((t) => t.id),
  )
  const readyToStart = tasks.find(
    (t) =>
      t.status === 'todo' &&
      t.dependencies.length > 0 &&
      t.dependencies.every((dep) => completedTaskIds.has(dep)),
  )
  if (readyToStart) {
    const project = projects.find((p) => p.id === readyToStart.projectId)
    suggestions.push({
      id: 'sug-005',
      category: 'productivity',
      priority: 'medium',
      title: `"${readyToStart.title}" is ready to start — all dependencies met`,
      detail: `This task in ${project?.title ?? 'an active project'} has been unblocked but not started. Assigned to ${readyToStart.assignedAgent}. Starting now avoids downstream delays.`,
      actionHint: 'Review /tasks → To Do',
    })
  }

  // ── Rule 6: Completed project with no documented follow-up ────────────────
  const completedProject = projects.find((p) => p.status === 'completed')
  if (completedProject && suggestions.length < 5) {
    suggestions.push({
      id: 'sug-006',
      category: 'app-improvement',
      priority: 'medium',
      title: `${completedProject.title} is complete — consider archiving and capturing lessons learned`,
      detail: `The project completed at 100% but has no linked post-mortem or retrospective doc. Documenting what worked and what didn't improves future execution. Archive when ready.`,
      actionHint: 'Review /docs to add a retrospective',
    })
  }

  // ── Rule 7: Todo project not yet started ──────────────────────────────────
  const stalledProject = projects.find(
    (p) => p.status === 'todo' && tasks.filter((t) => t.projectId === p.id).length > 0,
  )
  if (stalledProject && suggestions.length < 5) {
    suggestions.push({
      id: 'sug-007',
      category: 'workflow',
      priority: 'medium',
      title: `${stalledProject.title} is scoped but not started`,
      detail: `All tasks defined, assigned to ${stalledProject.ownerAgent}, but no work has begun. Assign a start date or activate the first task to build momentum.`,
      actionHint: `Review /projects → ${stalledProject.title}`,
    })
  }

  return suggestions.slice(0, 5)
}
