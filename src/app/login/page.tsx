'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/src/lib/cn'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check setup status on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data: { setupComplete?: boolean }) => {
        if (!data.setupComplete) router.replace('/setup')
        else inputRef.current?.focus()
      })
      .catch(() => {/* API offline — stay on page */})
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json() as { message?: string }
        setError(data.message ?? 'Invalid credentials')
        setPassword('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Connection failed — is the API running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#020508] px-4"
      style={{
        backgroundImage: 'radial-gradient(ellipse 60% 35% at 12% 2%, rgba(65,255,165,0.07) 0%, transparent 100%), radial-gradient(ellipse 40% 28% at 88% 6%, rgba(83,201,255,0.07) 0%, transparent 100%)',
      }}
    >
      {/* Grid backdrop */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden style={{
        backgroundImage: 'linear-gradient(rgba(126,255,210,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(126,255,210,0.03) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 90%)',
      }} />

      <div className="w-full max-w-sm">
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
              Mission Control
            </p>
          </div>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            'rounded-[16px] border border-[rgba(126,255,210,0.14)]',
            'bg-[rgba(7,14,19,0.92)] backdrop-blur-[20px]',
            'shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.03)]',
            'p-6 grid gap-5',
          )}
          aria-label="Login form"
        >
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
              placeholder="Enter your passphrase"
              autoComplete="current-password"
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
            disabled={loading || !password.trim()}
            className={cn(
              'w-full py-2.5 rounded-[10px] text-[0.8rem] font-semibold tracking-[0.06em] uppercase',
              'border border-[rgba(126,255,210,0.32)] bg-[rgba(36,255,156,0.10)]',
              'text-[#7ef7cd] transition-all duration-150',
              'hover:bg-[rgba(36,255,156,0.18)] hover:border-[rgba(126,255,210,0.45)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {loading ? 'Engaging…' : 'Engage'}
          </button>
        </form>

        <p className="text-center text-[0.62rem] text-[rgba(155,185,170,0.40)] mt-4">
          Sentinel Nexus · Operator Access Only
        </p>
      </div>
    </div>
  )
}
