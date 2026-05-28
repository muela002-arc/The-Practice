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

- **Frontend:** Next.js 16 (App Router), TypeScript strict mode, Tailwind v4, shadcn/ui (base-nova preset, neutral base color, @base-ui/react primitives)
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
Status: COMPLETE — scaffold verified, dev server running, Supabase clients connected. Vercel deploy deferred to after M2.

**Milestone 2: The Agent System Prompt (Week 2)**
Status: COMPLETE (2026-05-26) — system prompts voice-verified against Claude (11-12/12 rubric per agent), auth chain working (dev-login bypass + magic-link callback for token_hash + PKCE), agent selection and session routes live, copy-to-clipboard verified end-to-end with Atlas paste-test. Supabase `agents` table migration applied with one-active-agent partial unique index. Vercel deploy still deferred.

**Milestone 3: The Project Flow (Week 3)**
Status: COMPLETE (2026-05-27) — full flow live: brief → Sonnet shaping (`claude-sonnet-4-6`) → ACID persist via `create_project_with_operations` RPC → project board with active-op styling. Voice-quality gate passed (15 shapings clean against the six-point rubric). `lib/llm/` created with the `claudeCall` wrapper + `project-shaper` (forced tool_use, Zod-validated, retries once on schema failure with raw-output logging). Five canonical test briefs documented at `.claude/skills/testing-the-loop.md`. Loading state in agent voice via `useFormStatus()` on a client island. Schema: `projects(id, user_id, agent_id, title, goal, description)` + `operations(id, project_id, ordinal, title, description)`, both RLS-locked, immutable in V1.

**Milestone 4: The Session and Replay Loop (Week 4)**
Status: COMPLETE (2026-05-27) — full loop verified end-to-end: Begin Session → operation-contextualized system prompt with scars/wisdom slots populated from `getAgentHistory()` → Submit my work form (transcript + output + reflection) → `generateReplay()` Haiku call → `submitSession()` via `create_session_with_completion` RPC → replay page with narrative, scar (red border), wisdom (green border), XP/level stats, leveled-up celebration. Voice re-verification passed against three agents with sample scars/wisdom inserted between `# How you speak` and `# Session rules`. Sessions immutable, completion derived from session existence (no `completed_at` on operations). Five migrations applied (0006 sessions + agent xp/level, 0007 RPC). Five new routes: `/operation/[id]`, `/operation/[id]/submit`, `/operation/[id]/replay`, plus updated project board with session-aware active-op derivation.

**Milestone 5: Polish, Daily Drills, Soft Launch (Week 5-6)**
Status: COMPLETE (2026-05-27) — 30 canonical drills authored across Build/Refine/Decide and seeded via `supabase/seeds/drills.sql`; unified sessions schema (operation_id and drill_id both nullable, exactly-one check, denormalized user_id, partial unique on `(user_id, drill_id)` for anti-grinding); drill loop verified end-to-end (`/drills` → `/drill/[id]` → `/drill/[id]/submit` → `/drill/[id]/replay`) with the source-agnostic `generateReplay` refactor; public agent card at `/agent/[id]` with lazy Haiku-generated quote cached on `agents.card_quote`, Open Graph + Twitter card meta; invite system functional (`/sign-up` form with email + 10-char invite code, `/auth/callback` extended to atomic-claim the code and generate 3 new on first login, RLS-scoped invite management on `/session`). Six migrations applied this milestone (0008 drills+unified sessions, 0009 RPC update for drills, 0010 invite codes, 0011 card quote). Three sanctioned service-role usages now: `/auth/dev-login`, `/agent/[id]`, `/auth/callback`. Stale page-level "Submit my work" button removed from `/session`.

## Build Complete (2026-05-27)

All five milestones shipped. Soft-launch ready.

**What V1 ships:**

- Three starter agents (Atlas/Vela/Iris) with mechanically distinct doctrines, voice-verified across M2 (base prompt) and M4 (with scar/wisdom slots) against Claude.
- Magic-link sign-up gated by single-use invite codes. Each user gets 3 codes on first login. 10 platform-seeded launch codes plant the network.
- Project flow: free-text brief → Sonnet-shaped 3-5 operations → operation-scoped sessions → submission → Haiku replay narrative + optional scar + optional wisdom + XP/level.
- Drill flow: 30 standalone five-command scenarios across Build/Refine/Decide. Same submission/replay/scar/wisdom mechanics. Anti-grinding (one attempt per drill per user).
- Public shareable agent card at `/agent/[id]` with cached voice-shaped quote, level, XP, recent scars and wisdom.
- Unified sessions table covers both operation and drill sessions; one source of truth for agent history.

**Strategic principles upheld throughout:**

1. **BYO-AI forever.** Three platform-hosted LLM calls only: project shaping (Sonnet), replay generation (Haiku), card quote (Haiku). Everything else happens in the user's AI tool of choice.
2. **The agent IS the configuration.** Scars and wisdom modify `buildSystemPrompt` directly — they are real prompt deltas, not cosmetic stats.
3. **Doctrines are identity, not features.** Voice and shaping behavior visibly differ across Atlas/Vela/Iris on identical inputs (verified by qa-loop-tester equivalents in M3 and M4).
4. **Death is a Day 1 design commitment.** `agents.died_at` column reserved across all RLS, FK, and RPC paths. No mechanic implemented in V1.
5. **Minecraft, not Duolingo.** Projects are user-chosen, drills are opt-in. No daily-drill notification, no streak-shaming, no assigned content.

**What's NOT in V1** (see "What We Are NOT Building In V1" below for the full list, all honored).

**Next steps:** Vercel deploy, soft launch to 50 invited users, observe whether the doctrine-distinct retention thesis holds.

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

## Next.js Version Note

We are on Next 16.2.6, not Next 15. See AGENTS.md for known API differences. When in doubt about a Next API, check the local node_modules docs before assuming training-data behavior is correct.
