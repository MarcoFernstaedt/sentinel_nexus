// Generalized recurring-target tracking system for NEXUS
// Handles any repeatable measurable execution block:
//   daily dev applications, outreach targets, workout goals,
//   prospecting quotas, deal-touch targets, follow-up cadences, etc.

export type TrackingPeriod = 'daily' | 'weekly' | 'custom'

export type TrackingStatus =
  | 'active'      // target is live and accepting count updates
  | 'completed'   // current period hit target
  | 'missed'      // period closed without hitting target
  | 'no-report'   // period ended with no count submitted
  | 'paused'      // temporarily suspended

export type TrackingCategory =
  | 'job-search'
  | 'outreach'
  | 'fitness'
  | 'prospecting'
  | 'sales'
  | 'productivity'
  | 'follow-up'
  | 'custom'

export const TRACKING_CATEGORY_LABEL: Record<TrackingCategory, string> = {
  'job-search':   'Job Search',
  'outreach':     'Outreach',
  'fitness':      'Fitness',
  'prospecting':  'Prospecting',
  'sales':        'Sales',
  'productivity': 'Productivity',
  'follow-up':    'Follow-Up',
  'custom':       'Custom',
}

/** One closed period's result record, stored in history. */
export interface TrackedTargetHistoryEntry {
  periodKey: string           // YYYY-MM-DD for daily  |  YYYY-Www for weekly
  count: number               // final count for this period
  targetCount: number         // what the target was at period close
  reportedAt: string | null   // ISO when operator last updated count; null = no report
  notes: string | null
  status: 'completed' | 'partial' | 'missed' | 'no-report'
}

/** A single tracked recurring target. */
export interface TrackedTarget {
  id: string
  title: string
  category: TrackingCategory
  period: TrackingPeriod
  targetCount: number
  currentCount: number        // count for the *current* open period
  currentPeriodKey: string    // YYYY-MM-DD (daily) | YYYY-Www (weekly)
  /** Hour (0–23) at which the period closes. Enforcement only — not a hard lock. */
  dueHour: number
  status: TrackingStatus
  notes: string | null
  createdAt: string
  lastUpdatedAt: string
  history: TrackedTargetHistoryEntry[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get the period key string for today (daily). */
export function dailyPeriodKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Get the ISO week period key for today (weekly). Format: YYYY-Www */
export function weeklyPeriodKey(date: Date = new Date()): string {
  // ISO week: week starts Monday
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7           // Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)   // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function currentPeriodKey(period: TrackingPeriod, date: Date = new Date()): string {
  if (period === 'weekly') return weeklyPeriodKey(date)
  return dailyPeriodKey(date) // daily and custom both use YYYY-MM-DD
}

/** Human-readable progress string, e.g. "3 / 5" */
export function progressLabel(target: TrackedTarget): string {
  return `${target.currentCount} / ${target.targetCount}`
}

/** 0–1 completion ratio for the current period. */
export function progressRatio(target: TrackedTarget): number {
  if (target.targetCount === 0) return 0
  return Math.min(1, target.currentCount / target.targetCount)
}

/** Whether the target's period key is stale (period has rolled over). */
export function isPeriodStale(target: TrackedTarget, now: Date = new Date()): boolean {
  return target.currentPeriodKey !== currentPeriodKey(target.period, now)
}

/** Derive period status for the current open period. */
export function derivePeriodStatus(
  target: TrackedTarget,
): 'completed' | 'partial' | 'no-report' {
  if (target.currentCount >= target.targetCount) return 'completed'
  if (target.currentCount > 0) return 'partial'
  return 'no-report'
}

/** Build a history entry when closing the current period. */
export function buildHistoryEntry(target: TrackedTarget): TrackedTargetHistoryEntry {
  return {
    periodKey:   target.currentPeriodKey,
    count:       target.currentCount,
    targetCount: target.targetCount,
    reportedAt:  target.lastUpdatedAt,
    notes:       target.notes,
    status:      derivePeriodStatus(target),
  }
}
