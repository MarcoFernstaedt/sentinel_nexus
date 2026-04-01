'use client'

import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { TaskBoard } from '@/src/components/tasks/TaskBoard'

export default function TasksPage() {
  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1600px]">
      <SectionHeading
        eyebrow="Execution"
        title="Tasks"
        description="All operator tasks across active projects, grouped by status"
      />
      <TaskBoard />
    </div>
  )
}
