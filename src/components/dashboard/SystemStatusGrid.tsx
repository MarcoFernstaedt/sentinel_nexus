'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { useDashboard } from './DashboardDataProvider'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { useCalendarStore } from '@/src/hooks/useCalendarStore'
import { Inbox } from 'lucide-react'

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

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
      new Date(iso + 'T00:00:00'),
    )
  } catch { return iso }
}

export function SystemStatusGrid() {
  const { missionCommand, runtimeStatus, apiState } = useDashboard()
  const { goals, projects: apiProjects, calendar: apiCalendar } = missionCommand

  const { projects: localProjects } = useProjectsStore()
  const { items: localCalendarItems } = useCalendarStore()

  const isOffline = apiState === 'local-fallback'
  const statusCards = runtimeStatus?.cards.slice(0, 3) ?? []

  // Derive what to show in each panel
  const offlineProjects = localProjects.slice(0, 5)

  const upcomingLocalEvents = localCalendarItems
    .filter((ci) => ci.status !== 'completed' && ci.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  const upcomingApiEvents = apiCalendar
    .filter((e) => e.status !== 'done')
    .slice(0, 4)

  const goalsHeadingId   = 'goals-panel-heading'
  const projectsHeadingId = 'projects-panel-heading'
  const systemHeadingId  = 'system-panel-heading'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Panel 1: Goals (API) or Projects (offline) */}
      <Surface
        header={
          <SectionHeading
            id={goalsHeadingId}
            eyebrow="Mission"
            title={isOffline ? 'Projects' : 'Goals'}
          />
        }
        labelledBy={goalsHeadingId}
      >
        {isOffline ? (
          offlineProjects.length === 0 ? (
            <EmptyState title="No projects" icon={Inbox} />
          ) : (
            <div>
              {offlineProjects.map((p) => {
                const tone: 'live' | 'critical' | 'subtle' | 'pending' =
                  p.status === 'in-progress' ? 'live'     :
                  p.status === 'blocked'     ? 'critical' :
                  p.status === 'completed'   ? 'subtle'   : 'pending'
                const label =
                  p.status === 'in-progress' ? 'In Progress' :
                  p.status === 'blocked'     ? 'Blocked'     :
                  p.status === 'completed'   ? 'Done'        : 'To Do'
                return (
                  <StatusRow
                    key={p.id}
                    title={p.title}
                    subtitle={`${p.percentComplete}% · ${p.ownerAgent}`}
                    badgeLabel={label}
                    badgeTone={tone}
                  />
                )
              })}
            </div>
          )
        ) : goals.length === 0 ? (
          <EmptyState title="No goals loaded" icon={Inbox} />
        ) : (
          <div>
            {goals.slice(0, 5).map((goal) => {
              const tone: 'live' | 'warning' | 'critical' =
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

      {/* Panel 2: Projects */}
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
        {isOffline ? (
          offlineProjects.length === 0 ? (
            <EmptyState title="No projects" icon={Inbox} />
          ) : (
            <div>
              {offlineProjects.map((p) => {
                const tone: 'live' | 'critical' | 'subtle' | 'pending' =
                  p.status === 'in-progress' ? 'live'     :
                  p.status === 'blocked'     ? 'critical' :
                  p.status === 'completed'   ? 'subtle'   : 'pending'
                return (
                  <StatusRow
                    key={p.id}
                    title={p.title}
                    subtitle={p.description}
                    badgeLabel={`${p.percentComplete}%`}
                    badgeTone={tone}
                  />
                )
              })}
            </div>
          )
        ) : apiProjects.length === 0 ? (
          <EmptyState title="No projects loaded" icon={Inbox} />
        ) : (
          <div>
            {apiProjects.slice(0, 5).map((project) => {
              const tone: 'live' | 'warning' | 'critical' | 'pending' =
                project.status === 'active'  ? 'live'     :
                project.status === 'watch'   ? 'warning'  :
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

      {/* Panel 3: Runtime Status (API) or Upcoming (offline/no status) */}
      <Surface
        header={
          <SectionHeading
            id={systemHeadingId}
            eyebrow={apiState === 'connected' && statusCards.length > 0 ? 'Systems' : 'Schedule'}
            title={apiState === 'connected' && statusCards.length > 0 ? 'Runtime Status' : 'Upcoming'}
          />
        }
        labelledBy={systemHeadingId}
      >
        {apiState === 'connected' && statusCards.length > 0 ? (
          <div>
            {statusCards.map((card) => {
              const tone: 'live' | 'warning' | 'critical' | 'pending' =
                card.severity === 'stable'   ? 'live'     :
                card.severity === 'watch'    ? 'warning'  :
                card.severity === 'critical' ? 'critical' : 'pending'
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
        ) : isOffline ? (
          upcomingLocalEvents.length === 0 ? (
            <EmptyState title="No upcoming events" icon={Inbox} />
          ) : (
            <div>
              {upcomingLocalEvents.map((ci) => {
                const tone: 'warning' | 'pending' =
                  ci.status === 'overdue' ? 'warning' : 'pending'
                return (
                  <StatusRow
                    key={ci.id}
                    title={ci.title}
                    subtitle={`${ci.type}${ci.relatedAgent ? ` · ${ci.relatedAgent}` : ''}`}
                    badgeLabel={formatDateShort(ci.date)}
                    badgeTone={tone}
                  />
                )
              })}
            </div>
          )
        ) : upcomingApiEvents.length === 0 ? (
          <EmptyState title="No upcoming events" icon={Inbox} />
        ) : (
          <div>
            {upcomingApiEvents.map((event) => {
              const tone: 'live' | 'pending' = event.status === 'next-up' ? 'live' : 'pending'
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
        )}
      </Surface>
    </div>
  )
}
