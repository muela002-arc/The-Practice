-- Milestone 5: drills as standalone five-command sessions, with the sessions
-- table unified across operations and drills.
--
-- Schema changes to sessions:
--   - operation_id becomes nullable
--   - new drill_id (nullable, FK to drills, on delete restrict so retiring
--     a drill cannot orphan historical sessions referencing it)
--   - new user_id (denormalized; needed because drill sessions cannot reach
--     user_id via operation -> project)
--   - exactly-one check on (operation_id, drill_id)
--   - partial unique on (user_id, drill_id) — one attempt per drill per user
--     (anti-grinding default; can be lifted later)
--   - RLS rewritten from EXISTS-through-projects to user_id = auth.uid()
--     (the RPC still validates operation ownership and drill validity).

-- ---- drills ----

create table public.drills (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  prompt      text not null check (length(prompt) <= 2000),
  created_at  timestamptz not null default now()
);

alter table public.drills enable row level security;

-- Drills are global content readable by any authenticated user. No INSERT /
-- UPDATE / DELETE policies — drills are seeded via service role (see
-- supabase/seeds/drills.sql).
create policy "drills_select_authenticated"
  on public.drills for select
  to authenticated
  using (true);

-- ---- sessions: structural changes ----

-- Drop NOT NULL on operation_id so drill sessions can omit it.
-- The existing UNIQUE constraint on operation_id is preserved — Postgres
-- treats nulls as distinct, so multiple drill rows with NULL operation_id
-- coexist freely while operations still get one session each.
alter table public.sessions
  alter column operation_id drop not null;

-- New drill_id column. RESTRICT on delete so a retired drill cannot orphan
-- the historical sessions that reference it.
alter table public.sessions
  add column drill_id uuid references public.drills(id) on delete restrict;

-- New user_id column. Nullable at first so we can backfill from
-- operation -> project, then set NOT NULL.
alter table public.sessions
  add column user_id uuid references auth.users(id) on delete cascade;

update public.sessions s
   set user_id = p.user_id
  from public.operations o
  join public.projects   p on p.id = o.project_id
 where o.id = s.operation_id
   and s.user_id is null;

alter table public.sessions
  alter column user_id set not null;

-- Exactly one of (operation_id, drill_id) is non-null. Existing rows have
-- operation_id set and drill_id null, so they pass.
alter table public.sessions
  add constraint sessions_one_source_check
  check (
    (operation_id is not null and drill_id is null) or
    (operation_id is null     and drill_id is not null)
  );

-- One session per user per drill. Operations are already covered by the
-- table-level UNIQUE on operation_id.
create unique index sessions_one_per_user_drill
  on public.sessions (user_id, drill_id)
  where drill_id is not null;

-- Index for the new RLS check + common queries.
create index sessions_user_id on public.sessions (user_id);

-- ---- sessions: RLS rewrite ----

drop policy if exists "sessions_select_via_project" on public.sessions;
drop policy if exists "sessions_insert_via_project" on public.sessions;

create policy "sessions_select_own"
  on public.sessions for select
  using (user_id = auth.uid());

create policy "sessions_insert_own"
  on public.sessions for insert
  with check (user_id = auth.uid());

-- No UPDATE or DELETE policies. Sessions remain immutable.
