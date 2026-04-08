'use client'

import { useEffect } from 'react'
import {
  CircleAlert,
  Clock3,
  FileText,
  Info,
  Layers3,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { RuntimeTask } from '@/src/features/chat/model/types'

interface RuntimeTaskDetailSheetProps {
  task: RuntimeTask | null
  onClose: () => void
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-text-3 flex-shrink-0 mt-[1px]" />
      <div className="min-w-0">
        <p className="text-[0.62rem] uppercase tracking-[0.12em] text-text-3 font-medium leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[0.74rem] text-text-1 leading-snug break-words">{value}</p>
      </div>
    </div>
  )
}

function getTone(task: RuntimeTask) {
  if (task.status === 'Blocked') return 'warning' as const
  if (task.status === 'In Progress') return 'live' as const
  if (task.needsUserInput || task.needsApproval) return 'pending' as const
  return 'subtle' as const
}

export function RuntimeTaskDetailSheet({ task, onClose }: RuntimeTaskDetailSheetProps) {
  const open = task !== null

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const blockedDetail = task?.blockedReason?.trim()
  const waitingDetail = task?.waitingFor?.trim()
  const summary = task?.summary?.trim()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]',
          'transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={task?.title ?? 'Runtime task detail'}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] flex flex-col',
          'bg-gradient-to-b from-[rgba(6,14,20,0.98)] to-[rgba(5,11,16,0.96)]',
          'border-l border-soft shadow-elevated transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {task && (
          <>
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-soft">
              <div className="grid gap-1.5 min-w-0 flex-1">
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-text-3 font-medium">
                  Runtime task detail
                </p>
                <h2 className="text-[0.9rem] font-semibold text-text-0 leading-snug">{task.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={getTone(task)}>{task.status}</StatusBadge>
                  {task.needsUserInput ? <StatusBadge tone="pending">Needs input</StatusBadge> : null}
                  {task.needsApproval ? <StatusBadge tone="pending">Needs approval</StatusBadge> : null}
                  {task.readyToReport ? <StatusBadge tone="subtle">Ready to report</StatusBadge> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px]',
                  'border border-soft bg-surface-0 text-text-3 hover:text-text-1 hover:border-med',
                  'transition-colors duration-150',
                )}
                aria-label="Close task detail"
              >
                <X size={13} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 grid gap-5">
              {blockedDetail ? (
                <div className="grid gap-1.5 p-3 rounded-[10px] border border-[rgba(255,203,97,0.22)] bg-[rgba(49,34,10,0.28)]">
                  <div className="flex items-center gap-1.5">
                    <CircleAlert size={12} className="text-accent-warn" />
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-warn font-medium">
                      What is blocking this
                    </p>
                  </div>
                  <p className="text-[0.76rem] text-text-1 leading-relaxed">{blockedDetail}</p>
                </div>
              ) : null}

              {waitingDetail ? (
                <div className="grid gap-1.5 p-3 rounded-[10px] border border-[rgba(92,214,255,0.18)] bg-[rgba(10,30,44,0.30)]">
                  <div className="flex items-center gap-1.5">
                    <Clock3 size={12} className="text-accent-cyan" />
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-accent-cyan font-medium">
                      What needs to happen next
                    </p>
                  </div>
                  <p className="text-[0.76rem] text-text-1 leading-relaxed">{waitingDetail}</p>
                </div>
              ) : null}

              {summary ? (
                <div className="grid gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-text-3" />
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-text-3 font-medium">
                      Current summary
                    </p>
                  </div>
                  <p className="text-[0.75rem] text-text-1 leading-relaxed">{summary}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 p-3 rounded-[10px] border border-soft bg-[rgba(6,12,18,0.70)]">
                <MetaRow icon={User} label="Owner" value={task.owner} />
                <MetaRow icon={Layers3} label="Lane" value={task.lane} />
                <MetaRow icon={Info} label="Stage" value={task.stage} />
                <MetaRow icon={Clock3} label="Due" value={task.due} />
              </div>

              <div className="grid gap-1.5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-text-3 font-medium">
                  Task id
                </p>
                <p className="text-[0.72rem] font-mono text-text-2 break-all rounded-[8px] border border-soft bg-[rgba(6,12,18,0.70)] px-3 py-2">
                  {task.id}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
