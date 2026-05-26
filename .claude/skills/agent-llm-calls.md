---
name: agent-llm-calls
description: How LLM calls are structured in this codebase — the claudeCall wrapper, forced tool_use for structured output, Zod validation, retry via tool_result protocol. Read before adding any new Anthropic API call.
---

# Agent LLM calls

All Anthropic API calls go through `lib/llm/`. As of M3, two files live there:

- `lib/llm/client.ts` — the thin wrapper around the SDK
- `lib/llm/project-shaper.ts` — the first real consumer, structured-output via forced tool use

Future LLM callers (replay-generator in M4, scar-wisdom-derivation in M4) follow the same patterns documented here.

## Hard rules (from CLAUDE.md, non-negotiable)

- **Every LLM call goes through `lib/llm/` — never inline.** No `new Anthropic()` or `client.messages.create()` in route handlers, server actions, or pages. Always `import { claudeCall } from "@/lib/llm/client"`.
- **Voice QA hits the real API.** Mocking the LLM response for tests in ways that could hide voice drift is a CLAUDE.md anti-pattern. The five canonical test briefs at `.claude/skills/testing-the-loop.md` exist as the manual voice-quality gate, run against the real Anthropic endpoint.
- **No `any`.** Anthropic SDK types are imported as `Anthropic.Messages.Tool`, `Anthropic.Messages.Message`, `Anthropic.Messages.ToolUseBlock`, etc.

## The client wrapper (`lib/llm/client.ts`)

```ts
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith("placeholder")) {
    throw new Error("ANTHROPIC_API_KEY is not configured ...");
  }
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export async function claudeCall(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Messages.Message> {
  return getClient().messages.create(params);
}
```

Three responsibilities:

1. **Lazy singleton.** One `Anthropic` instance reused across calls. No per-call construction.
2. **Env validation at first call.** Throws if `ANTHROPIC_API_KEY` is missing OR starts with the literal string `placeholder` (matches the `.env.example` default). Catches the "I forgot to swap the placeholder" mistake at first use instead of letting it surface as a confusing 401 from Anthropic.
3. **Thin pass-through.** No retry, no parsing — those belong in the caller. The wrapper is a single function and stays that way.

If a future call needs streaming, add a `claudeCallStream` peer rather than overloading this signature.

## Structured-output pattern (`lib/llm/project-shaper.ts`)

When the LLM must return data that downstream code parses (titles, structured outputs, anything that becomes a DB row or a typed object), follow this five-part pattern:

### 1. Zod schema as the source of truth

```ts
export const ProjectShapeSchema = z.object({
  title: z.string().min(1).max(120),
  goal: z.string().min(1).max(500),
  operations: z.array(OperationSchema).min(3).max(5),
});
export type ProjectShape = z.infer<typeof ProjectShapeSchema>;
```

The schema defines the contract. The TS type is `z.infer<...>`. Length caps are LLM-output sanity tripwires (paragraphs in titles, novels in descriptions), not user-input caps — DB columns are unbounded `text`.

### 2. Parallel JSON Schema for the tool definition

```ts
const SHAPE_PROJECT_TOOL: Anthropic.Messages.Tool = {
  name: "shape_project",
  description: "Return the shaped project: title, one-sentence goal, and 3-5 ordered operations.",
  input_schema: {
    type: "object",
    properties: { /* hand-mirror the Zod fields */ },
    required: ["title", "goal", "operations"],
  },
};
```

