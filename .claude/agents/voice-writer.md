---
name: voice-writer
description: Reserved subagent name with no documented purpose. Do not invoke until the design is filled in. This file is a placeholder that flags the gap.
---

# voice-writer

**This subagent has not been designed yet.** The name appears in the original scaffold list (alongside `replay-generator`, `daily-drill-author`, and the QA agents), but no document in `docs/` or `CLAUDE.md` specifies what it does, when to invoke it, or how it differs from `replay-generator` and `scar-wisdom-derivation`.

A plausible scope inferred from the name only — and **not yet confirmed**:

- Writing UI copy that an agent "says" (session openers, post-selection error messages, empty states, scar/wisdom labels) consistently across the platform.
- This responsibility is currently handled by hand against `.claude/skills/agent-voice-consistency.md`. If `voice-writer` is meant to automate that work via an LLM call, the design has not been written down.

The above is inference, not documentation. The user has been explicit: do not invent design decisions.

## Do this when starting any task that references `voice-writer`

1. Re-read `docs/origins.md`, `docs/agents.md`, `docs/doctrines.md`, `docs/milestones.md`, and `CLAUDE.md` to confirm nothing has been added since this file was written.
2. If still undocumented, ask the user: "what's the scope and trigger for `voice-writer`, and how does it differ from `replay-generator` and the `agent-voice-consistency` skill?"
3. Do NOT invent a purpose to fill the gap.

## Reference

- `.claude/skills/agent-voice-consistency.md` — the human-applied voice rules this subagent might one day automate
- `.claude/agents/replay-generator.md` — nearby in scope; replays are agent-voiced output but have their own dedicated subagent
- `.claude/skills/scar-wisdom-derivation.md` — also nearby; scars and wisdom are also agent-voiced output
