'use client'

import { useMemo, useState } from 'react'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { DocCard } from '@/src/components/docs/DocCard'
import { DocsSearchBar } from '@/src/components/docs/DocsSearchBar'
import { useDocsStore } from '@/src/hooks/useDocsStore'
import type { DocCategory, DocType } from '@/src/types/docs'

export default function DocsPage() {
  const { docs } = useDocsStore()

  const [query, setQuery]               = useState('')
  const [activeCategory, setActiveCategory] = useState<DocCategory | null>(null)
  const [activeType, setActiveType]     = useState<DocType | null>(null)

  // Client-side filter + sort by updatedAt desc
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return docs
      .filter((d) => {
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
  }, [docs, query, activeCategory, activeType])

  const stats = useMemo(() => ({
    total:      docs.length,
    current:    docs.filter((d) => d.status === 'current').length,
    draft:      docs.filter((d) => d.status === 'draft').length,
    historical: docs.filter((d) => d.status === 'superseded' || d.status === 'archived').length,
  }), [docs])

  const hasActiveFilters = Boolean(query || activeCategory || activeType)

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

      {/* Search + filters */}
      <DocsSearchBar
        query={query}
        onQueryChange={setQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      {/* Result count */}
      <div className="flex items-center justify-between">
        <span className="text-[0.66rem] text-text-3 font-mono">
          {filtered.length === docs.length
            ? `${docs.length} documents`
            : `${filtered.length} of ${docs.length} documents`}
        </span>
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
          <p className="text-[0.76rem] text-text-2 font-medium">No documents match your search</p>
          <p className="text-[0.68rem] text-text-3">Try adjusting your filters or search terms</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setActiveCategory(null); setActiveType(null) }}
            className="mt-1 text-[0.66rem] text-accent-mint-dim hover:text-accent-mint transition-colors duration-100 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
