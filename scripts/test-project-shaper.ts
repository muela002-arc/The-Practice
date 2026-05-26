// Canonical test projects for the M3 quality gate (project shaping).
// Runs all five briefs through all three agents and prints the shaped output.
// See .claude/skills/testing-the-loop.md for the rubric and what to check.
//
// Setup: ANTHROPIC_API_KEY must be set to a real key in .env.local.
//
// Run:
//   npx tsx --env-file=.env.local scripts/test-project-shaper.ts
//
// (tsx is required — raw Node does not resolve the `@/` path alias used by
// the imported modules; tsx reads tsconfig.json paths.)
//
// Expected runtime: ~1-3 minutes (5 briefs × 3 agents = 15 Sonnet calls).

import { shapeProject } from "../lib/llm/project-shaper.ts";
import { AGENT_TYPES, type AgentType } from "../lib/agent/system-prompt.ts";

// Canonical source of the briefs. The human-readable mirror lives at
// .claude/skills/testing-the-loop.md — keep both in sync if you edit.
const CANONICAL_BRIEFS: readonly string[] = [
  "I want a personal habit tracker for my phone. Daily checkmarks, weekly stats, no cloud sync needed.",
  "I'm a high school chemistry teacher. I want a tool where I drop in my syllabus and get back week-by-week lesson plans with embedded lab suggestions, in a printable format.",
  "Build me an app my D&D group can use to roll dice, track HP, and look up spells. Five players. Phone-friendly.",
  "I want a command-line tool that takes a meeting transcript and gives me back: decisions made, action items with owners, follow-ups.",
  "I have a Node.js API in Express with 12 endpoints. I need to add rate limiting per-endpoint per-user. Hosted on Render.",
];

const HRULE = "═".repeat(79);
const SUBRULE = "─".repeat(36);

async function runOne(brief: string, agent: AgentType): Promise<void> {
  const start = Date.now();
  try {
    const shape = await shapeProject(agent, brief);
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n  ${SUBRULE} ${agent.toUpperCase()} (${seconds}s) ${SUBRULE}`);
    console.log(`  Title: ${shape.title}`);
    console.log(`  Goal:  ${shape.goal}`);
    console.log(`  Operations:`);
    shape.operations.forEach((op, i) => {
      console.log(`    ${i + 1}. ${op.title}`);
      console.log(`       ${op.description}`);
    });
  } catch (err) {
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    console.error(
      `\n  ${SUBRULE} ${agent.toUpperCase()} FAILED (${seconds}s) ${SUBRULE}`,
    );
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main(): Promise<void> {
  for (const [idx, brief] of CANONICAL_BRIEFS.entries()) {
    console.log(`\n${HRULE}`);
    console.log(`  BRIEF ${idx + 1}/${CANONICAL_BRIEFS.length}`);
    console.log(HRULE);
    console.log(`  "${brief}"`);
    for (const agent of AGENT_TYPES) {
      await runOne(brief, agent);
    }
  }

  console.log(`\n${HRULE}`);
  console.log("  Done. Review against .claude/skills/testing-the-loop.md rubric.");
  console.log(HRULE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
