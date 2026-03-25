import type { PropsWithChildren } from 'react'

type SectionProps = PropsWithChildren<{
  id?: string
  eyebrow?: string
  title: string
  intro?: string
}>

export function Section({ id, eyebrow, title, intro, children }: SectionProps) {
  return (
    <section id={id} className="section-shell">
      <div className="section-heading">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {intro ? <p className="section-intro">{intro}</p> : null}
      </div>
      {children}
    </section>
  )
}
