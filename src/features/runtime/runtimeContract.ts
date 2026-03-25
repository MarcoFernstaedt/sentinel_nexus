export const nexusRuntimeContract = {
  apiBasePath: '/api/nexus',
  eventStreamPath: '/api/nexus/events',
  db: {
    owner: 'Nexus only',
    engine: 'SQLite',
    filePath: '~/.openclaw/data/nexus/nexus.sqlite',
    rationale:
      'Keep Nexus state separate from gateway/runtime internals so product data can evolve without coupling to OpenClaw operational storage.',
  },
  surfaces: {
    chat: {
      status: 'local-shell-live',
      nextEndpoint: 'POST /api/nexus/chat/messages',
      scope: 'Current runtime/session only until cross-session memory is intentionally designed.',
    },
    systemStatus: {
      status: 'browser-derived-live',
      nextEndpoint: 'GET /api/nexus/system/status',
      scope: 'Gateway reachability, host posture, queue depth, session identity, runtime budget.',
    },
    notes: {
      status: 'backend-needed',
      nextEndpoint: 'GET|POST|PATCH /api/nexus/notes',
      scope: 'Operator notes with Nexus-owned persistence.',
    },
    tasks: {
      status: 'backend-needed',
      nextEndpoint: 'GET|POST|PATCH /api/nexus/tasks',
      scope: 'Task board, state transitions, ownership, due metadata.',
    },
    tools: {
      status: 'backend-needed',
      nextEndpoint: 'POST /api/nexus/tools/:toolId/execute',
      scope: 'Explicit, auditable tool execution via runtime adapter.',
    },
    modeAndAgentVisibility: {
      status: 'mixed',
      nextEndpoint: 'GET /api/nexus/runtime/context',
      scope: 'Mode, active agent/session, visibility, and runtime source-of-truth.',
    },
  },
} as const

export type NexusRuntimeContract = typeof nexusRuntimeContract
