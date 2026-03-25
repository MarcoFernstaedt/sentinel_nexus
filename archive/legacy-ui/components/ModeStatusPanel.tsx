import type { ModeStatus } from '../types'

interface ModeStatusPanelProps {
  mode: ModeStatus
}

export function ModeStatusPanel({ mode }: ModeStatusPanelProps) {
  return (
    <section className="mode-panel">
      <div className="section-heading">
        <p className="eyebrow">Mode status</p>
        <h2>{mode.name}</h2>
      </div>
      <div className="mode-panel__content">
        <span className={`badge badge--mode-${mode.state}`}>{mode.state}</span>
        <p>{mode.summary}</p>
        <p className="mode-guidance">{mode.operatorGuidance}</p>
      </div>
    </section>
  )
}
