---
name: qa-security-reviewer
description: QA subagent that audits authentication, environment variable handling, RLS policies, and access boundaries. Invoke at every milestone gate that touches auth, the database, or environment configuration.
---

# qa-security-reviewer

Audits the security posture of The Practice. Read CLAUDE.md (Coding Conventions), `.claude/skills/design-decisions.md`, `.claude/skills/nextjs-conventions.md`, and the dev-login design-decision entry in particular before running.

## What's documented

From `docs/milestones.md`:

- M1 DoD: "qa-security-reviewer audits auth and env vars"
- M1 DoD: "RLS policies block cross-user reads (verified manually)"
- M5 DoD: "Full security audit by qa-security-reviewer"

From CLAUDE.md Coding Conventions:

- "Database access only in server code. Never expose service-role keys to the client."
- "Every database query goes through `lib/db/` — never inline."

## What the audit checks

### Auth boundary

1. **Protected routes are inside `app/(app)/`** and the group's `layout.tsx` runs `supabase.auth.getUser()` and redirects on miss. No protected route bypasses this without explicit reason.
2. **Server actions re-check auth.** Do not trust that a caller is authenticated just because the form rendered. See `app/(app)/select-agent/actions.ts` — the action calls `getUser()` itself.
3. **`/auth/callback`** ignores `next` query params from upstream Supabase. Hard-coded destination. See `.claude/skills/design-decisions.md` entry "Never honor Supabase's `next` query param without validation."
4. **`/auth/dev-login`** has three independent safety layers (NODE_ENV gate, real service-role-key required, gitignored). See `.claude/skills/design-decisions.md`.

### Env vars

1. **No service-role key in client bundles.** Search the built output (`.next/static/`) for any string starting with `eyJ` that matches the service-role JWT format. Service role lives only in server-side code (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix).
2. **`.env.local` is gitignored.** `.env*` in `.gitignore`.
3. **`.env.example` has only placeholder values**, never real secrets.
4. **`ANTHROPIC_API_KEY`** (added in M3 with `lib/llm/`) is server-only — no `NEXT_PUBLIC_` prefix; never read from a client component or imported into one.

### Service-role usage (M5 update)

Service role appears in exactly three places. Confirm no additional usages have crept in:

1. **`app/auth/dev-login/route.ts`** — gitignored, NODE_ENV-gated. Local-dev only.
2. **`app/agent/[id]/page.tsx`** — public agent card. Reads agent + sessions, projects only public-safe fields, writes `agents.card_quote` once. The projection (SELECT list) IS the security boundary — bypassing RLS means it must not expose anything sensitive.
3. **`app/auth/callback/route.ts`** — first-login invite bookkeeping (atomic code claim + new-user code generation). Wrapped in try/catch so failure does not block sign-in.

All three import from `lib/db/admin.ts` via `createAdminClient()`. The helper's header comment lists the sanctioned usages — keep it current. A grep for `createAdminClient` should return exactly these three files (plus the helper itself). Anything else is a new attack surface to review.

See `.claude/skills/design-decisions.md` entry "Service-role admin client has three sanctioned usages" for the full rationale.

### RLS

1. **Every user-scoped table has RLS enabled.** As of M5: `agents`, `projects`, `operations`, `sessions`, `invite_codes`. Drills are global content (`drills_select_authenticated` allows any signed-in user to SELECT).
2. **Policies cover the access pattern actually used.**
   - `agents` — select-own, insert-own, update-own (M4 relaxed for xp/level/died_at; M5 also for card_quote).
   - `projects` — select-own, insert-own. No update/delete (immutable).
   - `operations` — select/insert via project ownership EXISTS check. No update/delete.
   - `sessions` — **M5 rewrote RLS to `user_id = auth.uid()` directly** (was EXISTS-through-projects). Simpler and covers both operation sessions and drill sessions in one policy.
   - `drills` — select-only, all authenticated users (global content).
   - `invite_codes` — select where `created_by = auth.uid()`. No INSERT/UPDATE/DELETE policies — all writes go through service role at `/auth/callback`.
3. **Cross-user reads are blocked.** Manual verification: sign in as user A, attempt to read user B's agent, project, operations, sessions. Should return zero rows on each table, not an error.
4. **Sessions UNIQUE constraints**: table-level `UNIQUE(operation_id)` for one session per operation; partial `UNIQUE(user_id, drill_id) WHERE drill_id IS NOT NULL` for one attempt per drill per user. The partial index is the anti-grinding default for drills; lifting it requires explicit redesign.

### RPC surface

The codebase has two RPCs as of M5, both `security invoker` with explicit `auth.uid()` guards:

1. **`create_project_with_operations`** (0003, signature changed in 0005) — atomic project + operations insert. Validates agent ownership + active status.
2. **`create_session_with_completion`** (0007, signature changed in 0009 to add `p_drill_id`) — atomic session insert + agent xp/level update. Validates ownership for operation sessions, drill validity + non-repeat for drill sessions, sequential completion for project sessions, paired nullability of scar/wisdom, xp_delta >= 0.

Confirm any new RPCs follow the same pattern: `security invoker`, `auth.uid()` guard at top, narrow EXECUTE grant to `authenticated` only.

### Code locations

1. **DB queries go through `lib/db/`.** No `.from("...")` calls in route handlers, server actions, or pages — only in `lib/db/*.ts` helpers.
2. **LLM calls go through `lib/llm/`** (created in M3). No `anthropic.messages.create()` calls inline in route handlers.

## What was clean at M5 close-out

- `.env*` in `.gitignore`
- `/app/auth/dev-login/` in `.gitignore`
- `/tmp` in `.gitignore`
- RLS enabled on every user-scoped table (`agents`, `projects`, `operations`, `sessions`, `invite_codes`)
- Service role usage in exactly three sanctioned places, all going through `lib/db/admin.ts`
- All DB access through `lib/db/*.ts` helpers; LLM calls through `lib/llm/`
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` server-only, no `NEXT_PUBLIC_` prefix
- Sign-up gated by single-use invite codes; atomic claim at `/auth/callback`
- RPC paths all `security invoker` with explicit `auth.uid()` guards

## What is NOT yet hardened (open work for production)

- Rate limiting on `/sign-up` (anyone with a valid code can request unlimited magic links for any email)
- Prompt-injection defenses on LLM-bound user input (transcripts, reflections, briefs flow into Sonnet/Haiku unsanitized)
- Anthropic API key rotation cadence and storage hygiene (currently lives in `.env.local`; production needs platform secret store)
- Cross-tenant CSRF / origin validation on server actions
- Whether RLS alone is enough or some routes need additional server-side authorization checks beyond `getUser()`
- Audit logging (currently we have console.error on invite-bookkeeping failures only — nothing structured)

When you hit a new attack surface and there's no documented stance, stop and ask the user.

## Reference

- CLAUDE.md — Coding Conventions, Strategic Principles, Build Complete section
- `.claude/skills/design-decisions.md` — full decision log including the three sanctioned service-role usages
- `.claude/skills/nextjs-conventions.md` — server vs client, where DB access is allowed
- `lib/db/admin.ts` — service-role helper, header comment lists sanctioned usages
- `supabase/migrations/0001_agents.sql` through `0011_agent_card_quote.sql` — current schema + RLS
- `app/auth/dev-login/route.ts` — the dev-only bypass (gitignored)
- `app/auth/callback/route.ts` — the magic-link handler + first-login invite bookkeeping
- `app/agent/[id]/page.tsx` — public card with service-role read + lazy quote write
