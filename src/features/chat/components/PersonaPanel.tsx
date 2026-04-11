import type { ActivityItem, ChatMode, RuntimeContext, RuntimeStatusSnapshot, TransportPreview } from '../model/types'
import { cn } from '@/src/lib/cn'

function formatLastSyncLabel(timestamp: string | undefined) {
  if (!timestamp) return 'Waiting for API'
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp
  return new Date(parsed).toLocaleTimeString([], { hour12: false })
}

type PersonaPanelProps = {
  activeMode: ChatMode
  transportPreview: TransportPreview
  runtimeContext: RuntimeContext | null
  runtimeStatus: RuntimeStatusSnapshot | null
  suggestedPrompts: string[]
  historyCount: number
  recentActivity: ActivityItem[]
  onPromptSelect: (prompt: string) => void
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-soft px-4 py-3 last:border-0">
      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-text-3 font-medium mb-2">{title}</p>
      {children}
    </section>
  )
}

export function PersonaPanel({
  activeMode,
  transportPreview,
  runtimeContext,
  runtimeStatus,
  suggestedPrompts,
  historyCount,
  recentActivity,
  onPromptSelect,
}: PersonaPanelProps) {
  const runtimeLabel = runtimeContext
    ? `${runtimeContext.session.hostLabel} · ${runtimeContext.session.serviceKind}`
    : 'Runtime context unavailable'

  const lastSyncLabel = formatLastSyncLabel(runtimeStatus?.capturedAt)

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto border-l border-soft bg-[rgba(5,10,15,0.5)]"
      aria-labelledby="persona-panel-heading"
    >
      {/* Hero block */}
      <div className="px-4 py-4 border-b border-soft bg-[linear-gradient(180deg,rgba(126,255,210,0.05),transparent)]">
        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-accent-mint-dim font-medium mb-1">
          Sentinel presence
        </p>
        <h2 id="persona-panel-heading" className="text-[0.88rem] font-semibold text-text-0 mb-0.5">
          {activeMode.label}
        </h2>
        <p className="text-[0.72rem] text-text-2 leading-relaxed mb-2">{activeMode.intent}</p>
        <p className="text-[0.7rem] text-accent-mint italic leading-relaxed">"{activeMode.personaLine}"</p>
      </div>

      {/* Transport */}
      <PanelSection title="Chat transport">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[0.78rem] font-semibold text-text-0">{transportPreview.provider}</span>
          <span className={cn(
            'text-[0.6rem] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border',
            transportPreview.state === 'ready-for-runtime'
              ? 'border-[rgba(126,255,210,0.3)] bg-[rgba(126,255,210,0.08)] text-accent-mint'
              : 'border-[rgba(255,203,97,0.3)] bg-[rgba(255,203,97,0.06)] text-accent-warn',
          )}>
            {transportPreview.state}
          </span>
        </div>
        <p className="text-[0.68rem] text-text-2 leading-relaxed">{transportPreview.summary}</p>
      </PanelSection>

      {/* Runtime session */}
      <PanelSection title="Runtime session">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[0.76rem] font-semibold text-text-0 leading-tight">{runtimeLabel}</span>
          <span className="text-[0.6rem] text-text-3 font-mono flex-shrink-0">sync {lastSyncLabel}</span>
        </div>
        <p className="text-[0.68rem] text-text-2">
          {runtimeContext
            ? `Msgs ${runtimeContext.chat.messageCount} · Notes ${runtimeContext.surfaces.notesCount} · Tasks ${runtimeContext.surfaces.tasksCount}`
            : 'No server session yet — running locally.'}
        </p>
      </PanelSection>

      {/* Recent activity */}
      <PanelSection title={`Recent progress — ${recentActivity.length} items`}>
        <div className="flex flex-col gap-1" role="list" aria-live="polite">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 4).map((item) => (
              <div key={item.id} role="listitem" className="text-[0.66rem] text-text-2 leading-snug">
                <span className="text-text-3 font-mono">[{item.type}]</span>{' '}
                <span className="text-text-1">{item.title}</span>
                {item.detail && <span className="text-text-3"> — {item.detail}</span>}
              </div>
            ))
          ) : (
            <p role="listitem" className="text-[0.66rem] text-text-3">No activity logged yet.</p>
          )}
        </div>
      </PanelSection>

      {/* History count */}
      <PanelSection title="Prompt memory">
        <p className="text-[0.76rem] font-semibold text-text-0 mb-0.5">
          {historyCount.toString().padStart(2, '0')} recalled entries
        </p>
        <p className="text-[0.66rem] text-text-2">Use ↑↓ in the composer to recall previous prompts.</p>
      </PanelSection>

      {/* Suggested prompts */}
      {suggestedPrompts.length > 0 && (
        <PanelSection title="Quick injections">
          <div className="flex flex-col gap-1.5" role="list">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={prompt}
                type="button"
                role="listitem"
                onClick={() => onPromptSelect(prompt)}
                className="flex items-start gap-2 rounded-lg border border-soft bg-surface-0 px-2.5 py-2 text-left hover:border-[rgba(126,255,210,0.25)] hover:bg-[rgba(126,255,210,0.04)] transition-all duration-150 group"
              >
                <span className="flex-shrink-0 text-[0.6rem] font-mono text-text-3 group-hover:text-accent-mint-dim pt-0.5">
                  0{i + 1}
                </span>
                <span className="text-[0.68rem] text-text-2 group-hover:text-text-1 leading-snug">{prompt}</span>
              </button>
            ))}
          </div>
        </PanelSection>
      )}
    </aside>
  )
}
