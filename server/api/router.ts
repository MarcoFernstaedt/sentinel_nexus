import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ChatModeId, TaskStatus } from '../domain/models.js'
import { HttpError, badRequest, internalServerError, json, notFound, readJson } from './http.js'
import { ChatService, NotesService, StatusService, TasksService } from '../application/services.js'

interface Services {
  chatService: ChatService
  notesService: NotesService
  tasksService: TasksService
  statusService: StatusService
}

const allowedTaskStatuses: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done']

export function createRouter(services: Services) {
  return async function route(request: IncomingMessage, response: ServerResponse) {
    try {
      const method = request.method ?? 'GET'
      const url = new URL(request.url ?? '/', 'http://localhost')

      if (method === 'OPTIONS') {
        json(response, 204, {})
        return
      }

      if (method === 'GET' && url.pathname === '/health') {
        json(response, 200, { ok: true })
        return
      }

      if (method === 'GET' && url.pathname === '/api/bootstrap') {
        const [status, messages, notes, tasks] = await Promise.all([
          services.statusService.snapshot(),
          services.chatService.list(),
          services.notesService.list(),
          services.tasksService.list(),
        ])
        json(response, 200, { status, messages, notes, tasks })
        return
      }

      if (method === 'GET' && url.pathname === '/api/status') {
        json(response, 200, await services.statusService.snapshot())
        return
      }

      if (method === 'GET' && url.pathname === '/api/chat/messages') {
        json(response, 200, await services.chatService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/chat/messages') {
        const body = await readJson<{ body?: string; modeId?: ChatModeId; author?: string }>(request)
        if (!body.body?.trim()) return badRequest(response, 'body is required')
        if (!body.modeId) return badRequest(response, 'modeId is required')
        json(response, 201, await services.chatService.submit({ body: body.body, modeId: body.modeId, author: body.author }))
        return
      }

      if (method === 'GET' && url.pathname === '/api/notes') {
        json(response, 200, await services.notesService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/notes') {
        const body = await readJson<{ title?: string; body?: string; tag?: string }>(request)
        if (!body.title?.trim() || !body.body?.trim()) return badRequest(response, 'title and body are required')
        json(response, 201, await services.notesService.create({ title: body.title, body: body.body, tag: body.tag ?? 'general' }))
        return
      }

      if (method === 'GET' && url.pathname === '/api/tasks') {
        json(response, 200, await services.tasksService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/tasks') {
        const body = await readJson<{ title?: string; owner?: string; due?: string; status?: TaskStatus; lane?: string }>(request)
        if (!body.title?.trim() || !body.owner?.trim() || !body.due?.trim() || !body.lane?.trim()) {
          return badRequest(response, 'title, owner, due, and lane are required')
        }
        const status = body.status && allowedTaskStatuses.includes(body.status) ? body.status : 'Queued'
        json(response, 201, await services.tasksService.create({ title: body.title, owner: body.owner, due: body.due, status, lane: body.lane }))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/tasks/')) {
        const taskId = url.pathname.split('/').at(-1)
        if (!taskId) return badRequest(response, 'taskId is required')
        const body = await readJson<{ status?: TaskStatus }>(request)
        if (!body.status || !allowedTaskStatuses.includes(body.status)) {
          return badRequest(response, 'valid status is required')
        }
        const updated = await services.tasksService.update(taskId, { status: body.status })
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      notFound(response)
    } catch (error) {
      if (error instanceof HttpError) {
        json(response, error.statusCode, { error: error.message })
        return
      }

      console.error('Nexus API route failed', error)
      internalServerError(response)
    }
  }
}
