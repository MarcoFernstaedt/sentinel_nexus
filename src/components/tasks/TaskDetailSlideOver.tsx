'use client'

import { useEffect } from 'react'
import { X, Calendar, User, GitBranch, CheckCircle2, Zap } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { ProjectStatusBadge } from '@/src/components/projects/ProjectStatusBadge'
import type { Task } from '@/src/types/projects'

interface TaskDetailSlideOverProps {
  task: Task | null
  projectTitle?: string
  onClose: () => void
}

function formatDate(iso?: string) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  } catch {
    return null
  }
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-text-3 flex-shrink-0 mt-[1px]" />
      <div className="min-w-0">
        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-text-3 font-medium leading-none mb-0.5">{label}</p>
        <p className="text-[0.74rem] text-text-1 leading-snug">{value}</p>
      </div>
    </div>
  )
}

export function TaskDetailSlideOver({ task, projectTitle, onClose }: TaskDetailSlideOverProps) {
  const open = task !== null

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]',
          'transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={task?.title ?? 'Task detail'}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50',
          'w-full max-w-[440px]',
          'flex flex-col',
          'bg-gradient-to-b from-[rgba(6,14,20,0.98)] to-[rgba(5,11,16,0.96)]',
          'border-l border-soft shadow-elevated',
          'transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {task && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-soft">
              <div className="grid gap-1.5 min-w-0 flex-1">
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-text-3 font-medium">
                  {projectTitle ?? 'Unassigned'}
                </p>
                <h2 className="text-[0.9rem] font-semibold text-text-0 leading-snug">
                  {task.title}
                </h2>
                <ProjectStatusBadge status={task.status} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px]',
                  'border border-soft bg-surface-0',
                  'text-text-3 hover:text-text-1 hover:border-med',
                  'transition-colors duration-150',
                )}
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 grid gap-5">
              {/* Why this task matters */}
              {task.taskReason && (
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Zap size={12} className="text-accent-mint" />
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-mint font-medium">
                      Why It Matters
                    </p>
                  </div>
                  <p className="text-[0.78rem] text-text-1 leading-relaxed">{task.taskReason}</p>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div className="grid gap-1.5">
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] text-text-3 font-medium">Description</p>
                  <p className="text-[0.75rem] text-text-1 leading-relaxed">{task.description}</p>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-[10px] border border-soft bg-[rgba(6,12,18,0.70)]">
                <MetaRow icon={User} label="Agent" value={task.assignedAgent} />
                {task.assignedSubAgent && (
                  <MetaRow icon={User} label="Sub-agent" value={task.assignedSubAgent} />
                )}
                {task.dueDate && (
                  <MetaRow icon={Calendar} label="Due" value={formatDate(task.dueDate) ?? task.dueDate} />
                )}
                <MetaRow icon={Calendar} label="Updated" value={formatDate(task.updatedAt) ?? task.updatedAt} />
              </div>

              {/* Progress */}
              {task.percentComplete > 0 && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-text-3 font-medium">Progress</p>
                    <span className="text-[0.68rem] font-mono text-text-2 tabular-nums">{task.percentComplete}%</span>
                  </div>
                  <div className="w-full h-[3px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-mint to-accent-cyan"
                      style={{ width: `${task.percentComplete}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {task.notes && (
                <div className="grid gap-1.5">
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] text-text-3 font-medium">Notes</p>
                  <p className="text-[0.75rem] text-text-1 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}

              {/* Dependencies */}
              {task.dependencies.length > 0 && (
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={12} className="text-text-3" />
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-text-3 font-medium">
                      Dependencies ({task.dependencies.length})
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {task.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="text-[0.68rem] font-mono text-text-2 px-2 py-1 rounded-[6px] bg-surface-0 border border-soft"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion details */}
              {task.completionDetails && (
                <div className="grid gap-1.5 p-3 rounded-[10px] border border-[rgba(98,255,196,0.18)] bg-[rgba(14,40,28,0.40)]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-accent-mint" />
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-mint font-medium">
                      Completion Details
                    </p>
                  </div>
                  <p className="text-[0.75rem] text-text-1 leading-relaxed">{task.completionDetails}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
