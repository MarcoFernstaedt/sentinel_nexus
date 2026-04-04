import { describe, expect, it } from 'vitest'
import type { CalendarEventRecord, MemoryRecord, TaskRecord } from '../domain/models.js'
import {
  validateCalendarCreate,
  validateMemoryCreate,
  validateSingleActiveTask,
  validateTaskCreate,
  validateTaskTransition,
} from '../domain/validators.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 'task-1',
    title: 'Test task',
    owner: 'Sentinel',
    due: '2026-05-01',
    status: 'Queued',
    stage: 'queued',
    lane: 'Build',
    source: 'runtime',
    ...overrides,
  }
}

function makeMemory(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  return {
    id: 'mem-1',
    title: 'Existing memory',
    kind: 'working-memory',
    updatedAt: new Date().toISOString(),
    summary: 'Some summary',
    tags: [],
    source: 'runtime',
    ...overrides,
  }
}

function makeCalendarEvent(overrides: Partial<CalendarEventRecord> = {}): CalendarEventRecord {
  return {
    id: 'cal-1',
    title: 'Existing event',
    type: 'task',
    startsAt: '2026-05-01T09:00:00.000Z',
    owner: 'Sentinel',
    status: 'scheduled',
    detail: 'Some detail',
    source: 'runtime',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// validateTaskTransition — allowed transitions
// ---------------------------------------------------------------------------

describe('validateTaskTransition — allowed transitions', () => {
  it('Queued → In Progress is allowed', () => {
    const result = validateTaskTransition(makeTask({ status: 'Queued' }), { status: 'In Progress' })
    expect(result.ok).toBe(true)
  })

  it('In Progress → Blocked is allowed when blockedReason provided', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress' }),
      { status: 'Blocked', blockedReason: 'waiting on API keys' },
    )
    expect(result.ok).toBe(true)
  })

  it('Blocked → In Progress is allowed', () => {
    const result = validateTaskTransition(makeTask({ status: 'Blocked', blockedReason: 'something' }), { status: 'In Progress' })
    expect(result.ok).toBe(true)
  })

  it('In Progress → Done is allowed when summary provided', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress' }),
      { status: 'Done', summary: 'completed the feature' },
    )
    expect(result.ok).toBe(true)
  })

  it('no-op same status transition is allowed', () => {
    const result = validateTaskTransition(makeTask({ status: 'In Progress' }), { status: 'In Progress' })
    expect(result.ok).toBe(true)
  })

  it('Done → Done no-op is allowed', () => {
    const result = validateTaskTransition(makeTask({ status: 'Done' }), { status: 'Done' })
    expect(result.ok).toBe(true)
  })

  it('patch with no status change is always allowed', () => {
    const result = validateTaskTransition(makeTask({ status: 'Queued' }), { summary: 'updated summary' })
    expect(result.ok).toBe(true)
  })

  it('In Progress → Done allowed when summary exists on task already', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress', summary: 'existing summary' }),
      { status: 'Done' },
    )
    expect(result.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateTaskTransition — disallowed transitions
// ---------------------------------------------------------------------------

describe('validateTaskTransition — disallowed transitions', () => {
  it('Queued → Done is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'Queued' }),
      { status: 'Done', summary: 'done' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_TASK_TRANSITION')
  })

  it('Queued → Blocked is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'Queued' }),
      { status: 'Blocked', blockedReason: 'reason' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_TASK_TRANSITION')
  })

  it('Blocked → Done is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'Blocked', blockedReason: 'something', summary: 'done' }),
      { status: 'Done' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_TASK_TRANSITION')
  })

  it('Done → In Progress is rejected (terminal state)', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'Done' }),
      { status: 'In Progress' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_TASK_TRANSITION')
  })

  it('Done → Blocked is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'Done' }),
      { status: 'Blocked', blockedReason: 'reason' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_TASK_TRANSITION')
  })
})

// ---------------------------------------------------------------------------
// validateTaskTransition — business rules
// ---------------------------------------------------------------------------

describe('validateTaskTransition — business rules', () => {
  it('Blocked without blockedReason is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress' }),
      { status: 'Blocked' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('BLOCKED_REASON_REQUIRED')
  })

  it('Blocked with empty blockedReason is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress' }),
      { status: 'Blocked', blockedReason: '   ' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('BLOCKED_REASON_REQUIRED')
  })

  it('Done without summary on task or patch is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress', summary: undefined }),
      { status: 'Done' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('DONE_SUMMARY_REQUIRED')
  })

  it('Done with only whitespace summary is rejected', () => {
    const result = validateTaskTransition(
      makeTask({ status: 'In Progress' }),
      { status: 'Done', summary: '   ' },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('DONE_SUMMARY_REQUIRED')
  })
})

