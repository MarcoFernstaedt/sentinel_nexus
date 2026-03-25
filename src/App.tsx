import './App.css'
import { Composer } from './features/chat/components/Composer'
import { ConversationView } from './features/chat/components/ConversationView'
import { ModeSwitch } from './features/chat/components/ModeSwitch'
import { PersonaPanel } from './features/chat/components/PersonaPanel'
import { useLocalChat } from './features/chat/hooks/useLocalChat'

function App() {
  const {
    activeMode,
    activeModeId,
    apiState,
    draft,
    historyCursorLabel,
    inputHistory,
    isResponding,
    messages,
    modes,
    runtimeContext,
    runtimeStatus,
    suggestedPrompts,
    transportPreview,
    setActiveModeId,
    setDraft,
    submitMessage,
    cycleHistory,
  } = useLocalChat()

  const latestMessage = messages[messages.length - 1]
  const sentinelMessages = messages.filter((message) => message.role === 'sentinel').length
  const operatorMessages = messages.filter((message) => message.role === 'operator').length
  const runtimeSummary = runtimeContext
    ? `${runtimeContext.session.hostLabel} · ${runtimeContext.chat.messageCount} messages synced`
    : 'Server-derived session context not available'

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-block">
          <p className="eyebrow">Sentinel Nexus</p>
          <h1>Private command surface for Marco and Sentinel.</h1>
          <p className="muted-copy">
            A cleaner, more deliberate interface for execution, decisions, and build pressure outside
            Telegram.
          </p>
        </div>

        <div className="rail-card rail-card--accent">
          <div className="rail-card__header">
            <p className="eyebrow">Live posture</p>
            <span className={`status-pill ${isResponding ? 'status-pill--live' : ''}`}>
              {isResponding ? 'Engaged' : apiState === 'connected' ? 'Synced' : 'Fallback'}
            </span>
          </div>
          <strong>{activeMode.label}</strong>
          <p className="muted-copy">{activeMode.intent}</p>
        </div>

        <div className="rail-grid">
          <div className="rail-metric">
            <span>Mode</span>
            <strong>{modes.length}</strong>
            <small>personas ready</small>
          </div>
          <div className="rail-metric">
            <span>Recall</span>
            <strong>{inputHistory.length.toString().padStart(2, '0')}</strong>
            <small>prompts stored</small>
          </div>
          <div className="rail-metric">
            <span>Replies</span>
            <strong>{sentinelMessages.toString().padStart(2, '0')}</strong>
            <small>Sentinel messages</small>
          </div>
          <div className="rail-metric">
            <span>Runtime</span>
            <strong>{apiState === 'connected' ? 'Live' : 'Local'}</strong>
            <small>{transportPreview.provider}</small>
          </div>
        </div>

        <div className="rail-card">
          <p className="eyebrow">Runtime sync</p>
          <strong>{apiState === 'connected' ? 'Backend connected' : 'Local fallback'}</strong>
          <p className="muted-copy">{runtimeSummary}</p>
        </div>

        <div className="rail-card">
          <p className="eyebrow">Design intent</p>
          <ul className="rail-list muted-copy">
            <li>Keep the active conversation primary.</li>
            <li>Make runtime limitations visible without feeling broken.</li>
            <li>Preserve fast prompt recall and mode switching.</li>
          </ul>
        </div>
      </aside>

      <main className="workspace">
        <section className="chat-surface panel">
          <header className="surface-header">
            <div>
              <p className="eyebrow">Conversation</p>
              <h2>Operator ↔ Sentinel</h2>
              <p className="muted-copy">
                One focused thread, persona-shaped by mode, with transport seams and local memory
                exposed instead of hidden.
              </p>
            </div>
            <div className="header-badges">
              <span className="status-pill">{apiState === 'connected' ? 'API live' : 'Private local shell'}</span>
              <span className="status-pill status-pill--subtle">
                {runtimeStatus ? `Synced ${runtimeStatus.environment}` : 'Runtime status pending'}
              </span>
            </div>
          </header>

          <section className="overview-strip" aria-label="Conversation overview">
            <div className="overview-card">
              <span>Active mode</span>
              <strong>{activeMode.label}</strong>
              <small>{activeMode.accent}</small>
            </div>
            <div className="overview-card">
              <span>Thread state</span>
              <strong>{isResponding ? 'Sentinel composing' : 'Ready for input'}</strong>
              <small>{messages.length} visible messages</small>
            </div>
            <div className="overview-card">
              <span>Operator activity</span>
              <strong>{operatorMessages.toString().padStart(2, '0')} prompts</strong>
              <small>{historyCursorLabel}</small>
            </div>
            <div className="overview-card">
              <span>Latest event</span>
              <strong>{latestMessage?.author ?? 'Waiting'}</strong>
              <small>{latestMessage?.timestamp ?? 'No activity yet'}</small>
            </div>
          </section>

          <ModeSwitch modes={modes} activeModeId={activeModeId} onSelect={setActiveModeId} />
          <ConversationView messages={messages} />
          <Composer
            draft={draft}
            historyCursorLabel={historyCursorLabel}
            isResponding={isResponding}
            activeModeLabel={activeMode.label}
            onDraftChange={(value) => setDraft({ value, historyIndex: null })}
            onSubmit={() => submitMessage(draft.value)}
            onHistory={cycleHistory}
          />
        </section>

        <PersonaPanel
          activeMode={activeMode}
          transportPreview={transportPreview}
          runtimeContext={runtimeContext}
          runtimeStatus={runtimeStatus}
          suggestedPrompts={suggestedPrompts}
          historyCount={inputHistory.length}
          onPromptSelect={(prompt) => setDraft({ value: prompt, historyIndex: null })}
        />
      </main>
    </div>
  )
}

export default App
