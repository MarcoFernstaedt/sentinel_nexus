import { cn } from '@/src/lib/cn'
import type { MemoryCategory } from '@/src/types/memory'
import { CATEGORY_LABEL } from '@/src/types/memory'

const CATEGORY_COLOR: Record<MemoryCategory, string> = {
  decision:    'text-accent-cyan border-[rgba(113,203,255,0.22)] bg-[rgba(113,203,255,0.06)]',
  context:     'text-text-2 border-soft bg-surface-1',
  knowledge:   'text-accent-mint-dim border-[rgba(126,255,210,0.18)] bg-[rgba(126,255,210,0.05)]',
  pattern:     'text-[#c4b5fd] border-[rgba(196,181,253,0.20)] bg-[rgba(196,181,253,0.06)]',
  observation: 'text-text-2 border-soft bg-surface-1',
  instruction: 'text-accent-warn border-[rgba(255,203,97,0.22)] bg-[rgba(255,203,97,0.06)]',
  reference:   'text-text-3 border-soft bg-surface-1',
}

export function MemoryCategoryBadge({ category }: { category: MemoryCategory }) {
  return (
    <span
      className={cn(
        'inline-flex px-[0.45rem] py-[0.16rem] rounded-[4px]',
        'text-[0.58rem] font-mono font-medium tracking-[0.05em] uppercase',
        'border whitespace-nowrap',
        CATEGORY_COLOR[category],
      )}
    >
      {CATEGORY_LABEL[category]}
    </span>
  )
}
