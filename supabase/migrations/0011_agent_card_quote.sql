-- Milestone 5: cached card quote on agents.
-- Generated lazily on first visit to /agent/[id], then reused. The agent
-- card page is public — no auth — so the quote sits on the agent row
-- where the public route can read it via service role.

alter table public.agents add column card_quote text;
