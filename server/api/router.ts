import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AgentRecord, ArtifactRecord, CalendarEventRecord, ChatModeId, GoalRecord, MemoryRecord, ProjectRecord, TaskRecord, TaskStage, TaskStatus, TeamMemberRecord } from '../domain/models.js'
import { ConflictError, HttpError, ValidationError, badRequest, internalServerError, json, notFound, readJson } from './http.js'
import { ActivityRepository } from '../application/repositories.js'
import { AgentsService, ArtifactsService, ChatService, GoalsService, HabitsService, MissionCommandService, NotesService, ProjectsService, SearchService, StatusService, TasksService, TeamService } from '../application/services.js'
import type { AuthStore } from '../infrastructure/authStore.js'
import { requireAuth, buildSessionCookieHeader, clearSessionCookieHeader } from '../middleware/auth.js'
import { authLimiter, apiLimiter } from '../infrastructure/rateLimiter.js'

interface Services {
  chatService: ChatService
  notesService: NotesService
  tasksService: TasksService
  statusService: StatusService
  missionCommandService: MissionCommandService
  goalsService: GoalsService
  habitsService: HabitsService
  projectsService: ProjectsService
  teamService: TeamService
  artifactsService: ArtifactsService
  agentsService: AgentsService
  searchService: SearchService
  activityRepository: ActivityRepository
  authStore: AuthStore
}

const allowedTaskStatuses: TaskStatus[] = ['Queued', 'In Progress', 'Blocked', 'Done']
const allowedTaskStages: TaskStage[] = ['queued', 'inspecting', 'editing', 'validating', 'committing', 'pushing', 'done']

