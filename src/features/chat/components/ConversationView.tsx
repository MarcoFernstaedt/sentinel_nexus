import { useEffect, useMemo, useRef } from 'react'
import type { ChatMessage } from '../model/types'

type ConversationViewProps = {
  messages: ChatMessage[]
}

function formatTimestamp(timestamp: string) {
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) {
    return timestamp
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

export function ConversationView({ messages }: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) {
      return
    }

    element.scrollTop = element.scrollHeight
  }, [messages])

  const groupedCount = useMemo(
    () => ({
      system: messages.filter((message) => message.role === 'system').length,
      operator: messages.filter((message) => message.role === 'operator').length,
      sentinel: messages.filter((message) => message.role === 'sentinel').length,
    }),
    [messages],
  )

  return (
    <section className="conversation-shell" aria-labelledby="conversation-log-heading">
      <h3 id="conversation-log-heading" className="sr-only">Conversation log</h3>
      <div className="conversation-shell__meta muted-copy" aria-label="Conversation totals">
        <span>{groupedCount.operator} operator inputs</span>
        <span>{groupedCount.sentinel} Sentinel replies</span>
        <span>{groupedCount.system} runtime notices</span>
      </div>
      <div
        ref={scrollRef}
        className="conversation-view"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation messages"
      >
        {messages.map((message) => (
          <article key={message.id} className={`message-card ${message.role}`} aria-label={`${message.author}. ${message.role === 'system' ? 'Runtime notice' : message.role === 'sentinel' ? 'Sentinel reply' : 'Operator input'}. ${formatTimestamp(message.timestamp)}.`}>
            <div className="message-card__badge" aria-hidden="true">
              {message.role === 'operator' ? 'M' : message.role === 'sentinel' ? 'S' : 'R'}
            </div>
            <div className="message-card__body">
              <header className="message-card__header">
                <div>
                  <strong>{message.author}</strong>
                  <p>
                    {message.role === 'system'
                      ? 'Runtime notice'
                      : message.role === 'sentinel'
                        ? 'Sentinel persona'
                        : 'Operator input'}
                  </p>
                </div>
                <time dateTime={message.timestamp}>{formatTimestamp(message.timestamp)}</time>
              </header>
              <p>{message.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
