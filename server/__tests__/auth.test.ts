import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { AuthStore } from '../infrastructure/authStore.js'

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-auth-test-'))
}

describe('AuthStore', () => {
  let store: AuthStore
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()
    store = new AuthStore(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns null before setup', async () => {
    expect(await store.read()).toBeNull()
    expect(await store.isSetupComplete()).toBe(false)
  })

  it('setup creates and persists auth config', async () => {
    const config = await store.setup('my-secret-passphrase')
    expect(config.setupComplete).toBe(true)
    expect(config.apiKey).toHaveLength(64) // 32 bytes hex
    expect(config.sessionSecret).toHaveLength(64)
    expect(config.salt).toHaveLength(64)
    expect(config.passwordHash).toHaveLength(128) // 64 bytes hex
  })

  it('isSetupComplete returns true after setup', async () => {
    await store.setup('passphrase1234')
    expect(await store.isSetupComplete()).toBe(true)
  })

  it('verifyPassword returns true for correct password', async () => {
    const config = await store.setup('correct-horse-battery')
    const valid = await store.verifyPassword('correct-horse-battery', config.salt, config.passwordHash)
    expect(valid).toBe(true)
  })

  it('verifyPassword returns false for wrong password', async () => {
    const config = await store.setup('correct-horse-battery')
    const valid = await store.verifyPassword('wrong-password', config.salt, config.passwordHash)
    expect(valid).toBe(false)
  })

  it('session tokens expire', async () => {
    const config = await store.setup('passphrase')
    // Create a token that already expired
    const expiredToken = `${Math.floor(Date.now() / 1000) - 1}.fake-mac`
    expect(store.verifySessionToken(expiredToken, config.sessionSecret)).toBe(false)
  })

  it('session tokens with wrong secret are rejected', async () => {
    const config = await store.setup('passphrase')
    const token = store.createSessionToken(config.sessionSecret)
    expect(store.verifySessionToken(token, 'wrong-secret')).toBe(false)
  })

  it('valid session token is accepted', async () => {
    const config = await store.setup('passphrase')
    const token = store.createSessionToken(config.sessionSecret)
    expect(store.verifySessionToken(token, config.sessionSecret)).toBe(true)
  })

  it('malformed token is rejected', async () => {
    const config = await store.setup('passphrase')
    expect(store.verifySessionToken('not-a-token', config.sessionSecret)).toBe(false)
    expect(store.verifySessionToken('', config.sessionSecret)).toBe(false)
    expect(store.verifySessionToken('a.b.c', config.sessionSecret)).toBe(false)
  })

  it('rotateApiKey generates a new key and invalidates the old one', async () => {
    const config = await store.setup('passphrase')
    const oldKey = config.apiKey
    const newKey = await store.rotateApiKey()
    expect(newKey).not.toBe(oldKey)
    expect(newKey).toHaveLength(64)

    const updated = await store.read()
    expect(updated!.apiKey).toBe(newKey)
  })

  it('rotateApiKey throws if setup not complete', async () => {
    await expect(store.rotateApiKey()).rejects.toThrow('Auth not configured')
  })

  it('each setup generates unique salt and apiKey', async () => {
    const store2 = new AuthStore(makeTmpDir())
    const c1 = await store.setup('passphrase')
    const c2 = await store2.setup('passphrase')
    expect(c1.salt).not.toBe(c2.salt)
    expect(c1.apiKey).not.toBe(c2.apiKey)
  })
})
