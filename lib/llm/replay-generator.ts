// Replay generation: the M4 LLM call that turns a completed session into a
// voice-shaped narrative, optional scar, optional wisdom, and an XP delta.
//
// Single-shot. Forced tool_use via tool_choice. Zod validation. One retry on
// validation failure via the tool_result protocol (per agent-llm-calls.md).
// On second failure, throws — the server action surfaces in agent voice.

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildSystemPrompt, type AgentType } from "@/lib/agent/system-prompt";
import { claudeCall } from "@/lib/llm/client";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2048;

// ---------- Schemas ----------

const ScarWisdomSchema = z.object({
  text: z.string().min(1).max(200),
  sourceExcerpt: z.string().min(1).max(500),
});

export const ReplayResultSchema = z.object({
  narrative: z.string().min(1).max(3000),
  // .nullish() = nullable + optional. The tool can omit the field entirely OR
  // set it to null. Normalized to plain null before returning to callers.
  scar: ScarWisdomSchema.nullish(),
  wisdom: ScarWisdomSchema.nullish(),
  xpDelta: z.number().int().min(0).max(150),
});

export type ReplayInput = {
  agentType: AgentType;
  // Existing scars/wisdom for this agent — passed in so the model doesn't
  // re-issue them. Empty for the agent's first session.
  existingScars: string[];
  existingWisdom: string[];
  // What the user worked
  operationTitle: string;
  operationDescription: string;
  projectGoal: string;
  // The submission
  transcript: string;
  output: string;
  reflection: string;
};

export type ReplayResult = {
  narrative: string;
  scar: { text: string; sourceExcerpt: string } | null;
  wisdom: { text: string; sourceExcerpt: string } | null;
  xpDelta: number;
};

// ---------- Prompt + tool ----------

const REPLAY_RULES = `# What you are doing right now

A session has just ended. The user worked one operation of a project with you — in their AI tool of choice (Claude, ChatGPT, Cursor, Lovable, etc.) — and submitted three things: the conversation transcript, what they shipped or produced, and a written reflection. The next message contains all of that, plus the operation and project context, plus the scars and wisdom you have already accumulated.

Produce four things by calling the \`replay_session\` tool. That is the only valid way to respond.

1. **A replay narrative.** A few paragraphs in your voice. First-person ("I"), present tense for the action, past tense for the outcome. Honest — if the user did not ship, the replay says so. If they shipped poorly, the replay says so. Flattering replays break the platform. A great replay is a great short story.

2. **A scar** (or omit). A short text tag in your voice describing a doctrine-relevant failure mode you observed in the session, paired with a \`sourceExcerpt\` — a verbatim quote from the transcript, output, or reflection that justifies it. Omit the field entirely if no doctrine-relevant failure surfaced.

3. **A wisdom** (or omit). A short text tag in your voice describing a lesson the user can carry forward — something that counterbalances your doctrine's weakness — paired with a verbatim \`sourceExcerpt\`. Omit the field entirely if no such lesson surfaced.

4. **An \`xpDelta\`** (0-150). Your judgment on how much XP this session earned. Scale:
   - Shipped well, doctrine respected: 80-150
   - Partial ship, or doctrine slipped: 30-80
   - Did not ship but learned: 10-30
   - No effort visible: 0

Rules:

- The \`sourceExcerpt\` for any scar or wisdom MUST be a verbatim quote from the submission. Do not paraphrase or invent. If you cannot find a real quote, omit the scar/wisdom entirely.
- Scars match your doctrine's predictable failure modes (Atlas: missed edges, skipped polish, undertesting. Vela: over-engineering, scope creep, analysis paralysis. Iris: hesitation, over-validation, audit-mode lock-in). A scar that doesn't match your doctrine is not your scar to give — omit it.
- The user's existing scars and wisdom are listed in the next message. Do not repeat any of them. New scars and wisdom are genuinely new observations, not paraphrases of old ones.
- Your voice rules apply to the narrative, the scar text, and the wisdom text. Drift breaks the platform.`;

