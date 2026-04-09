const FALLBACK_DATE = '—'

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime())
}

export function parseIsoDate(value?: string | null, options?: { endOfDay?: boolean }) {
  if (!value) return null

  const normalized = value.trim()
  if (!normalized) return null

  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}${options?.endOfDay ? 'T23:59:59' : 'T00:00:00'}`
    : normalized

  const parsed = new Date(candidate)
  return isValidDate(parsed) ? parsed : null
}

export function formatDateLabel(
  value?: string | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = FALLBACK_DATE,
) {
  const parsed = parseIsoDate(value)
  if (!parsed) return fallback

  return new Intl.DateTimeFormat(undefined, options ?? {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

export function formatMonthDayLabel(value?: string | null, fallback = FALLBACK_DATE) {
  return formatDateLabel(value, { month: 'short', day: 'numeric' }, fallback)
}

export function formatMonthYearLabel(value?: string | null, fallback = FALLBACK_DATE) {
  const parsed = parseIsoDate(value)
  if (!parsed) return fallback

  return parsed.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}
