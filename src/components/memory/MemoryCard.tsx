'use client'

import { useState } from 'react'
import { FolderKanban, User, ExternalLink } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { MemoryStatusBadge } from './MemoryStatusBadge'
import { MemoryCategoryBadge } from './MemoryCategoryBadge'
import type { Memory } from '@/src/types/memory'

const STATUS_ACCENT: Record<Memory['status'], string> = {
  'active':    'border-l-[2px] border-l-accent-mint',
  'long-term': 'border-l-[2px] border-l-[rgba(126,255,210,0.25)]',
  'archived':  'border-l-[2px] border-l-[rgba(255,255,255,0.08)]',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function MemoryCard({ memory }: { memory: Memory }) {
  const [expanded, setExpanded] = useState(false)
  const isArchived = memory.status === 'archived'
  const wasUpdated = memory.updatedAt !== memory.createdAt

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg',
        'bg-surface-0 border-y border-r border-soft shadow-panel',
        STATUS_ACCENT[memory.status],
        isArchived && 'opacity-60',
        'transition-opacity duration-150',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h4
          className={cn(
            'text-[0.82rem] font-semibold leading-snug flex-1 min-w-0',
            isArchived ? 'text-text-2' : 'text-text-0',
          )}
        >
          {memory.title}
        </h4>
        <MemoryStatusBadge status={memory.status} />
      </div>

      {/* Content */}
      <div>
        <p
          className={cn(
            'text-[0.72rem] text-text-2 leading-relaxed',
            !expanded && 'line-clamp-2',
          )}
        >
          {memory.content}
        </p>
        {memory.content.length > 180 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[0.62rem] text-accent-mint-dim hover:text-accent-mint transition-colors duration-100 font-medium"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <MemoryCategoryBadge category={memory.category} />

        {memory.source && (
          <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3 font-mono">
            <ExternalLink size={9} className="flex-shrink-0" />
            {memory.source}
          </span>
        )}

        {memory.relatedAgent && (
          <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
            <User size={9} className="flex-shrink-0" />
            {memory.relatedAgent}
          </span>
        )}

        {memory.relatedProjectTitle && (
          <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
            <FolderKanban size={9} className="flex-shrink-0" />
            {memory.relatedProjectTitle}
          </span>
        )}
      </div>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.58rem] font-mono text-text-3 px-1.5 py-[0.14rem] rounded-[3px] bg-surface-1 border border-soft"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-3 pt-0.5 border-t border-soft">
        <span className="text-[0.6rem] font-mono text-text-3 tabular-nums">
          Created {formatDate(memory.createdAt)}
        </span>
        {wasUpdated && (
          <span className="text-[0.6rem] font-mono text-text-3 tabular-nums">
            · Updated {formatDateShort(memory.updatedAt)}
          </span>
        )}
      </div>
    </div>
  )
}
