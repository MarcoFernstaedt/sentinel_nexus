#!/usr/bin/env node
/**
 * nexus-nightly-summary.mjs
 *
 * Reads tracked targets from the Nexus data store and outputs a formatted
 * end-of-day execution summary to stdout.
 *
 * Usage: node scripts/nexus-nightly-summary.mjs
 *
 * Designed to be called by the OpenClaw nightly cron at 11 PM Phoenix.
 * The cron should post the stdout output to the active session.
 * Exit 0 always — errors are printed to stdout so they appear in the session.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

const DATA_PATH = join(homedir(), '.openclaw', 'data', 'nexus', 'nexus-data.json')

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatLine(target) {
  const pct = target.targetCount > 0
    ? Math.round((target.currentCount / target.targetCount) * 100)
    : 0

  const ratio = `${target.currentCount}/${target.targetCount}`

  if (target.status === 'completed') {
    return `  ✓  ${target.title.padEnd(32)} ${ratio.padStart(6)}  (${pct}%) — Hit`
  }
  if (target.currentCount > 0) {
    return `  ⚠  ${target.title.padEnd(32)} ${ratio.padStart(6)}  (${pct}%) — Partial`
  }
  if (target.status === 'missed') {
    return `  ✗  ${target.title.padEnd(32)} ${ratio.padStart(6)}  (${pct}%) — Missed`
  }
  return `  ✗  ${target.title.padEnd(32)} ${ratio.padStart(6)}  (${pct}%) — Unreported`
}

async function main() {
  const today = todayKey()
  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Phoenix',
  })

  let store
  try {
    const raw = await readFile(DATA_PATH, 'utf8')
    store = JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('── Nexus EOD Summary ─────────────────────────────────────────')
      console.log(`No Nexus data found at ${DATA_PATH}. Nothing to report.`)
      return
    }
    console.log('── Nexus EOD Summary ─────────────────────────────────────────')
    console.log(`Error reading Nexus data: ${err.message}`)
    return
  }

  const allTargets = Array.isArray(store.trackedTargets) ? store.trackedTargets : []
  const daily = allTargets.filter((t) => t.period === 'daily' && t.status !== 'paused')

  console.log(`── Nexus EOD Summary · ${today} · ${now} MST ─────────────────`)

  if (daily.length === 0) {
    console.log('No active daily targets configured.')
    return
  }

  const hit     = daily.filter((t) => t.status === 'completed')
  const partial = daily.filter((t) => t.status !== 'completed' && t.currentCount > 0)
  const missed  = daily.filter((t) => t.status !== 'completed' && t.currentCount === 0)

  console.log()
  daily.forEach((t) => console.log(formatLine(t)))
  console.log()
  console.log(`  Score: ${hit.length} hit · ${partial.length} partial · ${missed.length} unreported · ${daily.length} total`)

  if (missed.length > 0) {
    console.log()
    console.log(`  ⚠ ${missed.length} target(s) have zero count logged today.`)
    console.log('  Update counts at /tracking before midnight.')
  } else if (hit.length === daily.length) {
    console.log()
    console.log('  All daily targets hit. Execution complete.')
  }

  console.log('─────────────────────────────────────────────────────────────')
}

main()
