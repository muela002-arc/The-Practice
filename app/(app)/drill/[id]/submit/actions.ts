"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getDrillById } from "@/lib/db/drills";
import {
  getAgentHistory,
  getSessionForDrill,
  submitSession,
} from "@/lib/db/sessions";
import { generateReplay } from "@/lib/llm/replay-generator";
import type { SubmitDrillFormState } from "./schema";

export async function submitDrill(
  _prevState: SubmitDrillFormState,
  formData: FormData,
): Promise<SubmitDrillFormState> {
  const drillId = formData.get("drillId");
  const transcriptRaw = formData.get("transcript");
  const outputRaw = formData.get("output");
  const reflectionRaw = formData.get("reflection");

  if (
    typeof drillId !== "string" ||
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

  const drill = await getDrillById(drillId);
  if (!drill) return { error: "Drill not found." };

  // Defense in depth: the partial unique index in 0008 catches re-submission,
  // and the RPC raises a clear error before that. This check spares the
  // round-trip when we already know.
  const existing = await getSessionForDrill(user.id, drillId);
  if (existing) redirect(`/drill/${drill.id}/replay`);

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const history = await getAgentHistory(agent.id);

  // Haiku call. ~5-10s. useFormStatus on the client swaps the button to the
  // agent's REPLAY_LOADING_MESSAGES copy.
  const replay = await generateReplay({
    agentType: agent.agentType,
    existingScars: history.scars,
    existingWisdom: history.wisdom,
    sessionTitle: drill.title,
    sessionDescription: drill.prompt,
    sessionGoal: null, // drills are standalone — no broader project goal
    transcript,
    output,
    reflection,
  });

  const result = await submitSession({
    drillId: drill.id,
    operationId: null,
    transcript,
    output,
    reflection,
    replayNarrative: replay.narrative,
    scar: replay.scar,
    wisdom: replay.wisdom,
    xpDelta: replay.xpDelta,
  });

  redirect(
    `/drill/${drill.id}/replay?leveled_up=${result.agent.leveledUp ? "true" : "false"}`,
  );
}
