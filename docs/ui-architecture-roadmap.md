# Sentinel Nexus UI architecture roadmap

## Recommendation

Do **not** do a one-pass rewrite to Next.js + Tailwind + shadcn right now.

That stack is directionally right for Marco's target aesthetic and maintainability goals, but this repo already has a functioning and recently improved Vite + React + Node runtime shell with truthful backend seams. A rushed migration would create avoidable risk in exactly the areas this product is trying to make trustworthy: runtime state, task visibility, and operator flow.

## Why a full migration is not prudent in one pass

- **The app already has an integrated backend seam.** Replacing the frontend runtime shell while preserving the existing API and truthful state surfaces would add migration complexity without immediate leverage.
- **The current pain is design-system and composition, not routing or SSR.** Most value is in a coherent component system, visual language, spacing/tokens, and reducing the size of `App.tsx`.
- **Tailwind/shadcn is a UI architecture choice, not a rescue operation.** The repo can move toward that shape safely before any framework migration.
- **Accessibility and truthfulness matter more than trend alignment.** Marco's visual impairment makes consistent focus states, hierarchy, density control, and low-clutter surfaces more important than a cosmetic stack swap.

## Transitional direction implemented in this pass

This pass establishes a **Tailwind/shadcn-style direction without forcing the migration yet**:

- semantic design tokens expanded in CSS
- reusable UI primitives (`Surface`, `StatusBadge`, `MetricCard`, `SectionHeading`)
- shared command-center formatting utilities moved out of `App.tsx`
- stronger separation between page composition and reusable surface patterns

This gives the codebase a safer path to later move into:

1. Tailwind tokens + utility classes
2. a `components/ui/*` shadcn-style catalog
3. route/page-level decomposition
4. optional Next.js app-router migration after UI/state boundaries are cleaner

## Recommended migration sequence

### Phase 1 — completed / started here
- Introduce semantic UI primitives and design tokens.
- Extract shared formatting/presentation logic from `App.tsx`.
- Keep the current runtime/API architecture stable.

### Phase 2 — next
- Break `App.tsx` into `features/command-center/sections/*`.
- Add a formal token map for spacing, radii, shadows, and panel variants.
- Introduce density modes and stronger responsive accessibility behavior.
- Add visual regression screenshots for the shell.

### Phase 3 — optional stack evolution
- Install Tailwind and map current tokens into `tailwind.config`.
- Rebuild primitives in a shadcn-style API while keeping semantics stable.
- Migrate page sections gradually instead of all at once.

### Phase 4 — framework decision
Only consider Next.js after the UI system is sufficiently modular and there is a clear benefit from:
- app-router layouts
- server rendering for initial shell load
- route-level composition requirements
- server actions or co-located backend use cases

## North-star UI direction

The target should be:

- futuristic but restrained
- executive, not gamer clutter
- glassy surfaces with clear truth labels
- strong information hierarchy
- keyboard-first and screen-reader-safe
- modular enough that a later Tailwind/shadcn migration is mostly mechanical
