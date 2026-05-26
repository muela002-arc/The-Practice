-- Milestone 3: helper RPC for transactional project creation.
-- Pairs with 0002 (projects + operations tables).
--
-- PostgREST does not support multi-statement transactions across separate
-- .from().insert() calls. The RPC exists so that lib/db/projects.ts can
-- insert a project and its 3-5 operations in a single ACID transaction.
-- If any operation insert fails (or the agent check fails, or the count is
-- wrong), the entire function rolls back — no orphan project rows.

create or replace function public.create_project_with_operations(
  p_user_id     uuid,
  p_agent_id    uuid,
  p_title       text,
  p_description text,
  p_operations  jsonb
)
returns uuid
language plpgsql
security invoker  -- run with caller's permissions; RLS applies normally
as $$
declare
  v_project_id uuid;
  v_op jsonb;
  v_count int;
  v_ordinal smallint;
begin
  -- Caller must match the user they're inserting under. RLS on the projects
  -- insert would catch this too, but the explicit check produces a clearer
  -- error than an RLS rejection at row level.
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'create_project_with_operations: caller does not match p_user_id';
  end if;

  -- The agent must belong to the caller and be active. The FK alone would
  -- accept any existing agent_id including another user's — defense in depth.
  if not exists (
    select 1 from public.agents
    where id = p_agent_id
      and user_id = p_user_id
      and died_at is null
  ) then
    raise exception 'create_project_with_operations: agent_id does not belong to user or is not active';
  end if;

  -- Operation count: M3 spec is 3-5 operations per project.
  v_count := jsonb_array_length(p_operations);
  if v_count < 3 or v_count > 5 then
    raise exception 'create_project_with_operations: operations must be 3-5, got %', v_count;
  end if;

  insert into public.projects (user_id, agent_id, title, description)
    values (p_user_id, p_agent_id, p_title, p_description)
    returning id into v_project_id;

  -- Ordinals are assigned from array order, 1-indexed. Caller does NOT supply
  -- ordinal — array position is the source of truth so the API stays simple.
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

-- Authenticated users only. The function's first check requires auth.uid(),
-- so anonymous callers would fail anyway, but explicit grants are cleaner.
revoke execute on function public.create_project_with_operations(uuid, uuid, text, text, jsonb) from public;
grant  execute on function public.create_project_with_operations(uuid, uuid, text, text, jsonb) to authenticated;
