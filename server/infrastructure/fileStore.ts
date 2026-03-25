import fs from 'node:fs/promises'
import path from 'node:path'
import { createSeedData } from '../domain/seeds.js'
import type { NexusDataStore } from '../domain/models.js'

export class FileBackedStore {
  constructor(private readonly dataDirectory: string) {}

  private get filePath() {
    return path.join(this.dataDirectory, 'nexus-data.json')
  }

  async read(): Promise<NexusDataStore> {
    await fs.mkdir(this.dataDirectory, { recursive: true })

    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      return JSON.parse(raw) as NexusDataStore
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
