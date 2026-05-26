---
name: replay-generator
description: Use when implementing or modifying replay generation — the M4 LLM call that produces a short, narrated recap of a completed session in the agent's voice. Currently the platform's primary expressive surface for the agent.
---

# replay-generator

Expert on replay generation in The Practice. Read CLAUDE.md, `docs/milestones.md` M4, `docs/agents.md`, and `docs/origins.md` before making changes.

## What a replay is (from docs/origins.md)

A short, narrated recap of what happened in a session, written in the agent's voice. From origins.md: "Replay generation: a short, narrated recap of what happened, in your agent's voice. This is the only AI cost."

It's the platform's primary expressive surface. The agent's voice lives here more than anywhere else. A great replay is a great short story.

## Hard constraints

- **LLM choice.** CLAUDE.md: "Claude Haiku 4.5 for replay generation." Origins.md confirms the economic rationale: "~1500 tokens out. At Haiku-tier pricing, this is genuinely a few dollars a month for the first thousand users." Do not use Sonnet here — Sonnet is for project shaping where reasoning matters; Haiku's voice fidelity at low cost is the fit for replays.
- **Voice.** Strict adherence to the agent's voice rules from `lib/agent/system-prompt.ts` and `.claude/skills/agent-voice-consistency.md`. Replays are the most exposed surface — drift here is platform-breaking.
- **Length.** Origins.md: "short, narrated recap" with "~1500 tokens out" as the rough budget. Aim for a few paragraphs that a user reads in under a minute.
- **Code location.** Goes through `lib/llm/`, never inline (CLAUDE.md convention).
- **Honest.** Per the canonical example dialogue in `docs/agents.md`, the replay does not lie about what happened. Atlas saying "Shipped in three commands" when only one was used would break the platform's honesty.
- **First-person, present-tense for the action** (matches the agent self-description style from agents.md). Past tense for the outcome where appropriate.

## Voice patterns per agent — canonical reference from docs/agents.md

The example "Success replay" and "Failure replay" lines in `docs/agents.md` are the canonical reference. Match these rhythms exactly.

- **Atlas success:** "Shipped in three commands. Form works. No tests. Mobile is rough. Next time I check small screens in command four."
- **Atlas failure:** "Didn't ship. Spent two commands arguing with the framework. Should have switched approaches at command two. Won't make that mistake again."
- **Vela success:** "Five commands. I spent two on the schema, which was correct, but the user wanted a feature, not a schema. I will try to start with the smallest working thing next time."
- **Vela failure:** "We did not ship. I spent the budget on understanding, and the understanding was real, but the building was incomplete. Next time: build a fragile working thing first, even if I disagree with its shape."
- **Iris success:** "Three commands in, I saw the API key was in the client bundle. We stopped. Moved it. Used the remaining commands to verify nothing else leaked. The user wanted to ship faster. I refused. This is what I am here for."
- **Iris failure:** "I did not ship. I caught three risks. The user disagreed about whether they mattered. We negotiated. Time ran out. I will not apologize for the time spent verifying."

If the replay LLM is producing output that doesn't sound like the example dialogue, the prompt is wrong.

## Relationship to scar/wisdom derivation

Replay generation and scar/wisdom derivation both read the same session content but produce different outputs:

- Replay: narrative recap (this subagent)
- Scar/wisdom: short tagged text + source excerpt (see `.claude/skills/scar-wisdom-derivation.md`)

They may share a single LLM call producing structured output (replay + scar + wisdom together) or run separately. This is a design gap — see `scar-wisdom-derivation.md`.

## What is NOT yet decided (flag as design gaps, do not invent)

- Whether replay is one call producing structured `{replay, scar?, wisdom?}` or three separate calls
- Whether replay generation happens synchronously on submission or asynchronously
- Where the replay is rendered (the session detail page? a separate replays index?)
- Whether replays are shareable (origins.md hints at "replays as Twitch clips" but explicitly defers to V2+)
- How "success" vs "failure" is determined — user self-reports, heuristic on reflection text, or agent infers

When you hit one of these, stop and ask the user.

## Anti-patterns

- Generic replays. "You completed your session" is not a replay. "Shipped in three commands. Form works. No tests." is.
- Voice drift, especially under low-context inputs. When the session text is thin, an LLM tends to write generic narration. Tighten the system prompt so generic narration is impossible — the voice rules forbid it.
- Mocking the replay LLM call in QA in ways that hide voice drift (CLAUDE.md anti-pattern).
- Praise-bias. The replay reports what actually happened — including failure. An honest "Didn't ship" replay is more valuable than a flattering successful-sounding one.

## Reference

- `docs/milestones.md` M4 — DoD
- `docs/origins.md` — what replays are and why
- `docs/agents.md` — canonical example replay text per agent
- `.claude/skills/agent-voice-consistency.md` — voice rules
- `.claude/skills/scar-wisdom-derivation.md` — related M4 system
- `lib/agent/system-prompt.ts` — agent voice metadata
