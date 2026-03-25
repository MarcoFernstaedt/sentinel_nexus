import type { IntegrationBoundary } from '../../types'

export const integrationBoundaries: IntegrationBoundary[] = [
  {
    id: 'gateway-health-endpoint',
    title: 'Gateway health endpoint',
    summary: 'Expose daemon reachability, last successful sync, and remote URL posture through a local API.',
    neededFor: 'True VPS status cards',
    status: 'waiting',
  },
  {
    id: 'usage-budget-feed',
    title: 'Usage budget feed',
    summary: 'Provide session spend, queue depth, rate-limit posture, and token consumption from runtime state.',
    neededFor: 'Real usage panels',
    status: 'waiting',
  },
  {
    id: 'mode-controller',
    title: 'Mode controller',
    summary: 'Promote mode selection from viewport-derived heuristics to explicit runtime/operator state.',
    neededFor: 'Accurate mode status',
    status: 'waiting',
  },
  {
    id: 'event-stream',
    title: 'Telemetry event stream',
    summary: 'Optional SSE/WebSocket layer for agent activity, logs, and host metrics without tight polling loops.',
    neededFor: 'Live board updates',
    status: 'ready',
  },
]
