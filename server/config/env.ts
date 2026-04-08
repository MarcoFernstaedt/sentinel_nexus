import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { NexusDatabaseConfig } from '../domain/models.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const homeDir = process.env.HOME ?? rootDir
const defaultDbDir = path.join(homeDir, '.openclaw', 'data', 'nexus')
const defaultWorkspaceRoot = path.join(homeDir, '.openclaw', 'workspace')
const defaultSchemaPath = path.join(rootDir, 'nexus.schema.sql')
const DEFAULT_BIND_HOST = '127.0.0.1'

function expandHomePath(value: string): string {
  if (value === '~') return homeDir
  if (value.startsWith('~/')) return path.join(homeDir, value.slice(2))
  return value
}

function parsePort(value: string | undefined, fallback: number): number {
  const candidate = value?.trim()
  if (!candidate) return fallback

  const parsed = Number(candidate)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`NEXUS_API_PORT must be an integer between 1 and 65535. Received: ${candidate}`)
  }

  return parsed
}

function normalizeHost(value: string | undefined): string {
  const host = (value ?? DEFAULT_BIND_HOST).trim()
  if (!host) return DEFAULT_BIND_HOST

  if (host === '0.0.0.0' && process.env.NODE_ENV === 'production') {
    console.warn('[nexus:security] NEXUS_API_HOST=0.0.0.0 exposes the API on all interfaces in production. Prefer 127.0.0.1 behind a reverse proxy unless you intentionally need direct LAN/VPS access.')
  }

  return host
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const raw = value?.trim()
  if (!raw) return []

  const unique = new Set<string>()

  for (const candidate of raw.split(',')) {
    const origin = candidate.trim()
    if (!origin) continue

    let parsed: URL
    try {
      parsed = new URL(origin)
    } catch {
      throw new Error(`NEXUS_ALLOWED_ORIGINS contains an invalid origin: ${origin}`)
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`NEXUS_ALLOWED_ORIGINS only supports http/https origins. Received: ${origin}`)
    }

    unique.add(parsed.origin)
  }

  return [...unique]
}

export interface AppConfig {
  port: number
  host: string
  nodeEnv: string
  allowedOrigins: string[]
  database: NexusDatabaseConfig
  workspaceRoot: string
}

export function getAppConfig(): AppConfig {
  const driver = (process.env.NEXUS_DB_DRIVER ?? 'file-json') as NexusDatabaseConfig['driver']
  const dataDirectory = process.env.NEXUS_DB_DIR
    ? path.resolve(expandHomePath(process.env.NEXUS_DB_DIR))
    : defaultDbDir

  const schemaPath = process.env.NEXUS_DB_SCHEMA_PATH
    ? path.resolve(expandHomePath(process.env.NEXUS_DB_SCHEMA_PATH))
    : defaultSchemaPath

  const workspaceRoot = process.env.NEXUS_WORKSPACE_DIR
    ? path.resolve(expandHomePath(process.env.NEXUS_WORKSPACE_DIR))
    : defaultWorkspaceRoot

  const port = parsePort(process.env.NEXUS_API_PORT, 3001)
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const host = normalizeHost(process.env.NEXUS_API_HOST)
  const allowedOrigins = parseAllowedOrigins(process.env.NEXUS_ALLOWED_ORIGINS)

  return {
    port,
    host,
    nodeEnv,
    allowedOrigins,
    database: {
      driver,
      dataDirectory,
      schemaPath,
      connectionUrl: process.env.NEXUS_DB_URL,
    },
    workspaceRoot,
  }
}
