import './App.css'
import { AppHeader } from './components/AppHeader'
import { ExternalLink } from './components/ExternalLink'
import { Section } from './components/Section'
import {
  hero,
  integrationLinks,
  pillars,
  principles,
  stackNotes,
} from './content/siteContent'

function App() {
  return (
    <div className="app-shell">
      <AppHeader
        primaryAction={hero.primaryAction}
        secondaryAction={hero.secondaryAction}
      />

      <main>
        <section className="hero-panel">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>{hero.title}</h1>
          <p className="hero-summary">{hero.summary}</p>
          <div className="hero-actions">
            <a className="action-link action-link--primary" href={hero.primaryAction.href}>
              {hero.primaryAction.label}
            </a>
            <a className="action-link action-link--secondary" href={hero.secondaryAction.href}>
              {hero.secondaryAction.label}
            </a>
          </div>
        </section>

        <Section
          id="architecture"
          eyebrow="Architecture review"
          title="What this pass improves"
          intro="The starter template is now split into small, testable seams that can grow into a serious operator interface."
        >
          <div className="card-grid">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="card">
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          id="stack"
          eyebrow="Design principles"
          title="Maintainability comes from structure, not promises"
          intro="These principles should stay intact as the product grows into auth, APIs, dashboards, and policy-aware workflows."
        >
          <div className="card-grid card-grid--compact">
            {principles.map((principle) => (
              <article key={principle.title} className="card card--compact">
                <h3>{principle.title}</h3>
                <p>{principle.detail}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Platform stack"
          title="Current build surface"
          intro="Useful because it is explicit. Dangerous only if future work keeps piling into the root without feature boundaries."
        >
          <div className="stack-layout">
            <ul className="stack-list">
              {stackNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <div className="link-cluster" aria-label="Core technologies">
              {integrationLinks.map((link) => (
                <ExternalLink key={link.label} href={link.href} className="chip-link">
                  {link.label}
                </ExternalLink>
              ))}
            </div>
          </div>
        </Section>
      </main>
    </div>
  )
}

export default App
