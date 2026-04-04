'use client'

import React from 'react'
import { cn } from '@/src/lib/cn'

const STEPS = [
  {
    n: '01',
    title: 'Create your first task',
    detail: 'Use the API or ask Claude Code to POST /api/tasks with a title, owner, and lane.',
  },
  {
    n: '02',
    title: 'Link it to a project',
    detail: 'Include projectId when creating tasks or notes so they roll up to your project goals.',
  },
  {
    n: '03',
    title: 'Track goals & habits',
    detail: 'Scroll down to Goals and Habits — update progress bars and check off daily habits.',
  },
]

export function WelcomePanel() {
  return (
    <section
      aria-label="Mission Control quick-start guide"
      className={cn(
        'rounded-[16px] border border-[rgba(126,255,210,0.16)]',
        'bg-[rgba(7,14,19,0.88)] backdrop-blur-[12px]',
        'shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)]',
        'p-5 grid gap-5',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full bg-[#41ffa5] flex-shrink-0"
          style={{ boxShadow: '0 0 8px rgba(65,255,165,0.55)' }}
          aria-hidden
        />
        <div>
          <p className="text-[0.58rem] uppercase tracking-[0.18em] text-[rgba(126,247,205,0.55)] font-medium mb-0.5">
            Mission Control Ready
          </p>
          <h2 className="text-[0.9rem] font-semibold text-[rgba(233,255,246,0.97)] leading-tight">
            Welcome — here&apos;s how to get started
          </h2>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className={cn(
              'rounded-[10px] border border-[rgba(126,255,210,0.1)] bg-[rgba(6,12,18,0.70)]',
              'p-3.5 grid gap-1.5',
            )}
          >
            <span className="text-[0.6rem] font-mono font-semibold text-[rgba(126,247,205,0.45)] uppercase tracking-[0.1em]">
              Step {step.n}
            </span>
            <p className="text-[0.78rem] font-semibold text-[rgba(233,255,246,0.9)] leading-snug">
              {step.title}
            </p>
            <p className="text-[0.68rem] text-[rgba(155,185,170,0.7)] leading-relaxed">
              {step.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Agent key callout */}
      <div
        className={cn(
          'rounded-[10px] border border-[rgba(83,201,255,0.2)] bg-[rgba(83,201,255,0.05)]',
          'px-4 py-3 flex items-start gap-3',
        )}
        role="note"
      >
        <svg
          className="w-4 h-4 text-[#53c9ff] flex-shrink-0 mt-0.5"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.2" />
          <path d="M8 7v4M8 5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <div className="grid gap-0.5">
          <p className="text-[0.7rem] font-medium text-[rgba(83,201,255,0.9)]">Agent API Key</p>
          <p className="text-[0.67rem] text-[rgba(155,185,200,0.75)] leading-relaxed">
            Your Claude Code API key is in{' '}
            <strong className="text-[rgba(83,201,255,0.8)] font-medium">Settings → Auth &amp; Access</strong>.
            Pass it as the{' '}
            <code className="text-[#7ef7cd] font-mono">X-Nexus-Key</code> header so agents can
            read and update mission data directly — no browser login needed.
          </p>
          <code className="mt-1 text-[0.64rem] text-[rgba(126,247,205,0.7)] font-mono">
            curl -H &quot;X-Nexus-Key: &lt;key&gt;&quot; http://localhost:3001/api/bootstrap
          </code>
        </div>
      </div>
    </section>
  )
}
