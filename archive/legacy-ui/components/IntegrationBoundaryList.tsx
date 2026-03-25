import type { IntegrationBoundary } from '../types'

interface IntegrationBoundaryListProps {
  boundaries: IntegrationBoundary[]
}

export function IntegrationBoundaryList({ boundaries }: IntegrationBoundaryListProps) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <p className="eyebrow">Integration boundaries</p>
        <h2>What still needs runtime wiring</h2>
        <p className="section-intro">
          These seams are intentional. The interface is ready now, while unavailable data remains clearly fenced.
        </p>
      </div>
      <div className="boundary-list">
        {boundaries.map((boundary) => (
          <article key={boundary.id} className="boundary-card">
            <div className="boundary-card__header">
              <h3>{boundary.title}</h3>
              <span className={`badge badge--boundary-${boundary.status}`}>{boundary.status}</span>
            </div>
            <p>{boundary.summary}</p>
            <small>Needed for: {boundary.neededFor}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
