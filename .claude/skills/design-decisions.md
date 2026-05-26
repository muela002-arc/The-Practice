# Design Decisions

A log of design decisions made during build. Append, don't edit. Newest at the bottom.

---

## 2026-05-26: lib/llm/ deferred until first real use case

Claude Code correctly declined to create lib/llm/ as an empty placeholder. It gets created in Milestone 2 when the system prompt generation makes the first real Anthropic API call. Building structure around actual usage, not anticipated usage.

## 2026-05-26: Email template is the source of truth for magic-link routing

A magic-link callback route in `/app` does NOT receive clicks unless the Supabase email template's link points to it. By default, Supabase templates expand `{{ .ConfirmationURL }}` to `{SUPABASE_URL}/auth/v1/verify?...&redirect_to={{ .SiteURL }}` — which redirects to the Site URL, bypassing `/auth/callback` entirely. Customize the template's link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink` (or `type=invite` for the Invite template). Adding the URL to "Allowed Redirect URLs" alone does nothing; that list only governs which `redirect_to` values are accepted by `signInWithOtp` from your code, it does not change what the dashboard buttons send. Diagnostic during M2: server log showed zero `/auth/callback` requests after a click — that is the signature of an untouched email template.

## 2026-05-26: Never honor Supabase's `next` query param without validation

Supabase's default magic-link flow can append `?next=/` to the callback URL. An `/auth/callback` handler that reads `const next = searchParams.get("next") ?? "/select-agent"` silently redirects authenticated users to `/` — completely bypassing the intended app entry point. For M2 there's exactly one post-auth destination (`/select-agent`), so the callback hard-codes it. When we have multiple destinations later, add `next` back behind an allow-list of known internal paths — never trust the raw value.

## 2026-05-26: Dev-login is the canonical local-dev auth (no email needed)

To authenticate in local dev without a working sign-up form or email delivery, the codebase ships a route at `/auth/dev-login` that: (1) refuses to run unless `NODE_ENV === "development"`, (2) refuses to run without a real `SUPABASE_SERVICE_ROLE_KEY` (rejects values starting with `placeholder`), (3) is gitignored at `/app/auth/dev-login/` so it cannot be committed or deployed. It signs you in as the first user in the system via `admin.listUsers` → `admin.generateLink({ type: "magiclink" })` → `verifyOtp({ token_hash })`. Three independent safety layers. Each visit is single-use (mints a fresh token). This is the only sanctioned way to bypass auth in dev — do NOT add per-route bypass flags, fake-session shortcuts, or environment-variable-toggled auth elsewhere.

## 2026-05-27: RPC parameter changes require drop+recreate, not ALTER

Postgres treats two functions with the same name but different parameter lists as different overloads, not as one function with a changed signature. `create or replace function ...` only matches when the parameter list is identical — changing parameters (e.g., adding `p_goal` to `create_project_with_operations` in M3) silently creates a new overload alongside the old, which then ambiguates calls. The clean pattern is `drop function if exists name(<old types>); create function name(<new types>) ...` in the migration, as we did in `0005_extend_project_rpc_for_goal.sql`. Plain table columns added via `alter table ... add column` work fine (see `0004_add_project_goal.sql`); RPC changes do not.

## 2026-05-27: `security invoker` is the default and the right choice for our RPCs

The `create_project_with_operations` RPC runs as `security invoker` (the default) — it executes with the caller's permissions, so RLS still gates the inserts inside the function body. `security definer` would bypass RLS by running as the function owner; we never need that for user-scoped writes in this codebase. The function's defense-in-depth `auth.uid() <> p_user_id` check at the top is redundant with RLS but produces a clearer error than a row-level rejection at insert time. Pattern for all future RPCs that write user-scoped data: `security invoker` + explicit `auth.uid()` guard + matching RLS policies. Never `security definer` for user-scoped writes.

## 2026-05-27: Loading state for slow server actions goes on a client island, not the page

`/project/new` is a server component that renders a `<StartProjectForm>` client island. The form's `<form action={startProject}>` triggers a server action that runs `shapeProject` (10-15s Sonnet call) before redirecting. The "Working." / "Let me think about this." / "Checking the shape of this." loading copy lives on a `useFormStatus()`-driven submit button inside the client island — `useFormStatus` only sees the parent form's pending state when used from a child component within that form. Pattern for all slow server-action calls: keep the page server-rendered, isolate the form (or just the submit button) as a client component, read `pending` from `useFormStatus`. Do NOT push the whole page client-side just to get a loading indicator.
