'use client'

import { useMemo } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { useDashboard } from './DashboardDataProvider'

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-[0.72rem] text-text-3 text-center py-4">
      {label}
    </p>
  )
}

function StatusRow({
  title,
  subtitle,
  badgeLabel,
  badgeTone,
}: {
  title: string
  subtitle?: string
  badgeLabel: string
  badgeTone: 'live' | 'warning' | 'critical' | 'pending' | 'default' | 'subtle'
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-soft last:border-0">
      <div className="min-w-0">
        <p className="text-[0.78rem] font-medium text-text-0 leading-tight truncate">{title}</p>
        {subtitle && (
          <p className="text-[0.67rem] text-text-2 mt-0.5 leading-snug line-clamp-1">{subtitle}</p>
        )}
      </div>
      <StatusBadge tone={badgeTone} className="flex-shrink-0">{badgeLabel}</StatusBadge>
    </div>
  )
}

export function SystemStatusGrid() {
  const { missionCommand, runtimeStatus, apiState } = useDashboard()
  const { goals, projects, calendar } = missionCommand

  const upcomingEvents = useMemo(
    () => calendar.filter((e) => e.status !== 'done').slice(0, 4),
    [calendar],
  )

  const statusCards = useMemo(
    () => runtimeStatus?.cards.slice(0, 3) ?? [],
    [runtimeStatus],
  )

  const goalsHeadingId = 'goals-panel-heading'
  const projectsHeadingId = 'projects-panel-heading'
  const systemHeadingId = 'system-panel-heading'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Goals Panel */}
      <Surface
        header={
          <SectionHeading
            id={goalsHeadingId}
            eyebrow="Mission"
            title="Goals"
          />
        }
        labelledBy={goalsHeadingId}
      >
        {goals.length === 0 ? (
          <EmptyState label="No goals loaded — API offline or not configured" />
        ) : (
          <div>
            {goals.slice(0, 5).map((goal) => {
              const tone =
                goal.status === 'on-track' ? 'live'    :
                goal.status === 'at-risk'  ? 'warning' : 'critical'
              return (
                <StatusRow
                  key={goal.id}
                  title={goal.title}
                  subtitle={`${goal.progressPercent}% · ${goal.targetDate}`}
                  badgeLabel={goal.status}
                  badgeTone={tone}
                />
              )
            })}
          </div>
        )}
      </Surface>

      {/* Projects Panel */}
      <Surface
        header={
          <SectionHeading
            id={projectsHeadingId}
            eyebrow="Execution"
            title="Projects"
          />
        }
        labelledBy={projectsHeadingId}
      >
        {projects.length === 0 ? (
          <EmptyState label="No projects loaded — API offline or not configured" />
        ) : (
          <div>
            {projects.slice(0, 5).map((project) => {
              const tone =
                project.status === 'active'  ? 'live'    :
                project.status === 'watch'   ? 'warning' :
                project.status === 'blocked' ? 'critical' : 'pending'
              return (
                <StatusRow
                  key={project.id}
                  title={project.name}
                  subtitle={project.objective}
                  badgeLabel={project.status}
                  badgeTone={tone}
                />
              )
            })}
          </div>
        )}
      </Surface>

      {/* System Status / Calendar Panel */}
      <Surface
        header={
          <SectionHeading
            id={systemHeadingId}
            eyebrow="Systems"
            title={apiState === 'connected' ? 'Runtime Status' : 'Upcoming'}
          />
        }
        labelledBy={systemHeadingId}
      >
        {apiState === 'connected' && statusCards.length > 0 ? (
          <div>
            {statusCards.map((card) => {
              const tone =
                card.severity === 'stable'      ? 'live'    :
                card.severity === 'watch'        ? 'warning' :
                card.severity === 'critical'     ? 'critical' : 'pending'
              return (
                <StatusRow
                  key={card.id}
                  title={card.label}
                  subtitle={card.detail}
                  badgeLabel={card.value}
                  badgeTone={tone}
                />
              )
            })}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div>
            {upcomingEvents.map((event) => {
              const tone = event.status === 'next-up' ? 'live' : 'pending'
              return (
                <StatusRow
                  key={event.id}
                  title={event.title}
                  subtitle={event.detail}
                  badgeLabel={event.status}
                  badgeTone={tone}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            label={
              apiState === 'local-fallback'
                ? 'API offline — runtime status unavailable'
                : 'No upcoming events'
            }
          />
        )}
      </Surface>
    </div>
  )
}
