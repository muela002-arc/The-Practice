import { createClient } from "@/lib/db/server";

// ---------- Types ----------

export type ScarOrWisdom = {
  text: string;
  sourceExcerpt: string;
};

export type SubmitSessionInput = {
  operationId: string;
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
  operationId: string;
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
// Inserts the session row + updates the agent's xp + level in one transaction
// (see supabase/migrations/0007_create_session_rpc.sql).
//
// The RPC handles all guards (ownership, sequential completion, pair
// consistency, xp >= 0, unique-violation translation). This function maps
// camelCase TS → snake_case RPC args and back.
export async function submitSession(
  input: SubmitSessionInput,
): Promise<SubmittedSession> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "create_session_with_completion",
    {
      p_operation_id: input.operationId,
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
    session: {
      id: data.session.id,
      operationId: data.session.operation_id,
      transcript: data.session.transcript,
      output: data.session.output,
      reflection: data.session.reflection,
      replayNarrative: data.session.replay_narrative,
      scar:
        data.session.scar_text !== null &&
        data.session.scar_source_excerpt !== null
          ? {
              text: data.session.scar_text,
              sourceExcerpt: data.session.scar_source_excerpt,
            }
          : null,
      wisdom:
        data.session.wisdom_text !== null &&
        data.session.wisdom_source_excerpt !== null
          ? {
              text: data.session.wisdom_text,
              sourceExcerpt: data.session.wisdom_source_excerpt,
            }
          : null,
      xpDelta: data.session.xp_delta,
      submittedAt: data.session.submitted_at,
    },
    agent: {
      xp: data.agent.xp,
      level: data.agent.level,
      leveledUp: data.agent.leveled_up,
    },
  };
}

// Returns the session for a given operation if it exists, else null.
// RLS already restricts to the caller's operations regardless of userId
// passed; the parameter exists for API symmetry with the other query helpers.
export async function getSessionForOperation(
  userId: string,
  operationId: string,
): Promise<SessionRow | null> {
  void userId;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, operation_id, transcript, output, reflection, replay_narrative, scar_text, scar_source_excerpt, wisdom_text, wisdom_source_excerpt, xp_delta, submitted_at",
    )
    .eq("operation_id", operationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    operationId: data.operation_id,
    transcript: data.transcript,
    output: data.output,
    reflection: data.reflection,
    replayNarrative: data.replay_narrative,
    scar:
      data.scar_text !== null && data.scar_source_excerpt !== null
        ? { text: data.scar_text, sourceExcerpt: data.scar_source_excerpt }
        : null,
    wisdom:
      data.wisdom_text !== null && data.wisdom_source_excerpt !== null
        ? { text: data.wisdom_text, sourceExcerpt: data.wisdom_source_excerpt }
        : null,
    xpDelta: data.xp_delta,
    submittedAt: data.submitted_at,
  };
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
  return new Set((data ?? []).map((row) => row.operation_id));
}

// All the scars and wisdom an agent has accumulated across every project
// they have shaped. Ordered oldest → newest by session submission time. Used
// by buildSystemPrompt to populate the scar/wisdom sections of the prompt
// the user pastes into their AI tool.
export async function getAgentHistory(agentId: string): Promise<AgentHistory> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "scar_text, wisdom_text, submitted_at, operations!inner(project_id, projects!inner(agent_id))",
    )
    .eq("operations.projects.agent_id", agentId)
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
