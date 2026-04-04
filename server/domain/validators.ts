import type { CalendarEventRecord, MemoryRecord, TaskRecord, TaskStatus } from './models.js'

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string; details?: unknown }

// ---------------------------------------------------------------------------
// Task state machine
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  Queued: ['In Progress'],
  'In Progress': ['In Progress', 'Blocked', 'Done'],
  Blocked: ['In Progress', 'Blocked'],
  Done: ['Done'],
}

export function validateTaskTransition(
  current: TaskRecord,
  patch: Partial<TaskRecord>,
): ValidationResult {
  const nextStatus = patch.status
  if (nextStatus === undefined || nextStatus === current.status) return { ok: true }

  const allowed = ALLOWED_TRANSITIONS[current.status]
  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      code: 'INVALID_TASK_TRANSITION',
      message: `Cannot transition task from "${current.status}" to "${nextStatus}".`,
      details: { from: current.status, to: nextStatus, allowed },
    }
  }

  if (nextStatus === 'Blocked') {
    const reason = (patch.blockedReason ?? current.blockedReason ?? '').trim()
    if (!reason) {
      return {
        ok: false,
        code: 'BLOCKED_REASON_REQUIRED',
        message: 'A task cannot be marked Blocked without a blockedReason.',
      }
    }
  }

  if (nextStatus === 'Done') {
    const summary = (patch.summary ?? current.summary ?? '').trim()
    if (!summary) {
      return {
        ok: false,
        code: 'DONE_SUMMARY_REQUIRED',
        message: 'A task cannot be marked Done without a summary.',
      }
    }
  }

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Task create validation
// ---------------------------------------------------------------------------

export function validateTaskCreate(
  input: { status?: TaskStatus; owner?: string; blockedReason?: string; summary?: string },
  _existingTasks: TaskRecord[],
): ValidationResult {
  const status = input.status ?? 'Queued'
  if (status === 'Blocked') {
    const reason = (input.blockedReason ?? '').trim()
    if (!reason) {
      return {
        ok: false,
        code: 'BLOCKED_REASON_REQUIRED',
        message: 'A task created with Blocked status requires a blockedReason.',
      }
    }
  }

  if (status === 'Done') {
    const summary = (input.summary ?? '').trim()
    if (!summary) {
      return {
        ok: false,
        code: 'DONE_SUMMARY_REQUIRED',
        message: 'A task created with Done status requires a summary.',
      }
    }
  }

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Memory validation
// ---------------------------------------------------------------------------

export function validateMemoryCreate(
  input: { title?: string; summary?: string },
  existingMemories: MemoryRecord[],
): ValidationResult {
  const title = (input.title ?? '').trim()
  const summary = (input.summary ?? '').trim()

  if (!title) {
    return { ok: false, code: 'MEMORY_TITLE_REQUIRED', message: 'Memory title cannot be empty.' }
  }
  if (!summary) {
    return { ok: false, code: 'MEMORY_SUMMARY_REQUIRED', message: 'Memory summary cannot be empty.' }
  }

  const duplicate = existingMemories.find(
    (m) => m.title.trim().toLowerCase() === title.toLowerCase(),
  )
  if (duplicate) {
    return {
      ok: false,
      code: 'MEMORY_TITLE_CONFLICT',
      message: `A memory with title "${duplicate.title}" already exists (${duplicate.id}).`,
      details: { existingId: duplicate.id },
    }
  }

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Calendar validation
// ---------------------------------------------------------------------------

function toDateString(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD
}

export function validateCalendarCreate(
  input: { title?: string; startsAt?: string },
  existingEvents: CalendarEventRecord[],
): ValidationResult {
  const title = (input.title ?? '').trim()
  const startsAt = (input.startsAt ?? '').trim()

  if (!title) {
    return { ok: false, code: 'CALENDAR_TITLE_REQUIRED', message: 'Calendar event title cannot be empty.' }
  }

  if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: `"${startsAt}" is not a valid date. Use an ISO 8601 date string (e.g. 2026-04-15T09:00:00.000Z).`,
    }
  }

  const dateStr = toDateString(startsAt)
  const titleLower = title.toLowerCase()
  const duplicate = existingEvents.find(
    (e) =>
      e.status !== 'done' &&
      e.title.trim().toLowerCase() === titleLower &&
      toDateString(e.startsAt) === dateStr,
  )
  if (duplicate) {
    return {
      ok: false,
      code: 'CALENDAR_EVENT_CONFLICT',
      message: `An upcoming event "${duplicate.title}" already exists on ${dateStr} (${duplicate.id}).`,
      details: { existingId: duplicate.id },
    }
  }

  return { ok: true }
}
