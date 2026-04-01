import { cn } from '@/src/lib/cn'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/src/types/projects'
import { STATUS_LABEL } from '@/src/types/projects'

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  'todo':        'text-text-3',
  'in-progress': 'text-accent-mint',
  'blocked':     'text-accent-warn',
  'completed':   'text-text-2',
}

const COLUMN_COUNT_ACCENT: Record<TaskStatus, string> = {
  'todo':        'text-text-3',
  'in-progress': 'text-accent-mint',
  'blocked':     'text-accent-warn',
  'completed':   'text-text-2',
}

interface TaskColumnProps {
  status: TaskStatus
  tasks: Task[]
  onSelectTask: (task: Task) => void
}

export function TaskColumn({ status, tasks, onSelectTask }: TaskColumnProps) {
  return (
    <div className="flex flex-col gap-2 min-h-0">
      {/* Column header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-soft">
        <span
          className={cn(
            'text-[0.67rem] uppercase tracking-[0.14em] font-medium',
            COLUMN_ACCENT[status],
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        <span
          className={cn(
            'text-[0.72rem] font-mono font-semibold tabular-nums',
            COLUMN_COUNT_ACCENT[status],
          )}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
        ))}

        {tasks.length === 0 && (
          <div
            className={cn(
              'rounded-[10px] border border-dashed border-soft',
              'py-6 text-center',
            )}
          >
            <p className="text-[0.68rem] text-text-3">No tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}
