// Project shaping: the M3 LLM call that turns a user's free-text brief into a
// structured ProjectShape (title + goal + 3-5 ordered operations), in the
// agent's voice and according to the agent's doctrine.
//
// Single-shot. One tool_use call to Sonnet, validated against ProjectShapeSchema.
// On Zod failure: log the raw model output, then retry once via the proper
// tool_result protocol with the validation error inlined. Second failure throws
// — the caller (server action) is responsible for translating to agent voice.

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildSystemPrompt, type AgentType } from "@/lib/agent/system-prompt";
import { claudeCall } from "@/lib/llm/client";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

// ---------- Schemas ----------

const OperationSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
});

export const ProjectShapeSchema = z.object({
  title: z.string().min(1).max(120),
  goal: z.string().min(1).max(500),
  operations: z.array(OperationSchema).min(3).max(5),
});

export type ProjectShape = z.infer<typeof ProjectShapeSchema>;

// ---------- Prompt + tool ----------

const SHAPING_RULES = `# What you are doing right now

A user is starting a project with you. Their brief will arrive as the next message. Shape that brief into 3 to 5 ordered operations — discrete chunks of work, each one doable in a single five-command session with the user's AI tool of choice (Claude, ChatGPT, Cursor, Lovable, etc.).

If a step would clearly need more than five commands of work, split it. If two steps would both fit comfortably inside one five-command session, merge them.

Return your shaping by calling the \`shape_project\` tool. That is the only valid way to respond.

Rules:

- Exactly 3, 4, or 5 operations. Not fewer. Not more.
- Operations are ordered. The user works them top-to-bottom.
- Operation titles: short, action-shaped (under 8 words).
- Operation descriptions: concrete and specific. Say what the user is going to build, check, or fix — not what they will think about doing.
- Project title: one short phrase (under 8 words).
- Project goal: one sentence describing what "the project is done" looks like.

Shape according to your doctrine. The other two starter agents would NOT produce the same operations from the same brief. If your shaping could just as easily come from a different doctrine's agent, you have failed the task.

Your voice rules apply to titles, the goal, and every description. Drift breaks the platform.`;

const SHAPE_PROJECT_TOOL: Anthropic.Messages.Tool = {
  name: "shape_project",
  description:
    "Return the shaped project: title, one-sentence goal, and 3-5 ordered operations.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Short project title, under 8 words.",
      },
      goal: {
        type: "string",
        description:
          "One sentence describing what 'the project is done' looks like.",
      },
      operations: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Short, action-shaped operation title (under 8 words).",
            },
            description: {
              type: "string",
              description:
                "Concrete, specific description of what the user will do in this operation.",
            },
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["title", "goal", "operations"],
  },
};

const TOOL_CHOICE = { type: "tool" as const, name: "shape_project" };

// ---------- Helpers ----------

function extractToolUse(
  response: Anthropic.Messages.Message,
): Anthropic.Messages.ToolUseBlock | undefined {
  return response.content.find(
    (b): b is Anthropic.Messages.ToolUseBlock =>
      b.type === "tool_use" && b.name === "shape_project",
  );
}

// ---------- Public ----------

export async function shapeProject(
  agentType: AgentType,
  userBrief: string,
): Promise<ProjectShape> {
  const systemPrompt = `${buildSystemPrompt(agentType)}\n\n${SHAPING_RULES}`;

  // Attempt 1
  const response1 = await claudeCall({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userBrief }],
    tools: [SHAPE_PROJECT_TOOL],
    tool_choice: TOOL_CHOICE,
  });

  const toolUse1 = extractToolUse(response1);
  if (!toolUse1) {
    throw new Error(
      "project-shaper: model did not call shape_project tool on first attempt",
    );
  }

  const result1 = ProjectShapeSchema.safeParse(toolUse1.input);
  if (result1.success) return result1.data;

  console.error("project-shaper: Zod validation failed on attempt 1", {
    agentType,
    zodError: result1.error.message,
    rawOutput: toolUse1.input,
  });

  // Attempt 2 — proper tool_result retry protocol
  const response2 = await claudeCall({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [
      { role: "user", content: userBrief },
      { role: "assistant", content: response1.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse1.id,
            content: `Validation failed: ${result1.error.message}\n\nReturn a corrected shape via the shape_project tool. Pay close attention to operation count (must be 3-5) and string length limits.`,
            is_error: true,
          },
        ],
      },
    ],
    tools: [SHAPE_PROJECT_TOOL],
    tool_choice: TOOL_CHOICE,
  });

  const toolUse2 = extractToolUse(response2);
  if (!toolUse2) {
    throw new Error(
      "project-shaper: model did not call shape_project tool on retry",
    );
  }

  const result2 = ProjectShapeSchema.safeParse(toolUse2.input);
  if (result2.success) return result2.data;

  console.error("project-shaper: Zod validation failed on retry", {
    agentType,
    zodError: result2.error.message,
    rawOutput: toolUse2.input,
  });

  throw new Error(
    `project-shaper: validation failed twice. Final error: ${result2.error.message}`,
  );
}
