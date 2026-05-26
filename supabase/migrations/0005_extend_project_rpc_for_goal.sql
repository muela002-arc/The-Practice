-- Milestone 3: extend create_project_with_operations to accept the agent-
-- generated `goal` text. Replaces the M3-initial signature from 0003.
-- The goal lands in the projects.goal column added by 0004.
--
-- `create or replace function` cannot change a parameter list — Postgres
-- treats it as a different function entirely. Drop the prior signature
-- explicitly, then create the new one.

drop function if exists public.create_project_with_operations(uuid, uuid, text, text, jsonb);

create function public.create_project_with_operations(
  p_user_id     uuid,
  p_agent_id    uuid,
  p_title       text,
  p_goal        text,
  p_description text,
  p_operations  jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_project_id uuid;
  v_op jsonb;
  v_count int;
  v_ordinal smallint;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'create_project_with_operations: caller does not match p_user_id';
  end if;

  if not exists (
    select 1 from public.agents
    where id = p_agent_id
      and user_id = p_user_id
      and died_at is null
  ) then
    raise exception 'create_project_with_operations: agent_id does not belong to user or is not active';
  end if;

  v_count := jsonb_array_length(p_operations);
  if v_count < 3 or v_count > 5 then
    raise exception 'create_project_with_operations: operations must be 3-5, got %', v_count;
  end if;

  insert into public.projects (user_id, agent_id, title, goal, description)
    values (p_user_id, p_agent_id, p_title, p_goal, p_description)
    returning id into v_project_id;

  v_ordinal := 0;
  for v_op in select * from jsonb_array_elements(p_operations) loop
    v_ordinal := v_ordinal + 1;
    insert into public.operations (project_id, ordinal, title, description)
      values (
        v_project_id,
        v_ordinal,
        v_op->>'title',
        v_op->>'description'
      );
  end loop;

  return v_project_id;
end;
$$;

revoke execute on function public.create_project_with_operations(uuid, uuid, text, text, text, jsonb) from public;
grant  execute on function public.create_project_with_operations(uuid, uuid, text, text, text, jsonb) to authenticated;
