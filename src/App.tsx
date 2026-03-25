import './App.css'
import { IntegrationBoundaryList } from './components/IntegrationBoundaryList'
import { ModeStatusPanel } from './components/ModeStatusPanel'
import { RuntimeStats } from './components/RuntimeStats'
import { TelemetrySection } from './components/TelemetrySection'
import { useTelemetry } from './features/telemetry/useTelemetry'

function App() {
  const { snapshot, lastRefreshLabel } = useTelemetry()

  return (
    <div className="app-shell">
      <header className="hero-shell">
        <div>
          <p className="eyebrow">Sentinel Nexus</p>
          <h1>Local telemetry board for operator control</h1>
          <p className="hero-copy">
            Built to feel alive now, even before full backend integration. Live browser/runtime signals drive
            the board where possible; unavailable host data stays explicit instead of pretending to be real.
          </p>
        </div>

        <div className="hero-meta">
          <div className="hero-meta__block">
            <span>Snapshot</span>
            <strong>{lastRefreshLabel} local refresh</strong>
          </div>
          <div className="hero-meta__block">
            <span>Architecture</span>
            <strong>Feature modules + runtime seams</strong>
          </div>
        </div>
      </header>

      <RuntimeStats stats={snapshot.runtimeStats} />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <TelemetrySection
            eyebrow="VPS posture"
            title="Remote status cards with honest local fallbacks"
            intro="Reachability and session vitality are live or derived locally. True host metrics stay fenced until a runtime feed exists."
            cards={snapshot.vpsCards}
          />

          <TelemetrySection
            eyebrow="Usage and local status"
            title="Browser-fed signals for a live-feeling operator shell"
            intro="These cards update from local runtime APIs now, while spend and queue budgets remain reserved for backend telemetry."
            cards={snapshot.localUsageCards}
          />
        </div>

        <aside className="dashboard-side">
          <ModeStatusPanel mode={snapshot.modeStatus} />
          <IntegrationBoundaryList boundaries={snapshot.integrationBoundaries} />
        </aside>
      </div>
    </div>
  )
}

export default App
