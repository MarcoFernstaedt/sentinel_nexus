import { nexusRuntimeContract } from '../../runtime/runtimeContract'
import type { ChatMessage, ChatMode, TransportPreview } from '../model/types'

export const chatModes: ChatMode[] = [
  {
    id: 'command',
    label: 'Command Mode',
    intent: 'Fast operator execution, triage, and direct next actions.',
    personaLine: 'Sentinel is concise, protective, and focused on immediate leverage.',
    accent: 'Immediate leverage',
  },
  {
    id: 'strategy',
    label: 'Strategy Mode',
    intent: 'Board-level framing, tradeoffs, sequence, and risk posture.',
    personaLine: 'Sentinel becomes colder and more analytical, pushing toward decisive clarity.',
    accent: 'Board view',
  },
  {
    id: 'build',
    label: 'Build Mode',
    intent: 'Implementation support, technical breakdowns, and ship discipline.',
    personaLine: 'Sentinel acts like an engineering chief of staff: precise, structured, unsentimental.',
    accent: 'Ship the thing',
  },
]

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'system',
    author: 'Local Runtime',
    body: 'Transport is mocked locally. This surface is prepared for future gateway wiring without making network calls yet.',
    timestamp: '02:16 UTC',
    modeId: 'command',
    status: 'ready',
  },
  {
    id: 'msg-2',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Nexus is standing by. Give me an objective, and I will reduce it to sequence, pressure points, and the next move.',
    timestamp: '02:17 UTC',
    modeId: 'command',
    status: 'ready',
  },
  {
    id: 'msg-3',
    role: 'operator',
    author: 'Marco',
    body: 'Frame the current shell so it feels like a real command interface even before transport is connected.',
    timestamp: '02:18 UTC',
    modeId: 'build',
    status: 'ready',
  },
  {
    id: 'msg-4',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Understood. I will make the mode, memory, and conversation scaffolding visible now so runtime integration later is additive instead of disruptive.',
    timestamp: '02:18 UTC',
    modeId: 'build',
    status: 'ready',
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
  'Switch to strategy mode and reframe the next 72 hours.',
  'Break this build into the smallest shippable execution slices.',
]
