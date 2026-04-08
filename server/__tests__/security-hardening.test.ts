import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { getAppConfig } from '../config/env.js'
import { HttpError, assertOriginAllowed } from '../api/http.js'
import { FileBackedStore } from '../infrastructure/fileStore.js'

describe('getAppConfig hardening', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('defaults API host to loopback', () => {
    delete process.env.NEXUS_API_HOST
    delete process.env.NEXUS_ALLOWED_ORIGINS
    const config = getAppConfig()
    expect(config.host).toBe('127.0.0.1')
    expect(config.allowedOrigins).toEqual([])
  })

  it('rejects invalid API port', () => {
    process.env.NEXUS_API_PORT = '99999'
    expect(() => getAppConfig()).toThrow(/NEXUS_API_PORT/)
  })

  it('normalizes and deduplicates allowed origins', () => {
    process.env.NEXUS_ALLOWED_ORIGINS = 'http://localhost:3000, https://nexus.example.com, http://localhost:3000 '
    const config = getAppConfig()
    expect(config.allowedOrigins).toEqual(['http://localhost:3000', 'https://nexus.example.com'])
  })

  it('rejects invalid allowed origins', () => {
    process.env.NEXUS_ALLOWED_ORIGINS = 'ftp://bad.example.com'
    expect(() => getAppConfig()).toThrow(/NEXUS_ALLOWED_ORIGINS/)
  })
})

describe('origin allow-list enforcement', () => {
  it('permits requests without an Origin header', () => {
    expect(() => assertOriginAllowed({ headers: {} } as never, ['http://localhost:3000'])).not.toThrow()
  })

  it('permits requests from configured origins', () => {
    expect(() => assertOriginAllowed({ headers: { origin: 'http://localhost:3000' } } as never, ['http://localhost:3000'])).not.toThrow()
  })

  it('rejects requests from other origins', () => {
    expect(() => assertOriginAllowed({ headers: { origin: 'https://evil.example.com' } } as never, ['http://localhost:3000']))
      .toThrowError(HttpError)
  })
})

describe('FileBackedStore hardening', () => {
  it('writes data directory and database file with private permissions', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nexus-store-'))
    const dataDir = path.join(tempDir, 'data')
    const store = new FileBackedStore(dataDir)

    await store.read()

    const dirStat = await stat(dataDir)
    const fileStat = await stat(path.join(dataDir, 'nexus-data.json'))

    expect(dirStat.mode & 0o777).toBe(0o700)
    expect(fileStat.mode & 0o777).toBe(0o600)
  })
})
