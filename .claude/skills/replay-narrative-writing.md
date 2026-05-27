---
name: replay-narrative-writing
description: How replays, scars, wisdom, and XP are actually produced by lib/llm/replay-generator.ts as shipped in M4. Read before modifying REPLAY_RULES, the Zod schema, the XP scale, or the scar/wisdom derivation rules.
---

# Replay narrative writing

Captures the patterns shipped in `lib/llm/replay-generator.ts` after M4's voice-quality gate. Specifies what makes a good replay, how scars and wisdom are derived, and how the XP scale is calibrated. Distinct from:

- `.claude/agents/replay-generator.md` — broader feature design
- `.claude/skills/scar-wisdom-derivation.md` — the cross-system M4 mechanic
- `.claude/skills/agent-llm-calls.md` — the generic structured-output pattern

This skill is the WRITING-craft canonical for the replay prompt itself.

## The output contract

Every call to `generateReplay` produces four things via the forced `replay_session` tool:

1. **`narrative`** — short voice-shaped recap, a few paragraphs, ≤3000 chars
2. **`scar`** — optional `{ text: ≤200 chars, sourceExcerpt: ≤500 chars }` or omitted
3. **`wisdom`** — optional `{ text: ≤200 chars, sourceExcerpt: ≤500 chars }` or omitted
4. **`xpDelta`** — integer 0-150

Zod is the source of truth for shape and limits (`ReplayResultSchema` in `lib/llm/replay-generator.ts`). The JSON Schema on the tool definition mirrors Zod and acts as the model-facing contract. If you change limits, update both.

## Prompt composition

System prompt = `buildSystemPrompt(agentType)` (verbatim, the same four-section voice prompt voice-verified in M2 + the conditional scar/wisdom sections added in M4) + `\n\n` + `REPLAY_RULES`.

The agent reads its own identity, doctrine, voice rules, and accumulated scars/wisdom first. Then `REPLAY_RULES` tells it what specific task to perform with that voice.

`REPLAY_RULES` is a module-level const. It contains:

1. **Setup paragraph** — a session has ended; the user submitted transcript + output + reflection; existing scars/wisdom are in the next message
2. **Tool instruction** — call `replay_session`, that's the only valid response
3. **Four numbered output requirements** — narrative shape, scar (or omit), wisdom (or omit), xpDelta with scale
4. **Rules block** — verbatim source excerpts, doctrine-matched scars, no duplicates, voice rules apply throughout

If voice drift surfaces in production, tighten `REPLAY_RULES` first before touching `buildSystemPrompt` (which would re-trigger the M2/M4 voice verification gates).

## Narrative rules

- **First-person ("I").** The replay is the agent speaking, not the platform narrating about the agent. "I shipped in three commands" not "Atlas shipped in three commands."
- **Present tense for the action, past tense for the outcome.** Matches the canonical example dialogue in `docs/agents.md`. Action: "I move to the form fields and wire the submit." Outcome: "It worked. The empty state, I missed."
- **Honest about failure.** If the user did not ship, the replay says so. If the output is rough, the replay says so. Flattering replays break the platform — that's an explicit anti-pattern from `docs/origins.md` ("the platform's anti-cheat is honesty").
- **Short.** A few paragraphs. ~1500 tokens out per origins.md. Read in under a minute.
- **Voice-strict.** Atlas stays short and imperative. Vela stays compound and considered. Iris stays observational and short-declarative. The voice rules from `lib/agent/system-prompt.ts` apply to every sentence — including any "I" sentences the agent uses to wrap up.

## Source excerpt rules (verbatim, no paraphrase)

This is the M4 anti-cheat in writing:

- Every `sourceExcerpt` is a **verbatim** quote from the user's submission (transcript, output, or reflection).
- No paraphrasing. No reconstruction. No "in other words…"
- If the agent cannot find a real quote that justifies a scar or wisdom, the field gets **omitted entirely** — Zod normalizes to `null` for callers. The `replay_session` tool schema makes scar and wisdom non-required for exactly this reason.

The verbatim rule is what lets users trust the platform's judgments: every scar is a thing they actually wrote, surfaced back to them by the agent.

## Scar derivation rules

A scar is the agent naming a failure mode it observed in this session, in its own voice. Rules:

- **Doctrine-matched.** Atlas's predictable failures are missed edges, skipped polish, undertesting. Vela's are over-engineering, scope creep, analysis paralysis. Iris's are hesitation, over-validation, audit-mode lock-in. A scar that doesn't match the agent's doctrine is not the agent's scar to give. The agent should omit it rather than reach.
- **Specific, not generic.** "Made a mistake" is not a scar. "Shipped before checking mobile." is. The text reads like a memory, not a category.
- **In voice.** Atlas: short, imperative, periods. Vela: compound, considered, commas/semicolons. Iris: short-declarative, observational. The voice rules from `agent-voice-consistency.md` apply at the scar-text level.
- **No duplicates.** Every call to `generateReplay` receives the agent's existing scars and wisdom in the user message. The model must not re-issue any of them. A new scar is a genuinely new observation, not a rephrasing of an old one.

