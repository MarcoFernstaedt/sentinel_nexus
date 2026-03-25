import { integrationBoundaries } from '../integrations/boundaries'
import { getLocalUsageCards, getModeStatus, getRuntimeStats, getVpsCards } from '../runtime/browserRuntime'
import type { TelemetrySnapshot } from '../../types'

export const createTelemetrySnapshot = (): TelemetrySnapshot => ({
  capturedAt: new Date().toISOString(),
  vpsCards: getVpsCards(),
  localUsageCards: getLocalUsageCards(),
  runtimeStats: getRuntimeStats(),
  modeStatus: getModeStatus(),
  integrationBoundaries,
})
