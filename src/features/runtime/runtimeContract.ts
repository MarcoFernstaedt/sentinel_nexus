export const nexusRuntimeContract = {
  apiBasePath: '/api',
  eventStreamPath: '/api/runtime/events',
  db: {
    owner: 'Nexus only',
    engine: 'file-json (current) -> SQLite/Postgres later',
    filePath: '~/.openclaw/data/nexus/nexus-data.json',
    rationale:
      'Keep Nexus state separate from gateway/runtime internals so product data can evolve without coupling to OpenClaw operational storage.',
  },
  surfaces: {
    chat: {
      status: 'backend-live',
      nextEndpoint: 'GET|POST /api/chat/messages',
      scope: 'Current runtime/session only until cross-session memory is intentionally designed.',
    },
    systemStatus: {
      status: 'backend-live',
      nextEndpoint: 'GET /api/status',
      scope: 'Current API runtime status, storage driver, task/notes/chat counts, and truthful server-derived cards.',
    },
    notes: {
      status: 'backend-live',
      nextEndpoint: 'GET|POST /api/notes',
      scope: 'Operator notes with Nexus-owned persistence.',
    },
    tasks: {
      status: 'backend-live',
      nextEndpoint: 'GET|POST|PATCH /api/tasks',
      scope: 'Task board, state transitions, ownership, due metadata, and attention-routing flags.',
    },
    tools: {
      status: 'not-wired-yet',
      nextEndpoint: 'not exposed yet',
      scope: 'Explicit, auditable tool execution via a future runtime adapter.',
    },
    modeAndAgentVisibility: {
      status: 'backend-live',
      nextEndpoint: 'GET /api/runtime/context + GET /api/runtime/events',
      scope: 'Mode, active agent/session, task-derived workstreams, and runtime source-of-truth.',
    },
  },
} as const

export type NexusRuntimeContract = typeof nexusRuntimeContract
