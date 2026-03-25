-- Sentinel Nexus future relational schema
-- Prepared as a separate Nexus DB path/schema boundary.

create table if not exists chat_messages (
  id text primary key,
  role text not null,
  author text not null,
  body text not null,
  timestamp text not null,
  mode_id text not null,
  status text not null default 'ready'
);

create table if not exists notes (
  id text primary key,
  title text not null,
  body text not null,
  tag text not null,
  updated_at text not null
);

create table if not exists tasks (
  id text primary key,
  title text not null,
  owner text not null,
  due text not null,
  status text not null,
  lane text not null
);
