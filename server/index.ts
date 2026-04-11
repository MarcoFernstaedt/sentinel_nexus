import http from 'node:http'
import { getAppConfig } from './config/env.js'
import { FileBackedStore } from './infrastructure/fileStore.js'
import { ActivityRepository, ChatRepository, MissionCommandRepository, NexusClientsRepository, NexusProjectsRepository, NexusTasksRepository, NotesRepository, StatusRepository, TasksRepository, TrackedTargetsRepository } from './application/repositories.js'
import { ChatService, MissionCommandService, NexusClientsService, NexusProjectsService, NexusTasksService, NotesService, StatusService, TasksService, TrackedTargetsService } from './application/services.js'
import { createRouter } from './api/router.js'

const config = getAppConfig()
const store = new FileBackedStore(config.database.dataDirectory)
const activityRepository = new ActivityRepository(store)

const server = http.createServer(
  createRouter(
    {
      chatService: new ChatService(new ChatRepository(store), activityRepository),
      notesService: new NotesService(new NotesRepository(store), activityRepository),
      tasksService: new TasksService(new TasksRepository(store), activityRepository),
      statusService: new StatusService(new StatusRepository(store), config),
      missionCommandService: new MissionCommandService(new MissionCommandRepository(store), activityRepository),
      trackedTargetsService: new TrackedTargetsService(new TrackedTargetsRepository(store)),
      nexusClientsService: new NexusClientsService(new NexusClientsRepository(store)),
      nexusProjectsService: new NexusProjectsService(new NexusProjectsRepository(store), new NexusTasksRepository(store)),
      nexusTasksService: new NexusTasksService(new NexusTasksRepository(store), new NexusProjectsRepository(store)),
      activityRepository,
    },
    {
      allowedOrigins: config.allowedOrigins,
    },
  ),
)

server.listen(config.port, config.host, () => {
  console.log(`Sentinel Nexus API listening on http://${config.host}:${config.port}`)
})
