import type {
  ActivityRecord,
  ArtifactRecord,
  CalendarEventRecord,
  ChatMessageRecord,
  GoalRecord,
  MemoryRecord,
  MissionCommandSnapshot,
  NexusDataStore,
  NoteRecord,
  OfficeRecord,
  ProjectRecord,
  SearchEntryRecord,
  TaskRecord,
  TeamMemberRecord,
} from './models.js'

export const seededMessages: ChatMessageRecord[] = []
export const seededNotes: NoteRecord[] = []
export const seededTasks: TaskRecord[] = []
export const seededActivity: ActivityRecord[] = []

const seededGoals: GoalRecord[] = []
const seededProjects: ProjectRecord[] = []
const seededCalendar: CalendarEventRecord[] = []
const seededMemories: MemoryRecord[] = []
const seededArtifacts: ArtifactRecord[] = []
const seededTeam: TeamMemberRecord[] = []
const seededOffice: OfficeRecord[] = []

function createSearchIndex(): SearchEntryRecord[] {
  return []
}

export const seededMissionCommand: MissionCommandSnapshot = {
  mission: {
    id: 'mission-primary',
    title: 'Marco mission command',
    statement: 'Turn Nexus into a truthful execution operating system for Marco\'s real priorities.',
    commandIntent: 'Show only live work, real priorities, and the next decisive action.',
    progressPercent: 0,
    targetDate: 'Pending',
    activeModeId: 'command',
    source: 'runtime',
  },
  goals: seededGoals,
  projects: seededProjects,
  calendar: seededCalendar,
  memories: seededMemories,
  artifacts: seededArtifacts,
  team: seededTeam,
  office: seededOffice,
  searchIndex: createSearchIndex(),
}

export const createSeedData = (): NexusDataStore => ({
  chatMessages: seededMessages,
  notes: seededNotes,
  tasks: seededTasks,
  activity: seededActivity,
  trackedTargets: [],
  nexusClients: [],
  nexusProjects: [],
  nexusTasks: [],
  missionCommand: seededMissionCommand,
})
