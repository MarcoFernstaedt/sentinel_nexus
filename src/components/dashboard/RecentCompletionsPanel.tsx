'use client'

import { CheckCircle2, FolderKanban } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
      new Date(iso),
    )
  } catch { return iso }
}

export function RecentCompletionsPanel() {
  const { projects, tasks } = useProjectsStore()

  // Completed tasks sorted by updatedAt desc
  const completedTasks = [...tasks]
    .filter((t) => t.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const completedProjects = projects.filter((p) => p.status === 'completed')

  const headingId = 'completions-panel-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Progress"
          title="Recent Completions"
        />
      }
      labelledBy={headingId}
    >
      {completedTasks.length === 0 && completedProjects.length === 0 ? (
        <p className="text-[0.72rem] text-text-3 text-center py-4">No completions yet</p>
      ) : (
        <div className="grid gap-0">
          {/* Completed projects */}
          {completedProjects.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-2.5 py-2 border-b border-soft last:border-0"
            >
              <FolderKanban
                size={11}
                className="text-accent-mint flex-shrink-0 mt-[2px]"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.73rem] font-semibold text-text-0 leading-snug line-clamp-1">
                  {p.title}
                </p>
                <p className="text-[0.61rem] text-text-3 mt-0.5">
                  Project complete · {p.ownerAgent} · {formatDate(p.updatedAt)}
                </p>
              </div>
            </div>
          ))}

          {/* Completed tasks */}
          {completedTasks.map((t) => {
            const proj = projects.find((p) => p.id === t.projectId)
            return (
              <div
                key={t.id}
                className="flex items-start gap-2.5 py-2 border-b border-soft last:border-0"
              >
                <CheckCircle2
                  size={11}
                  className={cn(
                    'flex-shrink-0 mt-[2px]',
                    'text-[rgba(126,255,210,0.55)]',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.73rem] font-medium text-text-1 leading-snug line-clamp-1">
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {proj && (
                      <span className="text-[0.6rem] text-text-3 truncate max-w-[120px]">
                        {proj.title}
                      </span>
                    )}
                    <span className="text-[0.6rem] font-mono text-text-3 tabular-nums">
                      {formatDate(t.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Surface>
  )
}
