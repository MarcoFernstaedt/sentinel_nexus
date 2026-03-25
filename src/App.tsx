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
    draft,
    historyCursorLabel,
    inputHistory,
    isResponding,
    messages,
    modes,
    suggestedPrompts,
    transportPreview,
    setActiveModeId,
    setDraft,
    submitMessage,
    cycleHistory,
  } = useLocalChat()

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <p className="eyebrow">Sentinel Nexus</p>
        <h1>Local command interface for Sentinel.</h1>
        <p className="muted-copy">
          A deeper chat surface with visible runtime seams, persona-aware modes, and operator
          prompt recall already built into the shell.
        </p>

        <div className="rail-card">
          <p className="eyebrow">Current mode</p>
          <strong>{activeMode.label}</strong>
          <p className="muted-copy">{activeMode.intent}</p>
        </div>

        <div className="rail-card">
          <p className="eyebrow">Why this build matters</p>
          <p className="muted-copy">
            The UI now behaves like a real command console locally, while staying clean enough to
            swap in gateway events, persistence, and real transport later.
          </p>
        </div>
      </aside>

      <main className="workspace">
        <section className="chat-surface panel">
          <header className="surface-header">
            <div>
              <p className="eyebrow">Conversation</p>
              <h2>Operator ↔ Sentinel</h2>
              <p className="muted-copy">
                Sentinel frames the exchange by mode, remembers recent prompts locally, and stages
                runtime integration behind a mock transport seam.
              </p>
            </div>
            <div className="header-badges">
              <span className="status-pill">Local-only</span>
              <span className="status-pill status-pill--subtle">Runtime adapter pending</span>
            </div>
          </header>

          <ModeSwitch modes={modes} activeModeId={activeModeId} onSelect={setActiveModeId} />
          <ConversationView messages={messages} />
          <Composer
            draft={draft}
            historyCursorLabel={historyCursorLabel}
            isResponding={isResponding}
            onDraftChange={(value) => setDraft({ value, historyIndex: null })}
            onSubmit={() => submitMessage(draft.value)}
            onHistory={cycleHistory}
          />
        </section>

        <PersonaPanel
          activeMode={activeMode}
          transportPreview={transportPreview}
          suggestedPrompts={suggestedPrompts}
          historyCount={inputHistory.length}
          onPromptSelect={(prompt) => setDraft({ value: prompt, historyIndex: null })}
        />
      </main>
    </div>
  )
}

export default App
