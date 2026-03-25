import type { StatCard } from '../types'
export function StatsGrid({ cards }: { cards: StatCard[] }) { return <div className="hero-metrics">{cards.map((card) => <article key={card.label} className="stat-card"><span className={`pill ${card.severity ?? 'stable'}`}>{card.label}</span><strong>{card.value}</strong><p>{card.detail}</p></article>)}</div> }
