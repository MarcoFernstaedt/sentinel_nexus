#!/usr/bin/env node
/**
 * nexus-ops-staleness.mjs
 *
 * Checks whether ops/now.md in the Nexus repo is stale (older than 3 days).
 *
 * Usage: node /path/to/scripts/nexus-ops-staleness.mjs
 *
 * Exit 0: ops/now.md is fresh or doesn't exist (no output)
 * Exit 1: ops/now.md is stale — outputs a warning line to stdout
 *
 * Designed to be called by the OpenClaw session-start hook.
 * The hook should surface the output as a warning at the top of the first
 * response in a new session, then do nothing on subsequent messages.
 */

import { stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const STALE_THRESHOLD_DAYS = 3
const STALE_THRESHOLD_MS   = STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000

// Resolve ops/now.md relative to the repo root (two levels up from scripts/)
const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const NOW_MD_PATH = join(REPO_ROOT, 'ops', 'now.md')

async function main() {
  let fileStat
  try {
    fileStat = await stat(NOW_MD_PATH)
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist — not stale, just missing. Exit clean.
      process.exit(0)
    }
    // Can't read the file — don't block the session, just exit clean.
    process.exit(0)
  }

  const ageMs = Date.now() - fileStat.mtimeMs
  if (ageMs <= STALE_THRESHOLD_MS) {
    // Fresh — no output, exit 0
    process.exit(0)
  }

  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
  console.log(
    `⚠ ops/now.md is ${ageDays} day${ageDays === 1 ? '' : 's'} old (threshold: ${STALE_THRESHOLD_DAYS} days). ` +
    `Update it before proceeding: ops/now.md`
  )
  process.exit(1)
}

main()
