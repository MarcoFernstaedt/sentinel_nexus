# Sentinel Nexus

A local-first Nexus chat shell for Sentinel.

## What it includes now

- Deeper conversation layout focused on Operator ↔ Sentinel exchange
- Mode switching for command, strategy, and build framing
- Sentinel persona panel that changes with the active mode
- Local prompt history recall shell via keyboard and UI controls
- Mock/local transport adapter seam for future runtime integration
- Responsive dark interface built for later gateway wiring

## Run

```bash
npm install
npm run dev
```

The Vite dev server is pinned to **port 3002**.

## Validate

```bash
npm run build
npm run lint
```

## Current integration state

Working now:
- Local-only chat state and simulated Sentinel replies
- Mode-aware conversation filtering and persona framing
- Input history recall using ↑/↓ plus recall controls
- Clean feature-based chat architecture with transport isolation

Still needs runtime integration:
- Real backend/chat transport in place of the local simulator
- Streaming events, delivery states, and error handling
- Persistent conversation storage and restored history
- Real operator identity/session wiring
- Gateway telemetry and command execution hooks
