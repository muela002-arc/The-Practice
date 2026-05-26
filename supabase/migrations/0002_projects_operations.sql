-- Milestone 3: projects and operations.
-- A project is the agent-shaped artifact of a user's free-text brief.
-- Operations are 3-5 sized chunks meant to fit one five-command session each.
--
-- M3 keeps both tables minimal:
--   - No status / completion columns — active operation is derived (M4 adds
--     submissions, which makes "active = lowest ordinal without a completed
--     submission"). For M3 alone, the first ordinal is the active one.
--   - No UPDATE/DELETE policies — projects and operations are immutable in V1.
--     M4 adds UPDATE for marking operations complete when submissions ship.
--   - 3-5 operation count is enforced at the application layer, not via a DB
--     constraint (a count-bounded check would need a deferrable trigger).

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  agent_id    uuid not null references public.agents(id) on delete restrict,
  title       text not null,                -- agent-generated short title
  description text not null,                -- the user's original free-text brief, preserved verbatim
  created_at  timestamptz not null default now()
);

create index projects_user_id on public.projects (user_id);

create table public.operations (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  ordinal     smallint not null check (ordinal >= 1),
  title       text not null,
  description text not null,
  created_at  timestamptz not null default now()
);

-- Ordinals are unique within a project and serve as the order pointer.
create unique index operations_project_ordinal
  on public.operations (project_id, ordinal);

alter table public.projects   enable row level security;
alter table public.operations enable row level security;

create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = user_id);

-- Operations inherit access via their project — no denormalized user_id column.
create policy "operations_select_via_project"
  on public.operations for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = operations.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "operations_insert_via_project"
  on public.operations for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = operations.project_id
        and projects.user_id = auth.uid()
    )
  );
