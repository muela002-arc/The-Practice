# Design Decisions

A log of design decisions made during build. Append, don't edit. Newest at the bottom.

---

## 2026-05-26: lib/llm/ deferred until first real use case

Claude Code correctly declined to create lib/llm/ as an empty placeholder. It gets created in Milestone 2 when the system prompt generation makes the first real Anthropic API call. Building structure around actual usage, not anticipated usage.
