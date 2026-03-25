import './App.css'
import { agentRoles, chatMessages, notesTasks, quickTools, systemPanels, topStats, usagePanels } from './data'
import type { Severity } from './types'

const severityLabel = (severity: Severity = 'stable') => severity

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Sentinel Nexus</p>
          <h1>Operator control surface</h1>
          <p className="sidebar-copy">
            A clean v1 command interface for Sentinel: chat, system posture, usage tracking,
            agent activity, notes, tasks, and fast operator tools.
          </p>
        </div>

        <div className="mode-card">
          <span className="mode-dot" />
          <div>
            <p className="mode-label">Mode</p>
            <strong>Executive Oversight</strong>
            <p className="mode-description">
              Strong posture. High signal. Human-in-the-loop where it matters.
            </p>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-title">System status</p>
          {systemPanels.map((panel) => (
            <article className="mini-card" key={panel.label}>
              <div className="mini-card-header">
                <span>{panel.label}</span>
                <span className={`pill ${panel.severity}`}>{severityLabel(panel.severity)}</span>
              </div>
              <strong>{panel.value}</strong>
              <p>{panel.detail}</p>
            </article>
          ))}
        </div>
      </aside>

      <main className="dashboard">
        <section className="hero-card panel">
          <div>
            <p className="eyebrow">Command bridge</p>
            <h2>Sentinel is ready to direct the room.</h2>
            <p className="hero-copy">
              This shell is intentionally productized: modern dashboard layout, strong contrast,
              accessible sizing, and clear placeholders where live integrations should land next.
            </p>
          </div>
          <div className="hero-metrics">
            {topStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className="mini-card-header">
                  <span>{stat.label}</span>
                  {stat.severity ? (
                    <span className={`pill ${stat.severity}`}>{severityLabel(stat.severity)}</span>
                  ) : null}
                </div>
                <strong>{stat.value}</strong>
                <p>{stat.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-grid">
          <section className="panel chat-panel">
            <div className="panel-header">
              <div>
                <p className="section-title">Chat with Sentinel</p>
                <h3>UI shell</h3>
              </div>
              <button className="ghost-button">New thread</button>
            </div>

            <div className="chat-log">
              {chatMessages.map((message) => (
                <article className={`chat-bubble ${message.sender}`} key={message.id}>
                  <div className="chat-meta">
                    <span>{message.sender === 'sentinel' ? 'Sentinel' : 'Operator'}</span>
                    <time>{message.time}</time>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>

            <div className="composer">
              <input aria-label="Message Sentinel" placeholder="Message Sentinel…" />
              <button>Transmit</button>
            </div>
          </section>

          <section className="stack-column">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-title">Usage and status</p>
                  <h3>Operational panels</h3>
                </div>
              </div>
              <div className="list-grid">
                {usagePanels.map((panel) => (
                  <article className="info-card" key={panel.label}>
                    <div className="mini-card-header">
                      <span>{panel.label}</span>
                      <span className={`pill ${panel.severity}`}>{severityLabel(panel.severity)}</span>
                    </div>
                    <strong>{panel.value}</strong>
                    <p>{panel.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-title">Sub-agent roles</p>
                  <h3>Activity map</h3>
                </div>
              </div>
              <div className="agents-list">
                {agentRoles.map((agent) => (
                  <article className="agent-row" key={agent.role}>
                    <div>
                      <div className="agent-title-row">
                        <strong>{agent.role}</strong>
                        <span className="agent-status">{agent.status}</span>
                      </div>
                      <p>{agent.detail}</p>
                    </div>
                    <div className="meter-block">
                      <span>{agent.load}% load</span>
                      <div className="meter-track">
                        <div className="meter-fill" style={{ width: `${agent.load}%` }} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <section className="stack-column">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-title">Notes and tasks</p>
                  <h3>Execution ledger</h3>
                </div>
                <button className="ghost-button">Add note</button>
              </div>
              <div className="tasks-list">
                {notesTasks.map((task) => (
                  <article className="task-row" key={task.title}>
                    <div>
                      <strong>{task.title}</strong>
                      <p>
                        {task.owner} · {task.due}
                      </p>
                    </div>
                    <span className={`task-state ${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-title">Quick tools</p>
                  <h3>Fast actions</h3>
                </div>
              </div>
              <div className="tools-list">
                {quickTools.map((tool) => (
                  <article className="tool-card" key={tool.title}>
                    <div>
                      <strong>{tool.title}</strong>
                      <p>{tool.description}</p>
                    </div>
                    <span>{tool.hotkey}</span>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </section>
      </main>
    </div>
  )
}

export default App
