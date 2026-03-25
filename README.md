# Sentinel Nexus

Sentinel Nexus is a **separate app/repo** from Dominion Edge Holdings.

Its job is not to manage holdings, deals, entities, or operating-company workflows. Its job is to be the **operator console for Sentinel**: the interface layer where Marco can see status, focus, conversations, agent activity, tool access, and usage over time.

## Product Positioning

**Sentinel Nexus is:**
- a personal operator console
- an interface-first product
- a modular shell for future chat, status, usage, agents, and tools
- a calm, high-signal command surface

**Sentinel Nexus is not:**
- Dominion Edge Holdings lite
- a CRM or deal pipeline manager
- an acquisition/portfolio operating system
- a clone of the holdings product with a different skin

That distinction matters. Dominion Edge Holdings is the business platform. Sentinel Nexus is the assistant platform.

## Highest-Value V1 Scope

The highest-value v1 is deliberately narrow:

1. **Overview shell**
   - polished landing/dashboard experience
   - summary cards for system status and current focus
   - room for “today”, “active thread”, and “next actions”

2. **Design system foundation**
   - color tokens, spacing, panels, cards, state badges
   - responsive layout that already feels premium
   - accessibility-minded typography and contrast

3. **Module boundaries for future expansion**
   - overview
   - conversations
   - agents
   - tools
   - usage

Only **Overview** should be implemented in v1. The other modules should remain architectural placeholders until the shell is excellent.

## Recommended Architecture

- **`src/App.tsx`**: page composition only
- **future `src/modules/*`**: one folder per product domain
- **future `src/components/ui/*`**: reusable UI primitives
- **future `src/lib/*`**: formatting, adapters, shared utilities
- **future `src/types/*`**: contracts for chat, status, agent runs, tool events, usage metrics

Suggested sequence:

### Phase 1 — Shell
Build the overview page, navigation model, state patterns, and visual identity.

### Phase 2 — Conversations
Add the Sentinel chat/thread surface with context handoff and action affordances.

### Phase 3 — Operations
Add agents, tools, usage, execution logs, and permissions/audit visibility.

## Scope Discipline Rules

- If a feature smells like holdings management, it belongs in Dominion Edge Holdings, not here.
- If a feature improves Sentinel’s interface, control surface, or operator visibility, it may belong here.
- Avoid adding backend complexity until the front-end shell and product boundaries are stable.
- Prefer modular placeholders over premature full implementations.

## Current Improvement Made

This repo has been moved off the default Vite starter and into a product-aligned front-end shell that:
- states the product clearly
- enforces separation from Dominion Edge Holdings
- defines v1 scope visually and in docs
- leaves clean room for future modules without bloating v1
