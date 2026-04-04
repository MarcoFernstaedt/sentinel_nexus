import http from 'node:http'
import { getAppConfig } from './config/env.js'
import { FileBackedStore } from './infrastructure/fileStore.js'
import { SqliteStore } from './infrastructure/sqliteStore.js'
import { AuthStore } from './infrastructure/authStore.js'
import {
  ActivityRepository,
  ChatRepository,
  GoalsRepository,
  HabitsRepository,
  MissionCommandRepository,
  NotesRepository,
  StatusRepository,
  TasksRepository,
} from './application/repositories.js'
import {
  ChatService,
  GoalsService,
  HabitsService,
  MissionCommandService,
  NotesService,
  StatusService,
  TasksService,
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
    activityRepository,
    authStore,
  }),
)

server.listen(config.port, async () => {
  const authReady = await authStore.isSetupComplete()
  const bar = '═'.repeat(54)
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
