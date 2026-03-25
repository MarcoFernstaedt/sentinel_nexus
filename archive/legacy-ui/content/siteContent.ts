export type PrimaryAction = {
  label: string
  href: string
  external?: boolean
}

export type Pillar = {
  title: string
  description: string
}

export type Principle = {
  title: string
  detail: string
}

export type IntegrationLink = {
  label: string
  href: string
}

export const hero = {
  eyebrow: 'Sentinel Nexus',
  title: 'The operator console for Sentinel—separate from Dominion Edge Holdings.',
  summary:
    'Nexus is the assistant platform: a clean control surface for status, focus, conversations, agents, tools, and usage. It should not absorb holdings, deal, portfolio, or acquisition workflows.',
  primaryAction: {
    label: 'Lock v1 scope',
    href: '#scope',
  } satisfies PrimaryAction,
  secondaryAction: {
    label: 'Review roadmap',
    href: '#roadmap',
  } satisfies PrimaryAction,
}

export const pillars: Pillar[] = [
  {
    title: 'Stay distinct',
    description:
      'If a feature smells like holdings management, CRM, pipeline operations, or portfolio oversight, it belongs in Dominion Edge Holdings, not in Nexus.',
  },
  {
    title: 'Win with the shell',
    description:
      'The highest-value v1 is an elegant overview experience: excellent navigation, visible system state, obvious focus, and premium interaction quality.',
  },
  {
    title: 'Design for expansion',
    description:
      'Future chat, agents, tools, and usage features should arrive as modules behind stable seams—not as a sprawling rewrite of the root app.',
  },
]

export const principles: Principle[] = [
  {
    title: 'v1 core: Overview',
    detail:
      'Implement the dashboard shell, summary cards, focus rail, and room for today/next-action surfaces before building deeper operator workflows.',
  },
  {
    title: 'Later: Conversations and agents',
    detail:
      'Threaded chat, agent runs, execution visibility, and coordination tools belong after the overview shell feels complete and trustworthy.',
  },
  {
    title: 'Later: Tools and usage',
    detail:
      'Tool permissions, action history, cost visibility, and usage analytics should land only after clear product boundaries and auth patterns exist.',
  },
]

export const integrationLinks: IntegrationLink[] = [
  {
    label: 'React 19',
    href: 'https://react.dev/',
  },
  {
    label: 'Vite 8',
    href: 'https://vite.dev/',
  },
  {
    label: 'TypeScript 5',
    href: 'https://www.typescriptlang.org/',
  },
]

export const stackNotes = [
  'Current structure is strong enough for a front-end shell: page composition in App, small reusable components, typed content, and isolated styling.',
  'Next structural move: add feature folders such as features/overview, features/conversations, and features/agents before introducing routing or API coupling.',
  'Add auth boundaries, API clients, and audit-aware state only when the shell and module ownership are stable.',
]
