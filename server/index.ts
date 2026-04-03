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

server.listen(config.port, () => {
  console.log(`Sentinel Nexus API listening on http://localhost:${config.port}`)
})
