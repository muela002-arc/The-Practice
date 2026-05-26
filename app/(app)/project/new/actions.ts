"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { createProject } from "@/lib/db/projects";
import { shapeProject } from "@/lib/llm/project-shaper";

export async function startProject(formData: FormData): Promise<void> {
  const briefRaw = formData.get("brief");
  if (typeof briefRaw !== "string") {
    throw new Error("Missing brief.");
  }
  const brief = briefRaw.trim();
  if (brief.length < 10) {
    throw new Error("Brief is too short. Give me at least a sentence.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  // Sonnet shaping call. ~10-15 seconds. The form's submit button swaps to the
  // agent's loading copy via useFormStatus while we wait.
  const shape = await shapeProject(agent.agentType, brief);

  const projectId = await createProject(
    user.id,
    agent.id,
    shape.title,
    shape.goal,
    brief,
    shape.operations,
  );

  redirect(`/project/${projectId}`);
}
