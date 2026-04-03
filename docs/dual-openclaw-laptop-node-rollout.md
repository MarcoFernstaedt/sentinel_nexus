# Dual OpenClaw Laptop-Node Rollout

## Objective
Create a two-instance OpenClaw architecture where the VPS remains the always-on primary system and a laptop instance acts as a local execution node for browser and desktop tasks.

## Target architecture

### VPS OpenClaw
Role:
Primary brain

Owns:
Messaging
Heartbeats
Cron
Nexus backend
Memory authority
Task coordination
Always-on automations

### Laptop OpenClaw
Role:
Local execution node

Owns:
Browser control
Desktop/browser tasks
Interactive workflows
Local-machine execution

## Operator rule
VPS Sentinel is authoritative.
Laptop Sentinel executes local and browser tasks and writes useful results back into shared truth.

## Phase 1 — Laptop installation

### Step 1
Install OpenClaw on the laptop.

Success criteria:
OpenClaw launches locally without errors.

### Step 2
Install a supported browser on the laptop.
Supported options:
Chrome
Brave
Edge
Chromium

Success criteria:
OpenClaw browser tooling can detect the browser.

### Step 3
Verify local browser control.
Run a simple browser task such as opening Amazon or a YouTube page and confirming that browser automation works.

Success criteria:
A local browser task completes successfully from the laptop OpenClaw instance.

## Phase 2 — Shared truth and file strategy

### Step 4
Choose a sync model.
Recommended:
Git for repos
Syncthing for workspace docs and memory files

Success criteria:
You can identify which data is shared, which is host-specific, and how changes will flow.

### Step 5
Sync the workspace truth layer.
Sync or copy:
SOUL.md
USER.md
AGENTS.md
ROUTING.md
INCIDENTS.md
MEMORY.md
memory/
active repos such as sentinel_nexus

Success criteria:
Both instances can read the same durable context.

### Step 6
Do not blindly sync host-specific config.
Be careful with:
~/.openclaw/openclaw.json
provider tokens
gateway settings
machine-specific paths
browser profiles
host service definitions

Success criteria:
Each machine has the right runtime config without breaking the other.

## Phase 3 — Config split

### Step 7
Keep VPS config focused on:
Messaging
Cron
Heartbeats
Remote availability
Nexus backend

### Step 8
Keep laptop config focused on:
Browser automation
Local execution
Interactive tasks
Desktop tooling

Success criteria:
VPS remains stable and always-on while laptop is optimized for local control.

## Phase 4 — Operational rules

### Step 9
Define authority rules.
Rule 1:
VPS Sentinel is the primary coordinator.

Rule 2:
Laptop Sentinel does not become a second independent brain.

Rule 3:
Important results must be written back into shared truth.

Rule 4:
Avoid duplicate initiative across both instances.

Success criteria:
No drift, no duplicate actions, no confusion over which instance owns what.

## Phase 5 — Validation

### Step 10
Run a browser task from the laptop instance.
Suggested first test:
Compare 5 Amazon office chairs.

### Step 11
Run a local desktop/browser workflow.
Suggested:
Open a site, extract structured information, summarize findings.

### Step 12
Verify VPS still handles:
Messaging
Heartbeats
Cron
Nexus runtime

Success criteria:
The hybrid architecture works without breaking your always-on system.

## Security checklist

1. Keep provider tokens separate unless intentionally shared.
2. Do not blindly sync all of ~/.openclaw.
3. Use least privilege on each machine.
4. Keep the VPS as the messaging authority.
5. Use Tailscale or equivalent secure remote access.
6. Be careful with browser profiles and personal sessions.
7. Avoid duplicate automation on both machines.
8. Validate what files are actually being synced.
9. Treat the laptop as more interactive and the VPS as more durable.
10. Do not expose laptop OpenClaw publicly unless you intentionally design for it.

## Maintenance checklist

Daily:
Check whether both instances are healthy.
Check whether shared workspace sync is current.
Check whether Nexus reflects real work.

Weekly:
Review drift between VPS and laptop.
Review stale tasks and duplicated effort.
Review auth and token health.
Review browser-task reliability.

Monthly:
Review architecture complexity.
Remove anything no longer useful.
Check cost and model routing discipline.
Audit synced files and secrets.

## Scalability plan

### Short term
Use manual delegation.
VPS plans.
Laptop executes browser/local tasks.

### Medium term
Standardize shared artifact flow.
Examples:
browser task result docs
structured notes
Nexus updates after execution

### Longer term
Build a cleaner inter-instance delegation workflow so the VPS instance can hand local-execution tasks to the laptop instance deliberately.

## What to build later, not first
Automatic cross-instance delegation
full shared state orchestration
complex bidirectional automation
multiple equal “brains”

## First concrete checklist

1. Install OpenClaw on laptop
2. Install Brave or Chrome on laptop
3. Verify browser control works locally
4. Decide Git vs Syncthing split
5. Sync workspace truth files
6. Keep VPS config and laptop config separate where needed
7. Run first browser task on laptop
8. Confirm VPS still handles messaging and Nexus
9. Document what worked
10. Adjust before scaling further

## Decision rule
If a task needs a real browser or local machine context, route it to the laptop instance.
If a task needs reliability, persistence, scheduling, or messaging, keep it on the VPS instance.
