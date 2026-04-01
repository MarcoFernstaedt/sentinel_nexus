import { cn } from '@/src/lib/cn'
import type { DocType } from '@/src/types/docs'
import { TYPE_LABEL } from '@/src/types/docs'

const TYPE_COLOR: Record<DocType, string> = {
  'spec':             'text-accent-cyan border-[rgba(113,203,255,0.22)] bg-[rgba(113,203,255,0.06)]',
  'runbook':          'text-accent-warn border-[rgba(255,203,97,0.22)] bg-[rgba(255,203,97,0.06)]',
  'architecture':     'text-[#c4b5fd] border-[rgba(196,181,253,0.20)] bg-[rgba(196,181,253,0.06)]',
  'api-reference':    'text-accent-mint-dim border-[rgba(126,255,210,0.18)] bg-[rgba(126,255,210,0.05)]',
  'decision-record':  'text-text-2 border-soft bg-surface-1',
  'report':           'text-text-2 border-soft bg-surface-1',
  'template':         'text-text-3 border-soft bg-surface-1',
  'guide':            'text-accent-mint-dim border-[rgba(126,255,210,0.18)] bg-[rgba(126,255,210,0.05)]',
}

export function DocTypeBadge({ type }: { type: DocType }) {
  return (
    <span
      className={cn(
        'inline-flex px-[0.45rem] py-[0.16rem] rounded-[4px]',
        'text-[0.58rem] font-mono font-medium tracking-[0.05em] uppercase',
        'border whitespace-nowrap',
        TYPE_COLOR[type],
      )}
    >
      {TYPE_LABEL[type]}
    </span>
  )
}
