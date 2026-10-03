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

-- Re-run this schema on existing projects before deploying the updated server.
-- All mutations lock one revision row so caps across landmarks are atomic.
create table if not exists turf_revision (
  singleton boolean primary key default true check (singleton),
  revision bigint not null default 0
);
insert into turf_revision (singleton) values (true) on conflict do nothing;
alter table turf_revision enable row level security;

create or replace function bump_turf_revision() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update turf_revision set revision = revision + 1 where singleton;
  return null;
end;
$$;
drop trigger if exists turf_revision_write on turf;
create trigger turf_revision_write before insert or update or delete on turf
for each statement execute function bump_turf_revision();

create or replace function turf_snapshot() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('revision', revision::text,
    'turf', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from turf t))
  from turf_revision where singleton;
$$;

create or replace function commit_turf(expected_revision bigint, claim jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare current_revision bigint;
begin
  select revision into current_revision from turf_revision where singleton for update;
  if current_revision <> expected_revision then return false; end if;
  insert into turf (landmark_id, title, lat, lon, owner_id, owner_name, pet, claimed_at)
  values (claim->>'landmark_id', claim->>'title', (claim->>'lat')::double precision,
    (claim->>'lon')::double precision, claim->>'owner_id', claim->>'owner_name',
    claim->'pet', (claim->>'claimed_at')::timestamptz)
  on conflict (landmark_id) do update set title = excluded.title,
    lat = excluded.lat, lon = excluded.lon, owner_id = excluded.owner_id,
    owner_name = excluded.owner_name, pet = excluded.pet, claimed_at = excluded.claimed_at;
  return true;
end;
$$;

create or replace function recall_guard(player_id text, pet_id text) returns boolean
language plpgsql security definer set search_path = public as $$
declare removed integer;
begin
  perform 1 from turf_revision where singleton for update;
  delete from turf where owner_id = player_id and pet->>'id' = pet_id;
  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

revoke all on function bump_turf_revision(), turf_snapshot(), commit_turf(bigint, jsonb), recall_guard(text, text)
  from public, anon, authenticated;
grant execute on function turf_snapshot(), commit_turf(bigint, jsonb), recall_guard(text, text) to service_role;

-- Private bank mappings contain account IDs, never API keys.
create table if not exists banks (player_id text primary key, bank jsonb not null);
create table if not exists bank_transfers (
  player_id text not null, trip_id text not null, transfer jsonb not null,
  primary key (player_id, trip_id)
);
alter table banks enable row level security;
alter table bank_transfers enable row level security;

create or replace function reserve_transfer(owner text, trip text, pending jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare inserted integer;
begin
  insert into bank_transfers (player_id, trip_id, transfer) values (owner, trip, pending)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  return inserted > 0;
end;
$$;
revoke all on function reserve_transfer(text, text, jsonb) from public, anon, authenticated;
grant execute on function reserve_transfer(text, text, jsonb) to service_role;
