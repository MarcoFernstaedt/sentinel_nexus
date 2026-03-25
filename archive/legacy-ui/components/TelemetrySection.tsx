import type { TelemetryCard as TelemetryCardType } from '../types'
import { TelemetryCard } from './TelemetryCard'

interface TelemetrySectionProps {
  eyebrow: string
  title: string
  intro: string
  cards: TelemetryCardType[]
}

export function TelemetrySection({ eyebrow, title, intro, cards }: TelemetrySectionProps) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="section-intro">{intro}</p>
      </div>
      <div className="telemetry-grid">
        {cards.map((card) => (
          <TelemetryCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}
