-- Milestone 4: atomic session submission RPC.
-- Inserts a session row + updates the agent's xp and level in one transaction.
-- Returns the new session row + the agent's xp/level + a leveled_up flag, so
-- the caller can render "you leveled up" without a second query.
--
-- Level thresholds (from .claude/skills/design-decisions.md):
--   L1: 0-99, L2: 100-249, L3: 250-499, L4: 500-899, L5: 900+

create function public.create_session_with_completion(
  p_operation_id          uuid,
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
  -- Look up the project owner + agent via the operation.
  select p.user_id, p.agent_id
    into v_user_id, v_agent_id
    from public.operations o
    join public.projects   p on p.id = o.project_id
   where o.id = p_operation_id;

  if v_user_id is null then
    raise exception 'create_session_with_completion: operation not found';
  end if;
  if auth.uid() is null or auth.uid() <> v_user_id then
    raise exception 'create_session_with_completion: caller does not own this operation';
  end if;

  -- Pair consistency. The DB check constraints from 0006 enforce this too,
  -- but the explicit check fires before INSERT with a clearer message.
  if (p_scar_text is null) <> (p_scar_source_excerpt is null) then
    raise exception 'create_session_with_completion: scar_text and scar_source_excerpt must both be null or both not null';
  end if;
  if (p_wisdom_text is null) <> (p_wisdom_source_excerpt is null) then
    raise exception 'create_session_with_completion: wisdom_text and wisdom_source_excerpt must both be null or both not null';
  end if;

  if p_xp_delta < 0 then
    raise exception 'create_session_with_completion: xp_delta must be non-negative';
  end if;

  -- Sequential-completion check: every earlier-ordinal operation in this
  -- project must already have a session. Prevents skipping via direct API.
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

  -- Insert the session. UNIQUE(operation_id) is what catches re-submissions;
  -- the exception handler at the bottom translates that error.
  insert into public.sessions (
    operation_id, transcript, output, reflection, replay_narrative,
    scar_text, scar_source_excerpt, wisdom_text, wisdom_source_excerpt, xp_delta
  ) values (
    p_operation_id, p_transcript, p_output, p_reflection, p_replay_narrative,
    p_scar_text, p_scar_source_excerpt, p_wisdom_text, p_wisdom_source_excerpt, p_xp_delta
  )
  returning * into v_session;

  -- Capture old state, compute new state, then write.
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
    raise exception 'create_session_with_completion: a session already exists for this operation';
end;
$$;

revoke execute on function public.create_session_with_completion(
  uuid, text, text, text, text, text, text, text, text, integer
) from public;
grant  execute on function public.create_session_with_completion(
  uuid, text, text, text, text, text, text, text, text, integer
) to authenticated;
