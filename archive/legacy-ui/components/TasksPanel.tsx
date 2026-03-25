import type { Dispatch, SetStateAction } from 'react'
import type { TaskItem } from '../types'

type TasksPanelProps = {
  tasks: TaskItem[]
  setTasks: Dispatch<SetStateAction<TaskItem[]>>
}

export function TasksPanel({ tasks, setTasks }: TasksPanelProps) {
  const cycleTask = (taskId: string) => {
    const order: TaskItem['status'][] = ['Queued', 'In Progress', 'Blocked', 'Done']

    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const nextIndex = (order.indexOf(task.status) + 1) % order.length
        return { ...task, status: order[nextIndex] }
      }),
    )
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Execution board</p>
          <h3>Tasks</h3>
        </div>
        <span className="pill stable">Local-first</span>
      </div>

      <div className="tasks-list">
        {tasks.map((task) => (
          <article key={task.id} className="task-row">
            <div className="panel-header">
              <div>
                <strong>{task.title}</strong>
                <p>{task.owner} · {task.lane} lane · due {task.due}</p>
              </div>
              <button className={`task-state ${task.status.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => cycleTask(task.id)}>
                {task.status}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
