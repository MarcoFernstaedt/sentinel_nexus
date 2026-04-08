import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { AppConfig } from '../config/env.js'
import { StatusService } from '../application/services.js'
import { StatusRepository } from '../application/repositories.js'
import { createSeedData } from '../domain/seeds.js'
import { FileBackedStore } from '../infrastructure/fileStore.js'

const tempDirs: string[] = []

async function makeHarness() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-status-'))
  tempDirs.push(root)

  const workspaceRoot = path.join(root, 'workspace')
  const dataDirectory = path.join(root, 'data')
  await fs.mkdir(workspaceRoot, { recursive: true })
  await fs.mkdir(path.join(workspaceRoot, 'docs'), { recursive: true })
  await fs.writeFile(path.join(workspaceRoot, 'README.md'), '# Test\n', 'utf8')
  await fs.writeFile(path.join(workspaceRoot, 'USER.md'), '# User\n', 'utf8')
  await fs.writeFile(path.join(workspaceRoot, 'HEARTBEAT.md'), '# Heartbeat\n', 'utf8')
  await fs.writeFile(path.join(workspaceRoot, 'docs', 'ui-architecture-roadmap.md'), '# UI roadmap\n', 'utf8')

  const store = new FileBackedStore(dataDirectory)
  const seed = createSeedData()
  await store.write(seed)

  const config: AppConfig = {
    port: 3001,
    nodeEnv: 'test',
    workspaceRoot,
    database: {
      driver: 'file-json',
      dataDirectory,
      schemaPath: path.join(root, 'nexus.schema.sql'),
    },
  }

  const repository = new StatusRepository(store)
  const service = new StatusService(repository, config)

  return { root, workspaceRoot, store, service }
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe('StatusService.runtimeContext', () => {
  it('fails closed when upstream presence files exist but contain malformed JSON', async () => {
    const { root, service } = await makeHarness()
    await fs.mkdir(path.join(root, 'agents', 'main', 'sessions'), { recursive: true })
    await fs.mkdir(path.join(root, 'subagents'), { recursive: true })
    await fs.writeFile(path.join(root, 'agents', 'main', 'sessions', 'sessions.json'), '{not-json', 'utf8')
    await fs.writeFile(path.join(root, 'subagents', 'runs.json'), '{still-not-json', 'utf8')

    await expect(service.runtimeContext()).resolves.toMatchObject({
      surfaces: {
        upstreamPresence: {
          source: 'openclaw-host-files',
          sessionIndexAvailable: true,
          subagentRunsAvailable: true,
          totalSessions: 0,
          activeSubagentRuns: 0,
          sessions: [],
          subagentRuns: [],
        },
      },
    })
  })

  it('builds truthful workstream, attention, and roster visibility counts from runtime tasks', async () => {
    const { root, store, service } = await makeHarness()
    const now = Date.now()
    const isoNow = new Date(now).toISOString()
    const data = createSeedData()
    data.tasks = [
      {
        id: 'task-active',
        title: 'Active work',
        owner: 'Sentinel',
        due: 'due:2026-04-08',
        status: 'In Progress',
        stage: 'editing',
        lane: 'queued',
        lastUpdatedAt: isoNow,
        source: 'runtime',
      },
      {
        id: 'task-waiting',
        title: 'Waiting work',
        owner: 'Sentinel',
        due: 'due:2026-04-08',
        status: 'Queued',
        stage: 'queued',
        lane: 'queued',
        needsApproval: true,
        lastUpdatedAt: new Date(now - 1_000).toISOString(),
        source: 'runtime',
      },
      {
        id: 'task-blocked',
        title: 'Blocked work',
        owner: 'Temp',
        due: 'due:2026-04-08',
        status: 'Blocked',
        stage: 'validating',
        lane: 'in_progress',
        blockedReason: 'Need operator input',
        lastUpdatedAt: new Date(now - 2_000).toISOString(),
        source: 'runtime',
      },
      {
        id: 'task-report',
        title: 'Ready report',
        owner: 'Temp',
        due: 'due:2026-04-08',
        status: 'Done',
        stage: 'done',
        lane: 'in_progress',
        readyToReport: true,
        completedAt: new Date(now - 3_000).toISOString(),
        lastUpdatedAt: new Date(now - 3_000).toISOString(),
        source: 'runtime',
      },
    ]
    data.activity = [
      {
        id: 'activity-1',
        type: 'task',
        title: 'Latest activity',
        detail: 'detail',
        timestamp: isoNow,
        status: 'logged',
        source: 'runtime',
      },
    ]
    await store.write(data)

    await fs.mkdir(path.join(root, 'agents', 'main', 'sessions'), { recursive: true })
    await fs.mkdir(path.join(root, 'subagents'), { recursive: true })
    const mainSessionFile = path.join(root, 'agents', 'main', 'sessions', 'main-1.jsonl')
    const subagentSessionFile = path.join(root, 'agents', 'main', 'sessions', 'sub-1.jsonl')
    await fs.writeFile(
      mainSessionFile,
      `${JSON.stringify({ type: 'message', timestamp: isoNow, message: { role: 'assistant' } })}
`,
      'utf8',
    )
    await fs.writeFile(
      subagentSessionFile,
      `${JSON.stringify({ type: 'message', timestamp: new Date(now - 30_000).toISOString(), message: { role: 'toolResult' } })}
`,
      'utf8',
    )
    await fs.writeFile(
      path.join(root, 'agents', 'main', 'sessions', 'sessions.json'),
      JSON.stringify({
        'agent:main:main': {
          sessionId: 'main-1',
          label: 'Main session',
          status: 'running',
          updatedAt: now,
          sessionFile: mainSessionFile,
        },
        'agent:main:subagent:abc': {
          sessionId: 'sub-1',
          label: 'Subagent session',
          status: 'running',
          updatedAt: now - 30_000,
          sessionFile: subagentSessionFile,
        },
      }),
      'utf8',
    )
    await fs.writeFile(
      path.join(root, 'subagents', 'runs.json'),
      JSON.stringify({
        runs: {
          'run-1': {
            runId: 'run-1',
            childSessionKey: 'agent:main:subagent:abc',
            label: 'Tight runtime test',
            startedAt: now - 5_000,
          },
        },
      }),
      'utf8',
    )

    const runtime = await service.runtimeContext()
    expect(runtime.surfaces.attentionCounts).toEqual({
      active: 1,
      waitingOnUser: 1,
      blocked: 1,
      readyToReport: 1,
    })
    expect(runtime.surfaces.workstreams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          owner: 'Sentinel',
          lane: 'queued',
          taskCount: 2,
          activeCount: 1,
          waitingCount: 1,
          blockedCount: 0,
          readyToReportCount: 0,
          latestTaskTitle: 'Active work',
        }),
        expect.objectContaining({
          owner: 'Temp',
          lane: 'in_progress',
          taskCount: 2,
          activeCount: 0,
          waitingCount: 0,
          blockedCount: 1,
          completedCount: 1,
          readyToReportCount: 1,
        }),
      ]),
    )
    expect(runtime.surfaces.visibility).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'sentinel', state: 'live' }),
        expect.objectContaining({ id: 'task-visibility', state: 'live', detail: '4 tracked tasks across 2 task-derived work cells.' }),
        expect.objectContaining({ id: 'agent-roster', state: 'live' }),
      ]),
    )
    expect(runtime.surfaces.upstreamPresence).toMatchObject({
      source: 'openclaw-host-files',
      totalSessions: 2,
      runningSessions: 2,
      recentlyUpdatedSessions: 2,
      activeSubagentRuns: 1,
      recentlyCompletedSubagentRuns: 0,
      sessions: expect.arrayContaining([
        expect.objectContaining({
          sessionId: 'main-1',
          lastObservedEventType: 'message',
          lastObservedMessageRole: 'assistant',
          lastObservedActivity: 'assistant-message',
        }),
        expect.objectContaining({
          sessionId: 'sub-1',
          lastObservedEventType: 'message',
          lastObservedMessageRole: 'toolResult',
          lastObservedActivity: 'tool-result',
        }),
      ]),
    })
  })
})
