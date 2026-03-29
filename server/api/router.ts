import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ChatModeId, TaskStage, TaskStatus } from '../domain/models.js'
import { HttpError, badRequest, internalServerError, json, notFound, readJson } from './http.js'
import { ActivityRepository } from '../application/repositories.js'
import { ChatService, NotesService, StatusService, TasksService } from '../application/services.js'

interface Services {
  chatService: ChatService
  notesService: NotesService
  tasksService: TasksService
  statusService: StatusService
  activityRepository: ActivityRepository
}

const allowedTaskStatuses: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done']
const allowedTaskStages: TaskStage[] = ['queued', 'inspecting', 'editing', 'validating', 'committing', 'pushing', 'done']

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
        const [status, runtime, messages, notes, tasks, activity] = await Promise.all([
          services.statusService.snapshot(),
          services.statusService.runtimeContext(),
          services.chatService.list(),
          services.notesService.list(),
          services.tasksService.list(),
          services.activityRepository.list(8),
        ])
        json(response, 200, { status, runtime, messages, notes, tasks, activity })
        return
      }

      if (method === 'GET' && url.pathname === '/api/status') {
        json(response, 200, await services.statusService.snapshot())
        return
      }

      if (method === 'GET' && url.pathname === '/api/runtime/context') {
        json(response, 200, await services.statusService.runtimeContext())
        return
      }

      if (method === 'GET' && url.pathname === '/api/activity') {
        json(response, 200, await services.activityRepository.list(12))
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
        const body = await readJson<{
          title?: string
          owner?: string
          due?: string
          status?: TaskStatus
          stage?: TaskStage
          lane?: string
          summary?: string
          needsUserInput?: boolean
          readyToReport?: boolean
          blockedReason?: string
          waitingFor?: string
        }>(request)
        if (!body.title?.trim() || !body.owner?.trim() || !body.due?.trim() || !body.lane?.trim()) {
          return badRequest(response, 'title, owner, due, and lane are required')
        }
        const status = body.status && allowedTaskStatuses.includes(body.status) ? body.status : 'Queued'
        const stage = body.stage && allowedTaskStages.includes(body.stage) ? body.stage : undefined
        json(
          response,
          201,
          await services.tasksService.create({
            title: body.title,
            owner: body.owner,
            due: body.due,
            status,
            stage,
            lane: body.lane,
            summary: body.summary?.trim() || undefined,
            needsUserInput: body.needsUserInput === true,
            readyToReport: body.readyToReport === true,
            blockedReason: body.blockedReason?.trim() || undefined,
            waitingFor: body.waitingFor?.trim() || undefined,
          }),
        )
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/tasks/')) {
        const taskId = url.pathname.split('/').at(-1)
        if (!taskId) return badRequest(response, 'taskId is required')
        const body = await readJson<{
          status?: TaskStatus
          stage?: TaskStage
          summary?: string
          needsUserInput?: boolean
          readyToReport?: boolean
          blockedReason?: string
          waitingFor?: string
        }>(request)
        const patch: {
          status?: TaskStatus
          stage?: TaskStage
          summary?: string
          needsUserInput?: boolean
          readyToReport?: boolean
          blockedReason?: string
          waitingFor?: string
        } = {}

        if (body.status !== undefined) {
          if (!allowedTaskStatuses.includes(body.status)) return badRequest(response, 'valid status is required')
          patch.status = body.status
        }

        if (body.stage !== undefined) {
          if (!allowedTaskStages.includes(body.stage)) return badRequest(response, 'valid stage is required')
          patch.stage = body.stage
        }

        if (body.summary !== undefined) {
          patch.summary = body.summary.trim() || undefined
        }

        if (body.needsUserInput !== undefined) {
          patch.needsUserInput = body.needsUserInput === true
        }

        if (body.readyToReport !== undefined) {
          patch.readyToReport = body.readyToReport === true
        }

        if (body.blockedReason !== undefined) {
          patch.blockedReason = body.blockedReason.trim() || undefined
        }

        if (body.waitingFor !== undefined) {
          patch.waitingFor = body.waitingFor.trim() || undefined
        }

        if (Object.keys(patch).length === 0) {
          return badRequest(response, 'at least one valid task field is required')
        }

        const updated = await services.tasksService.update(taskId, patch)
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
