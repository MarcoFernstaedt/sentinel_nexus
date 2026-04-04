import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)

export interface AuthConfig {
  setupComplete: boolean
  passwordHash: string   // hex — scrypt(password, salt, 64)
  salt: string           // hex — 32 random bytes
  sessionSecret: string  // hex — 32 random bytes, HMAC signing key
  apiKey: string         // hex — 32 random bytes, for agent/Claude access
  createdAt: string
}

export class AuthStore {
  private readonly filePath: string

  constructor(dataDirectory: string) {
    this.filePath = path.join(dataDirectory, 'auth.json')
  }

  async read(): Promise<AuthConfig | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      return JSON.parse(raw) as AuthConfig
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw err
    }
  }

  async write(config: AuthConfig): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(config, null, 2) + '\n', 'utf8')
  }

  async isSetupComplete(): Promise<boolean> {
    const cfg = await this.read()
    return cfg?.setupComplete === true
  }

  async setup(password: string): Promise<AuthConfig> {
    const salt = crypto.randomBytes(32).toString('hex')
    const passwordHash = await this.hashPassword(password, salt)
    const config: AuthConfig = {
      setupComplete: true,
      passwordHash,
      salt,
      sessionSecret: crypto.randomBytes(32).toString('hex'),
      apiKey: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date().toISOString(),
    }
    await this.write(config)
    return config
  }

  async hashPassword(password: string, salt: string): Promise<string> {
    const key = await scrypt(password, salt, 64) as Buffer
    return key.toString('hex')
  }

  async verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
    const hash = await this.hashPassword(password, salt)
    // Constant-time compare to prevent timing attacks
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))
    } catch {
      return false
    }
  }

  // ── Session tokens ────────────────────────────────────────────
  // Format: <expiry_unix_ts>.<hmac_sha256(expiry, secret)>

  createSessionToken(secret: string, ttlSeconds = 7 * 24 * 3600): string {
    const expiry = Math.floor(Date.now() / 1000) + ttlSeconds
    const payload = String(expiry)
    const mac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return `${payload}.${mac}`
  }

  verifySessionToken(token: string, secret: string): boolean {
    const parts = token.split('.')
    if (parts.length !== 2) return false
    const [payload, mac] = parts
    const expiry = Number(payload)
    if (!Number.isFinite(expiry) || Date.now() / 1000 > expiry) return false
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    try {
      return crypto.timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))
    } catch {
      return false
    }
  }

  async rotateApiKey(): Promise<string> {
    const cfg = await this.read()
    if (!cfg?.setupComplete) throw new Error('Auth not configured — run setup first')
    const newKey = crypto.randomBytes(32).toString('hex')
    await this.write({ ...cfg, apiKey: newKey })
    return newKey
  }
}
