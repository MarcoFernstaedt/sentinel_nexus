'use client'

import { useState } from 'react'
import { User, FolderKanban, Brain } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { DocStatusBadge } from './DocStatusBadge'
import { DocTypeBadge } from './DocTypeBadge'
import { CATEGORY_LABEL } from '@/src/types/docs'
import type { Doc } from '@/src/types/docs'

const STATUS_ACCENT: Record<Doc['status'], string> = {
  current:    'border-l-[2px] border-l-accent-mint',
  draft:      'border-l-[2px] border-l-[rgba(126,255,210,0.25)]',
  superseded: 'border-l-[2px] border-l-accent-warn',
  archived:   'border-l-[2px] border-l-[rgba(255,255,255,0.08)]',
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

export function DocCard({ doc }: { doc: Doc }) {
  const [expanded, setExpanded] = useState(false)
  const isArchived   = doc.status === 'archived'
  const isSuperseded = doc.status === 'superseded'
  const wasUpdated   = doc.updatedAt !== doc.createdAt

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg',
        'bg-surface-0 border-y border-r border-soft shadow-panel',
        STATUS_ACCENT[doc.status],
        (isArchived || isSuperseded) && 'opacity-60',
        'transition-opacity duration-150',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <h4
            className={cn(
              'text-[0.82rem] font-semibold leading-snug',
              isArchived || isSuperseded ? 'text-text-2' : 'text-text-0',
            )}
          >
            {doc.title}
          </h4>
          {doc.version && (
            <span className="flex-shrink-0 inline-flex px-[0.4rem] py-[0.14rem] rounded-[3px] text-[0.55rem] font-mono text-text-3 border border-soft bg-surface-1 mt-[2px]">
              {doc.version}
            </span>
          )}
        </div>
        <DocStatusBadge status={doc.status} />
      </div>

      {/* Description */}
      <div>
        <p
          className={cn(
            'text-[0.72rem] text-text-2 leading-relaxed',
            !expanded && 'line-clamp-2',
          )}
        >
          {doc.description}
        </p>
        {doc.description.length > 160 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[0.62rem] text-accent-mint-dim hover:text-accent-mint transition-colors duration-100 font-medium"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Type + category */}
      <div className="flex flex-wrap items-center gap-2">
        <DocTypeBadge type={doc.type} />
        <span className="text-[0.6rem] uppercase tracking-[0.1em] text-text-3 font-medium">
          {CATEGORY_LABEL[doc.category]}
        </span>
      </div>

      {/* Relations */}
      {(doc.relatedAgent || doc.relatedProjectTitle || doc.relatedMemoryTitle) && (
        <div className="flex flex-wrap items-center gap-2">
          {doc.relatedAgent && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
              <User size={9} className="flex-shrink-0" />
              {doc.relatedAgent}
            </span>
          )}
          {doc.relatedProjectTitle && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
              <FolderKanban size={9} className="flex-shrink-0" />
              {doc.relatedProjectTitle}
            </span>
          )}
          {doc.relatedMemoryTitle && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
              <Brain size={9} className="flex-shrink-0" />
              <span className="truncate max-w-[180px]">{doc.relatedMemoryTitle}</span>
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doc.tags.map((tag) => (
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
      <div className="flex items-center gap-2 pt-0.5 border-t border-soft">
        <span className="text-[0.6rem] font-mono text-text-3 tabular-nums">
          Created {formatDate(doc.createdAt)}
        </span>
        {wasUpdated && (
          <span className="text-[0.6rem] font-mono text-text-3 tabular-nums">
            · Updated {formatDateShort(doc.updatedAt)}
          </span>
        )}
      </div>
    </div>
  )
}
