'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { MemoryCard } from './MemoryCard'
import type { Memory, MemoryStatus } from '@/src/types/memory'

const SECTION_META: Record<MemoryStatus, { label: string; eyebrowClass: string }> = {
  'active':    { label: 'Active Memory',    eyebrowClass: 'text-accent-mint' },
  'long-term': { label: 'Long-term Memory', eyebrowClass: 'text-text-2' },
  'archived':  { label: 'Archived',         eyebrowClass: 'text-text-3' },
}

interface MemorySectionProps {
  status: MemoryStatus
  memories: Memory[]
  defaultCollapsed?: boolean
}

export function MemorySection({ status, memories, defaultCollapsed = false }: MemorySectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const meta = SECTION_META[status]

  return (
    <section className="grid gap-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn('text-[0.64rem] uppercase tracking-[0.16em] font-semibold', meta.eyebrowClass)}>
            {meta.label}
          </span>
          <span className={cn(
            'inline-flex items-center px-2 py-[0.18rem] rounded-full text-[0.6rem] font-mono font-medium border tabular-nums',
            memories.length === 0
              ? 'border-soft bg-surface-1 text-text-3'
              : 'border-soft bg-surface-1 text-text-2',
          )}>
            {memories.length}
          </span>
        </div>

        {/* Collapse toggle for archived */}
        {(defaultCollapsed || status === 'archived') && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1.5 text-[0.62rem] text-text-3 hover:text-text-1 transition-colors duration-100"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <>Show <ChevronDown size={12} /></>
            ) : (
              <>Hide <ChevronUp size={12} /></>
            )}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className={cn(
        'h-px w-full',
        status === 'active'
          ? 'bg-gradient-to-r from-accent-mint/30 via-accent-mint/10 to-transparent'
          : status === 'long-term'
          ? 'bg-gradient-to-r from-[rgba(126,255,210,0.12)] via-[rgba(126,255,210,0.04)] to-transparent'
          : 'bg-[rgba(255,255,255,0.05)]',
      )} />

      {/* Cards */}
      {!collapsed && (
        <>
          {memories.length === 0 ? (
            <div className="flex items-center justify-center py-8 rounded-lg border border-dashed border-soft text-[0.68rem] text-text-3">
              No {meta.label.toLowerCase()} entries
            </div>
          ) : (
            <div className="grid gap-2">
              {memories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          )}
        </>
      )}

      {collapsed && memories.length > 0 && (
        <p className="text-[0.64rem] text-text-3 font-mono">
          {memories.length} entr{memories.length === 1 ? 'y' : 'ies'} hidden
        </p>
      )}
    </section>
  )
}
