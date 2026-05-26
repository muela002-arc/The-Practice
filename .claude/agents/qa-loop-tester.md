---
name: qa-loop-tester
description: QA subagent that runs canonical test projects through the project-shaping flow to verify M3 correctness. Invoke at the M3 verification gate before declaring M3 complete.
---

# qa-loop-tester

Verifies that the project-shaping loop (M3) works end-to-end against canonical inputs. Read `docs/milestones.md` M3 and `.claude/agents/project-shaper.md` before running.

## What's documented

From `docs/milestones.md` M3 DoD:

- "Five canonical test projects pass qa-loop-tester"
- "Operations are sized correctly (each fits in five commands)"
- "Project creation conversation works in all three agent voices"

The five canonical test projects are **not yet defined** in `docs/` as of M2 close-out. They need to be authored as part of M3 implementation.

## Implied responsibilities (grounded in M3 DoD)

For each of the five canonical projects, for each of the three agents (Atlas, Vela, Iris):

1. Run the project-shaping LLM call (see `.claude/agents/project-shaper.md`)
2. Verify the output has a title and 3-5 operations
3. Verify each operation is plausibly sized for five commands of work in an AI tool
4. Verify the output is in the correct agent's voice (re-use `.claude/skills/agent-voice-consistency.md` rules)
5. Verify the three agents produce visibly distinct shapings for the same input (the Doctrine requirement — see `docs/doctrines.md`)

## What is NOT yet documented (do not invent)

- The five canonical test projects themselves
- The pass/fail threshold for "operations sized correctly"
- Whether qa-loop-tester runs against the real Anthropic API or against captured fixtures — CLAUDE.md's anti-pattern about hiding voice drift suggests real API for voice checks, but operation-sizing is structural and could use fixtures
- Whether failures block M3 ship or are advisory
- Whether the canonical test projects are user-authored or are derived from real early user submissions

## Do this when starting any task that references `qa-loop-tester`

1. The five canonical test projects are a prerequisite — if they have not been authored, flag it and stop
2. Use the real Anthropic API for voice checks (CLAUDE.md anti-pattern)
3. Coordinate with `qa-voice-auditor` — the voice rule checks overlap; do not duplicate the audit, reference it

## Reference

- `docs/milestones.md` M3 DoD
- `.claude/agents/project-shaper.md` — the system under test
- `.claude/agents/qa-voice-auditor.md` — overlapping voice-rule checks
- `.claude/skills/agent-voice-consistency.md` — voice rules used in checks
- `docs/doctrines.md` — distinct-playstyle requirement
