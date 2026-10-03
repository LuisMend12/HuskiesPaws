-- HuskiesPaws tables. Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The server talks to these with the service-role key, so row-level security
-- stays ON with no public policies: browsers can't read or write directly.

create table if not exists players (
  id text primary key,
  name text not null,
  score integer not null default 0 check (score >= 0),
  region_local text,
  region_state text,
  region_national text,
  updated_at timestamptz not null default now()
);
create index if not exists players_local_score on players (region_local, score desc);
create index if not exists players_state_score on players (region_state, score desc);
create index if not exists players_national_score on players (region_national, score desc);

create table if not exists turf (
  landmark_id text primary key,
  title text not null,
  lat double precision not null,
  lon double precision not null,
  owner_id text not null,
  owner_name text not null,
  pet jsonb not null,
  claimed_at timestamptz not null default now()
);
create index if not exists turf_owner on turf (owner_id);

-- Generated Grok Imagine art, cached so each place or pet is only drawn once.
create table if not exists images (
  key text primary key,
  path text not null,
  created_at timestamptz not null default now()
);

alter table players enable row level security;
alter table turf enable row level security;
alter table images enable row level security;
