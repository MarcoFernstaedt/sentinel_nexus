'use client'

import { AlertTriangle, TrendingUp, Zap, Workflow, Lightbulb } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useCalendarStore } from '@/src/hooks/useCalendarStore'
import { deriveSuggestions, SUGGESTION_CATEGORY_LABEL } from '@/src/lib/suggestions'
import type { Suggestion, SuggestionCategory, SuggestionPriority } from '@/src/lib/suggestions'

const CATEGORY_ICON: Record<SuggestionCategory, React.ElementType> = {
  bottleneck:           AlertTriangle,
  'missed-opportunity': TrendingUp,
  workflow:             Workflow,
  productivity:         Zap,
  'app-improvement':    Lightbulb,
}

const PRIORITY_COLOR: Record<SuggestionPriority, string> = {
  critical: 'text-[rgba(255,112,112,0.9)]',
  high:     'text-accent-warn',
  medium:   'text-accent-cyan',
}

const PRIORITY_DOT: Record<SuggestionPriority, string> = {
  critical: 'bg-[rgba(255,112,112,0.9)] shadow-[0_0_4px_rgba(255,112,112,0.4)]',
  high:     'bg-accent-warn shadow-[0_0_4px_rgba(255,203,97,0.35)]',
  medium:   'bg-accent-cyan opacity-70',
}

function SuggestionCard({ s }: { s: Suggestion }) {
  const Icon = CATEGORY_ICON[s.category]
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-soft last:border-0">
      <div className="flex items-start gap-2">
        <span
          className={cn('flex-shrink-0 mt-[3px] w-[5px] h-[5px] rounded-full', PRIORITY_DOT[s.priority])}
          aria-hidden
        />
        <p className="text-[0.74rem] font-semibold text-text-0 leading-snug flex-1">{s.title}</p>
      </div>
      <p className="text-[0.67rem] text-text-2 leading-relaxed pl-[13px]">{s.detail}</p>
      <div className="flex items-center gap-2 pl-[13px]">
        <Icon size={9} className={cn('flex-shrink-0', PRIORITY_COLOR[s.priority])} aria-hidden />
        <span className={cn('text-[0.58rem] uppercase tracking-[0.1em] font-medium', PRIORITY_COLOR[s.priority])}>
          {SUGGESTION_CATEGORY_LABEL[s.category]}
        </span>
        {s.actionHint && (
          <>
            <span className="text-text-3 text-[9px]">·</span>
            <span className="text-[0.6rem] font-mono text-text-3 italic">{s.actionHint}</span>
          </>
        )}
      </div>
    </div>
  )
}

export function SuggestionPanel() {
  const { projects, tasks }   = useProjectsStore()
  const { agents }            = useAgentsStore()
  const { items }             = useCalendarStore()

  const suggestions = deriveSuggestions(projects, tasks, agents, items)
  const headingId   = 'suggestions-panel-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Intelligence"
          title="Suggestions"
          description={`${suggestions.length} grounded insight${suggestions.length !== 1 ? 's' : ''} derived from system state`}
        />
      }
      labelledBy={headingId}
    >
      {suggestions.length === 0 ? (
        <p className="text-[0.72rem] text-text-3 text-center py-4">
          All systems nominal — no suggestions
        </p>
      ) : (
        <div>
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </Surface>
  )
}
