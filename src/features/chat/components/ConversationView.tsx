import type { ChatMessage } from '../model/types'

type ConversationViewProps = {
  messages: ChatMessage[]
}

export function ConversationView({ messages }: ConversationViewProps) {
  return (
    <div className="conversation-view" aria-live="polite">
      {messages.map((message) => (
        <article key={message.id} className={`message-card ${message.role}`}>
          <header className="message-card__header">
            <div>
              <strong>{message.author}</strong>
              <p>{message.role === 'system' ? 'Runtime notice' : message.role === 'sentinel' ? 'Sentinel persona' : 'Operator input'}</p>
            </div>
            <span>{message.timestamp}</span>
          </header>
          <p>{message.body}</p>
        </article>
      ))}
    </div>
  )
}
