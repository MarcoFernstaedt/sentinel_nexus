/**
 * Simple in-memory sliding-window rate limiter.
 * Designed for Node.js single-process deployments (no external store needed).
 * Each "key" (typically an IP address) gets a separate request window.
 */

interface Window {
  count: number
  resetAt: number // unix ms
}

export class RateLimiter {
  private readonly windows = new Map<string, Window>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Check + consume one request token for the given key.
   * Returns `{ allowed: true }` or `{ allowed: false, retryAfterMs: number }`.
   */
  consume(key: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now()
    let win = this.windows.get(key)

    if (!win || now >= win.resetAt) {
      win = { count: 1, resetAt: now + this.windowMs }
      this.windows.set(key, win)
      return { allowed: true }
    }

    if (win.count >= this.maxRequests) {
      return { allowed: false, retryAfterMs: win.resetAt - now }
    }

    win.count += 1
    return { allowed: true }
  }

  /** Prune stale windows to prevent unbounded memory growth. Call periodically. */
  prune(): void {
    const now = Date.now()
    for (const [key, win] of this.windows) {
      if (now >= win.resetAt) this.windows.delete(key)
    }
  }
}

// ── Shared instances ──────────────────────────────────────────────
// Auth endpoints: 10 attempts per 15 minutes per IP
export const authLimiter = new RateLimiter(10, 15 * 60 * 1000)

// Global API limiter: 300 req/min per IP (protects against runaway agents)
export const apiLimiter = new RateLimiter(300, 60 * 1000)

// Prune every 5 minutes
setInterval(() => {
  authLimiter.prune()
  apiLimiter.prune()
}, 5 * 60 * 1000).unref()
