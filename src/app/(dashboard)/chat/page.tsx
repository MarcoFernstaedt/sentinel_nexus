'use client'

import { ArrowUp, Lock } from 'lucide-react'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { cn } from '@/src/lib/cn'

export default function ChatPage() {
  const { agents, missionContext } = useAgentsStore()
  const sentinel = agents.find((a) => a.id === 'agent-sentinel')

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-soft bg-surface-0/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-[0.62rem] text-text-3 uppercase tracking-wider leading-none mb-0.5">Command Interface</p>
            <p className="text-[0.82rem] font-semibold text-text-0 leading-tight">Sentinel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-soft px-2.5 py-0.5 text-[0.62rem] font-medium text-accent-mint bg-surface-1">
            <span className="w-[5px] h-[5px] rounded-full bg-accent-mint animate-pulse" />
            {sentinel?.status === 'active' ? 'Online' : 'Standby'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-soft px-2.5 py-0.5 text-[0.62rem] text-text-2 bg-surface-1">
            <Lock size={9} />
            Supervised
          </span>
        </div>
      </div>

      {/* Thread area */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-5 max-w-[400px] text-center">

          {/* Sentinel avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full border border-[rgba(126,255,210,0.25)] bg-surface-2 flex items-center justify-center shadow-elevated">
              <span
                className="text-[0.78rem] font-bold tracking-widest select-none"
                style={{
                  background: 'linear-gradient(135deg, #7ef7cd 0%, #71cbff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SN
              </span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-mint border-2 border-bg-0" />
          </div>

          <div className="grid gap-1.5">
            <h2 className="text-[1.1rem] font-semibold text-text-0 leading-tight tracking-tight">
              Sentinel is ready.
            </h2>
            <p className="text-[0.74rem] text-text-2 leading-relaxed">
              Send a command to begin the session. All operator instructions are routed through Sentinel.
            </p>
          </div>

          {/* Current mission objective */}
          {missionContext.teamObjective && (
            <blockquote className="w-full rounded-lg border border-[rgba(126,255,210,0.14)] bg-surface-1 px-4 py-3 text-left">
              <p className="text-[0.62rem] text-text-3 uppercase tracking-wider mb-1.5">Current Objective</p>
              <p className="text-[0.74rem] text-text-1 leading-relaxed italic">
                &ldquo;{missionContext.teamObjective}&rdquo;
              </p>
            </blockquote>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-soft bg-surface-0/80 backdrop-blur-sm px-5 py-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-lg border border-soft bg-surface-1 px-3.5 py-2.5 min-h-[44px] flex items-center">
            <span className="text-[0.76rem] text-text-3 select-none">Send a command...</span>
          </div>
          <button
            type="button"
            disabled
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
              'bg-gradient-to-br from-accent-mint/20 to-accent-cyan/20',
              'border border-[rgba(126,255,210,0.2)] opacity-50 cursor-not-allowed',
            )}
            aria-label="Send command"
          >
            <ArrowUp size={14} className="text-accent-mint" />
          </button>
        </div>

        {/* Meta strip */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[0.58rem] font-mono text-text-3">Mode: Supervised</span>
          <span className="text-[0.58rem] text-text-3" aria-hidden>·</span>
          <span className="text-[0.58rem] font-mono text-text-3">Model: claude-opus-4-6</span>
          <span className="text-[0.58rem] text-text-3" aria-hidden>·</span>
          <span className="text-[0.58rem] font-mono text-text-3">Target: Sentinel</span>
        </div>
      </div>
    </div>
  )
}
