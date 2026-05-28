import { createClient } from "@/lib/db/server";

// ---------- Types ----------

export type ScarOrWisdom = {
  text: string;
  sourceExcerpt: string;
};

// M5: a submission is either operation-scoped (project work) or drill-scoped
// (standalone drill). The RPC enforces exactly-one-non-null at runtime.
// Both fields are optional in TS; callers pass whichever applies.
export type SubmitSessionInput = {
  operationId?: string | null;
  drillId?: string | null;
  transcript: string;
  output: string;
  reflection: string;
  replayNarrative: string;
  scar: ScarOrWisdom | null;
  wisdom: ScarOrWisdom | null;
  xpDelta: number;
};

export type SessionRow = {
  id: string;
  operationId: string | null;
  drillId: string | null;
  userId: string;
  transcript: string;
  output: string;
  reflection: string;
  replayNarrative: string;
  scar: ScarOrWisdom | null;
  wisdom: ScarOrWisdom | null;
  xpDelta: number;
  submittedAt: string;
};

export type SubmittedSession = {
  session: SessionRow;
  agent: {
    xp: number;
    level: number;
    leveledUp: boolean;
  };
};

export type AgentHistory = {
  scars: string[];
  wisdom: string[];
};

// ---------- Public ----------

// Atomic session submission via the create_session_with_completion RPC.
// The RPC handles all guards (auth, exactly-one source, ownership, sequential
// completion for operations, drill validity, pair consistency, xp >= 0,
// unique-violation translation).
export async function submitSession(
  input: SubmitSessionInput,
): Promise<SubmittedSession> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "create_session_with_completion",
    {
      p_operation_id: input.operationId ?? null,
      p_drill_id: input.drillId ?? null,
      p_transcript: input.transcript,
      p_output: input.output,
      p_reflection: input.reflection,
      p_replay_narrative: input.replayNarrative,
      p_scar_text: input.scar?.text ?? null,
      p_scar_source_excerpt: input.scar?.sourceExcerpt ?? null,
      p_wisdom_text: input.wisdom?.text ?? null,
      p_wisdom_source_excerpt: input.wisdom?.sourceExcerpt ?? null,
      p_xp_delta: input.xpDelta,
    },
  );
  if (error) throw error;
  if (!data) {
    throw new Error(
      "submitSession: create_session_with_completion returned no payload",
    );
  }

  return {
    session: rowFromRpcSession(data.session),
    agent: {
      xp: data.agent.xp,
      level: data.agent.level,
      leveledUp: data.agent.leveled_up,
    },
  };
}

// Returns the session for a given operation if it exists, else null.
// RLS already restricts to the caller's sessions (user_id = auth.uid()) per
// the M5 RLS rewrite; the userId parameter is retained for API symmetry with
// the other query helpers.
export async function getSessionForOperation(
  userId: string,
  operationId: string,
): Promise<SessionRow | null> {
  void userId;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, operation_id, drill_id, user_id, transcript, output, reflection, replay_narrative, scar_text, scar_source_excerpt, wisdom_text, wisdom_source_excerpt, xp_delta, submitted_at",
    )
    .eq("operation_id", operationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowFromDbSession(data);
}

// Returns the set of drill ids the given user has already completed. Used
// by the drills index to dim completed drills and by the drill detail page
// to redirect to /drill/[id]/replay when the user has already submitted.
export async function getDrillIdsCompletedByUser(
  userId: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("drill_id")
    .eq("user_id", userId)
    .not("drill_id", "is", null);
  if (error) throw error;
  const ids = new Set<string>();
  for (const row of data ?? []) {
    if (row.drill_id !== null) ids.add(row.drill_id);
  }
  return ids;
}

// Returns the session for a given drill if it exists, else null. Same
// pattern as getSessionForOperation. RLS scopes to the caller via user_id.
export async function getSessionForDrill(
  userId: string,
  drillId: string,
): Promise<SessionRow | null> {
  void userId;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, operation_id, drill_id, user_id, transcript, output, reflection, replay_narrative, scar_text, scar_source_excerpt, wisdom_text, wisdom_source_excerpt, xp_delta, submitted_at",
    )
    .eq("drill_id", drillId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowFromDbSession(data);
}

// Returns the set of operation ids (from the given list) that already have a
// session. Used to derive "next active operation" = lowest-ordinal op whose
// id is NOT in this set. One query for the whole project.
export async function getOperationIdsWithSessions(
  operationIds: readonly string[],
): Promise<Set<string>> {
  if (operationIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("operation_id")
    .in("operation_id", [...operationIds]);
  if (error) throw error;
  const ids = new Set<string>();
  for (const row of data ?? []) {
    if (row.operation_id !== null) ids.add(row.operation_id);
  }
  return ids;
}

// All the scars and wisdom an agent has accumulated. Ordered oldest → newest
// by session submission time. Used by buildSystemPrompt to populate the
// scar/wisdom sections of the prompt the user pastes into their AI tool.
//
// V1 simplification: one active agent per user means the agent's history =
// the user's session history. We look up user_id from the agent first, then
// query sessions by user_id. V2 with the death mechanic will need agent_id
// stored on sessions to disambiguate per-agent history; for now, user_id is
// sufficient and covers both operation sessions and drill sessions in one
// query.
export async function getAgentHistory(agentId: string): Promise<AgentHistory> {
  const supabase = await createClient();

  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("user_id")
    .eq("id", agentId)
    .maybeSingle();
  if (agentErr) throw agentErr;
  if (!agent) return { scars: [], wisdom: [] };

  const { data, error } = await supabase
    .from("sessions")
    .select("scar_text, wisdom_text, submitted_at")
    .eq("user_id", agent.user_id)
    .order("submitted_at", { ascending: true });
  if (error) throw error;

  const scars: string[] = [];
  const wisdom: string[] = [];
  for (const row of data ?? []) {
    if (row.scar_text) scars.push(row.scar_text);
    if (row.wisdom_text) wisdom.push(row.wisdom_text);
  }
  return { scars, wisdom };
}

// ---------- Internal mappers ----------

type DbSessionRow = {
  id: string;
  operation_id: string | null;
  drill_id: string | null;
  user_id: string;
  transcript: string;
  output: string;
  reflection: string;
  replay_narrative: string;
  scar_text: string | null;
  scar_source_excerpt: string | null;
  wisdom_text: string | null;
  wisdom_source_excerpt: string | null;
  xp_delta: number;
  submitted_at: string;
};

function rowFromDbSession(row: DbSessionRow): SessionRow {
  return {
    id: row.id,
    operationId: row.operation_id,
    drillId: row.drill_id,
    userId: row.user_id,
    transcript: row.transcript,
    output: row.output,
    reflection: row.reflection,
    replayNarrative: row.replay_narrative,
    scar:
      row.scar_text !== null && row.scar_source_excerpt !== null
        ? { text: row.scar_text, sourceExcerpt: row.scar_source_excerpt }
        : null,
    wisdom:
      row.wisdom_text !== null && row.wisdom_source_excerpt !== null
        ? { text: row.wisdom_text, sourceExcerpt: row.wisdom_source_excerpt }
        : null,
    xpDelta: row.xp_delta,
    submittedAt: row.submitted_at,
  };
}

// The RPC return payload has the same field names as the row.
function rowFromRpcSession(row: DbSessionRow): SessionRow {
  return rowFromDbSession(row);
}
