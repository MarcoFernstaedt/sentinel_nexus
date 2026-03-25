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
  title: 'Operator-grade intelligence, routed through one disciplined control surface.',
  summary:
    'This frontend now establishes a maintainable shell for the Sentinel Nexus product: clear messaging, centralized content, reusable sections, and safer link primitives. It is intentionally small, but no longer disposable.',
  primaryAction: {
    label: 'Open architecture notes',
    href: '#architecture',
  } satisfies PrimaryAction,
  secondaryAction: {
    label: 'Review build stack',
    href: '#stack',
  } satisfies PrimaryAction,
}

export const pillars: Pillar[] = [
  {
    title: 'Unified command surface',
    description:
      'One place to coordinate workflows, context, and operator decisions instead of scattering them across tabs and tools.',
  },
  {
    title: 'Composable modules',
    description:
      'Sections are data-driven and isolated so the app can grow into dashboards, agents, or integration panels without rewriting the shell.',
  },
  {
    title: 'Security-aware defaults',
    description:
      'External navigation is wrapped with safe defaults, and the structure makes it easy to introduce auth, policies, and audit instrumentation later.',
  },
]

export const principles: Principle[] = [
  {
    title: 'Start with seams',
    detail:
      'The project now separates content, rendering, and styling so future product work does not collapse into a monolithic App.tsx.',
  },
  {
    title: 'Prefer typed content',
    detail:
      'Product copy and section metadata live in one typed module, making reviews and future CMS/API transitions straightforward.',
  },
  {
    title: 'Keep the shell honest',
    detail:
      'The interface explains what exists now and what should come next rather than pretending the starter template is a product.',
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
  'Frontend-only shell today; no routing, state library, or backend coupling yet.',
  'Good next step: introduce feature directories before adding API code or dashboard complexity.',
  'Add auth boundaries, environment validation, and test coverage before handling sensitive operator data.',
]
