'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { TaskBoard } from '@/src/components/tasks/TaskBoard'
import { AddTaskSheet } from '@/src/components/tasks/AddTaskSheet'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'

export default function TasksPage() {
  const { projects, addTask } = useProjectsStore()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1600px]">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Execution"
          title="Tasks"
          description="All operator tasks across active projects, grouped by status"
        />
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.74rem] font-semibold transition-all duration-150',
            'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-accent-mint',
            'hover:bg-[rgba(126,255,210,0.16)] hover:border-[rgba(126,255,210,0.50)]',
          )}
        >
          <Plus size={13} />
          New Task
        </button>
      </div>
      <TaskBoard />

      {showAdd && (
        <AddTaskSheet
          onClose={() => setShowAdd(false)}
          onAdd={addTask}
          projects={projects}
        />
      )}
    </div>
  )
}
