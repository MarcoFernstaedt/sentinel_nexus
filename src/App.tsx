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
          id="scope"
          eyebrow="Scope discipline"
          title="What Sentinel Nexus is—and what it is not"
          intro="This product should remain the assistant-facing operator console. It should not drift into a second business operating system."
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
          id="roadmap"
          eyebrow="Highest-value v1"
          title="Build the shell first, then expand carefully"
          intro="The product path is clear: overview now, deeper operating surfaces later."
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
          eyebrow="Architecture recommendation"
          title="Keep modular seams visible from the start"
          intro="Useful because it is explicit. Dangerous only if future work piles into the root without feature boundaries."
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
