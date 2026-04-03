'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/src/lib/cn'

export default function SetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data: { setupComplete?: boolean }) => {
        if (data.setupComplete) router.replace('/login')
        else inputRef.current?.focus()
      })
      .catch(() => {/* API offline — stay on page */})
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    if (password !== confirm) {
      setError('Passphrases do not match')
      return
    }
    if (password.length < 8) {
      setError('Passphrase must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json() as { apiKey: string }
        setApiKey(data.apiKey)
      } else {
        const data = await res.json() as { message?: string }
        setError(data.message ?? 'Setup failed')
      }
    } catch {
      setError('Connection failed — is the API running?')
    } finally {
      setLoading(false)
    }
  }

  async function copyKey() {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center bg-[#020508] px-4"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 35% at 12% 2%, rgba(65,255,165,0.07) 0%, transparent 100%), radial-gradient(ellipse 40% 28% at 88% 6%, rgba(83,201,255,0.07) 0%, transparent 100%)',
      }}
    >
      {/* Grid backdrop */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(126,255,210,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(126,255,210,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 90%)',
        }}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] border border-[rgba(126,255,210,0.35)] bg-gradient-to-br from-[rgba(36,255,156,0.22)] to-[rgba(83,201,255,0.18)] flex items-center justify-center">
            <span className="text-[14px] font-bold text-[#7ef7cd] font-mono leading-none logo-glow">SN</span>
          </div>
          <div className="text-center">
            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[rgba(126,247,205,0.55)] font-medium mb-1">
              Sentinel Nexus
            </p>
            <p className="text-[1rem] font-semibold text-[rgba(233,255,246,0.97)]">
              Initial Configuration
            </p>
          </div>
        </div>

        {apiKey ? (
          /* API Key reveal panel */
          <div
            className={cn(
              'rounded-[16px] border border-[rgba(126,255,210,0.14)]',
              'bg-[rgba(7,14,19,0.92)] backdrop-blur-[20px]',
              'shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]',
              'p-6 grid gap-5',
            )}
            role="region"
            aria-label="Setup complete — API key"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#41ffa5] shadow-[0_0_6px_rgba(65,255,165,0.6)]" aria-hidden />
              <p className="text-[0.75rem] font-semibold text-[rgba(233,255,246,0.9)] uppercase tracking-[0.1em]">
                Mission Control Activated
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-[0.68rem] uppercase tracking-[0.12em] text-[#9fb9af] font-medium">
                Agent API Key
              </label>
              <div
                className={cn(
                  'relative rounded-[10px] border border-[rgba(126,255,210,0.18)]',
                  'bg-[rgba(6,12,18,0.90)] p-3',
                )}
              >
                <code className="text-[0.72rem] text-[#7ef7cd] font-mono break-all leading-relaxed">
                  {apiKey}
                </code>
                <button
                  onClick={copyKey}
                  className={cn(
                    'absolute top-2 right-2 px-2 py-1 rounded-[6px] text-[0.62rem] font-medium uppercase tracking-[0.08em]',
                    'border transition-all duration-150',
                    copied
                      ? 'border-[rgba(65,255,165,0.45)] bg-[rgba(65,255,165,0.12)] text-[#41ffa5]'
                      : 'border-[rgba(126,255,210,0.22)] bg-[rgba(36,255,156,0.06)] text-[rgba(126,247,205,0.7)] hover:bg-[rgba(36,255,156,0.12)]',
                  )}
                  aria-label={copied ? 'Copied to clipboard' : 'Copy API key to clipboard'}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div
              className={cn(
                'rounded-[10px] border border-[rgba(83,201,255,0.2)] bg-[rgba(83,201,255,0.06)]',
                'p-3 grid gap-2',
              )}
              role="note"
            >
              <p className="text-[0.68rem] text-[rgba(83,201,255,0.9)] font-medium uppercase tracking-[0.08em]">
                Agent Access Instructions
              </p>
              <p className="text-[0.7rem] text-[rgba(155,185,200,0.8)] leading-relaxed">
                Save this key — it will not be shown again in full. Claude Code and other agents use it as the{' '}
                <code className="text-[#53c9ff] font-mono">X-Nexus-Key</code> header to access the API directly.
              </p>
              <div className={cn(
                'mt-1 rounded-[8px] border border-[rgba(83,201,255,0.15)] bg-[rgba(6,12,18,0.80)] p-2.5',
              )}>
                <code className="text-[0.66rem] text-[rgba(126,247,205,0.8)] font-mono">
                  curl -H &quot;X-Nexus-Key: {apiKey.slice(0, 8)}…&quot; http://localhost:3001/api/bootstrap
                </code>
              </div>
            </div>

            <button
              onClick={() => router.push('/login')}
              className={cn(
                'w-full py-2.5 rounded-[10px] text-[0.8rem] font-semibold tracking-[0.06em] uppercase',
                'border border-[rgba(126,255,210,0.32)] bg-[rgba(36,255,156,0.10)]',
                'text-[#7ef7cd] transition-all duration-150',
                'hover:bg-[rgba(36,255,156,0.18)] hover:border-[rgba(126,255,210,0.45)]',
              )}
            >
              Proceed to Mission Control
            </button>
          </div>
        ) : (
          /* Setup form */
          <form
            onSubmit={handleSubmit}
            className={cn(
              'rounded-[16px] border border-[rgba(126,255,210,0.14)]',
              'bg-[rgba(7,14,19,0.92)] backdrop-blur-[20px]',
              'shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]',
              'p-6 grid gap-5',
            )}
            aria-label="Initial setup form"
          >
            <div>
              <p className="text-[0.72rem] text-[rgba(155,185,170,0.7)] leading-relaxed">
                Set an operator passphrase to secure Mission Control. This passphrase will be required on every login.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-[0.68rem] uppercase tracking-[0.12em] text-[#9fb9af] font-medium">
                Operator Passphrase
              </label>
              <input
                ref={inputRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-[10px] text-[0.82rem]',
                  'bg-[rgba(6,12,18,0.80)] border',
                  'text-[rgba(233,255,246,0.97)] placeholder:text-[rgba(155,185,170,0.35)]',
                  'transition-colors duration-150 outline-none font-mono',
                  error
                    ? 'border-[rgba(255,112,112,0.45)] focus:border-[rgba(255,112,112,0.65)]'
                    : 'border-[rgba(126,255,210,0.14)] focus:border-[rgba(126,255,210,0.35)]',
                )}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="confirm" className="text-[0.68rem] uppercase tracking-[0.12em] text-[#9fb9af] font-medium">
                Confirm Passphrase
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter passphrase"
                autoComplete="new-password"
                required
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-[10px] text-[0.82rem]',
                  'bg-[rgba(6,12,18,0.80)] border',
                  'text-[rgba(233,255,246,0.97)] placeholder:text-[rgba(155,185,170,0.35)]',
                  'transition-colors duration-150 outline-none font-mono',
                  error
                    ? 'border-[rgba(255,112,112,0.45)] focus:border-[rgba(255,112,112,0.65)]'
                    : 'border-[rgba(126,255,210,0.14)] focus:border-[rgba(126,255,210,0.35)]',
                )}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[rgba(255,112,112,0.08)] border border-[rgba(255,112,112,0.25)]"
              >
                <span className="text-[0.68rem] text-[rgba(255,112,112,0.9)]">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim() || !confirm.trim()}
              className={cn(
                'w-full py-2.5 rounded-[10px] text-[0.8rem] font-semibold tracking-[0.06em] uppercase',
                'border border-[rgba(126,255,210,0.32)] bg-[rgba(36,255,156,0.10)]',
                'text-[#7ef7cd] transition-all duration-150',
                'hover:bg-[rgba(36,255,156,0.18)] hover:border-[rgba(126,255,210,0.45)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {loading ? 'Initializing…' : 'Initialize Mission Control'}
            </button>
          </form>
        )}

        <p className="text-center text-[0.62rem] text-[rgba(155,185,170,0.40)] mt-4">
          Sentinel Nexus · First-Run Configuration
        </p>
      </div>
    </div>
  )
}
