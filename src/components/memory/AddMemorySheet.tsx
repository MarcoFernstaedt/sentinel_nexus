'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import type { MemoryCategory, MemoryStatus } from '@/src/types/memory'
import { CATEGORY_LABEL, STATUS_LABEL } from '@/src/types/memory'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as MemoryCategory[]
const STATUS_OPTIONS: MemoryStatus[] = ['active', 'long-term']

interface AddMemorySheetProps {
  onClose: () => void
  onAdd: (input: {
    title: string
    content: string
    category: MemoryCategory
    status?: MemoryStatus
    tags?: string[]
    relatedAgent?: string
  }) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[0.66rem] uppercase tracking-[0.12em] text-text-3 font-medium">
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg text-[0.78rem]',
        'bg-surface-0 border border-soft',
        'text-text-1 placeholder:text-text-3',
        'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
        'transition-colors duration-150',
      )}
    />
  )
}

export function AddMemorySheet({ onClose, onAdd }: AddMemorySheetProps) {
  const [title,        setTitle]        = useState('')
  const [content,      setContent]      = useState('')
  const [category,     setCategory]     = useState<MemoryCategory>('context')
  const [status,       setStatus]       = useState<MemoryStatus>('active')
  const [tags,         setTags]         = useState('')
  const [relatedAgent, setRelatedAgent] = useState('')
  const [error,        setError]        = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle   = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle)   { setError('Title is required.'); return }
    if (!trimmedContent) { setError('Content is required.'); return }
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    onAdd({
      title: trimmedTitle,
      content: trimmedContent,
      category,
      status,
      tags: parsedTags,
      relatedAgent: relatedAgent.trim() || undefined,
    })
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add memory"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:inset-auto md:fixed md:top-1/2 md:left-1/2',
          'md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px]',
          'rounded-t-2xl md:rounded-2xl',
          'bg-[linear-gradient(180deg,rgba(9,16,24,0.98),rgba(7,12,18,0.98))]',
          'border border-soft shadow-elevated',
          'max-h-[90dvh] overflow-y-auto',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.18em] text-accent-mint-dim font-medium">
              Memory Vault
            </p>
            <h3 className="text-[0.9rem] font-semibold text-text-0 leading-tight mt-0.5">
              Add Memory
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-[8px] border border-soft text-text-3 hover:text-text-1 hover:border-med transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5">
          {/* Title */}
          <div className="grid gap-1.5">
            <FieldLabel>Title</FieldLabel>
            <TextInput
              value={title}
              onChange={(v) => { setTitle(v); setError(null) }}
              placeholder="e.g. Chose React Query over Redux, Rate limit rule, Sprint context…"
            />
          </div>

          {/* Content */}
          <div className="grid gap-1.5">
            <FieldLabel>Content</FieldLabel>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setError(null) }}
              placeholder="Full context, decision rationale, instruction details…"
              rows={5}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-[0.78rem] resize-none',
                'bg-surface-0 border border-soft',
                'text-text-1 placeholder:text-text-3',
                'focus:outline-none focus:border-[rgba(126,255,210,0.40)] focus:ring-1 focus:ring-[rgba(126,255,210,0.18)]',
                'transition-colors duration-150',
              )}
            />
          </div>

          {/* Category */}
          <div className="grid gap-1.5">
            <FieldLabel>Category</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-2.5 py-[0.28rem] rounded-full text-[0.62rem] font-medium border transition-all duration-100 whitespace-nowrap',
                    category === cat
                      ? 'border-[rgba(126,255,210,0.40)] bg-[rgba(126,255,210,0.10)] text-accent-mint'
                      : 'border-soft bg-surface-1 text-text-2 hover:border-med hover:text-text-1',
                  )}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <FieldLabel>Status</FieldLabel>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    'px-2.5 py-[0.28rem] rounded-full text-[0.62rem] font-medium border transition-all duration-100 whitespace-nowrap',
                    status === s
                      ? 'border-[rgba(126,255,210,0.40)] bg-[rgba(126,255,210,0.10)] text-accent-mint'
                      : 'border-soft bg-surface-1 text-text-2 hover:border-med hover:text-text-1',
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="grid gap-1.5">
            <FieldLabel>Tags <span className="normal-case text-text-3">(optional, comma-separated)</span></FieldLabel>
            <TextInput
              value={tags}
              onChange={setTags}
              placeholder="e.g. architecture, decision, auth"
            />
          </div>

          {/* Related agent */}
          <div className="grid gap-1.5">
            <FieldLabel>Related Agent <span className="normal-case text-text-3">(optional)</span></FieldLabel>
            <TextInput
              value={relatedAgent}
              onChange={setRelatedAgent}
              placeholder="e.g. Sentinel, Build Cell, operator…"
            />
          </div>

          {error && (
            <p className="text-[0.68rem] text-[rgba(255,112,112,0.85)] font-medium">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-[0.74rem] font-medium text-text-2 border border-soft hover:text-text-1 hover:border-med transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                'px-4 py-2 rounded-lg text-[0.74rem] font-semibold transition-all duration-150',
                'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.10)] text-accent-mint',
                'hover:bg-[rgba(126,255,210,0.18)] hover:border-[rgba(126,255,210,0.50)]',
              )}
            >
              Save Memory
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
