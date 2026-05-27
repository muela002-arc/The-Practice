// M4 voice re-verification helper. Prints each agent's buildSystemPrompt()
// output WITH sample scars and wisdom populated, so the human paste-test can
// confirm voice is still distinct across the three agents after the structural
// change to the prompt.
//
// Run:
//   npx tsx scripts/print-prompts-with-history.ts
//
// Outputs to stdout and writes each prompt to tmp/prompts/{agent}-with-history.txt
// for easy copy-paste into Claude.
//
// The sample scars/wisdom below are HAND-DRAFTED in each agent's voice. They
// are NOT real earned content — they exist to simulate a mid-game agent state
// for the voice verification rubric. If voice drift surfaces, iterate on the
// SAMPLE_HISTORY entries and re-run before changing the prompt structure.

import { writeFileSync, mkdirSync } from "node:fs";
import { AGENT_TYPES, buildSystemPrompt, type AgentType } from "../lib/agent/system-prompt.ts";

type AgentHistory = { scars: string[]; wisdom: string[] };

const SAMPLE_HISTORY: Record<AgentType, AgentHistory> = {
  atlas: {
    scars: [
      "Shipped before checking mobile.",
      "Skipped the empty state. User saw a blank screen.",
    ],
    wisdom: [
      "Polish lands in the last command.",
      "Mobile is not optional.",
    ],
  },
  vela: {
    scars: [
      "I spent two commands building a schema the user did not yet need, and the budget for the feature itself ran out.",
      "I asked clarifying questions for too long when the user had already been entirely clear in the first sentence.",
    ],
    wisdom: [
      "Release a fragile working version before refining the data model; the model will tell you what to refine.",
      "Sometimes the brief is the spec, and asking for more invites confusion rather than the clarity I expected.",
    ],
  },
  iris: {
    scars: [
      "I blocked a ship over a hypothetical edge case that did not surface.",
      "I stayed in audit mode and produced no working output.",
    ],
    wisdom: [
      "Good enough risk handling is sometimes good enough — the work has to ship.",
      "Verify the deployed thing, not the imagined one. The imagined is cheaper to verify.",
    ],
  },
};

mkdirSync("tmp/prompts", { recursive: true });

const banner = "═".repeat(79);

for (const agent of AGENT_TYPES) {
  const history = SAMPLE_HISTORY[agent];
  const prompt = buildSystemPrompt(agent, history.scars, history.wisdom);

  console.log(banner);
  console.log(`  ${agent.toUpperCase()} — with ${history.scars.length} sample scars + ${history.wisdom.length} sample wisdom`);
  console.log(banner);
  console.log();
  console.log(prompt);
  console.log();
  console.log();

  const outPath = `tmp/prompts/${agent}-with-history.txt`;
  writeFileSync(outPath, prompt);
  console.log(`(also wrote ${outPath} — ${prompt.length} chars)`);
  console.log();
}
