export type MemoryStatus   = 'active' | 'long-term' | 'archived'
export type MemoryCategory =
  | 'decision'
  | 'context'
  | 'knowledge'
  | 'pattern'
  | 'observation'
  | 'instruction'
  | 'reference'

export interface Memory {
  id: string
  title: string
  content: string
  category: MemoryCategory
  status: MemoryStatus
  createdAt: string         // ISO
  updatedAt: string         // ISO
  source?: string           // e.g. 'Sentinel', 'operator', 'API Gateway audit'
  relatedProjectId?: string
  relatedProjectTitle?: string
  relatedAgent?: string
  tags: string[]
}

export const STATUS_LABEL: Record<MemoryStatus, string> = {
  'active':    'Active',
  'long-term': 'Long-term',
  'archived':  'Archived',
}

export const CATEGORY_LABEL: Record<MemoryCategory, string> = {
  decision:    'Decision',
  context:     'Context',
  knowledge:   'Knowledge',
  pattern:     'Pattern',
  observation: 'Observation',
  instruction: 'Instruction',
  reference:   'Reference',
}
