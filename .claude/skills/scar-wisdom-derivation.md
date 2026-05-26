---
name: scar-wisdom-derivation
description: Use when implementing or modifying the scar and wisdom derivation flow — the M4 system that reads completed session content, produces scar and wisdom tags in the agent's voice tied to source excerpts, and writes them back into the agent's system prompt.
---

# scar-wisdom-derivation

Expert on how scars and wisdom are derived from session outcomes. Read CLAUDE.md, `docs/milestones.md` M4, `docs/agents.md`, and `docs/doctrines.md` before making changes.

## What scars and wisdom are (from docs/origins.md and CLAUDE.md)

- **Scars** are short text tags an agent earns from failure modes inside a session. They describe what went wrong, in the agent's voice. From origins.md: "Scar earned: Reached for code when prose would do." A scar is a memory the agent expresses — not a stat.
- **Wisdom** are short text tags an agent earns that counterbalance the Doctrine's weaknesses — when to slow down (for Atlas), when to ship a fragile version (for Vela), when "good enough" risk handling is good enough (for Iris). From origins.md: "earned a wisdom tag: Diagnose before patching."

The agent IS the configuration (CLAUDE.md Strategic Principle 2). Scars and wisdom are real modifications to the system prompt the user carries into their AI tool — not cosmetic stats.

## Hard constraints

- **Voice.** Both scars and wisdom are written in the earning agent's voice. They must obey the voice rules in `lib/agent/system-prompt.ts` and `.claude/skills/agent-voice-consistency.md`. An Atlas scar is short and imperative; a Vela scar is compound and considered; an Iris scar is observational.
- **Tied to source excerpts.** M4 DoD: "Scars and wisdom are earned, tied to source excerpts." The session content the scar was derived from must be traceable — the scar is not abstract feedback, it's a quotable observation about a specific moment.
- **System prompt updates.** M4 DoD: "System prompt updates to reflect scars/wisdom." Earned scars and wisdom flow into `buildSystemPrompt()`. The structural slot is reserved — but the exact section ordering for those slots is TBD until M4 implementation. Re-run voice verification (qa-voice-auditor) after the structure changes.
- **Predictable failure modes per Doctrine (from docs/origins.md).** The doctrine determines which scars are likely:
  - Shipper's Code overships → "Shipped before testing."
  - Foundations First over-engineers → "Built the moat before the castle."
  - Guardian Scroll over-validates → "Trimmed past bone."
  A good derivation respects the doctrine — an Iris agent should not earn a Shipper-style scar even if their session resembles one superficially.

## Derivation flow (sketch — full implementation lands in M4)

1. User submits session: paste of conversation + reflection text (anti-cheat layer from origins.md: command log + reflection field).
2. Derivation reads the submission, the agent's current state (doctrine, prior scars/wisdom), and the project + operation context.
3. LLM call produces candidate scar text(s) and/or wisdom text(s) in the agent's voice, each paired with a source excerpt from the submission.
4. Stored to Supabase, tied to the session and the agent.
5. `buildSystemPrompt(agent)` reads the agent's accumulated scars and wisdom and includes them in the assembled prompt for the next session.

## What is NOT yet decided (flag as design gaps, do not invent)

- The LLM model for derivation (CLAUDE.md names Haiku for replay and Sonnet for shaping; derivation may share one of those or differ)
- The schema for `scars` and `wisdom` tables in Supabase
- How many scars/wisdom can be earned per session (one each? variable? capped?)
- Whether derivation always produces both, sometimes only a scar, only a wisdom, or sometimes neither
- The exact way source excerpts are stored (quoted span? offset+length? both?)
- How scars and wisdom render structurally inside the system prompt (new sections? bullets appended to "In practice"? — re-read `system-prompt-construction.md` before deciding; voice verification must be re-run after any structure change)
- Whether scars can be "retired" or "graduated" over time (origins.md hints at agent graduation/retirement but explicitly defers those mechanics to V2)
- Whether the user can dispute a scar/wisdom or request regeneration

When you hit one of these, stop and ask the user. Do not infer from the existing docs.

## Anti-patterns

- Generic scar text. "Made a mistake" is not a scar — "Reached for code when prose would do" is. Specificity is the product.
- Voice drift. Atlas earning a scar that uses "perhaps" or "carefully" breaks the platform. Run the voice rules in `.claude/skills/agent-voice-consistency.md` mechanically before storing.
- Counterbalance violation. Vela earning a wisdom that says "ship it" — even when correct in spirit — is voice drift. Re-phrase to "release a fragile version" or similar.
- Mocking the derivation LLM call in QA in ways that hide voice drift (CLAUDE.md anti-pattern).
- Adding scar/wisdom slots to the prompt before M4 voice verification re-runs. The four-section structure was verified in M2; introducing new sections is a structural change that must be re-verified.

## Reference

- `docs/milestones.md` M4 — DoD
- `docs/origins.md` — narrative context for what scars and wisdom are
- `docs/doctrines.md` — predicted scar/wisdom territory per Doctrine
- `docs/agents.md` — voice specifications and example dialogue (Success replay, Failure replay)
- `lib/agent/system-prompt.ts` — current prompt structure (no scar/wisdom slots yet — M4 adds them)
- `.claude/skills/agent-voice-consistency.md` — voice rules
- `.claude/skills/system-prompt-construction.md` — how prompts are built
- `.claude/agents/replay-generator.md` — sibling system that reads the same session content
- `.claude/agents/qa-voice-auditor.md` — re-run after structural changes to the prompt
