"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getOperationById, getProjectById } from "@/lib/db/projects";
import { getAgentHistory, submitSession } from "@/lib/db/sessions";
import { generateReplay } from "@/lib/llm/replay-generator";
import type { SubmitFormState } from "./schema";

export async function submitOperation(
  _prevState: SubmitFormState,
  formData: FormData,
): Promise<SubmitFormState> {
  const operationId = formData.get("operationId");
  const transcriptRaw = formData.get("transcript");
  const outputRaw = formData.get("output");
  const reflectionRaw = formData.get("reflection");

  if (
    typeof operationId !== "string" ||
    typeof transcriptRaw !== "string" ||
    typeof outputRaw !== "string" ||
    typeof reflectionRaw !== "string"
  ) {
    return { error: "Missing form fields." };
  }

  const transcript = transcriptRaw.trim();
  const output = outputRaw.trim();
  const reflection = reflectionRaw.trim();

  if (transcript.length < 50) {
    return {
      error:
        "Paste the full five-command conversation. Your transcript is too short.",
    };
  }
  if (output.length < 5) {
    return {
      error: "Paste a URL or the result text — at least a few characters.",
    };
  }
  if (reflection.length < 60) {
    return {
      error:
        "Write two or three sentences in your reflection — what did your agent do well or poorly?",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const operation = await getOperationById(operationId);
  if (!operation) return { error: "Operation not found." };

  const project = await getProjectById(user.id, operation.projectId);
  if (!project) return { error: "Project not found." };

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  // Pull the agent's accumulated scars + wisdom so the LLM doesn't re-issue them.
  const history = await getAgentHistory(agent.id);

  // Haiku call. ~5-10s. useFormStatus on the client swaps the submit label
  // to the agent's REPLAY_LOADING_MESSAGES copy while we wait. Errors here
  // (Zod retries exhausted, API down) throw — the nearest error boundary
  // catches them. Validation errors above return as state for inline display.
  const replay = await generateReplay({
    agentType: agent.agentType,
    existingScars: history.scars,
    existingWisdom: history.wisdom,
    operationTitle: operation.title,
    operationDescription: operation.description,
    projectGoal: project.goal,
    transcript,
    output,
    reflection,
  });

  const result = await submitSession({
    operationId: operation.id,
    transcript,
    output,
    reflection,
    replayNarrative: replay.narrative,
    scar: replay.scar,
    wisdom: replay.wisdom,
    xpDelta: replay.xpDelta,
  });

  // Pass the level-up signal through the URL. It's an ephemeral celebration —
  // refreshing the replay page later won't re-show it, which is correct.
  redirect(
    `/operation/${operation.id}/replay?leveled_up=${result.agent.leveledUp ? "true" : "false"}`,
  );
}