const REPLAY_SESSION_TOOL: Anthropic.Messages.Tool = {
  name: "replay_session",
  description:
    "Return the replay narrative, optional scar, optional wisdom, and XP delta for the completed session.",
  input_schema: {
    type: "object",
    properties: {
      narrative: {
        type: "string",
        description:
          "Short voice-shaped recap of what happened. First-person, present tense for action, past tense for outcome. A few paragraphs. Honest, not flattering.",
      },
      scar: {
        type: "object",
        description:
          "A doctrine-relevant failure mode observed in the session. Omit this field entirely if no such failure surfaced.",
        properties: {
          text: {
            type: "string",
            description:
              "Short scar text in your voice. Specific, not generic. Under 200 characters.",
          },
          sourceExcerpt: {
            type: "string",
            description:
              "Verbatim quote from the transcript, output, or reflection that justifies this scar. Do not paraphrase.",
          },
        },
        required: ["text", "sourceExcerpt"],
      },
      wisdom: {
        type: "object",
        description:
          "A lesson that counterbalances your doctrine's weakness. Omit this field entirely if no such lesson surfaced.",
        properties: {
          text: {
            type: "string",
            description:
              "Short wisdom text in your voice. Specific, not generic. Under 200 characters.",
          },
          sourceExcerpt: {
            type: "string",
            description:
              "Verbatim quote from the submission that justifies this wisdom. Do not paraphrase.",
          },
        },
        required: ["text", "sourceExcerpt"],
      },
      xpDelta: {
        type: "integer",
        minimum: 0,
        maximum: 150,
        description:
          "XP earned this session. Shipped well: 80-150. Partial: 30-80. No ship + lesson: 10-30. No effort: 0.",
      },
    },
    required: ["narrative", "xpDelta"],
  },
};

const TOOL_CHOICE = { type: "tool" as const, name: "replay_session" };

// ---------- Helpers ----------

function extractToolUse(
  response: Anthropic.Messages.Message,
): Anthropic.Messages.ToolUseBlock | undefined {
  return response.content.find(
    (b): b is Anthropic.Messages.ToolUseBlock =>
      b.type === "tool_use" && b.name === "replay_session",
  );
}

function buildUserMessage(input: ReplayInput): string {
  const scarsBlock = input.existingScars.length
    ? input.existingScars.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "(none yet)";
  const wisdomBlock = input.existingWisdom.length
    ? input.existingWisdom.map((w, i) => `${i + 1}. ${w}`).join("\n")
    : "(none yet)";

  return `Operation: ${input.operationTitle}
Operation description: ${input.operationDescription}
Project goal: ${input.projectGoal}

--- Transcript ---
${input.transcript}

--- Output ---
${input.output}

--- Reflection ---
${input.reflection}

--- Your existing scars (do not repeat) ---
${scarsBlock}

--- Your existing wisdom (do not repeat) ---
${wisdomBlock}`;
}

function normalizeResult(
  parsed: z.infer<typeof ReplayResultSchema>,
): ReplayResult {
  return {
    narrative: parsed.narrative,
    scar: parsed.scar ?? null,
    wisdom: parsed.wisdom ?? null,
    xpDelta: parsed.xpDelta,
  };
}

// ---------- Public ----------

export async function generateReplay(input: ReplayInput): Promise<ReplayResult> {
  const systemPrompt = `${buildSystemPrompt(input.agentType)}\n\n${REPLAY_RULES}`;
  const userMessage = buildUserMessage(input);

  // Attempt 1
  const response1 = await claudeCall({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: [REPLAY_SESSION_TOOL],
    tool_choice: TOOL_CHOICE,
  });

  const toolUse1 = extractToolUse(response1);
  if (!toolUse1) {
    throw new Error(
      "replay-generator: model did not call replay_session tool on first attempt",
    );
  }

  const result1 = ReplayResultSchema.safeParse(toolUse1.input);
  if (result1.success) return normalizeResult(result1.data);

  console.error("replay-generator: Zod validation failed on attempt 1", {
    agentType: input.agentType,
    zodError: result1.error.message,
    rawOutput: toolUse1.input,
  });

  // Attempt 2 — proper tool_result retry protocol
  const response2 = await claudeCall({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: response1.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse1.id,
            content: `Validation failed: ${result1.error.message}\n\nReturn a corrected replay via the replay_session tool. Pay close attention to length limits (narrative ≤3000 chars, scar/wisdom text ≤200 chars, sourceExcerpt ≤500 chars) and xpDelta range (0-150).`,
            is_error: true,
          },
        ],
      },
    ],
    tools: [REPLAY_SESSION_TOOL],
    tool_choice: TOOL_CHOICE,
  });

  const toolUse2 = extractToolUse(response2);
  if (!toolUse2) {
    throw new Error(
      "replay-generator: model did not call replay_session tool on retry",
    );
  }

  const result2 = ReplayResultSchema.safeParse(toolUse2.input);
  if (result2.success) return normalizeResult(result2.data);

  console.error("replay-generator: Zod validation failed on retry", {
    agentType: input.agentType,
    zodError: result2.error.message,
    rawOutput: toolUse2.input,
  });

  throw new Error(
    `replay-generator: validation failed twice. Final error: ${result2.error.message}`,
  );
}
