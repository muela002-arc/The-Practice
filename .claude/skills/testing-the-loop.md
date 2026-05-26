---
name: testing-the-loop
description: The five canonical test projects used to verify M3 (project shaping). Run scripts/test-project-shaper.ts to exercise all three agents against all five briefs. Read at the M3 quality gate or before changes to lib/llm/project-shaper.ts.
---

# Testing the loop

The M3 quality gate is a manual review of the shapings produced by `lib/llm/project-shaper.ts` across all three agents (Atlas, Vela, Iris) for five canonical project briefs. Same discipline as the M2 voice paste test — human verifies before UI ships.

## The five canonical briefs

Authored at M3 start as a representative sample of real user projects, deliberately spanning different domains and complexity profiles. Each is chosen because Atlas / Vela / Iris should produce visibly different shapings — that's the M3 DoD: "Project creation conversation works in all three agent voices."

1. **Personal utility (mobile):** "I want a personal habit tracker for my phone. Daily checkmarks, weekly stats, no cloud sync needed."
2. **Professional content authoring:** "I'm a high school chemistry teacher. I want a tool where I drop in my syllabus and get back week-by-week lesson plans with embedded lab suggestions, in a printable format."
3. **Multi-user app:** "Build me an app my D&D group can use to roll dice, track HP, and look up spells. Five players. Phone-friendly."
4. **Dev tool / CLI:** "I want a command-line tool that takes a meeting transcript and gives me back: decisions made, action items with owners, follow-ups."
5. **Infrastructure refactor:** "I have a Node.js API in Express with 12 endpoints. I need to add rate limiting per-endpoint per-user. Hosted on Render."

The TypeScript-importable source of these briefs is `scripts/test-project-shaper.ts` (the `CANONICAL_BRIEFS` constant). **If you change a brief, update both this file and that constant.** Markdown isn't importable, so the duplication is deliberate.

## How to run

Set a real `ANTHROPIC_API_KEY` in `.env.local` first (replacing the `placeholder-anthropic-key` value), then:

```
npx tsx --env-file=.env.local scripts/test-project-shaper.ts
```

(tsx is required — raw Node does not resolve the `@/` path alias that the imported `lib/llm/project-shaper.ts` uses.)

Runs 5 briefs × 3 agents = 15 Sonnet calls sequentially. Expect ~1-3 minutes.

## What to check (the rubric)

For each brief × agent shaping:

1. **Voice fidelity.** Titles, goal, and operation descriptions obey the agent's voice rules from `.claude/skills/agent-voice-consistency.md`. Atlas is short, imperative. Vela is compound, considered. Iris is short-declarative-observational. The forbidden phrases for each agent stay forbidden.
2. **Doctrine fidelity.** The shape reflects the doctrine, not just the wording. Atlas's first operation is "ship something rough." Vela's first operation is often clarification or scoping. Iris's first operation is a risk pass or verification setup. See `.claude/agents/project-shaper.md`.
3. **Distinctness.** Across the three agents on the same brief, the operation lists should be visibly different — not reworded versions of each other. **If you can't guess the doctrine from the shaping alone, the shaping has failed.**
4. **Operation sizing.** Each operation is plausibly doable in five commands of work in an AI tool. No "build the entire app" mega-operations. No trivial one-line operations.
5. **Operation ordering.** The order makes sense for the doctrine — Atlas ships first then polishes, Vela scopes first then builds, Iris validates first then implements.
6. **Title and goal in agent voice.** The project title and goal are also in voice. Generic "Project to build X" titles count as drift.

## What "passing" looks like

All 15 shapings pass the six checks above. If 1-2 fail (commonly: voice drift on Vela's longer-form descriptions, or Atlas-Iris distinctness on small projects), iterate on `SHAPING_RULES` in `lib/llm/project-shaper.ts` and re-run. Do not declare M3 ready for UI work until the run is clean.

## What to do when shaping fails

- **Voice drift:** tighten `SHAPING_RULES`; explicitly cite forbidden phrases per doctrine.
- **Doctrines indistinguishable:** the model isn't leaning on doctrine signals — add explicit examples per doctrine in the prompt (see `.claude/agents/project-shaper.md` for the canonical doctrine-driven shaping patterns).
- **Schema violations (Zod failures):** check `console.error` output during the run; the function logs `agentType`, `zodError`, and `rawOutput` before retrying. If retries are succeeding, the prompt is good and the limits in `ProjectShapeSchema` are catching edge cases — fine. If retries are failing too, the prompt isn't producing the schema's shape.
- **API errors:** check `ANTHROPIC_API_KEY` value and quota.

## Reference

- `lib/llm/project-shaper.ts` — the function under test
- `lib/llm/client.ts` — the SDK wrapper
- `.claude/agents/project-shaper.md` — design spec for the shaping feature
- `.claude/agents/qa-voice-auditor.md` — voice-rubric source
- `.claude/skills/agent-voice-consistency.md` — voice rules condensed
- `.claude/agents/qa-loop-tester.md` — this test is the manual version of what qa-loop-tester automates
