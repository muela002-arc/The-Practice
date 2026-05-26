// Thin wrapper around the Anthropic SDK. Centralizes:
//   - lazy client instantiation (single instance reused across calls)
//   - ANTHROPIC_API_KEY presence + non-placeholder check
//   - typed pass-through to messages.create
//
// All Anthropic API calls in the codebase go through this module — no inline
// `new Anthropic()` or `client.messages.create()` in route handlers / actions.
// (See CLAUDE.md: "Every LLM call goes through lib/llm/ — never inline.")

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith("placeholder")) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set a real key in .env.local before making LLM calls.",
    );
  }
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export async function claudeCall(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Messages.Message> {
  return getClient().messages.create(params);
}
