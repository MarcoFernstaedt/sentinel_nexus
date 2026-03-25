import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { NexusDatabaseConfig } from '../domain/models.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const homeDir = process.env.HOME ?? rootDir
const defaultDbDir = path.join(homeDir, '.openclaw', 'data', 'nexus')
const defaultSchemaPath = path.join(rootDir, 'nexus.schema.sql')

export interface AppConfig {
  port: number
  nodeEnv: string
  database: NexusDatabaseConfig
}

export function getAppConfig(): AppConfig {
  const driver = (process.env.NEXUS_DB_DRIVER ?? 'file-json') as NexusDatabaseConfig['driver']
  const dataDirectory = process.env.NEXUS_DB_DIR
    ? path.resolve(process.env.NEXUS_DB_DIR)
    : defaultDbDir

  const schemaPath = process.env.NEXUS_DB_SCHEMA_PATH
    ? path.resolve(process.env.NEXUS_DB_SCHEMA_PATH)
    : defaultSchemaPath

  return {
    port: Number(process.env.NEXUS_API_PORT ?? 4001),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    database: {
      driver,
      dataDirectory,
      schemaPath,
      connectionUrl: process.env.NEXUS_DB_URL,
    },
  }
}
