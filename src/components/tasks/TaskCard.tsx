'use client'

import { cn } from '@/src/lib/cn'
import type { Task } from '@/src/types/projects'

interface TaskCardProps {
  task: Task
  onSelect: (task: Task) => void
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const isBlocked   = task.status === 'blocked'
  const isCompleted = task.status === 'completed'

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={cn(
        'w-full text-left grid gap-2 p-3 rounded-[10px] border',
        'transition-all duration-150 cursor-pointer group',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(126,255,210,0.6)]',
        isBlocked
          ? 'border-l-2 border-l-[rgba(255,203,97,0.55)] border-t-soft border-r-soft border-b-soft bg-[rgba(7,14,20,0.70)]'
          : isCompleted
          ? 'border-soft bg-[rgba(5,10,14,0.50)] opacity-70 hover:opacity-90'
          : 'border-soft bg-[rgba(7,14,20,0.70)] hover:border-med hover:bg-[rgba(8,17,24,0.80)]',
      )}
      aria-label={`Task: ${task.title}`}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-[0.75rem] font-medium leading-snug line-clamp-2 flex-1',
            isCompleted ? 'text-text-2 line-through decoration-[rgba(155,185,170,0.40)]' : 'text-text-0',
          )}
        >
          {task.title}
        </p>
        {/* Percent */}
        {task.percentComplete > 0 && task.percentComplete < 100 && (
          <span className="text-[0.62rem] font-mono text-text-3 flex-shrink-0 tabular-nums">
            {task.percentComplete}%
          </span>
        )}
      </div>

      {/* Task reason */}
      {task.taskReason && (
        <p className="text-[0.66rem] text-text-3 leading-snug line-clamp-1">
          {task.taskReason}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.62rem] font-medium text-text-2 truncate">
          {task.assignedAgent}
          {task.assignedSubAgent ? ` · ${task.assignedSubAgent}` : ''}
        </span>
        {task.dueDate && (
          <span className="text-[0.6rem] font-mono text-text-3 whitespace-nowrap flex-shrink-0">
            {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(task.dueDate))}
          </span>
        )}
      </div>
    </button>
  )
}