JSON Schema (for Anthropic's tool definition) is hand-written to mirror Zod. We do NOT depend on `zod-to-json-schema` — one extra dep, one more thing to drift. The two schemas drift only if you forget to update both; for small schemas (<10 fields), that's fine. If a future caller has a much larger schema, reconsider.

The `input_schema.description` fields on each property are part of the prompt the model sees — write them like prompt instructions, not type annotations.

### 3. Force the tool with `tool_choice`

```ts
tool_choice: { type: "tool", name: "shape_project" }
```

This makes the model's only valid response a `tool_use` block for this specific tool. Without it (e.g., `tool_choice: "auto"`), the model can choose to respond with plain text and ignore the tool.

### 4. Validate the result and retry once via `tool_result`

```ts
const result = ProjectShapeSchema.safeParse(toolUse.input);
if (result.success) return result.data;

console.error("project-shaper: Zod validation failed on attempt 1", {
  agentType, zodError: result.error.message, rawOutput: toolUse.input,
});

// Retry — proper tool_result protocol
const response2 = await claudeCall({
  ...same params,
  messages: [
    { role: "user", content: userBrief },
    { role: "assistant", content: response1.content },  // includes tool_use
    {
      role: "user",
      content: [{
        type: "tool_result",
        tool_use_id: toolUse1.id,
        content: `Validation failed: ${result.error.message}\n\nReturn a corrected shape via the shape_project tool.`,
        is_error: true,
      }],
    },
  ],
});
```

**Key points on the retry:**

- Use the **proper tool_result protocol**, not a fresh user message. The model needs to see that its previous tool call failed — that's what `tool_result` with `is_error: true` is for. Anthropic's API rejects assistant-then-user message sequences where the assistant content contained a `tool_use` without a corresponding `tool_result`.
- **One retry only.** Two attempts max. If the second response also fails Zod, throw — don't loop indefinitely. The caller (server action) decides how to surface the failure.
- **Log the raw output before retrying.** `console.error({agentType, zodError, rawOutput})` so we can debug voice drift or schema violations after the fact. Server actions surface in server logs; the user only sees "something broke."

### 5. Error translation is the caller's job, not the function's

`shapeProject` throws raw `Error` with the Zod message. The server action that invokes it (`app/(app)/project/new/actions.ts`) is responsible for translating to agent voice when surfacing to the UI. CLAUDE.md says "errors in agent voice when user-facing" — the LLM call itself is not user-facing, the action is.

## Prompt assembly

System prompt = `buildSystemPrompt(agentType)` (the M2 four-section prompt) + `\n\n` + task-specific rules block.

```ts
const systemPrompt = `${buildSystemPrompt(agentType)}\n\n${SHAPING_RULES}`;
```

Reasons:

- **Voice identity is centralized.** `lib/agent/system-prompt.ts` is the canonical source of identity + doctrine + voice rules + (M2) session rules. Reuse means future voice changes propagate to every LLM call automatically.
- **The session-rules block coming through is fine.** It includes the user-side "five commands, pace yourself" guidance, which doesn't strictly apply to our internal shaping call but reinforces context the agent already knows. Trade-off vs. refactoring `buildSystemPrompt` to expose sections — not worth it for M3.

The task-specific suffix (`SHAPING_RULES` in project-shaper.ts) tells the agent what it's doing right now in this call, what tool to use, and what rules apply to the output. Keep it tight — the four-section prompt already establishes who the agent is.

## Model selection

| Model | When | Why |
|---|---|---|
| `claude-sonnet-4-6` | Project shaping | Reasoning over a free-text brief, doctrine-driven decomposition, structured output validity. |
| `claude-haiku-4-5` | Replay generation (M4) | Short voice-shaped narration. Voice fidelity at low cost. ~1500 tokens out per call (origins.md). |
| Sonnet or Haiku | Scar/wisdom derivation (M4) | TBD per `.claude/skills/scar-wisdom-derivation.md`. |

CLAUDE.md is the canonical version-pin source. Update it when bumping model versions. Don't hardcode a model in a caller without verifying CLAUDE.md agrees.

## Where the API key lives

`ANTHROPIC_API_KEY` in `.env.local`, server-side only (no `NEXT_PUBLIC_` prefix). The placeholder default in `.env.example` is `sk-ant-...` — the `client.ts` check rejects any value starting with `placeholder` so a forgotten swap fails loudly at first call.

## Running an LLM call locally outside Next

`lib/llm/` modules import `@/...` path aliases that Node can't resolve on its own. To run a script that touches `lib/llm/` (like `scripts/test-project-shaper.ts`), use tsx:

```
npx tsx --env-file=.env.local <script>.ts
```

tsx reads `tsconfig.json` for path aliases. Raw Node + `--experimental-strip-types` does not. See [[design-decisions]] for the M3-era discovery.

## When adding a new LLM call (M4 forward checklist)

1. Decide which model. Update CLAUDE.md if it's a new model class.
2. Create `lib/llm/<name>.ts` — module-level constants for the prompt and tool, exported function that does the call.
3. Define the Zod schema first. Then hand-write the parallel JSON Schema for the tool. Re-derive the TS type via `z.infer`.
4. Force `tool_choice` if the output must be structured.
5. Validate the tool input with Zod after the call. Retry once via `tool_result` with `is_error: true` on validation failure.
6. `console.error({...inputs, error, rawOutput})` before retrying. Log on second failure too.
7. Throw on second failure. Let the caller (server action / route handler) translate to agent voice for the user.
8. Add canonical test inputs to `.claude/skills/testing-the-loop.md` and a runner under `scripts/` for the human voice-quality gate.
9. Re-read `.claude/skills/agent-voice-consistency.md` before declaring the output is in voice. Re-read `.claude/agents/qa-voice-auditor.md` for the audit cadence.

## Anti-patterns

- Inline `client.messages.create(...)` in a route handler. Goes through `claudeCall` or it doesn't ship.
- Using `tool_choice: "auto"` for a call whose output you parse. The model can decline the tool and respond with text; your downstream code breaks. Force the tool.
- Skipping Zod validation because "the tool's input_schema already validates." Anthropic validates types and required fields, but not semantics (empty strings, "TBD" placeholders, length caps, doctrine fidelity). Zod is your second line.
- Retrying more than once. Two attempts is the budget. A second failure is a real failure — throw with the Zod message.
- Looking at the `text` content block while ignoring the `tool_use` block (or vice versa). With forced `tool_choice`, the model goes straight to `tool_use` — but the response array can still contain a leading `text` block in some cases. Use the `extractToolUse` pattern (find by `type === "tool_use"` AND `name === expected`).
- Mocking the LLM call in unit tests in a way that bypasses voice. The voice quality gate is the canonical test — manual, real-API, against `.claude/skills/testing-the-loop.md`.

## Reference

- `lib/llm/client.ts` — the wrapper
- `lib/llm/project-shaper.ts` — the first structured-output caller
- `scripts/test-project-shaper.ts` — the canonical-brief test runner
- `.claude/skills/testing-the-loop.md` — voice quality gate
- `.claude/skills/agent-voice-consistency.md` — voice rules
- `.claude/skills/system-prompt-construction.md` — `buildSystemPrompt` structure
- `.claude/agents/project-shaper.md` — project shaping design spec
- `.claude/agents/replay-generator.md` — sibling M4 caller (same patterns expected)
- `.claude/agents/qa-voice-auditor.md` — audit cadence and rubric
- `CLAUDE.md` — version pins and anti-patterns
