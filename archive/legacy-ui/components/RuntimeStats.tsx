import type { RuntimeStat } from '../types'

interface RuntimeStatsProps {
  stats: RuntimeStat[]
}

export function RuntimeStats({ stats }: RuntimeStatsProps) {
  return (
    <section className="runtime-strip" aria-label="Runtime context">
      {stats.map((stat) => (
        <article key={stat.label} className="runtime-tile">
          <p>{stat.label}</p>
          <strong>{stat.value}</strong>
          <small>{stat.detail}</small>
        </article>
      ))}
    </section>
  )
}
