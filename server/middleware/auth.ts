import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AuthStore } from '../infrastructure/authStore.js'
import { json } from '../api/http.js'

// ── Cookie parsing helper ─────────────────────────────────────────

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map((pair) => {
      const idx = pair.indexOf('=')
      if (idx === -1) return ['', '']
      return [pair.slice(0, idx).trim(), decodeURIComponent(pair.slice(idx + 1).trim())]
    }).filter(([k]) => k),
  )
}

// ── Auth check ────────────────────────────────────────────────────

export async function requireAuth(
  req: IncomingMessage,
  res: ServerResponse,
  authStore: AuthStore,
): Promise<boolean> {
  const config = await authStore.read()

  // If setup not complete, any request is allowed through so the setup flow works.
  // The only unprotected API routes are /api/auth/* anyway.
  if (!config || !config.setupComplete) {
    json(res, 503, { error: 'setup_required', message: 'Nexus setup not complete. Visit /setup to configure.' })
    return false
  }

  // ── Method 1: API key (for Claude / agents) ───────────────────
  const apiKeyHeader = req.headers['x-nexus-key'] as string | undefined
  if (apiKeyHeader) {
    try {
      const matches = Buffer.from(apiKeyHeader).equals(Buffer.from(config.apiKey))
      if (matches) return true
    } catch {
      // fall through
    }
  }

  // ── Method 2: Session cookie (browser) ───────────────────────
  const cookies = parseCookies(req.headers['cookie'])
  const sessionToken = cookies['__nexus_session']
  if (sessionToken && authStore.verifySessionToken(sessionToken, config.sessionSecret)) {
    return true
  }

  json(res, 401, { error: 'unauthorized', message: 'Authentication required.' })
  return false
}

// ── Session cookie header builder ─────────────────────────────────

export function buildSessionCookieHeader(token: string): string {
  const maxAge = 7 * 24 * 3600 // 7 days
  return `__nexus_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
}

export function clearSessionCookieHeader(): string {
  return '__nexus_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
}
