import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CalendarEventRecord, ChatModeId, MemoryRecord, ProjectRecord, TaskRecord, TaskStage, TaskStatus, TeamMemberRecord } from '../domain/models.js'
import { ConflictError, HttpError, ValidationError, badRequest, internalServerError, json, notFound, readJson } from './http.js'
import { ActivityRepository } from '../application/repositories.js'
import { ChatService, MissionCommandService, NotesService, StatusService, TasksService } from '../application/services.js'

interface Services {
  chatService: ChatService
  notesService: NotesService
  tasksService: TasksService
  statusService: StatusService
  missionCommandService: MissionCommandService
  activityRepository: ActivityRepository
}

const allowedTaskStatuses: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done']
const allowedTaskStages: TaskStage[] = ['queued', 'inspecting', 'editing', 'validating', 'committing', 'pushing', 'done']

function writeSseEvent(response: ServerResponse, event: string, payload: unknown) {
  response.write(`event: ${event}\n`)
  response.write(`data: ${JSON.stringify(payload)}\n\n`)
}

async function createRuntimeEventSnapshot(services: Services) {
  const [status, runtime, messages, notes, tasks, activity, missionCommand] = await Promise.all([
    services.statusService.snapshot(),
    services.statusService.runtimeContext(),
    services.chatService.list(),
    services.notesService.list(),
    services.tasksService.list(),
    services.activityRepository.list(8),
    services.statusService.missionCommand(),
  ])

  return {
    event: 'bootstrap' as const,
    capturedAt: new Date().toISOString(),
    status,
    runtime,
    messages,
    notes,
    tasks,
    activity,
    missionCommand,
  }
}

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
        const [status, runtime, messages, notes, tasks, activity, missionCommand] = await Promise.all([
          services.statusService.snapshot(),
          services.statusService.runtimeContext(),
          services.chatService.list(),
          services.notesService.list(),
          services.tasksService.list(),
          services.activityRepository.list(8),
          services.statusService.missionCommand(),
        ])
        json(response, 200, { status, runtime, messages, notes, tasks, activity, missionCommand })
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

      if (method === 'GET' && url.pathname === '/api/runtime/events') {
        response.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Accel-Buffering': 'no',
        })
        response.flushHeaders?.()

        let closed = false
        let lastPayload = ''

        const publishSnapshot = async () => {
          const snapshot = await createRuntimeEventSnapshot(services)
          const nextPayload = JSON.stringify(snapshot)
          if (nextPayload === lastPayload) return
          lastPayload = nextPayload
          writeSseEvent(response, 'bootstrap', snapshot)
        }

        const heartbeat = setInterval(() => {
          if (!closed) response.write(': keepalive\n\n')
        }, 15000)

        const poller = setInterval(() => {
          void publishSnapshot().catch(() => {
            if (closed) return
            writeSseEvent(response, 'error', { message: 'runtime snapshot failed' })
          })
        }, 2000)

        request.on('close', () => {
          closed = true
          clearInterval(heartbeat)
          clearInterval(poller)
          response.end()
        })

        await publishSnapshot()
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
          needsApproval?: boolean
          assignedBy?: string
          readyToReport?: boolean
          blockedReason?: string
          waitingFor?: string
        }>(request)
        if (!body.title?.trim() || !body.owner?.trim() || !body.due?.trim() || !body.lane?.trim()) {
          return badRequest(response, 'title, owner, due, and lane are required')
        }
        const status = body.status && allowedTaskStatuses.includes(body.status) ? body.status : 'Queued'
        const stage = body.stage && allowedTaskStages.includes(body.stage) ? body.stage : undefined
        const createInput = {
          title: body.title,
          owner: body.owner,
          due: body.due,
          status,
          lane: body.lane,
          summary: body.summary?.trim() || undefined,
          needsUserInput: body.needsUserInput === true,
          needsApproval: body.needsApproval === true,
          assignedBy: body.assignedBy?.trim() || undefined,
          readyToReport: body.readyToReport === true,
          blockedReason: body.blockedReason?.trim() || undefined,
          waitingFor: body.waitingFor?.trim() || undefined,
          ...(stage !== undefined ? { stage } : {}),
        } as Parameters<typeof services.tasksService.create>[0]
        json(response, 201, await services.tasksService.create(createInput))
        return
      }

      if (method === 'POST' && url.pathname.match(/^\/api\/tasks\/[^/]+\/approve$/)) {
        const taskId = url.pathname.split('/')[3]
        if (!taskId) return badRequest(response, 'taskId is required')
        const updated = await services.tasksService.approve(taskId)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'POST' && url.pathname.match(/^\/api\/tasks\/[^/]+\/reject$/)) {
        const taskId = url.pathname.split('/')[3]
        if (!taskId) return badRequest(response, 'taskId is required')
        const body = await readJson<{ reason?: string }>(request)
        const updated = await services.tasksService.reject(taskId, body.reason?.trim() || undefined)
        if (!updated) return notFound(response)
        json(response, 200, updated)
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
          needsApproval?: boolean
          readyToReport?: boolean
          blockedReason?: string
          waitingFor?: string
        }>(request)
        const patch: Partial<TaskRecord> = {}

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

        if (body.needsApproval !== undefined) {
          patch.needsApproval = body.needsApproval === true
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

      if (method === 'PATCH' && url.pathname === '/api/mission') {
        const body = await readJson<{ progressPercent?: number; commandIntent?: string }>(request)
        const patch: { progressPercent?: number; commandIntent?: string } = {}
        if (body.progressPercent !== undefined) {
          const pct = Number(body.progressPercent)
          if (Number.isNaN(pct) || pct < 0 || pct > 100) return badRequest(response, 'progressPercent must be 0-100')
          patch.progressPercent = pct
        }
        if (body.commandIntent !== undefined) patch.commandIntent = body.commandIntent.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, 'at least one field required')
        json(response, 200, await services.missionCommandService.patchMission(patch))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/projects/')) {
        const projectId = url.pathname.split('/').at(-1)
        if (!projectId) return badRequest(response, 'projectId is required')
        const body = await readJson<{ status?: string; progressPercent?: number; objective?: string }>(request)
        const patch: Partial<ProjectRecord> = {}
        const allowedProjectStatuses: ProjectRecord['status'][] = ['active', 'watch', 'blocked', 'parked', 'done']
        if (body.status !== undefined) {
          if (!allowedProjectStatuses.includes(body.status as ProjectRecord['status'])) return badRequest(response, `status must be one of: ${allowedProjectStatuses.join(', ')}`)
          patch.status = body.status as ProjectRecord['status']
        }
        if (body.progressPercent !== undefined) {
          const pct = Number(body.progressPercent)
          if (Number.isNaN(pct) || pct < 0 || pct > 100) return badRequest(response, 'progressPercent must be 0-100')
          patch.progressPercent = pct
        }
        if (body.objective !== undefined) patch.objective = body.objective.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, 'at least one field required')
        const updated = await services.missionCommandService.patchProject(projectId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/team/')) {
        const memberId = url.pathname.split('/').at(-1)
        if (!memberId) return badRequest(response, 'memberId is required')
        const body = await readJson<{ status?: string; focus?: string }>(request)
        const patch: Partial<TeamMemberRecord> = {}
        const allowedMemberStatuses: TeamMemberRecord['status'][] = ['active', 'limited-visibility', 'offline']
        if (body.status !== undefined) {
          if (!allowedMemberStatuses.includes(body.status as TeamMemberRecord['status'])) return badRequest(response, `status must be one of: ${allowedMemberStatuses.join(', ')}`)
          patch.status = body.status as TeamMemberRecord['status']
        }
        if (body.focus !== undefined) patch.focus = body.focus.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, 'at least one field required')
        const updated = await services.missionCommandService.patchTeamMember(memberId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'POST' && url.pathname === '/api/calendar') {
        const body = await readJson<{ title?: string; type?: CalendarEventRecord['type']; startsAt?: string; owner?: string; detail?: string; endsAt?: string; relatedProjectId?: string }>(request)
        if (!body.title?.trim() || !body.type || !body.startsAt?.trim() || !body.owner?.trim()) {
          return badRequest(response, 'title, type, startsAt, and owner are required')
        }
        const allowedEventTypes: CalendarEventRecord['type'][] = ['task', 'meeting', 'deadline', 'routine']
        if (!allowedEventTypes.includes(body.type)) return badRequest(response, `type must be one of: ${allowedEventTypes.join(', ')}`)
        json(response, 201, await services.missionCommandService.createCalendarEvent({
          title: body.title,
          type: body.type,
          startsAt: body.startsAt,
          owner: body.owner,
          detail: body.detail?.trim() ?? '',
          endsAt: body.endsAt,
          relatedProjectId: body.relatedProjectId,
        }))
        return
      }

      if (method === 'POST' && url.pathname === '/api/memories') {
        const body = await readJson<{ title?: string; summary?: string; kind?: MemoryRecord['kind']; tags?: string[] }>(request)
        if (!body.title?.trim() || !body.summary?.trim()) return badRequest(response, 'title and summary are required')
        const allowedKinds: MemoryRecord['kind'][] = ['working-memory', 'long-term-memory']
        if (body.kind && !allowedKinds.includes(body.kind)) return badRequest(response, `kind must be one of: ${allowedKinds.join(', ')}`)
        json(response, 201, await services.missionCommandService.createMemory({
          title: body.title,
          summary: body.summary,
          kind: body.kind,
          tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
        }))
        return
      }

      if (method === 'POST' && url.pathname === '/api/activity') {
        const body = await readJson<{ title?: string; detail?: string; type?: string }>(request)
        if (!body.title?.trim()) return badRequest(response, 'title is required')
        const allowedTypes = ['chat', 'task', 'note', 'status']
        const entryType = body.type && allowedTypes.includes(body.type) ? body.type as 'chat' | 'task' | 'note' | 'status' : 'status'
        const entry = await services.activityRepository.append({
          id: `activity-${crypto.randomUUID()}`,
          type: entryType,
          title: body.title.trim(),
          detail: body.detail?.trim() ?? '',
          timestamp: new Date().toISOString(),
          status: 'logged',
          source: 'runtime',
        })
        json(response, 201, entry)
        return
      }

      notFound(response)
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        console.warn(`[nexus:reject] ${request.method ?? 'GET'} ${request.url ?? '/'} — ${error.code} — ${error.message}`)
        json(response, error.statusCode, {
          ok: false,
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        })
        return
      }

      if (error instanceof HttpError) {
        json(response, error.statusCode, { error: error.message })
        return
      }

      console.error('Nexus API route failed', error)
      internalServerError(response)
    }
  }
}
