'use client'

import { useMemo, useState } from 'react'
import { TaskColumn } from '@/src/components/tasks/TaskColumn'
import { TaskDetailSlideOver } from '@/src/components/tasks/TaskDetailSlideOver'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import type { Task, TaskStatus } from '@/src/types/projects'

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'completed']

interface ProjectTaskListProps {
  tasks: Task[]
  projectTitle: string
}

export function ProjectTaskList({ tasks, projectTitle }: ProjectTaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      'todo':        [],
      'in-progress': [],
      'blocked':     [],
      'completed':   [],
    }
    for (const task of tasks) {
      map[task.status].push(task)
    }
    return map
  }, [tasks])

  return (
    <>
      <div className="grid gap-4">
        <SectionHeading
          eyebrow="Execution"
          title="Tasks"
          description={`${tasks.length} task${tasks.length !== 1 ? 's' : ''} in this project`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onSelectTask={setSelectedTask}
            />
          ))}
        </div>
      </div>

      <TaskDetailSlideOver
        task={selectedTask}
        projectTitle={projectTitle}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}
