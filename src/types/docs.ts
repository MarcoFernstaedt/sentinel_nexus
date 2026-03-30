export type DocStatus   = 'current' | 'draft' | 'superseded' | 'archived'
export type DocType     = 'spec' | 'runbook' | 'architecture' | 'api-reference' | 'decision-record' | 'report' | 'template' | 'guide'
export type DocCategory = 'system' | 'project' | 'agent' | 'operations' | 'research' | 'security'

export interface Doc {
  id: string
  title: string
  description: string
  category: DocCategory
  type: DocType
  status: DocStatus
  createdAt: string         // ISO
  updatedAt: string         // ISO
  relatedProjectId?: string
  relatedProjectTitle?: string
  relatedMemoryId?: string
  relatedMemoryTitle?: string
  relatedAgent?: string
  tags: string[]
  version?: string
}

export const STATUS_LABEL: Record<DocStatus, string> = {
  current:    'Current',
  draft:      'Draft',
  superseded: 'Superseded',
  archived:   'Archived',
}

export const TYPE_LABEL: Record<DocType, string> = {
  'spec':             'Spec',
  'runbook':          'Runbook',
  'architecture':     'Architecture',
  'api-reference':    'API Ref',
  'decision-record':  'Decision Record',
  'report':           'Report',
  'template':         'Template',
  'guide':            'Guide',
}

export const CATEGORY_LABEL: Record<DocCategory, string> = {
  system:     'System',
  project:    'Project',
  agent:      'Agent',
  operations: 'Operations',
  research:   'Research',
  security:   'Security',
}
