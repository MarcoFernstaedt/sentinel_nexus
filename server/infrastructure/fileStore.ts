import fs from 'node:fs/promises'
import path from 'node:path'
import { createSeedData } from '../domain/seeds.js'
import type { NexusDataStore, RecordSource, TaskRecord, TaskStage } from '../domain/models.js'

const seedData = createSeedData()
const seededIds = {
  chatMessages: new Set(seedData.chatMessages.map((item) => item.id)),
  notes: new Set(seedData.notes.map((item) => item.id)),
  tasks: new Set(seedData.tasks.map((item) => item.id)),
  activity: new Set(seedData.activity.map((item) => item.id)),
  goals: new Set(seedData.missionCommand.goals.map((item) => item.id)),
  projects: new Set(seedData.missionCommand.projects.map((item) => item.id)),
  calendar: new Set(seedData.missionCommand.calendar.map((item) => item.id)),
  memories: new Set(seedData.missionCommand.memories.map((item) => item.id)),
  artifacts: new Set(seedData.missionCommand.artifacts.map((item) => item.id)),
  team: new Set(seedData.missionCommand.team.map((item) => item.id)),
  office: new Set(seedData.missionCommand.office.map((item) => item.id)),
  searchIndex: new Set(seedData.missionCommand.searchIndex.map((item) => item.id)),
}

const statusToStage: Record<TaskRecord['status'], TaskStage> = {
  Queued: 'queued',
  'In Progress': 'editing',
  Blocked: 'validating',
  Done: 'done',
}

function normalizeSource<T extends { id: string; source?: RecordSource }>(
  item: T,
  knownSeedIds: Set<string>,
): T & { source: RecordSource } {
  if (item.source === 'runtime' || item.source === 'seeded-demo') {
    return item as T & { source: RecordSource }
  }

  return {
    ...item,
    source: knownSeedIds.has(item.id) ? 'seeded-demo' : 'runtime',
  }
}

function normalizeTask(task: TaskRecord): TaskRecord {
  const inferredUpdatedAt = task.lastUpdatedAt ?? task.completedAt

  return {
    ...task,
    stage: task.stage ?? statusToStage[task.status],
    needsUserInput: task.needsUserInput ?? false,
    readyToReport: task.readyToReport ?? false,
    blockedReason: task.blockedReason?.trim() || undefined,
    waitingFor: task.waitingFor?.trim() || undefined,
    completedAt: task.completedAt ?? (task.status === 'Done' ? inferredUpdatedAt : undefined),
    lastUpdatedAt: inferredUpdatedAt,
  }
}

function normalizeStore(store: NexusDataStore): NexusDataStore {
  const missionCommand = store.missionCommand ?? seedData.missionCommand

  return {
    chatMessages: store.chatMessages.map((item) => normalizeSource(item, seededIds.chatMessages)),
    notes: store.notes.map((item) => normalizeSource(item, seededIds.notes)),
    tasks: store.tasks.map((item) => normalizeTask(normalizeSource(item, seededIds.tasks))),
    activity: (store.activity ?? []).map((item) => normalizeSource(item, seededIds.activity)),
    missionCommand: {
      mission: normalizeSource(missionCommand.mission, new Set([seedData.missionCommand.mission.id])),
      goals: missionCommand.goals.map((item) => normalizeSource(item, seededIds.goals)),
      projects: missionCommand.projects.map((item) => normalizeSource(item, seededIds.projects)),
      calendar: missionCommand.calendar.map((item) => normalizeSource(item, seededIds.calendar)),
      memories: missionCommand.memories.map((item) => normalizeSource(item, seededIds.memories)),
      artifacts: missionCommand.artifacts.map((item) => normalizeSource(item, seededIds.artifacts)),
      team: missionCommand.team.map((item) => normalizeSource(item, seededIds.team)),
      office: missionCommand.office.map((item) => normalizeSource(item, seededIds.office)),
      searchIndex: missionCommand.searchIndex.map((item) => normalizeSource(item, seededIds.searchIndex)),
    },
  }
}

export class FileBackedStore {
  constructor(private readonly dataDirectory: string) {}

  private get filePath() {
    return path.join(this.dataDirectory, 'nexus-data.json')
  }

  async read(): Promise<NexusDataStore> {
    await fs.mkdir(this.dataDirectory, { recursive: true })

    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      const normalized = normalizeStore(JSON.parse(raw) as NexusDataStore)
      await this.write(normalized)
      return normalized
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const store = createSeedData()
        await this.write(store)
        return store
      }

      throw error
    }
  }

  async write(store: NexusDataStore): Promise<void> {
    await fs.mkdir(this.dataDirectory, { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(store, null, 2) + '\n', 'utf8')
  }
}