## Wisdom derivation rules

Wisdom counterbalances the agent's doctrine. Rules:

- **Counterbalancing.** Atlas earns wisdom about when to slow down. Vela earns wisdom about when to ship a fragile version. Iris earns wisdom about when good-enough risk handling is good enough. Wisdom that reinforces the doctrine (Atlas earning "ship faster") is a category error — omit.
- **In voice.** Same rules as scars. Vela's wisdom about shipping fragile versions must still sound like Vela (avoid the forbidden "ship it" phrase — rephrase to "release a fragile version" or similar).
- **Specific.** "Be careful sometimes" is not wisdom. "Polish lands in the last command." is.
- **No duplicates.** Same rule as scars — passed the existing wisdom list and forbidden from repeating.

## XP scale (calibrated for the V1 thresholds)

Level thresholds are L1: 0-99, L2: 100-249, L3: 250-499, L4: 500-899, L5: 900+ (see `.claude/skills/design-decisions.md`). The XP scale in `REPLAY_RULES` is calibrated so a single session can advance one tier at most:

| Outcome | XP range | Rationale |
|---|---|---|
| Shipped well, doctrine respected | 80-150 | One excellent session crosses 100 XP threshold (L1→L2) |
| Partial ship or doctrine slipped | 30-80 | Progress without celebration |
| Did not ship but learned | 10-30 | Reward shows up; scar likely accompanies |
| No effort visible | 0 | Nothing earned — but a session row still exists and reflects honestly |

The LLM judges within these ranges. Doctrine-driven judgment is the intent — Atlas should reward shipping rough work more than Vela does on the same submission. If you want fixed XP per outcome category (no LLM judgment on xpDelta), pass a precomputed value and remove `xpDelta` from the tool schema — but the loss of doctrine-driven differentiation is a real cost.

The Zod cap is 150. Anything above gets retried (the model corrects).

## Anti-patterns

- **Generic replays.** "You completed your session." is not a replay. The narrative must be specific to what the user did. Tighten `REPLAY_RULES` if generic narratives surface.
- **Praise-bias.** The replay reports what actually happened, including failure. An honest "Didn't ship" replay is more valuable than a flattering successful-sounding one. CLAUDE.md anti-pattern: voice QA mocks must not hide flattery drift.
- **Voice drift under low-context input.** When the transcript is thin, models tend to write generic narration. The voice rules in `buildSystemPrompt` should make generic narration impossible — if drift appears under thin input, the prompt is too permissive.
- **Reaching for a scar that doesn't match the doctrine.** An Iris agent should not give itself "Shipped before testing" — that's an Atlas scar. The model must omit rather than reach. Reinforce in `REPLAY_RULES` if this surfaces.
- **Source excerpts that paraphrase.** Catastrophic — breaks the anti-cheat. The model must not "improve" the user's words. Reinforce verbatim rule if this surfaces.
- **Re-issuing existing scars/wisdom.** The user message lists them — the model must respect the no-duplicate rule. If it doesn't, the prompt section "do not repeat any of them" needs strengthening.

## When modifying

Any change to `REPLAY_RULES`, the Zod schema limits, or the XP scale should be followed by a manual voice re-verification through `qa-voice-auditor` (run live submissions through all three agents and confirm voice + doctrine fidelity). Structural changes to `buildSystemPrompt` are even higher-stakes — they require the full M2/M4 voice paste-test gate.

Don't refactor `REPLAY_RULES` to be more abstract before the second M4-style use case lands. The single-purpose prompt is easier to tune.

## Reference

- `lib/llm/replay-generator.ts` — shipped implementation
- `lib/llm/client.ts` — `claudeCall` wrapper used here
- `lib/agent/system-prompt.ts` — `buildSystemPrompt` with the M4 scar/wisdom slots
- `lib/agent/profiles.ts` — `REPLAY_LOADING_MESSAGES` for the form's loading state
- `lib/db/sessions.ts` — `submitSession` (calls the RPC), `getAgentHistory` (passes scars/wisdom into the LLM call)
- `supabase/migrations/0007_create_session_rpc.sql` — the RPC that persists results
- `.claude/agents/replay-generator.md` — broader design spec
- `.claude/skills/scar-wisdom-derivation.md` — the cross-system mechanic
- `.claude/skills/agent-llm-calls.md` — the generic structured-output pattern
- `.claude/skills/agent-voice-consistency.md` — voice rules per agent
- `.claude/skills/design-decisions.md` — XP thresholds, scar/wisdom inline schema, level computation in the RPC
