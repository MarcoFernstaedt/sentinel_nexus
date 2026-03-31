'use client'

import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListTodo } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { useCalendarStore } from '@/src/hooks/useCalendarStore'

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
      new Date(iso + 'T00:00:00'),
    )
  } catch { return iso }
}

function BlockerRow({
  icon: Icon,
  title,
  meta,
  tone,
}: {
  icon: React.ElementType
  title: string
  meta: string
  tone: 'critical' | 'warn'
}) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-soft last:border-0">
      <span
        className={cn(
          'flex-shrink-0 mt-[2px] w-[5px] h-[5px] rounded-full',
          tone === 'critical'
            ? 'bg-[rgba(255,112,112,0.9)] shadow-[0_0_4px_rgba(255,112,112,0.5)]'
            : 'bg-accent-warn shadow-[0_0_4px_rgba(255,203,97,0.4)]',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.73rem] font-medium text-text-0 leading-snug line-clamp-1">{title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Icon size={9} className="text-text-3 flex-shrink-0" />
          <span className="text-[0.62rem] text-text-3 line-clamp-1">{meta}</span>
        </div>
      </div>
    </div>
  )
}

export function BlockersAlertsPanel() {
  const { projects, tasks } = useProjectsStore()
  const { items }           = useCalendarStore()
  const today               = new Date().toISOString().slice(0, 10)

  const blockedProjects = projects.filter((p) => p.status === 'blocked')
  const blockedTasks    = tasks.filter((t) => t.status === 'blocked')
  const overdueItems    = items.filter(
    (ci) =>
      ci.status === 'overdue' ||
      (ci.date < today && ci.status !== 'completed' && ci.status !== 'cancelled'),
  )

  const totalCount = blockedProjects.length + blockedTasks.length + overdueItems.length
  const allClear   = totalCount === 0

  const headingId = 'blockers-panel-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Alerts"
          title="Blockers"
        />
      }
      labelledBy={headingId}
    >
      {allClear ? (
        <EmptyState
          title="All clear"
          description="No active blockers or overdue items"
          icon={CheckCircle2}
          iconClassName="text-accent-mint"
          titleClassName="text-accent-mint"
        />
      ) : (
        <div className="grid gap-0">
          {/* Blocked projects */}
          {blockedProjects.map((p) => (
            <BlockerRow
              key={p.id}
              icon={FolderKanban}
              title={p.title}
              meta={`${p.priority} priority · ${p.percentComplete}% · ${p.ownerAgent}`}
              tone="critical"
            />
          ))}

          {/* Blocked tasks */}
          {blockedTasks.map((t) => {
            const proj = projects.find((p) => p.id === t.projectId)
            return (
              <BlockerRow
                key={t.id}
                icon={ListTodo}
                title={t.title}
                meta={`${proj?.title ?? 'No project'} · ${t.assignedAgent}`}
                tone="critical"
              />
            )
          })}

          {/* Overdue calendar items */}
          {overdueItems.map((ci) => (
            <BlockerRow
              key={ci.id}
              icon={Clock}
              title={ci.title}
              meta={`${ci.type} · ${formatDateShort(ci.date)}${ci.relatedAgent ? ` · ${ci.relatedAgent}` : ''}`}
              tone="warn"
            />
          ))}
        </div>
      )}

      {/* Count footer */}
      {!allClear && (
        <div className="mt-3 pt-2 border-t border-soft flex items-center gap-1.5">
          <AlertTriangle size={10} className="text-accent-warn" />
          <span className="text-[0.62rem] text-text-3">
            {totalCount} active item{totalCount !== 1 ? 's' : ''} need attention
          </span>
        </div>
      )}
    </Surface>
  )
}
