'use client'

import { useMemo, useState } from 'react'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { DocCard } from '@/src/components/docs/DocCard'
import { DocsSearchBar } from '@/src/components/docs/DocsSearchBar'
import { useDocsStore } from '@/src/hooks/useDocsStore'
import { cn } from '@/src/lib/cn'
import type { DocCategory, DocStatus, DocType } from '@/src/types/docs'

type StatusTab = 'active' | 'historical' | 'all'

const STATUS_TAB_LABELS: Record<StatusTab, string> = {
  active:     'Active',
  historical: 'Historical',
  all:        'All',
}

export default function DocsPage() {
  const { docs } = useDocsStore()

  const [query, setQuery]               = useState('')
  const [activeCategory, setActiveCategory] = useState<DocCategory | null>(null)
  const [activeType, setActiveType]     = useState<DocType | null>(null)
  const [statusTab, setStatusTab]       = useState<StatusTab>('active')

  const STATUS_GROUPS: Record<StatusTab, DocStatus[]> = {
    active:     ['current', 'draft'],
    historical: ['superseded', 'archived'],
    all:        ['current', 'draft', 'superseded', 'archived'],
  }

  // Client-side filter + sort by updatedAt desc
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const allowedStatuses = STATUS_GROUPS[statusTab]
    return docs
      .filter((d) => {
        if (!allowedStatuses.includes(d.status)) return false
        if (activeCategory && d.category !== activeCategory) return false
        if (activeType && d.type !== activeType) return false
        if (!q) return true
        return (
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          (d.relatedAgent?.toLowerCase().includes(q) ?? false) ||
          (d.relatedProjectTitle?.toLowerCase().includes(q) ?? false)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, query, activeCategory, activeType, statusTab])

  const stats = useMemo(() => ({
    total:      docs.length,
    current:    docs.filter((d) => d.status === 'current').length,
    draft:      docs.filter((d) => d.status === 'draft').length,
    historical: docs.filter((d) => d.status === 'superseded' || d.status === 'archived').length,
  }), [docs])

  const tabCounts: Record<StatusTab, number> = useMemo(() => ({
    active:     docs.filter((d) => d.status === 'current' || d.status === 'draft').length,
    historical: docs.filter((d) => d.status === 'superseded' || d.status === 'archived').length,
    all:        docs.length,
  }), [docs])

  const hasActiveFilters = Boolean(query || activeCategory || activeType)
  const scopeLabel = filtered.length === tabCounts[statusTab]
    ? `${filtered.length} documents`
    : `${filtered.length} of ${tabCounts[statusTab]} documents`

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[900px]">
      <SectionHeading
        eyebrow="Artifact Vault"
        title="Docs"
        description="System references, specs, runbooks, and architecture records — searchable and always retrievable"
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total"      value={String(stats.total)}      detail="All documents" />
        <MetricCard label="Current"    value={String(stats.current)}    detail="Active references" emphasis={stats.current > 0} />
        <MetricCard label="Draft"      value={String(stats.draft)}      detail="In progress" />
        <MetricCard label="Historical" value={String(stats.historical)} detail="Superseded & archived" />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-soft pb-0 -mb-2">
        {(Object.keys(STATUS_TAB_LABELS) as StatusTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusTab(tab)}
            className={cn(
              'relative px-3.5 py-2 text-[0.72rem] font-medium transition-colors duration-150',
              'border-b-2 -mb-px',
              statusTab === tab
                ? 'border-accent-mint text-text-0'
                : 'border-transparent text-text-3 hover:text-text-1',
            )}
          >
            {STATUS_TAB_LABELS[tab]}
            <span className={cn(
              'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-px text-[0.54rem] font-mono font-bold tabular-nums leading-none',
              statusTab === tab
                ? 'bg-[rgba(126,255,210,0.15)] text-accent-mint'
                : 'bg-surface-1 text-text-3',
            )}>
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <DocsSearchBar
        query={query}
        onQueryChange={setQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      {/* Result count + clear */}
      <div className="flex items-center justify-between">
        <span className="text-[0.66rem] text-text-3 font-mono">{scopeLabel}</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setQuery(''); setActiveCategory(null); setActiveType(null) }}
            className="text-[0.62rem] text-accent-mint-dim hover:text-accent-mint transition-colors duration-100 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Document list */}
      {filtered.length > 0 ? (
        <div className="grid gap-2">
          {filtered.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 rounded-lg border border-dashed border-soft gap-3">
          {hasActiveFilters ? (
            <>
              <p className="text-[0.76rem] text-text-2 font-medium">No documents match your filters</p>
              <p className="text-[0.68rem] text-text-3">Try adjusting your search or category filters</p>
              <button
                type="button"
                onClick={() => { setQuery(''); setActiveCategory(null); setActiveType(null) }}
                className="mt-1 text-[0.66rem] text-accent-mint-dim hover:text-accent-mint transition-colors duration-100 font-medium"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <p className="text-[0.76rem] text-text-2 font-medium">No {STATUS_TAB_LABELS[statusTab].toLowerCase()} documents</p>
              <p className="text-[0.68rem] text-text-3">
                {statusTab === 'active'
                  ? 'Documents with status Current or Draft will appear here'
                  : statusTab === 'historical'
                    ? 'Superseded and archived documents will appear here'
                    : 'No documents have been added yet'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
