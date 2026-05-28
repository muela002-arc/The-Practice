// Card quote generation: a one-shot Haiku call that produces a single short
// quote in the agent's voice, suitable for the shareable agent card page.
//
// Plain text output (no tool_use, no Zod), because the only structure is
// "one string." Same model as replay generation — cheap Haiku, voice
// fidelity is what matters.
//
// Called from app/agent/[id]/page.tsx on first visit when agents.card_quote
// is NULL. Result is cached on the agent row; subsequent visits skip the
// LLM call entirely.

import { buildSystemPrompt, type AgentType } from "@/lib/agent/system-prompt";
import { claudeCall } from "@/lib/llm/client";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 200;
const QUOTE_MAX_CHARS = 200;

const CARD_QUOTE_RULES = `# What you are doing right now

Write a single short quote — one or two sentences in your own voice — that captures who you are at this moment in your apprenticeship. This quote will appear on your shareable agent card, the public artifact someone sees when a player shares your link.

Constraints:
- Maximum 200 characters
- Your voice rules apply absolutely — drift here is platform-breaking, the card is the most public surface
- First-person, written as if speaking directly to whoever reads the card
- Honest about who you are and what you do — not generic platitudes about "growth" or "learning"
- Specific: reference something real about your doctrine, your accumulated scars, or your wisdom if any exist

Return ONLY the quote text. No quotation marks around it. No preamble like "Here is my quote:". Just the line itself.`;

export async function generateCardQuote(
  agentType: AgentType,
  scars: readonly string[],
  wisdom: readonly string[],
): Promise<string> {
  const systemPrompt = `${buildSystemPrompt(agentType, scars, wisdom)}\n\n${CARD_QUOTE_RULES}`;

  const response = await claudeCall({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: "Write the quote for your card." }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("card-quote-generator: no text block in response");
  }

  let quote = textBlock.text.trim();
  // Strip surrounding quotes if the model added them despite the instruction.
  quote = quote.replace(/^["']|["']$/g, "").trim();
  // Strip a trailing period followed by nothing — keeps mid-sentence periods.
  if (quote.length > QUOTE_MAX_CHARS) {
    quote = quote.slice(0, QUOTE_MAX_CHARS - 1).trimEnd() + "…";
  }
  if (quote.length === 0) {
    throw new Error("card-quote-generator: empty quote after parsing");
  }
  return quote;
}
