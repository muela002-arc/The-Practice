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
