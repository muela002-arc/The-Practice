"use server";

import { redirect } from "next/navigation";
import { AGENT_TYPES, type AgentType } from "@/lib/agent/system-prompt";
import { createClient } from "@/lib/db/server";
import { createAgentForUser } from "@/lib/db/agents";

function isAgentType(value: unknown): value is AgentType {
  return (
    typeof value === "string" && (AGENT_TYPES as readonly string[]).includes(value)
  );
}

export async function pickAgent(formData: FormData): Promise<void> {
  const choice = formData.get("agent");
  if (!isAgentType(choice)) {
    throw new Error("Invalid agent choice.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const result = await createAgentForUser(user.id, choice);
  // Already-has-agent is a benign race: send them to their session.
  if (!result.ok && result.reason !== "already-has-agent") {
    throw new Error(result.message);
  }
  redirect("/session");
}
