-- Milestone 5: extend create_session_with_completion to accept either an
-- operation_id (project session) or a drill_id (drill session). The signature
-- changes, so Postgres requires drop+recreate (same pattern as 0005).

drop function if exists public.create_session_with_completion(
  uuid, text, text, text, text, text, text, text, text, integer
);

create function public.create_session_with_completion(
  p_operation_id          uuid,
  p_drill_id              uuid,
  p_transcript            text,
  p_output                text,
  p_reflection            text,
  p_replay_narrative      text,
  p_scar_text             text,
  p_scar_source_excerpt   text,
  p_wisdom_text           text,
  p_wisdom_source_excerpt text,
  p_xp_delta              integer
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_user_id    uuid;
  v_agent_id   uuid;
  v_current_xp integer;
  v_old_level  smallint;
  v_new_xp     integer;
  v_new_level  smallint;
  v_session    public.sessions%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'create_session_with_completion: not authenticated';
  end if;

  -- Exactly one of (operation_id, drill_id). The DB check enforces too,
  -- but the explicit error fires before INSERT with a clearer message.
  if (p_operation_id is null) = (p_drill_id is null) then
    raise exception 'create_session_with_completion: exactly one of operation_id or drill_id must be set';
  end if;

  -- Active agent
  select id into v_agent_id
    from public.agents
   where user_id = v_user_id and died_at is null;
  if v_agent_id is null then
    raise exception 'create_session_with_completion: user has no active agent';
  end if;

  -- Operation-specific validation
  if p_operation_id is not null then
    if not exists (
      select 1 from public.operations o
        join public.projects p on p.id = o.project_id
       where o.id = p_operation_id and p.user_id = v_user_id
    ) then
      raise exception 'create_session_with_completion: operation not found or not owned by caller';
    end if;

    if exists (
      select 1
        from public.operations earlier, public.operations target
       where target.id          = p_operation_id
         and earlier.project_id = target.project_id
         and earlier.ordinal    < target.ordinal
         and not exists (
           select 1 from public.sessions s where s.operation_id = earlier.id
         )
    ) then
      raise exception 'create_session_with_completion: prior operations in this project must be completed first';
    end if;
  end if;

  -- Drill-specific validation
  if p_drill_id is not null then
    if not exists (select 1 from public.drills where id = p_drill_id) then
      raise exception 'create_session_with_completion: drill not found';
    end if;
    if exists (
      select 1 from public.sessions
       where drill_id = p_drill_id and user_id = v_user_id
    ) then
      raise exception 'create_session_with_completion: you have already completed this drill';
    end if;
  end if;

  -- Pair consistency
  if (p_scar_text is null) <> (p_scar_source_excerpt is null) then
    raise exception 'create_session_with_completion: scar_text and scar_source_excerpt must both be null or both not null';
  end if;
  if (p_wisdom_text is null) <> (p_wisdom_source_excerpt is null) then
    raise exception 'create_session_with_completion: wisdom_text and wisdom_source_excerpt must both be null or both not null';
  end if;
  if p_xp_delta < 0 then
    raise exception 'create_session_with_completion: xp_delta must be non-negative';
  end if;

  -- Insert (user_id derived from auth.uid(), not caller-supplied — RLS
  -- would block a mismatch anyway, but deriving here makes that explicit)
  insert into public.sessions (
    operation_id, drill_id, user_id,
    transcript, output, reflection, replay_narrative,
    scar_text, scar_source_excerpt, wisdom_text, wisdom_source_excerpt,
    xp_delta
  ) values (
    p_operation_id, p_drill_id, v_user_id,
    p_transcript, p_output, p_reflection, p_replay_narrative,
    p_scar_text, p_scar_source_excerpt, p_wisdom_text, p_wisdom_source_excerpt,
    p_xp_delta
  )
  returning * into v_session;

  -- Compute new agent state and write it.
  select xp, level into v_current_xp, v_old_level
    from public.agents where id = v_agent_id;
  v_new_xp    := v_current_xp + p_xp_delta;
  v_new_level := case
    when v_new_xp >= 900 then 5
    when v_new_xp >= 500 then 4
    when v_new_xp >= 250 then 3
    when v_new_xp >= 100 then 2
    else 1
  end;
  update public.agents
     set xp = v_new_xp, level = v_new_level
   where id = v_agent_id;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id',                    v_session.id,
      'operation_id',          v_session.operation_id,
      'drill_id',              v_session.drill_id,
      'user_id',               v_session.user_id,
      'transcript',            v_session.transcript,
      'output',                v_session.output,
      'reflection',            v_session.reflection,
      'replay_narrative',      v_session.replay_narrative,
      'scar_text',             v_session.scar_text,
      'scar_source_excerpt',   v_session.scar_source_excerpt,
      'wisdom_text',           v_session.wisdom_text,
      'wisdom_source_excerpt', v_session.wisdom_source_excerpt,
      'xp_delta',              v_session.xp_delta,
      'submitted_at',          v_session.submitted_at
    ),
    'agent', jsonb_build_object(
      'xp',         v_new_xp,
      'level',      v_new_level,
      'leveled_up', (v_old_level <> v_new_level)
    )
  );
exception
  when unique_violation then
    -- Covers both operation_id UNIQUE (re-submission) and the partial unique
    -- on (user_id, drill_id) (drill repeat for same user).
    raise exception 'create_session_with_completion: a session already exists for this operation or drill';
end;
$$;

revoke execute on function public.create_session_with_completion(
  uuid, uuid, text, text, text, text, text, text, text, text, integer
) from public;
grant  execute on function public.create_session_with_completion(
  uuid, uuid, text, text, text, text, text, text, text, text, integer
) to authenticated;
