-- Milestone 4: sessions table + agent XP/level + completion via derivation.
-- A session is the durable artifact of one completed operation. One session
-- per operation (enforced by UNIQUE), immutable once submitted.
--
-- Operation completion = existence of a session row. No completed_at column
-- on operations (preserves the M3 immutability invariant).
--
-- Scar and wisdom are INLINE nullable columns (0 or 1 each) with paired-
-- nullability check constraints. xp_delta is non-negative.

create table public.sessions (
  id                    uuid primary key default gen_random_uuid(),
  operation_id          uuid not null unique
                          references public.operations(id) on delete cascade,
  transcript            text not null,
  output                text not null,
  reflection            text not null,
  replay_narrative      text not null,
  scar_text             text,
  scar_source_excerpt   text,
  wisdom_text           text,
  wisdom_source_excerpt text,
  xp_delta              integer not null default 0 check (xp_delta >= 0),
  submitted_at          timestamptz not null default now(),

  -- Both fields of a scar are present, or neither is. No half-set state.
  check (
    (scar_text is null and scar_source_excerpt is null) or
    (scar_text is not null and scar_source_excerpt is not null)
  ),
  check (
    (wisdom_text is null and wisdom_source_excerpt is null) or
    (wisdom_text is not null and wisdom_source_excerpt is not null)
  )
);

alter table public.sessions enable row level security;

-- Sessions inherit access via operation → project → user_id.
-- No denormalized user_id column — matches the operations RLS pattern from 0002.
create policy "sessions_select_via_project"
  on public.sessions for select
  using (
    exists (
      select 1
      from public.operations o
      join public.projects p on p.id = o.project_id
      where o.id = sessions.operation_id
        and p.user_id = auth.uid()
    )
  );

create policy "sessions_insert_via_project"
  on public.sessions for insert
  with check (
    exists (
      select 1
      from public.operations o
      join public.projects p on p.id = o.project_id
      where o.id = sessions.operation_id
        and p.user_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies. Sessions are immutable once submitted.
-- V2 may add an UPDATE policy for "regenerate replay" if voice drift surfaces.

-- ---- agents: add xp and level ----

alter table public.agents
  add column xp    integer  not null default 0,
  add column level smallint not null default 1;

-- Owners can update their own agent row. Broad at the RLS layer; the M4
-- session-submission RPC (lands in 0007) is the only path that should
-- actually mutate, and it touches only xp + level (and died_at later, when
-- the death mechanic ships). Code discipline limits columns — not RLS.
create policy "agents_update_own"
  on public.agents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
