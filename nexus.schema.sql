-- Sentinel Nexus — full relational schema
-- Used by SqliteStore; all tables use TEXT for JSON arrays/booleans
-- for compatibility with the existing NexusDataStore interface.

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

-- ── Notes ───────────────────────────────────────────────────────
create table if not exists notes (
  id         text primary key,
  title      text not null,
  body       text not null,
  tag        text not null default '',
  updated_at text not null,
  source     text not null default 'runtime'
);

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

-- ── Team ─────────────────────────────────────────────────────────
create table if not exists team (
  id     text primary key,
  name   text not null,
  role   text not null default '',
  status text not null default 'active',
  focus  text not null default '',
  source text not null default 'runtime'
);

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
