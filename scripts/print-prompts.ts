import { AGENT_TYPES, buildSystemPrompt } from "../lib/agent/system-prompt.ts";

for (const agent of AGENT_TYPES) {
  const banner = `═══════════════════════════════════════════════════════════════════════════════`;
  console.log(banner);
  console.log(`  ${agent.toUpperCase()}`);
  console.log(banner);
  console.log();
  console.log(buildSystemPrompt(agent));
  console.log();
  console.log();
}