function isAuthPath(pathname: string) {
  return pathname === '/health' || pathname.startsWith('/api/auth/')
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

      // ── Health (public) ─────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/health') {
        json(response, 200, { ok: true })
        return
      }

      // ── Auth endpoints (public) ──────────────────────────────────
      if (url.pathname.startsWith('/api/auth/')) {
        await handleAuth(method, url.pathname, request, response, services.authStore)
        return
      }

      // ── Global API rate limit ────────────────────────────────────
      const clientIp = (request.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]?.trim() ?? '127.0.0.1'
      const apiCheck = apiLimiter.consume(clientIp)
      if (!apiCheck.allowed) {
        json(response, 429, { error: 'too_many_requests', retryAfterMs: apiCheck.retryAfterMs })
        return
      }

      // ── Auth guard (all other routes) ────────────────────────────
      if (!await requireAuth(request, response, services.authStore)) return

      // ── Bootstrap ───────────────────────────────────────────────
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

      if (method === 'GET' && url.pathname === '/api/activity') {
        json(response, 200, await services.activityRepository.list(12))
        return
      }

      // ── Chat ────────────────────────────────────────────────────
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

      // ── Notes ───────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/notes') {
        json(response, 200, await services.notesService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/notes') {
        const body = await readJson<{ title?: string; body?: string; tag?: string; projectId?: string }>(request)
        if (!body.title?.trim() || !body.body?.trim()) return badRequest(response, 'title and body are required')
        json(response, 201, await services.notesService.create({ title: body.title, body: body.body, tag: body.tag ?? 'general', projectId: body.projectId }))
        return
      }

      // ── Tasks ───────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/tasks') {
        json(response, 200, await services.tasksService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/tasks') {
        const body = await readJson<{
          title?: string; owner?: string; due?: string; status?: TaskStatus; stage?: TaskStage
          lane?: string; summary?: string; needsUserInput?: boolean; needsApproval?: boolean
          assignedBy?: string; readyToReport?: boolean; blockedReason?: string; waitingFor?: string
        }>(request)
        if (!body.title?.trim() || !body.owner?.trim() || !body.due?.trim() || !body.lane?.trim()) {
          return badRequest(response, 'title, owner, due, and lane are required')
        }
        const status = body.status && allowedTaskStatuses.includes(body.status) ? body.status : 'Queued'
        const stage = body.stage && allowedTaskStages.includes(body.stage) ? body.stage : undefined
        const createInput = {
          title: body.title, owner: body.owner, due: body.due, status, lane: body.lane,
          summary: body.summary?.trim() || undefined, needsUserInput: body.needsUserInput === true,
          needsApproval: body.needsApproval === true, assignedBy: body.assignedBy?.trim() || undefined,
          readyToReport: body.readyToReport === true, blockedReason: body.blockedReason?.trim() || undefined,
          waitingFor: body.waitingFor?.trim() || undefined, ...(stage !== undefined ? { stage } : {}),
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
          status?: TaskStatus; stage?: TaskStage; summary?: string
          needsUserInput?: boolean; needsApproval?: boolean; readyToReport?: boolean
          blockedReason?: string; waitingFor?: string
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
        if (body.summary !== undefined) patch.summary = body.summary.trim() || undefined
        if (body.needsUserInput !== undefined) patch.needsUserInput = body.needsUserInput === true
        if (body.needsApproval !== undefined) patch.needsApproval = body.needsApproval === true
        if (body.readyToReport !== undefined) patch.readyToReport = body.readyToReport === true
        if (body.blockedReason !== undefined) patch.blockedReason = body.blockedReason.trim() || undefined
        if (body.waitingFor !== undefined) patch.waitingFor = body.waitingFor.trim() || undefined
        if (Object.keys(patch).length === 0) return badRequest(response, 'at least one valid task field is required')
        const updated = await services.tasksService.update(taskId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      // ── Mission ─────────────────────────────────────────────────
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

      // ── Projects ────────────────────────────────────────────────
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

      // ── Team ────────────────────────────────────────────────────
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

      // ── Calendar ────────────────────────────────────────────────
      if (method === 'POST' && url.pathname === '/api/calendar') {
        const body = await readJson<{ title?: string; type?: CalendarEventRecord['type']; startsAt?: string; owner?: string; detail?: string; endsAt?: string; relatedProjectId?: string }>(request)
        if (!body.title?.trim() || !body.type || !body.startsAt?.trim() || !body.owner?.trim()) {
          return badRequest(response, 'title, type, startsAt, and owner are required')
        }
        const allowedEventTypes: CalendarEventRecord['type'][] = ['task', 'meeting', 'deadline', 'routine']
        if (!allowedEventTypes.includes(body.type)) return badRequest(response, `type must be one of: ${allowedEventTypes.join(', ')}`)
        json(response, 201, await services.missionCommandService.createCalendarEvent({
          title: body.title, type: body.type, startsAt: body.startsAt, owner: body.owner,
          detail: body.detail?.trim() ?? '', endsAt: body.endsAt, relatedProjectId: body.relatedProjectId,
        }))
        return
      }

      // ── Memories ────────────────────────────────────────────────
      if (method === 'POST' && url.pathname === '/api/memories') {
        const body = await readJson<{ title?: string; summary?: string; kind?: MemoryRecord['kind']; tags?: string[] }>(request)
        if (!body.title?.trim() || !body.summary?.trim()) return badRequest(response, 'title and summary are required')
        const allowedKinds: MemoryRecord['kind'][] = ['working-memory', 'long-term-memory']
        if (body.kind && !allowedKinds.includes(body.kind)) return badRequest(response, `kind must be one of: ${allowedKinds.join(', ')}`)
        json(response, 201, await services.missionCommandService.createMemory({
          title: body.title, summary: body.summary, kind: body.kind,
          tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
        }))
        return
      }

      // ── Goals ───────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/goals') {
        json(response, 200, await services.goalsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/goals') {
        const body = await readJson<{ title?: string; category?: GoalRecord['category']; targetDate?: string; summary?: string }>(request)
        if (!body.title?.trim()) return badRequest(response, 'title is required')
        if (!body.category) return badRequest(response, 'category is required')
        json(response, 201, await services.goalsService.create({
          title: body.title, category: body.category,
          targetDate: body.targetDate ?? '', summary: body.summary ?? '',
        }))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/goals/')) {
        const goalId = url.pathname.split('/').at(-1)
        if (!goalId) return badRequest(response, 'goalId is required')
        const body = await readJson<{ progressPercent?: number; status?: GoalRecord['status']; summary?: string; title?: string; targetDate?: string }>(request)
        const patch: Parameters<typeof services.goalsService.update>[1] = {}
        if (body.progressPercent !== undefined) {
          const pct = Number(body.progressPercent)
          if (Number.isNaN(pct) || pct < 0 || pct > 100) return badRequest(response, 'progressPercent must be 0-100')
          patch.progressPercent = pct
        }
        const allowedGoalStatuses: GoalRecord['status'][] = ['on-track', 'at-risk', 'blocked']
        if (body.status !== undefined) {
          if (!allowedGoalStatuses.includes(body.status)) return badRequest(response, `status must be one of: ${allowedGoalStatuses.join(', ')}`)
          patch.status = body.status
        }
        if (body.summary !== undefined) patch.summary = body.summary.trim()
        if (body.title !== undefined) patch.title = body.title.trim()
        if (body.targetDate !== undefined) patch.targetDate = body.targetDate.trim()
        const updated = await services.goalsService.update(goalId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/goals/')) {
        const goalId = url.pathname.split('/').at(-1)
        if (!goalId) return badRequest(response, 'goalId is required')
        const deleted = await services.goalsService.delete(goalId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Habits ──────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/habits') {
        json(response, 200, await services.habitsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/habits') {
        const body = await readJson<{ title?: string; category?: string; frequency?: string; targetPerPeriod?: number }>(request)
        if (!body.title?.trim()) return badRequest(response, 'title is required')
        const allowedCategories = ['fitness', 'work', 'learning', 'health', 'focus']
        const allowedFrequencies = ['daily', 'weekly']
        const category = body.category && allowedCategories.includes(body.category) ? body.category as 'fitness' | 'work' | 'learning' | 'health' | 'focus' : 'work'
        const frequency = body.frequency && allowedFrequencies.includes(body.frequency) ? body.frequency as 'daily' | 'weekly' : 'daily'
        const targetPerPeriod = Number.isFinite(Number(body.targetPerPeriod)) && Number(body.targetPerPeriod) > 0 ? Number(body.targetPerPeriod) : 1
        json(response, 201, await services.habitsService.create({ title: body.title, category, frequency, targetPerPeriod }))
        return
      }

      if (method === 'POST' && url.pathname.match(/^\/api\/habits\/[^/]+\/complete$/)) {
        const habitId = url.pathname.split('/')[3]
        if (!habitId) return badRequest(response, 'habitId is required')
        const body = await readJson<{ date?: string }>(request).catch(() => ({}) as { date?: string })
        const updated = await services.habitsService.complete(habitId, body.date)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/habits/')) {
        const habitId = url.pathname.split('/').at(-1)
        if (!habitId) return badRequest(response, 'habitId is required')
        const body = await readJson<{ title?: string; category?: string; frequency?: string; targetPerPeriod?: number }>(request)
        const patch: Parameters<typeof services.habitsService.update>[1] = {}
        if (body.title !== undefined) patch.title = body.title.trim()
        if (body.category !== undefined) patch.category = body.category as 'fitness' | 'work' | 'learning' | 'health' | 'focus'
        if (body.frequency !== undefined) patch.frequency = body.frequency as 'daily' | 'weekly'
        if (body.targetPerPeriod !== undefined) patch.targetPerPeriod = Number(body.targetPerPeriod)
        const updated = await services.habitsService.update(habitId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/habits/')) {
        const habitId = url.pathname.split('/').at(-1)
        if (!habitId) return badRequest(response, 'habitId is required')
        const deleted = await services.habitsService.delete(habitId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Projects (full CRUD) ────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/projects') {
        json(response, 200, await services.projectsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/projects') {
        const body = await readJson<Partial<ProjectRecord>>(request)
        if (!body.name?.trim()) return badRequest(response, 'name is required')
        if (!body.owner?.trim()) return badRequest(response, 'owner is required')
        const allowedStatuses: ProjectRecord['status'][] = ['active', 'watch', 'blocked', 'parked', 'done']
        const status = body.status && allowedStatuses.includes(body.status) ? body.status : 'active'
        json(response, 201, await services.projectsService.create({
          name: body.name.trim(),
          area: body.area?.trim() ?? '',
          status,
          objective: body.objective?.trim() ?? '',
          missionAlignment: body.missionAlignment?.trim() ?? '',
          goalIds: Array.isArray(body.goalIds) ? body.goalIds : [],
          progressPercent: Math.min(100, Math.max(0, Number(body.progressPercent) || 0)),
          owner: body.owner.trim(),
          targetDate: body.targetDate?.trim() || undefined,
        }))
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/projects/')) {
        const projectId = url.pathname.split('/').at(-1)
        if (!projectId) return badRequest(response, 'projectId is required')
        const deleted = await services.projectsService.delete(projectId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Team (full CRUD) ─────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/team') {
        json(response, 200, await services.teamService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/team') {
        const body = await readJson<Partial<TeamMemberRecord>>(request)
        if (!body.name?.trim()) return badRequest(response, 'name is required')
        const allowedStatuses: TeamMemberRecord['status'][] = ['active', 'limited-visibility', 'offline']
        const status = body.status && allowedStatuses.includes(body.status) ? body.status : 'active'
        json(response, 201, await services.teamService.create({
          name: body.name.trim(),
          role: body.role?.trim() ?? '',
          status,
          focus: body.focus?.trim() ?? '',
        }))
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/team/')) {
        const memberId = url.pathname.split('/').at(-1)
        if (!memberId) return badRequest(response, 'memberId is required')
        const deleted = await services.teamService.delete(memberId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Memories (list, update, delete) ─────────────────────────
      if (method === 'GET' && url.pathname === '/api/memories') {
        json(response, 200, await services.missionCommandService.listMemories())
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/memories/')) {
        const memId = url.pathname.split('/').at(-1)
        if (!memId) return badRequest(response, 'memoryId is required')
        const body = await readJson<{ title?: string; summary?: string; kind?: MemoryRecord['kind']; tags?: string[] }>(request)
        const patch: Parameters<typeof services.missionCommandService.updateMemory>[1] = {}
        if (body.title !== undefined) patch.title = body.title.trim()
        if (body.summary !== undefined) patch.summary = body.summary.trim()
        const allowedKinds: MemoryRecord['kind'][] = ['working-memory', 'long-term-memory']
        if (body.kind !== undefined && allowedKinds.includes(body.kind)) patch.kind = body.kind
        if (Array.isArray(body.tags)) patch.tags = body.tags.map(String)
        const updated = await services.missionCommandService.updateMemory(memId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/memories/')) {
        const memId = url.pathname.split('/').at(-1)
        if (!memId) return badRequest(response, 'memoryId is required')
        const deleted = await services.missionCommandService.deleteMemory(memId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Calendar (list, update) ──────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/calendar') {
        json(response, 200, await services.missionCommandService.listCalendarEvents())
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/calendar/')) {
        const calId = url.pathname.split('/').at(-1)
        if (!calId) return badRequest(response, 'calendarId is required')
        const body = await readJson<{ status?: CalendarEventRecord['status']; title?: string; detail?: string; endsAt?: string }>(request)
        const patch: Parameters<typeof services.missionCommandService.updateCalendarEvent>[1] = {}
        const allowedCalStatuses: CalendarEventRecord['status'][] = ['scheduled', 'next-up', 'done']
        if (body.status !== undefined && allowedCalStatuses.includes(body.status)) patch.status = body.status
        if (body.title !== undefined) patch.title = body.title.trim()
        if (body.detail !== undefined) patch.detail = body.detail.trim()
        if (body.endsAt !== undefined) patch.endsAt = body.endsAt.trim()
        if (Object.keys(patch).length === 0) return badRequest(response, 'at least one field required')
        const updated = await services.missionCommandService.updateCalendarEvent(calId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      // ── Artifacts (full CRUD) ────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/artifacts') {
        json(response, 200, await services.artifactsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/artifacts') {
        const body = await readJson<{ title?: string; type?: ArtifactRecord['type']; location?: string; summary?: string; relatedProjectId?: string }>(request)
        if (!body.title?.trim()) return badRequest(response, 'title is required')
        const allowedTypes: ArtifactRecord['type'][] = ['doc', 'artifact', 'reference']
        const type = body.type && allowedTypes.includes(body.type) ? body.type : 'doc'
        json(response, 201, await services.artifactsService.create({
          title: body.title,
          type,
          location: body.location?.trim() ?? '',
          summary: body.summary?.trim() ?? '',
          relatedProjectId: body.relatedProjectId?.trim() || undefined,
        }))
        return
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/artifacts/')) {
        const artId = url.pathname.split('/').at(-1)
        if (!artId) return badRequest(response, 'artifactId is required')
        const body = await readJson<{ title?: string; type?: ArtifactRecord['type']; location?: string; summary?: string; relatedProjectId?: string }>(request)
        const patch: Parameters<typeof services.artifactsService.update>[1] = {}
        if (body.title !== undefined) patch.title = body.title.trim()
        const allowedTypes: ArtifactRecord['type'][] = ['doc', 'artifact', 'reference']
        if (body.type !== undefined && allowedTypes.includes(body.type)) patch.type = body.type
        if (body.location !== undefined) patch.location = body.location.trim()
        if (body.summary !== undefined) patch.summary = body.summary.trim()
        if (body.relatedProjectId !== undefined) patch.relatedProjectId = body.relatedProjectId.trim() || undefined
        const updated = await services.artifactsService.update(artId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/artifacts/')) {
        const artId = url.pathname.split('/').at(-1)
        if (!artId) return badRequest(response, 'artifactId is required')
        const deleted = await services.artifactsService.delete(artId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Agents (full CRUD) ───────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/agents') {
        json(response, 200, await services.agentsService.list())
        return
      }

      if (method === 'POST' && url.pathname === '/api/agents') {
        const body = await readJson<Partial<AgentRecord>>(request)
        if (!body.name?.trim()) return badRequest(response, 'name is required')
        const allowedModes: AgentRecord['currentMode'][] = ['autonomous', 'supervised', 'paused', 'maintenance']
        const allowedStatuses: AgentRecord['status'][] = ['active', 'standby', 'blocked', 'offline', 'idle']
        const allowedAlignments: AgentRecord['alignmentStatus'][] = ['on-track', 'blocked', 'idle', 'off-track']
        json(response, 201, await services.agentsService.create({
          name: body.name.trim(),
          role: body.role?.trim() ?? '',
          missionResponsibility: body.missionResponsibility?.trim() ?? '',
          currentTask: body.currentTask?.trim() ?? 'Standby',
          currentMode: body.currentMode && allowedModes.includes(body.currentMode) ? body.currentMode : 'supervised',
          model: body.model?.trim() ?? '',
          status: body.status && allowedStatuses.includes(body.status) ? body.status : 'standby',
          alignmentStatus: body.alignmentStatus && allowedAlignments.includes(body.alignmentStatus) ? body.alignmentStatus : 'on-track',
          lastActivityAt: new Date().toISOString(),
          subAgents: Array.isArray(body.subAgents) ? body.subAgents : [],
          contributingTo: Array.isArray(body.contributingTo) ? body.contributingTo : [],
          linkedProjectId: body.linkedProjectId?.trim() || undefined,
          linkedMissionArea: body.linkedMissionArea?.trim() ?? '',
          load: Math.min(100, Math.max(0, Number(body.load) || 0)),
          notes: body.notes?.trim() || undefined,
        }))
        return
      }

      if (method === 'PATCH' && url.pathname.match(/^\/api\/agents\/[^/]+$/) && !url.pathname.endsWith('/approve') && !url.pathname.endsWith('/reject')) {
        const agentId = url.pathname.split('/').at(-1)
        if (!agentId) return badRequest(response, 'agentId is required')
        const body = await readJson<Partial<AgentRecord>>(request)
        const patch: Partial<AgentRecord> = {}
        const allowedStatuses: AgentRecord['status'][] = ['active', 'standby', 'blocked', 'offline', 'idle']
        const allowedModes: AgentRecord['currentMode'][] = ['autonomous', 'supervised', 'paused', 'maintenance']
        const allowedAlignments: AgentRecord['alignmentStatus'][] = ['on-track', 'blocked', 'idle', 'off-track']
        if (body.status !== undefined && allowedStatuses.includes(body.status)) patch.status = body.status
        if (body.currentMode !== undefined && allowedModes.includes(body.currentMode)) patch.currentMode = body.currentMode
        if (body.alignmentStatus !== undefined && allowedAlignments.includes(body.alignmentStatus)) patch.alignmentStatus = body.alignmentStatus
        if (body.currentTask !== undefined) patch.currentTask = body.currentTask.trim()
        if (body.load !== undefined) patch.load = Math.min(100, Math.max(0, Number(body.load)))
        if (body.notes !== undefined) patch.notes = body.notes.trim() || undefined
        if (body.linkedProjectId !== undefined) patch.linkedProjectId = body.linkedProjectId.trim() || undefined
        if (Array.isArray(body.subAgents)) patch.subAgents = body.subAgents
        if (Array.isArray(body.contributingTo)) patch.contributingTo = body.contributingTo
        if (Object.keys(patch).length === 0) return badRequest(response, 'at least one valid field required')
        const updated = await services.agentsService.update(agentId, patch)
        if (!updated) return notFound(response)
        json(response, 200, updated)
        return
      }

      if (method === 'DELETE' && url.pathname.startsWith('/api/agents/')) {
        const agentId = url.pathname.split('/').at(-1)
        if (!agentId) return badRequest(response, 'agentId is required')
        const deleted = await services.agentsService.delete(agentId)
        if (!deleted) return notFound(response)
        json(response, 200, { ok: true })
        return
      }

      // ── Search ───────────────────────────────────────────────────
      if (method === 'GET' && url.pathname === '/api/search') {
        const q = url.searchParams.get('q')?.trim()
        if (!q) return badRequest(response, 'query param q is required')
        const limitParam = Number(url.searchParams.get('limit') ?? '20')
        const limit = Number.isFinite(limitParam) ? Math.min(50, Math.max(1, limitParam)) : 20
        json(response, 200, await services.searchService.search(q, limit))
        return
      }

      // ── Activity ────────────────────────────────────────────────
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
          ok: false, code: error.code, message: error.message,
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

// ── Auth route handler ────────────────────────────────────────────

async function handleAuth(
  method: string,
  pathname: string,
  request: IncomingMessage,
  response: ServerResponse,
  authStore: AuthStore,
) {
  // GET /api/auth/status
  if (method === 'GET' && pathname === '/api/auth/status') {
    const setupComplete = await authStore.isSetupComplete()
    json(response, 200, { setupComplete })
    return
  }

  // POST /api/auth/setup
  if (method === 'POST' && pathname === '/api/auth/setup') {
    const ip = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? '127.0.0.1'
    const rl = authLimiter.consume(ip)
    if (!rl.allowed) {
      json(response, 429, { error: 'too_many_requests', message: 'Too many auth attempts. Try again later.', retryAfterMs: rl.retryAfterMs })
      return
    }
    if (await authStore.isSetupComplete()) {
      json(response, 409, { error: 'already_setup', message: 'Setup already complete' })
      return
    }
    const body = await readJson<{ password?: string }>(request)
    if (!body.password || body.password.length < 8) {
      return badRequest(response, 'password must be at least 8 characters')
    }
    const config = await authStore.setup(body.password)
    json(response, 201, { ok: true, apiKey: config.apiKey })
    return
  }

  // POST /api/auth/login
  if (method === 'POST' && pathname === '/api/auth/login') {
    const ip = (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? '127.0.0.1'
    const rl = authLimiter.consume(ip)
    if (!rl.allowed) {
      json(response, 429, { error: 'too_many_requests', message: 'Too many auth attempts. Try again later.', retryAfterMs: rl.retryAfterMs })
      return
    }
    const config = await authStore.read()
    if (!config?.setupComplete) {
      json(response, 503, { error: 'setup_required', message: 'Setup not complete' })
      return
    }
    const body = await readJson<{ password?: string }>(request)
    if (!body.password) return badRequest(response, 'password is required')
    const valid = await authStore.verifyPassword(body.password, config.salt, config.passwordHash)
    if (!valid) {
      json(response, 401, { error: 'invalid_credentials', message: 'Invalid password' })
      return
    }
    const token = authStore.createSessionToken(config.sessionSecret)
    response.setHeader('Set-Cookie', buildSessionCookieHeader(token))
    json(response, 200, { ok: true })
    return
  }

  // POST /api/auth/logout
  if (method === 'POST' && pathname === '/api/auth/logout') {
    response.setHeader('Set-Cookie', clearSessionCookieHeader())
    json(response, 200, { ok: true })
    return
  }

  // GET /api/auth/key (requires auth)
  if (method === 'GET' && pathname === '/api/auth/key') {
    if (!await requireAuth(request, response, authStore)) return
    const config = await authStore.read()
    if (!config) return notFound(response)
    json(response, 200, { apiKey: config.apiKey })
    return
  }

  // POST /api/auth/rotate-key (requires auth)
  if (method === 'POST' && pathname === '/api/auth/rotate-key') {
    if (!await requireAuth(request, response, authStore)) return
    try {
      const newKey = await authStore.rotateApiKey()
      json(response, 200, { apiKey: newKey })
    } catch (err) {
      json(response, 400, { message: (err as Error).message })
    }
    return
  }

  notFound(response)
}
