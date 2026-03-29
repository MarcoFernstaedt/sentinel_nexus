import { nexusRuntimeContract } from '../../runtime/runtimeContract'
import type { ChatMessage, ChatMode, TransportPreview } from '../model/types'

export const chatModes: ChatMode[] = [
  {
    id: 'command',
    label: 'Sentinel',
    intent: 'Operator execution, triage, pressure, and direct next actions.',
    personaLine: 'Sentinel is concise, protective, and focused on immediate leverage.',
    accent: 'Execution pressure',
  },
  {
    id: 'strategy',
    label: 'Acquisition Operator',
    intent: 'Deal framing, tradeoffs, sequence, outreach posture, and risk control.',
    personaLine: 'Sentinel becomes colder and more analytical, pushing toward decisive clarity.',
    accent: 'Deal flow control',
  },
  {
    id: 'build',
    label: 'Software Engineer',
    intent: 'Implementation support, technical breakdowns, debugging, and ship discipline.',
    personaLine: 'Sentinel acts like an engineering chief of staff: precise, structured, unsentimental.',
    accent: 'Ship discipline',
  },
]

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'system',
    author: 'Local Runtime',
    body: 'Transport is mocked locally. This surface is prepared for future gateway wiring without making network calls yet.',
    timestamp: '2026-03-28T02:16:00Z',
    modeId: 'command',
    status: 'ready',
    source: 'runtime',
  },
  {
    id: 'msg-2',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Nexus is standing by. Give me an objective, and I will reduce it to sequence, pressure points, and the next move.',
    timestamp: '2026-03-28T02:17:00Z',
    modeId: 'command',
    status: 'ready',
    source: 'runtime',
  },
  {
    id: 'msg-3',
    role: 'operator',
    author: 'Marco',
    body: 'Frame the current shell so it feels like a real command interface even before transport is connected.',
    timestamp: '2026-03-28T02:18:00Z',
    modeId: 'build',
    status: 'ready',
    source: 'runtime',
  },
  {
    id: 'msg-4',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Understood. I will make the mode, memory, and conversation scaffolding visible now so runtime integration later is additive instead of disruptive.',
    timestamp: '2026-03-28T02:19:00Z',
    modeId: 'build',
    status: 'ready',
    source: 'runtime',
  },
]

export const transportPreview: TransportPreview = {
  provider: 'Local simulator',
  state: 'ready-for-runtime',
  summary: 'Message submission, response generation, and state transitions are isolated behind a local adapter seam.',
  runtimeTarget: {
    apiBasePath: nexusRuntimeContract.apiBasePath,
    eventStreamPath: nexusRuntimeContract.eventStreamPath,
    dbFilePath: nexusRuntimeContract.db.filePath,
    sessionScope: nexusRuntimeContract.surfaces.chat.scope,
  },
}

export const suggestedPrompts = [
  'Audit the current bottleneck and give me one ruthless next move.',
  'Switch to Acquisition Operator and reframe the next 72 hours.',
  'Switch to Software Engineer and break this build into the smallest shippable execution slices.',
]
