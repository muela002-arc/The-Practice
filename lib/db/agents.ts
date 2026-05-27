import type { AgentType } from "@/lib/agent/system-prompt";
import { createClient } from "@/lib/db/server";

export type ActiveAgent = {
  id: string;
  agentType: AgentType;
  createdAt: string;
  xp: number;
  level: number;
};

export async function getActiveAgentForUser(
  userId: string,
): Promise<ActiveAgent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("id, agent_type, created_at, xp, level")
    .eq("user_id", userId)
    .is("died_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    agentType: data.agent_type,
    createdAt: data.created_at,
    xp: data.xp,
    level: data.level,
  };
}

export type CreateAgentResult =
  | { ok: true; agent: ActiveAgent }
  | { ok: false; reason: "already-has-agent" | "unknown"; message: string };

export async function createAgentForUser(
  userId: string,
  agentType: AgentType,
): Promise<CreateAgentResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .insert({ user_id: userId, agent_type: agentType })
    .select("id, agent_type, created_at, xp, level")
    .single();

  if (error) {
    // 23505 = unique_violation. The agents_one_active_per_user partial index
    // means the user already has an active agent.
    if (error.code === "23505") {
      return {
        ok: false,
        reason: "already-has-agent",
        message: "You already have an active agent.",
      };
    }
    return { ok: false, reason: "unknown", message: error.message };
  }
  return {
    ok: true,
    agent: {
      id: data.id,
      agentType: data.agent_type,
      createdAt: data.created_at,
      xp: data.xp,
      level: data.level,
    },
  };
}
