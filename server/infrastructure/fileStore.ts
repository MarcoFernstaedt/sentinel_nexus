import fs from 'node:fs/promises'
import path from 'node:path'
import { createSeedData } from '../domain/seeds.js'
import type { NexusDataStore, RecordSource } from '../domain/models.js'

const seedData = createSeedData()
const seededIds = {
  chatMessages: new Set(seedData.chatMessages.map((item) => item.id)),
  notes: new Set(seedData.notes.map((item) => item.id)),
  tasks: new Set(seedData.tasks.map((item) => item.id)),
  activity: new Set(seedData.activity.map((item) => item.id)),
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

function normalizeStore(store: NexusDataStore): NexusDataStore {
  return {
    chatMessages: store.chatMessages.map((item) => normalizeSource(item, seededIds.chatMessages)),
    notes: store.notes.map((item) => normalizeSource(item, seededIds.notes)),
    tasks: store.tasks.map((item) => normalizeSource(item, seededIds.tasks)),
    activity: (store.activity ?? []).map((item) => normalizeSource(item, seededIds.activity)),
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
