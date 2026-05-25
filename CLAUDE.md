# The Practice — Project Constitution

This file is read by Claude Code at the start of every session. Keep it current. Update at the end of every session with anything that future sessions need to know.

## What We Are Building

The Practice is a meta-layer above AI tools (Claude, ChatGPT, Cursor, Lovable, etc.) where users raise apprentice AI agents by sending them into real creation work. The agent is a persistent character with voice, scars, wisdom, and a Doctrine. The user takes the agent's system prompt into their preferred AI tool and runs five-command sessions. Outcomes feed back into the agent's growth.

The fantasy: "I am building a way of working with AI that is uniquely mine."

## Strategic Principles (Non-Negotiable)

1. **BYO-AI forever.** We never host the primary LLM compute for users' creative work. Users bring Claude, ChatGPT, Cursor, etc. We are the layer above tools, not a competitor to them.
2. **The agent IS the configuration.** There is no separation between the character and the system prompt. Scars and wisdom are real modifications to the prompt the user carries into their AI tool.
3. **Doctrines are identity, not features.** Each Doctrine produces mechanically distinct playstyles. A Shipper's Code player and a Guardian Scroll player should win and lose the same mission differently.
4. **Death is a Day 1 design commitment.** Not implemented in V1, but the data model assumes agents can eventually be lost. Don't build anything that makes death impossible later.
5. **Minecraft, not Duolingo.** Users direct what they build. Projects are user-chosen. The platform scaffolds; it does not assign.

## The Three Starter Agents

- **Atlas** (Shipper's Code): Direct, urgent, short sentences. Ships first, polishes never. Earns scars about edge cases and polish.
- **Vela** (Foundations First): Measured, thorough, paragraph-talker. Understands before building. Earns scars about over-engineering and analysis paralysis.
- **Iris** (Guardian Scroll): Sharp, observant, dry. Validates before trusting. Earns scars about hesitation and over-caution.

See `/docs/agents.md` for full voice specifications and example dialogue.

## Stack

- **Frontend:** Next.js 15 (App Router), TypeScript strict mode, Tailwind, shadcn/ui
- **Backend:** Next.js API routes (no separate service in V1)
- **Database:** Supabase (Postgres + Auth + RLS)
- **LLM:** Anthropic API directly. Claude Haiku 4.5 for replay generation. Claude Sonnet for project-shaping (richer reasoning needed).
- **Hosting:** Vercel
- **Auth:** Supabase Auth, magic links only, no passwords

## Coding Conventions

- TypeScript strict mode. No `any`. If you need `unknown`, use it explicitly.
- Server components by default. Client components only when interactivity requires.
- Database access only in server code. Never expose service-role keys to the client.
- Every LLM call goes through `lib/llm/` — never inline in a route handler.
- Every database query goes through `lib/db/` — never inline.
- Errors in agent voice when user-facing. Never generic "Something went wrong."
- File names: kebab-case for routes, PascalCase for components, camelCase for utilities.
- One concept per file. If a file is over 200 lines, it's probably two concepts.

## Current Milestone

**Milestone 1: The Walking Skeleton (Week 1)**

Goal: signup → agent selection → empty profile page, deployed.

Status: Not started.

## What We Are NOT Building In V1

- Multiple agents per user
- Guilds, tournaments, leagues
- Hosted AI runs (BYO-AI only)
- Payment / plans
- Visual evolution graphics
- The weekly newspaper site
- Peer voting / review
- Multiple mission types (Build only, no Rescue or Red Flag yet)
- Lineage, ancestors, loaning
- Ambient between-session life
- Community-authored Doctrines
- Permanent death (designed-in, not implemented)
- Mobile-first polish (responsive baseline only)

## How To Use The .claude/ Directory

- **`.claude/skills/`** — Read these proactively when relevant. They are the codebase's accumulated wisdom. If you discover a new pattern that will be used again, propose a new skill at the end of the session.
- **`.claude/agents/`** — Subagents for specialized work. Invoke them when their domain matches. Don't use a subagent for one-off tasks; use them when their specialized context produces visibly better output.

## Session Discipline

At the start of every session:
1. Read this file.
2. Read any skill files relevant to the work.
3. Confirm the current milestone.

At the end of every session:
1. Update the "Current Milestone" section if status changed.
2. Add any new design decisions to `.claude/skills/design-decisions.md`.
3. If a pattern emerged that will be used again, propose a new skill.
4. Commit with a clear message describing what shipped, not what was attempted.

## Anti-Patterns To Refuse

- Adding features from the "NOT Building In V1" list, even if they seem small.
- Skipping the human-in-the-loop verification of agent voices (Milestone 2 manual test).
- Mocking the LLM responses for QA in ways that hide voice drift — voice QA must hit the real API.
- Adding generic error messages. Errors speak in agent voice.
- "Cleaning up" the system prompt construction code to be more abstract before we have three real use cases.
