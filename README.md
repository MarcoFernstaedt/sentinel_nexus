# Sentinel Nexus

Sentinel Nexus now has a minimal but intentional frontend foundation instead of the stock Vite counter template.

## What changed in this review pass

- Replaced the starter template UI with a product-facing app shell.
- Split rendering into small components (`AppHeader`, `Section`, `ExternalLink`).
- Moved copy and section metadata into `src/content/siteContent.ts` so product changes are typed and centralized.
- Added safer external link handling with `rel="noreferrer noopener"`.
- Tightened the visual shell to reflect an operator-grade product direction.

## Architecture notes

Current structure:

- `src/App.tsx` — page composition only
- `src/components/` — reusable UI primitives
- `src/content/` — typed content/config for the current shell
- `src/index.css` / `src/App.css` — global tokens and layout styling

Recommended next steps before significant feature growth:

1. Add feature directories (`features/dashboard`, `features/agents`, `features/policies`) instead of expanding root-level files.
2. Introduce routing only when multiple true product surfaces exist.
3. Add environment validation, authentication boundaries, and API client isolation before handling real operator data.
4. Add tests for rendering and future business logic as soon as stateful behavior appears.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```
