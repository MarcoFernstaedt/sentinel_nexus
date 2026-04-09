const configuredBaseUrl = (process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '').trim()

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '')
}

function inferBrowserBaseUrl() {
  if (typeof window === 'undefined') return ''

  const { protocol, hostname } = window.location

  if (!hostname) return ''

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3001`
  }

  return `${protocol}//${hostname}:3001`
}

export const API_BASE_URL = normalizeBaseUrl(configuredBaseUrl || inferBrowserBaseUrl())

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}
