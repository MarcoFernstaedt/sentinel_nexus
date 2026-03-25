# Sentinel Nexus

A clean v1 operator dashboard for Sentinel.

## What it includes

- Chat with Sentinel UI shell
- System status panels
- Usage and status metrics
- Mode display
- Sub-agent roles and activity view
- Notes/tasks execution ledger
- Quick tools panel
- Responsive dark interface

## Run

```bash
npm install
npm run dev
```

The Vite dev server is pinned to **port 3002**.

## Build

```bash
npm run build
npm run lint
```

## Current integration state

Working now:
- Fully functional frontend shell
- Structured data model for dashboard surfaces
- Responsive layout and visual system
- Production build and lint passing

Still needs integration:
- Live backend/chat transport
- Real system telemetry and gateway status APIs
- Persistent notes/tasks storage
- Real sub-agent activity feeds
- Auth, user/session management, and command execution wiring
