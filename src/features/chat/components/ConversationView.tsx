import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../model/types'
import { cn } from '@/src/lib/cn'

function formatTimestamp(timestamp: string) {
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

type ConversationViewProps = {
  messages: ChatMessage[]
}

export function ConversationView({ messages }: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-6 min-h-0 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
      >
        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-text-3 font-medium">Command Channel</p>
        <p className="text-[0.82rem] text-text-2 max-w-[280px] leading-relaxed">
          Send Sentinel an objective, a decision, or a build constraint.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 min-h-0"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Conversation messages"
    >
      {messages.map((message) => (
        <article
          key={message.id}
          className={cn(
            'flex gap-3 max-w-full',
            message.role === 'operator' ? 'flex-row-reverse' : 'flex-row',
            message.role === 'system' && 'justify-center',
          )}
        >
          {message.role === 'system' ? (
            <div className="rounded-full border border-soft bg-surface-0 px-3 py-1">
              <p className="text-[0.66rem] text-text-3 font-medium">{message.body}</p>
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-[8px] flex items-center justify-center text-[0.6rem] font-bold font-mono',
                  message.role === 'operator'
                    ? 'bg-[rgba(126,255,210,0.12)] border border-[rgba(126,255,210,0.28)] text-accent-mint'
                    : 'bg-surface-1 border border-soft text-text-2',
                )}
                aria-hidden
              >
                {message.role === 'operator' ? 'M' : 'S'}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  'flex flex-col gap-1 max-w-[75%]',
                  message.role === 'operator' && 'items-end',
                )}
              >
                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2.5 text-[0.78rem] leading-relaxed',
                    message.role === 'operator'
                      ? 'bg-[rgba(126,255,210,0.09)] border border-[rgba(126,255,210,0.20)] text-text-0'
                      : 'bg-surface-1 border border-soft text-text-1',
                  )}
                >
                  {message.body}
                </div>
                <time
                  dateTime={message.timestamp}
                  className="text-[0.6rem] text-text-3 font-mono px-1"
                >
                  {formatTimestamp(message.timestamp)}
                </time>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  )
}
