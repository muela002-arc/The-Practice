-- Milestone 2: agents table.
-- One active agent per user. `died_at` is a Day-1 design slot so the death
-- mechanic in a future milestone can mark agents lost without a schema change.

create table public.agents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  agent_type  text not null check (agent_type in ('atlas', 'vela', 'iris')),
  created_at  timestamptz not null default now(),
  died_at     timestamptz
);

-- One *active* (non-dead) agent per user. Multiple dead agents may coexist
-- for lineage purposes; we do not enforce that in V1.
create unique index agents_one_active_per_user
  on public.agents (user_id)
  where died_at is null;

alter table public.agents enable row level security;

create policy "agents_select_own"
  on public.agents for select
  using (auth.uid() = user_id);

create policy "agents_insert_own"
  on public.agents for insert
  with check (auth.uid() = user_id);

-- No update/delete policies. Agents are permanent until death mechanic ships,
-- which will add an UPDATE policy scoped to setting died_at.
