import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_JSON_BODY_BYTES = 1024 * 1024

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

export async function readJson<T>(request: IncomingMessage): Promise<T> {
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

export function json(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(JSON.stringify(payload))
}

export function notFound(response: ServerResponse) {
  json(response, 404, { error: 'Not found' })
}

export function badRequest(response: ServerResponse, message: string) {
  json(response, 400, { error: message })
}

export function internalServerError(response: ServerResponse) {
  json(response, 500, { error: 'Internal server error' })
}

export function conflict(response: ServerResponse, code: string, message: string, details?: unknown) {
  json(response, 409, { ok: false, code, message, ...(details !== undefined ? { details } : {}) })
}
