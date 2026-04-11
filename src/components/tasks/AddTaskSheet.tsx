'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import type { TaskStatus } from '@/src/types/projects'
import type { Project } from '@/src/types/projects'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'completed',   label: 'Completed' },
]

interface AddTaskSheetProps {
  onClose: () => void
  onAdd: (input: {
    title: string
    description: string
    status: TaskStatus
    projectId?: string
    dueDate?: string
  }) => void
  projects: Project[]
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[0.66rem] uppercase tracking-[0.12em] text-text-3 font-medium">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg text-[0.78rem]',
        'bg-surface-0 border border-soft',
        'text-text-1 placeholder:text-text-3',
        'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
        'transition-colors duration-150',
      )}
    />
  )
}

export function AddTaskSheet({ onClose, onAdd, projects }: AddTaskSheetProps) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [status,      setStatus]      = useState<TaskStatus>('todo')
  const [projectId,   setProjectId]   = useState<string>('')
  const [dueDate,     setDueDate]     = useState('')
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) { setError('Title is required.'); return }
    onAdd({
      title: trimmedTitle,
      description: description.trim(),
      status,
      projectId: projectId || undefined,
      dueDate: dueDate || undefined,
    })
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add task"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:fixed md:top-1/2 md:left-1/2',
          'md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px]',
          'rounded-t-2xl md:rounded-2xl',
          'bg-[linear-gradient(180deg,rgba(9,16,24,0.98),rgba(7,12,18,0.98))]',
          'border border-soft shadow-elevated',
          'max-h-[90dvh] overflow-y-auto',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.18em] text-accent-mint-dim font-medium">
              Tasks
            </p>
            <h3 className="text-[0.9rem] font-semibold text-text-0 leading-tight mt-0.5">
              New Task
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-[8px] border border-soft text-text-3 hover:text-text-1 hover:border-med transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5">
          {/* Title */}
          <div className="grid gap-1.5">
            <FieldLabel>Title</FieldLabel>
            <TextInput
              value={title}
              onChange={(v) => { setTitle(v); setError(null) }}
              placeholder="e.g. Submit 10 applications, Review PR, Write tests…"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <FieldLabel>Description <span className="normal-case text-text-3">(optional)</span></FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to happen, definition of done, context…"
              rows={2}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-[0.78rem] resize-none',
                'bg-surface-0 border border-soft',
                'text-text-1 placeholder:text-text-3',
                'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
                'transition-colors duration-150',
              )}
            />
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <FieldLabel>Status</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'px-2.5 py-[0.28rem] rounded-full text-[0.62rem] font-medium border transition-all duration-100 whitespace-nowrap',
                    status === opt.value
                      ? 'border-[rgba(126,255,210,0.40)] bg-[rgba(126,255,210,0.10)] text-accent-mint'
                      : 'border-soft bg-surface-1 text-text-2 hover:border-med hover:text-text-1',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="grid gap-1.5">
              <FieldLabel>Project <span className="normal-case text-text-3">(optional)</span></FieldLabel>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg text-[0.78rem]',
                  'bg-surface-0 border border-soft',
                  'text-text-1',
                  'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
                  'transition-colors duration-150',
                )}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Due date */}
          <div className="grid gap-1.5">
            <FieldLabel>Due Date <span className="normal-case text-text-3">(optional)</span></FieldLabel>
            <TextInput
              type="date"
              value={dueDate}
              onChange={setDueDate}
            />
          </div>

          {error && (
            <p className="text-[0.68rem] text-[rgba(255,112,112,0.85)] font-medium">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-[0.74rem] font-medium text-text-2 border border-soft hover:text-text-1 hover:border-med transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                'px-4 py-2 rounded-lg text-[0.74rem] font-semibold transition-all duration-150',
                'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.10)] text-accent-mint',
                'hover:bg-[rgba(126,255,210,0.18)] hover:border-[rgba(126,255,210,0.50)]',
              )}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
