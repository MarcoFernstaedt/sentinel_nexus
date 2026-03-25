import type { AgentRole, ChatMessage, NoteTask, QuickTool, StatCard } from './types'

export const topStats: StatCard[] = [
  {
    label: 'System Status',
    value: 'Nominal',
    detail: 'Frontend shell online · backend bridge pending',
    severity: 'stable',
  },
  {
    label: 'Active Sessions',
    value: '04',
    detail: 'Sentinel, Operator, Research, Build',
    severity: 'watch',
  },
  {
    label: 'Token Usage',
    value: '71%',
    detail: 'Budget healthy with room for deeper reasoning',
    severity: 'watch',
  },
  {
    label: 'Task Throughput',
    value: '18/hr',
    detail: 'Execution velocity is trending upward',
    severity: 'stable',
  },
]

export const systemPanels: StatCard[] = [
  {
    label: 'Gateway',
    value: 'Connected',
    detail: 'Last sync 12s ago',
    severity: 'stable',
  },
  {
    label: 'Telemetry',
    value: 'Partial',
    detail: 'Awaiting live event ingestion API',
    severity: 'watch',
  },
  {
    label: 'Escalations',
    value: '0',
    detail: 'No human interventions required',
    severity: 'stable',
  },
]

export const usagePanels: StatCard[] = [
  {
    label: 'Daily Spend',
    value: '$42.18',
    detail: 'Forecast $58.90 by 24h close',
    severity: 'watch',
  },
  {
    label: 'Context Health',
    value: '86%',
    detail: 'Compression acceptable',
    severity: 'stable',
  },
  {
    label: 'Queue Depth',
    value: '09',
    detail: 'Good balance between focus and responsiveness',
    severity: 'stable',
  },
]

export const chatMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'sentinel',
    text: 'Nexus command interface is online. I can coordinate execution, surface system posture, and stage operator decisions from one screen.',
    time: '02:14 UTC',
  },
  {
    id: '2',
    sender: 'operator',
    text: 'Show me where bottlenecks are emerging across sub-agents and task flow.',
    time: '02:15 UTC',
  },
  {
    id: '3',
    sender: 'sentinel',
    text: 'Research is waiting on external data. Build is clear. Notes and quick tools are standing by for tighter workflow integration.',
    time: '02:15 UTC',
  },
]

export const agentRoles: AgentRole[] = [
  {
    role: 'Executive Control',
    status: 'Live',
    detail: 'Sentinel keeps the board aligned and triages priority shifts.',
    load: 84,
  },
  {
    role: 'Research Cell',
    status: 'Placeholder',
    detail: 'Ready for search, fetch, and market intelligence integrations.',
    load: 52,
  },
  {
    role: 'Build Cell',
    status: 'Live',
    detail: 'Tracks implementation stream, commits, and repo health.',
    load: 68,
  },
  {
    role: 'Ops Watch',
    status: 'Placeholder',
    detail: 'Reserved for uptime, cron, and healthcheck signals.',
    load: 37,
  },
]

export const notesTasks: NoteTask[] = [
  {
    title: 'Wire live gateway status endpoint',
    owner: 'Platform',
    due: 'Today',
    status: 'In Progress',
  },
  {
    title: 'Connect notes panel to persistence',
    owner: 'Frontend',
    due: 'Next',
    status: 'Queued',
  },
  {
    title: 'Enable task assignment from chat actions',
    owner: 'Automation',
    due: 'After API',
    status: 'Blocked',
  },
  {
    title: 'Ship operator-ready dark theme polish',
    owner: 'Design',
    due: 'Now',
    status: 'Done',
  },
]

export const quickTools: QuickTool[] = [
  {
    title: 'Launch Focus Mode',
    description: 'Collapses noise and pins the execution-critical panels.',
    hotkey: '⌘1',
  },
  {
    title: 'Generate Standup',
    description: 'Drafts a concise status brief from current dashboard signals.',
    hotkey: '⌘2',
  },
  {
    title: 'Open Runbook',
    description: 'Jump point for recovery, escalation, and operator procedures.',
    hotkey: '⌘3',
  },
  {
    title: 'Sync Notes',
    description: 'Reserved hook for markdown or database-backed note persistence.',
    hotkey: '⌘4',
  },
]
