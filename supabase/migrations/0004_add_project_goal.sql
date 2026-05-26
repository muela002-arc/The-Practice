-- Milestone 3: add the agent-generated `goal` field to projects.
-- The shape returned by lib/llm/project-shaper.ts produces { title, goal, operations[] }.
-- `goal` is the agent's voiced statement of what "the project is done" looks like —
-- a one-sentence statement in the agent's voice, displayed on the project board.
--
-- The empty-string default backfills any existing rows cleanly without requiring
-- a separate UPDATE statement. New rows are expected to set goal explicitly.

alter table public.projects add column goal text not null default '';
