'use client'

import { useMemo, useState } from 'react'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { MemorySection } from '@/src/components/memory/MemorySection'
import { MemorySearchBar } from '@/src/components/memory/MemorySearchBar'
import { useMemoryStore } from '@/src/hooks/useMemoryStore'
import type { MemoryCategory } from '@/src/types/memory'

export default function NotesPage() {
  const { memories } = useMemoryStore()

  const [query, setQuery]                   = useState('')
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | null>(null)
  const [activeAgent, setActiveAgent]       = useState<string | null>(null)

  // Derive unique agent options from data
  const agentOptions = useMemo(() => {
    const agents = memories
      .map((m) => m.relatedAgent)
      .filter((a): a is string => Boolean(a))
    return Array.from(new Set(agents)).sort()
  }, [memories])

  // Client-side filter
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return memories.filter((m) => {
      if (activeCategory && m.category !== activeCategory) return false
      if (activeAgent && m.relatedAgent !== activeAgent) return false
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        (m.source?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [memories, query, activeCategory, activeAgent])

  const active   = filtered.filter((m) => m.status === 'active')
  const longTerm = filtered.filter((m) => m.status === 'long-term')
  const archived = filtered.filter((m) => m.status === 'archived')

  const stats = useMemo(() => ({
    total:    memories.length,
    active:   memories.filter((m) => m.status === 'active').length,
    longTerm: memories.filter((m) => m.status === 'long-term').length,
    archived: memories.filter((m) => m.status === 'archived').length,
  }), [memories])

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[900px]">
      <SectionHeading
        eyebrow="Memory Vault"
        title="Memory"
        description="Structured agent and operator memory — decisions, context, patterns, and reference history"
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total"     value={String(stats.total)}    detail="All memory entries" />
        <MetricCard label="Active"    value={String(stats.active)}   detail="Current context"     emphasis={stats.active > 0} />
        <MetricCard label="Long-term" value={String(stats.longTerm)} detail="Established knowledge" />
        <MetricCard label="Archived"  value={String(stats.archived)} detail="Historical reference" />
      </div>

      {/* Search + filters */}
      <MemorySearchBar
        query={query}
        onQueryChange={setQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeAgent={activeAgent}
        onAgentChange={setActiveAgent}
        agentOptions={agentOptions}
      />

      {/* Sections */}
      <MemorySection status="active"    memories={active} />
      <MemorySection status="long-term" memories={longTerm} />
      <MemorySection status="archived"  memories={archived} defaultCollapsed />
    </div>
  )
}
