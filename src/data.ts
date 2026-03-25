import type { AgentRole, ChatMessage, NoteItem, QuickTool, StatCard, TaskItem } from './types'

export const topStats: StatCard[] = [
  { label: 'System Status', value: 'Nominal', detail: 'Frontend workspace online · runtime bridge still local-only', severity: 'stable' },
  { label: 'Active Sessions', value: '04', detail: 'Sentinel, Build Cell, Research Cell, Ops Watch', severity: 'watch' },
  { label: 'Local State', value: 'Persisted', detail: 'Notes and task surfaces survive refresh via browser storage', severity: 'stable' },
  { label: 'Operator Tempo', value: 'High', detail: 'Quick tools and local task board ready for action', severity: 'stable' },
]

export const systemPanels: StatCard[] = [
  { label: 'Gateway', value: 'Pending', detail: 'Future runtime hook for live OpenClaw status', severity: 'watch' },
  { label: 'Telemetry', value: 'Local-first', detail: 'Using seeded operator data until live events exist', severity: 'stable' },
  { label: 'Persistence', value: 'Browser', detail: 'No backend required for notes/tasks in this pass', severity: 'stable' },
]

export const usagePanels: StatCard[] = [
  { label: 'Quick Tools', value: '4', detail: 'Operator shortcuts exposed with runtime readiness state', severity: 'stable' },
  { label: 'Notes', value: '3', detail: 'Seeded field notes can be edited locally', severity: 'stable' },
  { label: 'Tasks', value: '4', detail: 'Execution board ships with lane and owner metadata', severity: 'watch' },
]

export const chatMessages: ChatMessage[] = [
  { id: '1', sender: 'sentinel', text: 'Nexus operator shell is online. Local state is active, agent roles are visible, and execution surfaces are standing by.', time: '02:14 UTC' },
  { id: '2', sender: 'operator', text: 'What is ready now versus what still needs runtime wiring?', time: '02:15 UTC' },
  { id: '3', sender: 'sentinel', text: 'Notes, tasks, and quick tools work locally. Live gateway telemetry, command execution, and sub-agent event feeds still need backend integration.', time: '02:15 UTC' },
]

export const agentRoles: AgentRole[] = [
  { id: 'sentinel-exec', role: 'Executive Control', status: 'Live', detail: 'Primary operator presence. Owns triage, sequencing, and command intent.', load: 84, surface: 'Command board + overview', runtimeState: 'Integrated' },
  { id: 'research-cell', role: 'Research Cell', status: 'Standby', detail: 'Prepared for search, fetch, and evidence gathering once runtime events arrive.', load: 52, surface: 'Sub-agent visibility rail', runtimeState: 'Pending' },
  { id: 'build-cell', role: 'Build Cell', status: 'Live', detail: 'Tracks implementation flow, code momentum, and validation posture.', load: 68, surface: 'Task board + status cards', runtimeState: 'Local-only' },
  { id: 'ops-watch', role: 'Ops Watch', status: 'Placeholder', detail: 'Reserved for healthcheck, cron, and gateway incident awareness.', load: 37, surface: 'Quick tools + telemetry strip', runtimeState: 'Pending' },
]

export const initialTasks: TaskItem[] = [
  { id: 'task-gateway', title: 'Wire live gateway status endpoint', owner: 'Platform', due: 'Today', status: 'In Progress', lane: 'Ops' },
  { id: 'task-notes', title: 'Keep note surface local-first with swap-ready persistence seam', owner: 'Frontend', due: 'Now', status: 'Done', lane: 'Build' },
  { id: 'task-actions', title: 'Connect quick tools to real command execution', owner: 'Runtime', due: 'Next', status: 'Blocked', lane: 'Ops' },
  { id: 'task-roles', title: 'Expose sub-agent status with role metadata and runtime state', owner: 'Frontend', due: 'Now', status: 'Done', lane: 'Research' },
]

export const initialNotes: NoteItem[] = [
  { id: 'note-1', title: 'Operator doctrine', body: 'Keep Nexus local-first. Frontend should remain useful offline or before any runtime bridge exists.', tag: 'principle', updatedAt: 'Just now' },
  { id: 'note-2', title: 'Runtime seam', body: 'Every fake action in the shell should advertise whether it is integrated, stubbed, or waiting for backend command wiring.', tag: 'architecture', updatedAt: '5 min ago' },
  { id: 'note-3', title: 'Operator ask', body: 'Make notes, tasks, tools, and sub-agent role visibility feel like one coherent control room instead of scattered widgets.', tag: 'priority', updatedAt: '11 min ago' },
]

export const quickTools: QuickTool[] = [
  { id: 'focus-mode', title: 'Launch Focus Mode', description: 'Collapse supporting context and bias the screen toward active execution.', hotkey: '⌘1', state: 'Ready' },
  { id: 'standup', title: 'Generate Standup', description: 'Produce a local summary using the current notes, tasks, and role surfaces.', hotkey: '⌘2', state: 'Ready' },
  { id: 'runbook', title: 'Open Runbook', description: 'Reserved command surface for procedures, escalations, and recovery paths.', hotkey: '⌘3', state: 'Stub' },
  { id: 'runtime-sync', title: 'Runtime Sync', description: 'Future hook for gateway/session synchronization once APIs are available.', hotkey: '⌘4', state: 'Needs runtime' },
]
