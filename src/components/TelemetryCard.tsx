import type { TelemetryCard as TelemetryCardType } from '../types'

interface TelemetryCardProps {
  card: TelemetryCardType
}

export function TelemetryCard({ card }: TelemetryCardProps) {
  return (
    <article className={`telemetry-card telemetry-card--${card.severity}`}>
      <div className="telemetry-card__header">
        <p>{card.label}</p>
        <span className={`badge badge--${card.source}`}>{card.source}</span>
      </div>
      <strong>{card.value}</strong>
      <p>{card.detail}</p>
      <small>Updated {new Date(card.updatedAt).toLocaleTimeString([], { hour12: false })}</small>
    </article>
  )
}