// ---------------------------------------------------------------------------
// validateTaskCreate
// ---------------------------------------------------------------------------

describe('validateTaskCreate', () => {
  it('allows creating a Queued task with no extra requirements', () => {
    const result = validateTaskCreate({ status: 'Queued', owner: 'Sentinel' }, [])
    expect(result.ok).toBe(true)
  })

  it('allows creating In Progress task when owner has no active task', () => {
    const result = validateTaskCreate({ status: 'In Progress', owner: 'Sentinel' }, [])
    expect(result.ok).toBe(true)
  })

  it('rejects creating Blocked task without blockedReason', () => {
    const result = validateTaskCreate({ status: 'Blocked', owner: 'Sentinel' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('BLOCKED_REASON_REQUIRED')
  })

  it('rejects creating Done task without summary', () => {
    const result = validateTaskCreate({ status: 'Done', owner: 'Sentinel' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('DONE_SUMMARY_REQUIRED')
  })
})

// ---------------------------------------------------------------------------
// validateMemoryCreate
// ---------------------------------------------------------------------------

describe('validateMemoryCreate', () => {
  it('allows valid memory', () => {
    const result = validateMemoryCreate({ title: 'API auth decision', summary: 'Use JWT 15min TTL' }, [])
    expect(result.ok).toBe(true)
  })

  it('rejects empty title', () => {
    const result = validateMemoryCreate({ title: '', summary: 'some summary' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('MEMORY_TITLE_REQUIRED')
  })

  it('rejects whitespace-only title', () => {
    const result = validateMemoryCreate({ title: '   ', summary: 'some summary' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('MEMORY_TITLE_REQUIRED')
  })

  it('rejects empty summary', () => {
    const result = validateMemoryCreate({ title: 'My memory', summary: '' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('MEMORY_SUMMARY_REQUIRED')
  })

  it('rejects duplicate title (case-insensitive)', () => {
    const existing = [makeMemory({ title: 'API Auth Decision' })]
    const result = validateMemoryCreate({ title: 'api auth decision', summary: 'new content' }, existing)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('MEMORY_TITLE_CONFLICT')
  })

  it('allows different title despite similar content', () => {
    const existing = [makeMemory({ title: 'API Auth Decision' })]
    const result = validateMemoryCreate({ title: 'API Auth Strategy v2', summary: 'new content' }, existing)
    expect(result.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateCalendarCreate
// ---------------------------------------------------------------------------

describe('validateCalendarCreate', () => {
  it('allows valid future event', () => {
    const result = validateCalendarCreate({ title: 'Sprint review', startsAt: '2026-06-01T09:00:00.000Z' }, [])
    expect(result.ok).toBe(true)
  })

  it('rejects missing startsAt', () => {
    const result = validateCalendarCreate({ title: 'Event', startsAt: '' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_DATE')
  })

  it('rejects malformed date string', () => {
    const result = validateCalendarCreate({ title: 'Event', startsAt: 'not-a-date' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_DATE')
  })

  it('rejects obviously invalid date (month 99)', () => {
    const result = validateCalendarCreate({ title: 'Event', startsAt: '2026-99-01T00:00:00.000Z' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_DATE')
  })

  it('rejects duplicate upcoming event same title and date', () => {
    const existing = [makeCalendarEvent({ title: 'Sprint Review', startsAt: '2026-06-01T09:00:00.000Z', status: 'scheduled' })]
    const result = validateCalendarCreate({ title: 'sprint review', startsAt: '2026-06-01T14:00:00.000Z' }, existing)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('CALENDAR_EVENT_CONFLICT')
  })

  it('allows same title on different date', () => {
    const existing = [makeCalendarEvent({ title: 'Sprint Review', startsAt: '2026-06-01T09:00:00.000Z', status: 'scheduled' })]
    const result = validateCalendarCreate({ title: 'Sprint Review', startsAt: '2026-06-08T09:00:00.000Z' }, existing)
    expect(result.ok).toBe(true)
  })

  it('allows same title on same date if existing event is done', () => {
    const existing = [makeCalendarEvent({ title: 'Sprint Review', startsAt: '2026-06-01T09:00:00.000Z', status: 'done' })]
    const result = validateCalendarCreate({ title: 'Sprint Review', startsAt: '2026-06-01T09:00:00.000Z' }, existing)
    expect(result.ok).toBe(true)
  })

  it('rejects empty title', () => {
    const result = validateCalendarCreate({ title: '', startsAt: '2026-06-01T09:00:00.000Z' }, [])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('CALENDAR_TITLE_REQUIRED')
  })
})
