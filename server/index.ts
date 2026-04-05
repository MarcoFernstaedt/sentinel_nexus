import http from 'node:http'
import process from 'node:process'
import { getAppConfig } from './config/env.js'
import { FileBackedStore } from './infrastructure/fileStore.js'
import { SqliteStore } from './infrastructure/sqliteStore.js'
import { AuthStore } from './infrastructure/authStore.js'
import {
  ActivityRepository,
  AgentsRepository,
  ArtifactsRepository,
  ChatRepository,
  GoalsRepository,
  HabitsRepository,
  MissionCommandRepository,
  NotesRepository,
  ProjectsRepository,
  SearchRepository,
  StatusRepository,
  TasksRepository,
  TeamRepository,
} from './application/repositories.js'
import {
  AgentsService,
  ArtifactsService,
  ChatService,
  GoalsService,
  HabitsService,
  MissionCommandService,
  NotesService,
  ProjectsService,
  SearchService,
  StatusService,
  TasksService,
  TeamService,
} from './application/services.js'
import { createRouter } from './api/router.js'

const config = getAppConfig()

const store = config.database.driver === 'sqlite'
  ? new SqliteStore(config.database.dataDirectory, config.database.schemaPath)
  : new FileBackedStore(config.database.dataDirectory)

const authStore = new AuthStore(config.database.dataDirectory)
const activityRepository = new ActivityRepository(store)

const server = http.createServer(
  createRouter({
    chatService: new ChatService(new ChatRepository(store), activityRepository),
    notesService: new NotesService(new NotesRepository(store), activityRepository),
    tasksService: new TasksService(new TasksRepository(store), activityRepository),
    statusService: new StatusService(new StatusRepository(store), config),
    missionCommandService: new MissionCommandService(new MissionCommandRepository(store), activityRepository),
    goalsService: new GoalsService(new GoalsRepository(store), activityRepository),
    habitsService: new HabitsService(new HabitsRepository(store), activityRepository),
    projectsService: new ProjectsService(new ProjectsRepository(store), activityRepository),
    teamService: new TeamService(new TeamRepository(store), activityRepository),
    artifactsService: new ArtifactsService(new ArtifactsRepository(store), activityRepository),
    agentsService: new AgentsService(new AgentsRepository(store), activityRepository),
    searchService: new SearchService(new SearchRepository(store)),
    activityRepository,
    authStore,
  }),
)

server.listen(config.port, async () => {
  const authReady = await authStore.isSetupComplete()
  const bar = '═'.repeat(58)
  console.log(`\n${bar}`)
  console.log(`  Sentinel Nexus API  ·  http://localhost:${config.port}`)
  console.log(bar)
  console.log(`  DB driver  : ${config.database.driver}`)
  console.log(`  Data dir   : ${config.database.dataDirectory}`)
  console.log(`  Auth       : ${authReady ? 'configured ✓' : 'not set up — visit http://localhost:3000/setup'}`)
  if (authReady) {
    console.log(`  Agent key  : X-Nexus-Key header  (Settings → Auth & Access)`)
  }
  console.log(`  Env        : ${config.nodeEnv}`)
  console.log(`${bar}\n`)
})

// ── Graceful shutdown ──────────────────────────────────────────────

function shutdown(signal: string) {
  console.log(`\nSentinel Nexus: received ${signal} — shutting down gracefully…`)
  server.close((err) => {
    if (err) console.error('Error closing HTTP server:', err)
    if (store instanceof SqliteStore) {
      store.close()
      console.log('SqliteStore: connection closed.')
    }
    console.log('Sentinel Nexus: bye.')
    process.exit(err ? 1 : 0)
  })

  // Force-exit after 10 s if something hangs
  setTimeout(() => {
    console.error('Sentinel Nexus: forced exit after timeout.')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  shutdown('uncaughtException')
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})
