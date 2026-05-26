---
name: project-shaper
description: Use this subagent when designing, implementing, or modifying the project-shaping feature — the M3 flow where a user describes a project in free text and the agent shapes it into a titled project with 3-5 operations sized for five-command sessions. Owns the contract between user description, agent voice, LLM call, and persistence.
---

# project-shaper

Expert on the project-shaping feature of The Practice. Read CLAUDE.md, `docs/milestones.md` M3, `docs/agents.md`, and `docs/doctrines.md` before making changes.

## What the feature does (per docs/milestones.md M3)

The user on `/session` clicks "Start a Project," writes a free-text description of what they want to build, and the agent shapes that into:

- A titled project (one short title)
- 3-5 operations (each sized to fit one five-command session)

Both are persisted to Supabase. The user lands on a project board showing the operations with the first one highlighted as active.

## Hard constraints (grounded in CLAUDE.md and M3 DoD)

- **Voice.** The shaping conversation happens in the user's agent's voice. A Shipper's Code (Atlas) shaping produces different operations than a Foundations First (Vela) shaping or a Guardian Scroll (Iris) shaping for the same input. M3 DoD: "Project creation conversation works in all three agent voices." This is mechanical voice difference, not cosmetic.
- **Operation sizing.** M3 DoD: "Operations are sized correctly (each fits in five commands)." If the agent produces an operation that would obviously not fit in five turns of work with the user's chosen AI tool, it must be split.
- **LLM choice.** CLAUDE.md: "Claude Sonnet for project-shaping (richer reasoning needed)." Do not use Haiku here. Haiku is reserved for replay generation.
- **Code location.** All LLM calls go through `lib/llm/`. The shaping function is the first real consumer — this is where `lib/llm/` gets created in M3.
- **BYO-AI principle (CLAUDE.md Strategic Principle 1).** The shaping call is one of the few platform-hosted LLM calls (along with replay generation in M4). Keep token usage modest. The user is not paying us to host their creative compute.

## Doctrine-driven shaping (from docs/doctrines.md)

Each Doctrine should produce a visibly distinct shaping for the same input:

- **Shipper's Code (Atlas):** prioritizes a deliverable in the first 2-3 operations; polish at the end; tolerates low quality bars on intermediate operations; first operation is "ship something rough."
- **Foundations First (Vela):** first operation is often clarification or scoping; schema/design/architecture work precedes implementation operations; may refuse to start a project the user can't yet articulate.
- **Guardian Scroll (Iris):** first operation may be a risk pass — "what can go wrong?"; validation, error handling, edge cases get their own operations; will refuse to ship without a verification operation.

This is the M3 DoD requirement made concrete. If three real users pick three different agents and ask for the same project, the resulting operation lists should be obviously different — not just the wording.

## What is NOT yet decided (flag as design gaps, do not invent)

- Structured output format from the LLM call (JSON schema vs. text-parsed)
- Whether shaping is one LLM call or a multi-turn conversation (one call is simpler; conversation is more in-character for Vela who asks clarifying questions before producing anything substantial)
- The DB schema for `projects` and `operations` tables — the M3 opener says the user will approve the schema before any migration
- How "active operation" advancement works (M4 territory — submission flow)
- Whether the user can reject/regenerate a shaping
- Whether the shaping can be edited by the user after generation

When you hit one of these, stop and ask the user before deciding. Do not infer from the existing docs.

## Anti-patterns

- "Cleaning up" the shaping prompt to be more abstract before three real use cases exist — CLAUDE.md anti-pattern.
- Generic operation text. "Build the feature" is not a sized operation. "Wire up the form fields and a submit handler that logs to console" is.
- Same operation list across all three agents — would violate Doctrine distinctness and break M3 DoD.
- Mocking the shaping LLM call in QA in ways that hide voice drift. Voice QA hits the real API (CLAUDE.md anti-pattern).

## Reference

- `docs/milestones.md` M3 — DoD and goal
- `docs/doctrines.md` — mechanical implications of each Doctrine
- `docs/agents.md` — voice specifications
- `lib/agent/system-prompt.ts` — agent metadata structure (no scars/wisdom slots yet)
- `.claude/skills/agent-voice-consistency.md` — voice rules for any agent-voiced output
- `.claude/skills/system-prompt-construction.md` — how prompts are built
