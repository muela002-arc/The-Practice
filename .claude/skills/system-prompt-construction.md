---
name: system-prompt-construction
description: How agent system prompts are assembled in lib/agent/system-prompt.ts. Read before adding fields like scars or wisdom, before changing voice rules, or before introducing a new agent.
---

# System prompt construction

System prompts are pure string assembly. No LLM calls, no DB reads, no async work. The function lives at `lib/agent/system-prompt.ts` and exports `buildSystemPrompt(agent: AgentType): string`. As of M2 it is called from exactly one place: the server-rendered `/session` page.

## The four-section structure

Every prompt has exactly four sections, in this order:

1. **Identity** — `# Who you are` — first-person self-description, sourced verbatim from `docs/agents.md` ("Self-description (first person, used in system prompt)").
2. **Doctrine** — `# Your doctrine: {doctrineName}` — the doctrine's core belief (one paragraph) followed by an "In practice:" bullet list of mechanical implications. Sourced from `docs/doctrines.md`.
3. **Voice rules** — `# How you speak` — concrete rules about sentence length, punctuation, vocabulary, tense, and forbidden phrases, followed by signature phrases. Sourced from `docs/agents.md`.
4. **Session rules** — `# Session rules` — the same four constraints across all agents: five-command pacing, stay-in-voice imperative, pushback-before-comply, ship-through-doctrine.

The four-section structure was voice-verified by manual paste tests during M2 — all three agents scored 11-12/12 on the user's rubric. **Do not change the structure without re-running the manual voice verification.** The procedure: run `node --experimental-strip-types scripts/print-prompts.ts`, paste each agent's output into Claude with the same target task, confirm distinct behavior.

## The data table

Agent specs live in a `SPECS: Record<AgentType, AgentSpec>` constant in the same file. Each `AgentSpec` has: `name`, `doctrineName`, `identity`, `doctrineCore`, `doctrineInPractice`, `voiceRules`, `signatures`. One concept per file — co-locating data and assembly is fine while the spec is small (3 agents, ~12 fields each, file is well under 200 lines).

`SESSION_CONSTRAINTS` is a separate `const` because it's identical across agents. The session-opener UI strings live in `lib/agent/profiles.ts`, not here — those are display copy, not part of the prompt.

## What's deliberately NOT in the prompt

- **The meta-fiction.** The AI tool doesn't need to know "you are part of a game where the user is raising you." It just needs to behave like the agent.
- **Scars and wisdom.** No slots, no template variables, no `{{scars}}` placeholders. These come in M4. Adding slots now is speculative structure.
- **BYO-AI framing, project context, mission types.** Out of scope for the prompt itself.

## When extending this (M3, M4)

- **Adding a new agent** (V2 territory, not V1): add an `AgentType` union member, an entry in `SPECS`, an entry in `AGENT_PROFILES`, an entry in `SESSION_OPENERS`. The DB migration's `check (agent_type in ...)` constraint also needs updating.
- **Adding scars** (M4): extend `AgentSpec` with optional `scars: readonly Scar[]`, render a fifth section `# What you've learned the hard way` after Voice rules and before Session rules. Re-run voice verification.
- **Adding wisdom** (M4): mirror scars — separate section, separate slot.

## Anti-patterns

- Inlining `buildSystemPrompt` into a route handler. It goes through `lib/agent/`, never inline.
- "Cleaning up" the construction code to be more abstract before three real use cases exist. CLAUDE.md flags this explicitly.
- Adding template engines (Mustache, Liquid) for what is currently four sections of straight string concatenation.
- Mocking the function for tests in ways that hide voice drift. Voice QA happens against the real Claude API, not unit tests.
