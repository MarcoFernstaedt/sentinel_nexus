import http from 'node:http'
import { getAppConfig } from './config/env.js'
import { FileBackedStore } from './infrastructure/fileStore.js'
import { ChatRepository, NotesRepository, StatusRepository, TasksRepository } from './application/repositories.js'
import { ChatService, NotesService, StatusService, TasksService } from './application/services.js'
import { createRouter } from './api/router.js'

const config = getAppConfig()
const store = new FileBackedStore(config.database.dataDirectory)

const server = http.createServer(
  createRouter({
    chatService: new ChatService(new ChatRepository(store)),
    notesService: new NotesService(new NotesRepository(store)),
    tasksService: new TasksService(new TasksRepository(store)),
    statusService: new StatusService(new StatusRepository(store), config),
  }),
)

server.listen(config.port, () => {
  console.log(`Sentinel Nexus API listening on http://localhost:${config.port}`)
})
