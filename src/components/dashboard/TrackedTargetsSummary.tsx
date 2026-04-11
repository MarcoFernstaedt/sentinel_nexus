'use client'

import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { useTrackedTargets } from '@/src/hooks/useTrackedTargets'
import { progressRatio } from '@/src/types/tracking'

const MAX_ROWS = 4

export function TrackedTargetsSummary() {
  const { activeTargets, totalActive, updateCount } = useTrackedTargets()

  const display = activeTargets.slice(0, MAX_ROWS)
  const doneCount = activeTargets.filter((t) => t.status === 'completed').length

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-soft bg-[linear-gradient(180deg,rgba(10,18,26,0.90),rgba(7,13,19,0.84))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-soft">
        <div className="flex items-center gap-2.5">
          <span className="text-[0.68rem] font-semibold text-text-0 tracking-[0.01em]">Today's Targets</span>
          {totalActive > 0 && (
            <span className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.54rem] font-semibold border',
              doneCount === totalActive
                ? 'border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.12)] text-accent-mint'
                : doneCount > 0
                  ? 'border-[rgba(255,203,97,0.30)] bg-[rgba(255,203,97,0.08)] text-accent-warn'
                  : 'border-soft bg-surface-1 text-text-3',
            )}>
              {doneCount}/{totalActive} done
            </span>
          )}
        </div>
        <Link
          href="/tracking"
          className="flex items-center gap-1 text-[0.6rem] font-medium text-text-3 hover:text-accent-mint transition-colors duration-150"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      {/* Target rows */}
      {display.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-[0.72rem] text-text-3 mb-2">No active targets</p>
          <Link
            href="/tracking"
            className="text-[0.64rem] text-accent-mint hover:underline"
          >
            Set up tracking targets →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {display.map((target) => {
            const ratio = progressRatio(target)
            const pct   = Math.round(ratio * 100)
            const done  = target.status === 'completed'

            return (
              <div key={target.id} className="flex items-center gap-3 px-4 py-2.5">
                {/* Title + bar */}
                <div className="flex-1 min-w-0 grid gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'text-[0.72rem] font-medium truncate leading-tight',
                      done ? 'text-text-2 line-through' : 'text-text-1',
                    )}>
                      {target.title}
                    </span>
                    <span className={cn(
                      'text-[0.64rem] font-mono tabular-nums flex-shrink-0',
                      done ? 'text-accent-mint' : 'text-text-2',
                    )}>
                      {target.currentCount}/{target.targetCount}
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-full h-[3px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-500',
                        done
                          ? 'bg-accent-mint shadow-[0_0_6px_rgba(126,255,210,0.5)]'
                          : pct >= 50
                            ? 'bg-gradient-to-r from-[rgba(255,203,97,0.7)] to-accent-mint'
                            : 'bg-[rgba(126,255,210,0.45)]',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* +1 button */}
                {!done && (
                  <button
                    type="button"
                    onClick={() => updateCount(target.id, 1)}
                    className={cn(
                      'flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-[6px]',
                      'border border-[rgba(126,255,210,0.25)] bg-[rgba(126,255,210,0.06)] text-accent-mint',
                      'hover:bg-[rgba(126,255,210,0.15)] hover:border-[rgba(126,255,210,0.45)]',
                      'transition-all duration-100 active:scale-90',
                    )}
                    aria-label={`Add one to ${target.title}`}
                  >
                    <Plus size={10} />
                  </button>
                )}
                {done && (
                  <span className="flex-shrink-0 text-[0.6rem] text-accent-mint font-semibold">✓</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer — overflow hint */}
      {activeTargets.length > MAX_ROWS && (
        <div className="px-4 py-2 border-t border-soft">
          <Link
            href="/tracking"
            className="text-[0.62rem] text-text-3 hover:text-accent-mint transition-colors"
          >
            +{activeTargets.length - MAX_ROWS} more targets at /tracking
          </Link>
        </div>
      )}
    </div>
  )
}
