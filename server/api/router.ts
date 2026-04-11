import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CalendarEventRecord, ChatModeId, MemoryRecord, NexusClientRecord, NexusProjectRecord, NexusTaskRecord, ProjectRecord, TaskRecord, TaskStage, TaskStatus, TeamMemberRecord, TrackedTargetRecord } from '../domain/models.js'
import { ConflictError, HttpError, ValidationError, assertOriginAllowed, badRequest, internalServerError, json, notFound, readJson, writeSseHeaders } from './http.js'
import { ActivityRepository } from '../application/repositories.js'
import { ChatService, MissionCommandService, NexusClientsService, NexusProjectsService, NexusTasksService, NotesService, StatusService, TasksService, TrackedTargetsService } from '../application/services.js'

interface Services {
  chatService: ChatService
  notesService: NotesService
  tasksService: TasksService
  statusService: StatusService
  missionCommandService: MissionCommandService
  activityRepository: ActivityRepository
  trackedTargetsService: TrackedTargetsService
  nexusClientsService: NexusClientsService
  nexusProjectsService: NexusProjectsService
  nexusTasksService: NexusTasksService
}

interface RouterOptions {
  allowedOrigins: string[]
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

export function createRouter(services: Services, options: RouterOptions) {
  return async function route(request: IncomingMessage, response: ServerResponse) {
    try {
      const method = request.method ?? 'GET'
      const url = new URL(request.url ?? '/', 'http://localhost')

      if (method === 'OPTIONS') {
        assertOriginAllowed(request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 204, {})
        return
      }

      assertOriginAllowed(request, options.allowedOrigins)

      if (method === 'GET' && url.pathname === '/health') {
        json(response, request, options.allowedOrigins, 200, { ok: true })
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
        json(response, request, options.allowedOrigins, 200, { status, runtime, messages, notes, tasks, activity, missionCommand })
        return
      }

      if (method === 'GET' && url.pathname === '/api/status') {
        json(response, request, options.allowedOrigins, 200, await services.statusService.snapshot())
        return
      }

      if (method === 'GET' && url.pathname === '/api/runtime/context') {
        json(response, request, options.allowedOrigins, 200, await services.statusService.runtimeContext())
        return
      }

      if (method === 'GET' && url.pathname === '/api/runtime/events') {
        writeSseHeaders(response, request, options.allowedOrigins)
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
        json(response, request, options.allowedOrigins, 200, await services.activityRepository.list(12))
        return
      }

      if (method === 'GET' && url.pathname === '/api/chat/messages') {
        json(response, request, options.allowedOrigins, 200, await services.chatService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/chat/messages') {
        const body = await readJson<{ body?: string; modeId?: ChatModeId; author?: string }>(request)
        if (!body.body?.trim()) return badRequest(response, request, options.allowedOrigins, 'body is required')
        if (!body.modeId) return badRequest(response, request, options.allowedOrigins, 'modeId is required')
        json(response, request, options.allowedOrigins, 201, await services.chatService.submit({ body: body.body, modeId: body.modeId, author: body.author }))
        return
      }

      if (method === 'GET' && url.pathname === '/api/notes') {
        json(response, request, options.allowedOrigins, 200, await services.notesService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/notes') {
        const body = await readJson<{ title?: string; body?: string; tag?: string }>(request)
        if (!body.title?.trim() || !body.body?.trim()) return badRequest(response, request, options.allowedOrigins, 'title and body are required')
        json(response, request, options.allowedOrigins, 201, await services.notesService.create({ title: body.title, body: body.body, tag: body.tag ?? 'general' }))
        return
      }

      if (method === 'GET' && url.pathname === '/api/tasks') {
        json(response, request, options.allowedOrigins, 200, await services.tasksService.list())
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
          return badRequest(response, request, options.allowedOrigins, 'title, owner, due, and lane are required')
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
        json(response, request, options.allowedOrigins, 201, await services.tasksService.create(createInput))
        return
      }

      if (method === 'POST' && url.pathname.match(/^\/api\/tasks\/[^/]+\/approve$/)) {
        const taskId = url.pathname.split('/')[3]
        if (!taskId) return badRequest(response, request, options.allowedOrigins, 'taskId is required')
        const updated = await services.tasksService.approve(taskId)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'POST' && url.pathname.match(/^\/api\/tasks\/[^/]+\/reject$/)) {
        const taskId = url.pathname.split('/')[3]
        if (!taskId) return badRequest(response, request, options.allowedOrigins, 'taskId is required')
        const body = await readJson<{ reason?: string }>(request)
        const updated = await services.tasksService.reject(taskId, body.reason?.trim() || undefined)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/tasks/')) {
        const taskId = url.pathname.split('/').at(-1)
        if (!taskId) return badRequest(response, request, options.allowedOrigins, 'taskId is required')
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
          if (!allowedTaskStatuses.includes(body.status)) return badRequest(response, request, options.allowedOrigins, 'valid status is required')
          patch.status = body.status
        }

        if (body.stage !== undefined) {
          if (!allowedTaskStages.includes(body.stage)) return badRequest(response, request, options.allowedOrigins, 'valid stage is required')
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
          return badRequest(response, request, options.allowedOrigins, 'at least one valid task field is required')
        }

        const updated = await services.tasksService.update(taskId, patch)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'PATCH' && url.pathname === '/api/mission') {
        const body = await readJson<{ progressPercent?: number; commandIntent?: string }>(request)
        const patch: { progressPercent?: number; commandIntent?: string } = {}
        if (body.progressPercent !== undefined) {
          const pct = Number(body.progressPercent)
          if (Number.isNaN(pct) || pct < 0 || pct > 100) return badRequest(response, request, options.allowedOrigins, 'progressPercent must be 0-100')
          patch.progressPercent = pct
        }
        if (body.commandIntent !== undefined) patch.commandIntent = body.commandIntent.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, request, options.allowedOrigins, 'at least one field required')
        json(response, request, options.allowedOrigins, 200, await services.missionCommandService.patchMission(patch))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/projects/')) {
        const projectId = url.pathname.split('/').at(-1)
        if (!projectId) return badRequest(response, request, options.allowedOrigins, 'projectId is required')
        const body = await readJson<{ status?: string; progressPercent?: number; objective?: string }>(request)
        const patch: Partial<ProjectRecord> = {}
        const allowedProjectStatuses: ProjectRecord['status'][] = ['active', 'watch', 'blocked', 'parked', 'done']
        if (body.status !== undefined) {
          if (!allowedProjectStatuses.includes(body.status as ProjectRecord['status'])) return badRequest(response, request, options.allowedOrigins, `status must be one of: ${allowedProjectStatuses.join(', ')}`)
          patch.status = body.status as ProjectRecord['status']
        }
        if (body.progressPercent !== undefined) {
          const pct = Number(body.progressPercent)
          if (Number.isNaN(pct) || pct < 0 || pct > 100) return badRequest(response, request, options.allowedOrigins, 'progressPercent must be 0-100')
          patch.progressPercent = pct
        }
        if (body.objective !== undefined) patch.objective = body.objective.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, request, options.allowedOrigins, 'at least one field required')
        const updated = await services.missionCommandService.patchProject(projectId, patch)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/team/')) {
        const memberId = url.pathname.split('/').at(-1)
        if (!memberId) return badRequest(response, request, options.allowedOrigins, 'memberId is required')
        const body = await readJson<{ status?: string; focus?: string }>(request)
        const patch: Partial<TeamMemberRecord> = {}
        const allowedMemberStatuses: TeamMemberRecord['status'][] = ['active', 'limited-visibility', 'offline']
        if (body.status !== undefined) {
          if (!allowedMemberStatuses.includes(body.status as TeamMemberRecord['status'])) return badRequest(response, request, options.allowedOrigins, `status must be one of: ${allowedMemberStatuses.join(', ')}`)
          patch.status = body.status as TeamMemberRecord['status']
        }
        if (body.focus !== undefined) patch.focus = body.focus.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, request, options.allowedOrigins, 'at least one field required')
        const updated = await services.missionCommandService.patchTeamMember(memberId, patch)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'POST' && url.pathname === '/api/calendar') {
        const body = await readJson<{ title?: string; type?: CalendarEventRecord['type']; startsAt?: string; owner?: string; detail?: string; endsAt?: string; relatedProjectId?: string }>(request)
        if (!body.title?.trim() || !body.type || !body.startsAt?.trim() || !body.owner?.trim()) {
          return badRequest(response, request, options.allowedOrigins, 'title, type, startsAt, and owner are required')
        }
        const allowedEventTypes: CalendarEventRecord['type'][] = ['task', 'meeting', 'deadline', 'routine']
        if (!allowedEventTypes.includes(body.type)) return badRequest(response, request, options.allowedOrigins, `type must be one of: ${allowedEventTypes.join(', ')}`)
        json(response, request, options.allowedOrigins, 201, await services.missionCommandService.createCalendarEvent({
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
        if (!body.title?.trim() || !body.summary?.trim()) return badRequest(response, request, options.allowedOrigins, 'title and summary are required')
        const allowedKinds: MemoryRecord['kind'][] = ['working-memory', 'long-term-memory']
        if (body.kind && !allowedKinds.includes(body.kind)) return badRequest(response, request, options.allowedOrigins, `kind must be one of: ${allowedKinds.join(', ')}`)
        json(response, request, options.allowedOrigins, 201, await services.missionCommandService.createMemory({
          title: body.title,
          summary: body.summary,
          kind: body.kind,
          tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
        }))
        return
      }

      if (method === 'GET' && url.pathname === '/api/tracked-targets') {
        json(response, request, options.allowedOrigins, 200, await services.trackedTargetsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/tracked-targets/bulk') {
        const body = await readJson<{ targets?: unknown[] }>(request)
        if (!Array.isArray(body.targets)) return badRequest(response, request, options.allowedOrigins, 'targets array is required')
        await services.trackedTargetsService.bulkWrite(body.targets as TrackedTargetRecord[])
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      if (method === 'POST' && url.pathname === '/api/tracked-targets') {
        const body = await readJson<Partial<TrackedTargetRecord>>(request)
        if (!body.id?.trim() || !body.title?.trim()) return badRequest(response, request, options.allowedOrigins, 'id and title are required')
        json(response, request, options.allowedOrigins, 200, await services.trackedTargetsService.upsert(body as TrackedTargetRecord))
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/tracked-targets/')) {
        const targetId = url.pathname.split('/').at(-1)
        if (!targetId) return badRequest(response, request, options.allowedOrigins, 'targetId is required')
        await services.trackedTargetsService.delete(targetId)
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      if (method === 'POST' && url.pathname === '/api/activity') {
        const body = await readJson<{ title?: string; detail?: string; type?: string }>(request)
        if (!body.title?.trim()) return badRequest(response, request, options.allowedOrigins, 'title is required')
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
        json(response, request, options.allowedOrigins, 201, entry)
        return
      }

      // ── /api/exec/clients ──────────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/exec/clients') {
        json(response, request, options.allowedOrigins, 200, await services.nexusClientsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/exec/clients') {
        const body = await readJson<Partial<NexusClientRecord>>(request)
        if (!body.name?.trim()) return badRequest(response, request, options.allowedOrigins, 'name is required')
        const allowedClientStatuses: NexusClientRecord['status'][] = ['active', 'paused', 'closed']
        const status = body.status && allowedClientStatuses.includes(body.status) ? body.status : 'active'
        json(response, request, options.allowedOrigins, 201, await services.nexusClientsService.create({
          name: body.name.trim(),
          status,
          contactName: body.contactName?.trim(),
          contactEmail: body.contactEmail?.trim(),
          notes: body.notes?.trim(),
        }))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/exec/clients/')) {
        const clientId = url.pathname.split('/').at(-1)
        if (!clientId) return badRequest(response, request, options.allowedOrigins, 'clientId is required')
        const body = await readJson<Partial<NexusClientRecord>>(request)
        const patch: Partial<NexusClientRecord> = {}
        if (body.name !== undefined) patch.name = body.name.trim()
        if (body.status !== undefined) patch.status = body.status
        if (body.contactName !== undefined) patch.contactName = body.contactName.trim() || undefined
        if (body.contactEmail !== undefined) patch.contactEmail = body.contactEmail.trim() || undefined
        if (body.notes !== undefined) patch.notes = body.notes.trim() || undefined
        if (Object.keys(patch).length === 0) return badRequest(response, request, options.allowedOrigins, 'at least one field required')
        const updated = await services.nexusClientsService.patch(clientId, patch)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/exec/clients/')) {
        const clientId = url.pathname.split('/').at(-1)
        if (!clientId) return badRequest(response, request, options.allowedOrigins, 'clientId is required')
        await services.nexusClientsService.delete(clientId)
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      // ── /api/exec/projects ─────────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/exec/projects') {
        json(response, request, options.allowedOrigins, 200, await services.nexusProjectsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/exec/projects/bulk') {
        const body = await readJson<{ projects?: unknown[] }>(request)
        if (!Array.isArray(body.projects)) return badRequest(response, request, options.allowedOrigins, 'projects array is required')
        await services.nexusProjectsService.bulkWrite(body.projects as NexusProjectRecord[])
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      if (method === 'POST' && url.pathname === '/api/exec/projects') {
        const body = await readJson<Partial<NexusProjectRecord>>(request)
        if (!body.title?.trim()) return badRequest(response, request, options.allowedOrigins, 'title is required')
        const allowedStatuses: NexusProjectRecord['status'][] = ['todo', 'in-progress', 'blocked', 'completed']
        const allowedPriorities: NexusProjectRecord['priority'][] = ['critical', 'high', 'medium', 'low']
        json(response, request, options.allowedOrigins, 201, await services.nexusProjectsService.create({
          title: body.title.trim(),
          description: body.description?.trim() ?? '',
          status: body.status && allowedStatuses.includes(body.status) ? body.status : 'todo',
          priority: body.priority && allowedPriorities.includes(body.priority) ? body.priority : 'medium',
          clientId: body.clientId?.trim() || undefined,
          ownerAgent: body.ownerAgent?.trim() ?? 'operator',
          assignedSubAgents: Array.isArray(body.assignedSubAgents) ? body.assignedSubAgents : [],
          dueDate: body.dueDate?.trim() || undefined,
          notes: body.notes?.trim() || undefined,
          linkedDocs: Array.isArray(body.linkedDocs) ? body.linkedDocs : [],
          linkedMemories: Array.isArray(body.linkedMemories) ? body.linkedMemories : [],
          relatedCalendarItems: Array.isArray(body.relatedCalendarItems) ? body.relatedCalendarItems : [],
          tags: Array.isArray(body.tags) ? body.tags : [],
        }))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/exec/projects/')) {
        const projectId = url.pathname.split('/').at(-1)
        if (!projectId) return badRequest(response, request, options.allowedOrigins, 'projectId is required')
        const body = await readJson<Partial<NexusProjectRecord>>(request)
        const patch: Partial<NexusProjectRecord> = {}
        const allowedStatuses: NexusProjectRecord['status'][] = ['todo', 'in-progress', 'blocked', 'completed']
        const allowedPriorities: NexusProjectRecord['priority'][] = ['critical', 'high', 'medium', 'low']
        if (body.title !== undefined) patch.title = body.title.trim()
        if (body.description !== undefined) patch.description = body.description.trim()
        if (body.status !== undefined) {
          if (!allowedStatuses.includes(body.status)) return badRequest(response, request, options.allowedOrigins, `status must be one of: ${allowedStatuses.join(', ')}`)
          patch.status = body.status
        }
        if (body.priority !== undefined) {
          if (!allowedPriorities.includes(body.priority)) return badRequest(response, request, options.allowedOrigins, `priority must be one of: ${allowedPriorities.join(', ')}`)
          patch.priority = body.priority
        }
        if (body.clientId !== undefined) patch.clientId = body.clientId.trim() || undefined
        if (body.ownerAgent !== undefined) patch.ownerAgent = body.ownerAgent.trim()
        if (body.percentComplete !== undefined) {
          const pct = Number(body.percentComplete)
          if (!Number.isNaN(pct)) patch.percentComplete = Math.max(0, Math.min(100, pct))
        }
        if (body.dueDate !== undefined) patch.dueDate = body.dueDate.trim() || undefined
        if (body.notes !== undefined) patch.notes = body.notes.trim() || undefined
        if (body.tags !== undefined) patch.tags = Array.isArray(body.tags) ? body.tags : []
        if (Object.keys(patch).length === 0) return badRequest(response, request, options.allowedOrigins, 'at least one field required')
        const updated = await services.nexusProjectsService.patch(projectId, patch)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/exec/projects/')) {
        const projectId = url.pathname.split('/').at(-1)
        if (!projectId) return badRequest(response, request, options.allowedOrigins, 'projectId is required')
        await services.nexusProjectsService.delete(projectId)
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      // ── /api/exec/tasks ────────────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/exec/tasks') {
        const projectId = url.searchParams.get('projectId')
        const results = projectId
          ? await services.nexusTasksService.listByProject(projectId)
          : await services.nexusTasksService.list()
        json(response, request, options.allowedOrigins, 200, results)
        return
      }

      if (method === 'POST' && url.pathname === '/api/exec/tasks/bulk') {
        const body = await readJson<{ tasks?: unknown[] }>(request)
        if (!Array.isArray(body.tasks)) return badRequest(response, request, options.allowedOrigins, 'tasks array is required')
        await services.nexusTasksService.bulkWrite(body.tasks as NexusTaskRecord[])
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      if (method === 'POST' && url.pathname === '/api/exec/tasks') {
        const body = await readJson<Partial<NexusTaskRecord>>(request)
        if (!body.title?.trim()) return badRequest(response, request, options.allowedOrigins, 'title is required')
        const allowedStatuses: NexusTaskRecord['status'][] = ['todo', 'in-progress', 'blocked', 'completed']
        json(response, request, options.allowedOrigins, 201, await services.nexusTasksService.create({
          title: body.title.trim(),
          description: body.description?.trim() ?? '',
          status: body.status && allowedStatuses.includes(body.status) ? body.status : 'todo',
          projectId: body.projectId?.trim() || undefined,
          clientId: body.clientId?.trim() || undefined,
          assignedAgent: body.assignedAgent?.trim() ?? 'operator',
          assignedSubAgent: body.assignedSubAgent?.trim() || undefined,
          percentComplete: typeof body.percentComplete === 'number' ? body.percentComplete : 0,
          dueDate: body.dueDate?.trim() || undefined,
          notes: body.notes?.trim() ?? '',
          dependencies: Array.isArray(body.dependencies) ? body.dependencies : [],
          completionDetails: body.completionDetails?.trim() || undefined,
          taskReason: body.taskReason?.trim() ?? '',
          tags: Array.isArray(body.tags) ? body.tags : [],
        }))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/exec/tasks/')) {
        const taskId = url.pathname.split('/').at(-1)
        if (!taskId) return badRequest(response, request, options.allowedOrigins, 'taskId is required')
        const body = await readJson<Partial<NexusTaskRecord>>(request)
        const patch: Partial<NexusTaskRecord> = {}
        const allowedStatuses: NexusTaskRecord['status'][] = ['todo', 'in-progress', 'blocked', 'completed']
        if (body.title !== undefined) patch.title = body.title.trim()
        if (body.description !== undefined) patch.description = body.description.trim()
        if (body.status !== undefined) {
          if (!allowedStatuses.includes(body.status)) return badRequest(response, request, options.allowedOrigins, `status must be one of: ${allowedStatuses.join(', ')}`)
          patch.status = body.status
        }
        if (body.percentComplete !== undefined) {
          const pct = Number(body.percentComplete)
          if (!Number.isNaN(pct)) patch.percentComplete = Math.max(0, Math.min(100, pct))
        }
        if (body.assignedAgent !== undefined) patch.assignedAgent = body.assignedAgent.trim()
        if (body.assignedSubAgent !== undefined) patch.assignedSubAgent = body.assignedSubAgent.trim() || undefined
        if (body.dueDate !== undefined) patch.dueDate = body.dueDate.trim() || undefined
        if (body.notes !== undefined) patch.notes = body.notes.trim()
        if (body.completionDetails !== undefined) patch.completionDetails = body.completionDetails.trim() || undefined
        if (body.taskReason !== undefined) patch.taskReason = body.taskReason.trim()
        if (body.tags !== undefined) patch.tags = Array.isArray(body.tags) ? body.tags : []
        if (Object.keys(patch).length === 0) return badRequest(response, request, options.allowedOrigins, 'at least one field required')
        const updated = await services.nexusTasksService.patch(taskId, patch)
        if (!updated) return notFound(response, request, options.allowedOrigins)
        json(response, request, options.allowedOrigins, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/exec/tasks/')) {
        const taskId = url.pathname.split('/').at(-1)
        if (!taskId) return badRequest(response, request, options.allowedOrigins, 'taskId is required')
        await services.nexusTasksService.delete(taskId)
        json(response, request, options.allowedOrigins, 200, { ok: true })
        return
      }

      notFound(response, request, options.allowedOrigins)
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        console.warn(`[nexus:reject] ${request.method ?? 'GET'} ${request.url ?? '/'} — ${error.code} — ${error.message}`)
        json(response, request, options.allowedOrigins, error.statusCode, {
          ok: false,
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        })
        return
      }

      if (error instanceof HttpError) {
        json(response, request, options.allowedOrigins, error.statusCode, { error: error.message })
        return
      }

      console.error('Nexus API route failed', error)
      internalServerError(response, request, options.allowedOrigins)
    }
  }
}
