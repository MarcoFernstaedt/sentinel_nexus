import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_JSON_BODY_BYTES = 1024 * 1024
const JSON_CONTENT_TYPES = new Set(['application/json'])

function getRequestOrigin(request: IncomingMessage): string | null {
  const origin = request.headers.origin
  if (typeof origin !== 'string') return null

  try {
    return new URL(origin).origin
  } catch {
    return null
  }
}

function buildCorsHeaders(request: IncomingMessage, allowedOrigins: string[]) {
  const requestOrigin = getRequestOrigin(request)
  const allowAnyOrigin = allowedOrigins.length === 0
  const allowOrigin = allowAnyOrigin
    ? requestOrigin ?? '*'
    : requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : null

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  } as const
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class ValidationError extends HttpError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message, 422)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends HttpError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export function assertOriginAllowed(request: IncomingMessage, allowedOrigins: string[]) {
  if (allowedOrigins.length === 0) return

  const requestOrigin = getRequestOrigin(request)
  if (!requestOrigin) return
  if (!allowedOrigins.includes(requestOrigin)) {
    throw new HttpError('origin is not allowed', 403)
  }
}

export async function readJson<T>(request: IncomingMessage): Promise<T> {
  const method = (request.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = request.headers['content-type']?.split(';')[0]?.trim().toLowerCase()
    if (contentType && !JSON_CONTENT_TYPES.has(contentType)) {
      throw new HttpError('Content-Type must be application/json', 415)
    }
  }

  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length

    if (totalBytes > MAX_JSON_BODY_BYTES) {
      throw new HttpError('request body exceeds 1 MB limit', 413)
    }

    chunks.push(buffer)
  }

  const raw = Buffer.concat(chunks).toString('utf8')

  if (!raw) {
    return {} as T
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    throw new HttpError('invalid JSON body', 400)
  }
}

export function json(response: ServerResponse, request: IncomingMessage, allowedOrigins: string[], statusCode: number, payload: unknown) {
  const body = JSON.stringify(payload)
  const cors = buildCorsHeaders(request, allowedOrigins)
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    ...(cors['Access-Control-Allow-Origin'] ? { 'Access-Control-Allow-Origin': cors['Access-Control-Allow-Origin'] } : {}),
    'Access-Control-Allow-Methods': cors['Access-Control-Allow-Methods'],
    'Access-Control-Allow-Headers': cors['Access-Control-Allow-Headers'],
    Vary: cors.Vary,
  })
  response.end(body)
}

export function writeSseHeaders(response: ServerResponse, request: IncomingMessage, allowedOrigins: string[]) {
  const cors = buildCorsHeaders(request, allowedOrigins)
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    ...(cors['Access-Control-Allow-Origin'] ? { 'Access-Control-Allow-Origin': cors['Access-Control-Allow-Origin'] } : {}),
    'Access-Control-Allow-Methods': cors['Access-Control-Allow-Methods'],
    'Access-Control-Allow-Headers': cors['Access-Control-Allow-Headers'],
    Vary: cors.Vary,
  })
}

export function notFound(response: ServerResponse, request: IncomingMessage, allowedOrigins: string[]) {
  json(response, request, allowedOrigins, 404, { error: 'Not found' })
}

export function badRequest(response: ServerResponse, request: IncomingMessage, allowedOrigins: string[], message: string) {
  json(response, request, allowedOrigins, 400, { error: message })
}

export function internalServerError(response: ServerResponse, request: IncomingMessage, allowedOrigins: string[]) {
  json(response, request, allowedOrigins, 500, { error: 'Internal server error' })
}

export function conflict(response: ServerResponse, request: IncomingMessage, allowedOrigins: string[], code: string, message: string, details?: unknown) {
  json(response, request, allowedOrigins, 409, { ok: false, code, message, ...(details !== undefined ? { details } : {}) })
}
