import { Search } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import type { DocCategory, DocType } from '@/src/types/docs'
import { CATEGORY_LABEL, TYPE_LABEL } from '@/src/types/docs'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as DocCategory[]
const ALL_TYPES      = Object.keys(TYPE_LABEL) as DocType[]

interface DocsSearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  activeCategory: DocCategory | null
  onCategoryChange: (c: DocCategory | null) => void
  activeType: DocType | null
  onTypeChange: (t: DocType | null) => void
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-[0.26rem] rounded-full text-[0.62rem] font-medium border transition-all duration-150 whitespace-nowrap',
        active
          ? 'border-[rgba(126,255,210,0.40)] bg-[rgba(126,255,210,0.10)] text-accent-mint'
          : 'border-soft bg-surface-1 text-text-2 hover:border-med hover:text-text-1',
      )}
    >
      {children}
    </button>
  )
}

export function DocsSearchBar({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
  activeType,
  onTypeChange,
}: DocsSearchBarProps) {
  return (
    <div className="grid gap-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by title, description, or tag…"
          className={cn(
            'w-full pl-9 pr-4 py-2.5 rounded-lg text-[0.76rem]',
            'bg-surface-0 border border-soft',
            'text-text-1 placeholder:text-text-3',
            'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.20)]',
            'transition-colors duration-150',
          )}
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium mr-1">Category</span>
        <FilterPill active={activeCategory === null} onClick={() => onCategoryChange(null)}>
          All
        </FilterPill>
        {ALL_CATEGORIES.map((cat) => (
          <FilterPill
            key={cat}
            active={activeCategory === cat}
            onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
          >
            {CATEGORY_LABEL[cat]}
          </FilterPill>
        ))}
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium mr-1">Type</span>
        <FilterPill active={activeType === null} onClick={() => onTypeChange(null)}>
          All
        </FilterPill>
        {ALL_TYPES.map((t) => (
          <FilterPill
            key={t}
            active={activeType === t}
            onClick={() => onTypeChange(activeType === t ? null : t)}
          >
            {TYPE_LABEL[t]}
          </FilterPill>
        ))}
      </div>
    </div>
  )
}
