-- Sentinel Nexus — full relational schema
-- Used by SqliteStore; all tables use TEXT for JSON arrays/booleans
-- for compatibility with the existing NexusDataStore interface.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Chat ────────────────────────────────────────────────────────
create table if not exists chat_messages (
  id         text primary key,
  role       text not null,
  author     text not null,
  body       text not null,
  timestamp  text not null,
  mode_id    text not null,
  status     text not null default 'ready',
  source     text not null default 'runtime'
);
create index if not exists idx_chat_messages_timestamp on chat_messages(timestamp);

-- ── Notes ───────────────────────────────────────────────────────
create table if not exists notes (
  id         text primary key,
  title      text not null,
  body       text not null,
  tag        text not null default '',
  project_id text,
  updated_at text not null,
  source     text not null default 'runtime'
);
create index if not exists idx_notes_updated_at  on notes(updated_at);
create index if not exists idx_notes_project_id  on notes(project_id);

-- ── Tasks ───────────────────────────────────────────────────────
create table if not exists tasks (
  id               text primary key,
  title            text not null,
  owner            text not null,
  due              text not null,
  status           text not null,
  stage            text not null default 'queued',
  lane             text not null default '',
  project_id       text,
  summary          text,
  needs_user_input integer not null default 0,
  needs_approval   integer not null default 0,
  assigned_by      text,
  ready_to_report  integer not null default 0,
  blocked_reason   text,
  waiting_for      text,
  last_updated_at  text,
  completed_at     text,
  source           text not null default 'runtime'
);
create index if not exists idx_tasks_status         on tasks(status);
create index if not exists idx_tasks_owner          on tasks(owner);
create index if not exists idx_tasks_project_id     on tasks(project_id);
create index if not exists idx_tasks_last_updated   on tasks(last_updated_at);

-- ── Activity ─────────────────────────────────────────────────────
create table if not exists activity (
  id        text primary key,
  type      text not null,
  title     text not null,
  detail    text not null default '',
  timestamp text not null,
  status    text not null default 'logged',
  source    text not null default 'runtime'
);
create index if not exists idx_activity_timestamp on activity(timestamp desc);

-- ── Mission ──────────────────────────────────────────────────────
create table if not exists mission (
  id               text primary key,
  title            text not null,
  statement        text not null,
  command_intent   text not null,
  progress_percent integer not null default 0,
  target_date      text not null,
  active_mode_id   text not null default 'command',
  source           text not null default 'runtime'
);

-- ── Goals ────────────────────────────────────────────────────────
create table if not exists goals (
  id               text primary key,
  title            text not null,
  category         text not null,
  status           text not null default 'on-track',
  progress_percent integer not null default 0,
  target_date      text not null,
  summary          text not null default '',
  source           text not null default 'runtime'
);
create index if not exists idx_goals_category on goals(category);
create index if not exists idx_goals_status   on goals(status);

-- ── Projects ─────────────────────────────────────────────────────
create table if not exists projects (
  id                text primary key,
  name              text not null,
  area              text not null default '',
  status            text not null default 'active',
  objective         text not null default '',
  mission_alignment text not null default '',
  goal_ids          text not null default '[]',  -- JSON array
  progress_percent  integer not null default 0,
  target_date       text,
  owner             text not null default '',
  source            text not null default 'runtime'
);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_owner  on projects(owner);

-- ── Calendar ─────────────────────────────────────────────────────
create table if not exists calendar (
  id                 text primary key,
  title              text not null,
  type               text not null,
  starts_at          text not null,
  ends_at            text,
  owner              text not null default '',
  related_project_id text,
  status             text not null default 'scheduled',
  detail             text not null default '',
  source             text not null default 'runtime'
);
create index if not exists idx_calendar_starts_at on calendar(starts_at);
create index if not exists idx_calendar_status    on calendar(status);

-- ── Memories ─────────────────────────────────────────────────────
create table if not exists memories (
  id         text primary key,
  title      text not null,
  kind       text not null default 'working-memory',
  updated_at text not null,
  summary    text not null default '',
  tags       text not null default '[]',  -- JSON array
  source     text not null default 'runtime'
);
create index if not exists idx_memories_kind       on memories(kind);
create index if not exists idx_memories_updated_at on memories(updated_at);

-- ── Artifacts ────────────────────────────────────────────────────
create table if not exists artifacts (
  id                 text primary key,
  title              text not null,
  type               text not null default 'doc',
  location           text not null default '',
  updated_at         text not null,
  summary            text not null default '',
  related_project_id text,
  source             text not null default 'runtime'
);
create index if not exists idx_artifacts_type       on artifacts(type);
create index if not exists idx_artifacts_updated_at on artifacts(updated_at);

-- ── Team ─────────────────────────────────────────────────────────
create table if not exists team (
  id     text primary key,
  name   text not null,
  role   text not null default '',
  status text not null default 'active',
  focus  text not null default '',
  source text not null default 'runtime'
);
create index if not exists idx_team_status on team(status);

-- ── Agents ───────────────────────────────────────────────────────
-- AI agents (Claude Code, sub-agents, platform agents, etc.)
create table if not exists agents (
  id                   text primary key,
  name                 text not null,
  role                 text not null default '',
  mission_responsibility text not null default '',
  current_task         text not null default '',
  current_mode         text not null default 'supervised',
  model                text not null default '',
  status               text not null default 'standby',
  alignment_status     text not null default 'on-track',
  last_activity_at     text not null,
  sub_agents           text not null default '[]',  -- JSON array of SubAgentRecord
  contributing_to      text not null default '[]',  -- JSON array of strings
  linked_project_id    text,
  linked_mission_area  text not null default '',
  load                 integer not null default 0,
  notes                text,
  source               text not null default 'runtime'
);
create index if not exists idx_agents_status on agents(status);

-- ── Office ───────────────────────────────────────────────────────
create table if not exists office (
  id     text primary key,
  label  text not null,
  value  text not null default '',
  detail text not null default '',
  source text not null default 'runtime'
);

-- ── Search Index ─────────────────────────────────────────────────
create table if not exists search_index (
  id          text primary key,
  entity_type text not null,
  title       text not null,
  summary     text not null default '',
  related_id  text not null,
  updated_at  text,
  source      text not null default 'runtime'
);
create index if not exists idx_search_entity_type on search_index(entity_type);
create index if not exists idx_search_related_id  on search_index(related_id);

-- ── Habits ───────────────────────────────────────────────────────
create table if not exists habits (
  id                text primary key,
  title             text not null,
  category          text not null default 'work',
  frequency         text not null default 'daily',
  target_per_period integer not null default 1,
  completed_dates   text not null default '[]',  -- JSON array of 'YYYY-MM-DD'
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  created_at        text not null,
  source            text not null default 'runtime'
);
create index if not exists idx_habits_category on habits(category);
