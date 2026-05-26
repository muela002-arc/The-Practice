---
name: nextjs-conventions
description: Next.js 16 App Router conventions used in this project — route groups, auth protection pattern, server vs client components, server actions, route handlers. Read before adding a new route or page.
---

# Next.js conventions

Next 16.2.6, App Router only. Server components by default per CLAUDE.md. No middleware in M2 (may change in later milestones if we need cross-route session refresh).

## Route group for protected routes

Authenticated routes live under `app/(app)/`. The parentheses make `(app)` a route group: it scopes a layout without affecting the URL. So `app/(app)/select-agent/page.tsx` maps to `/select-agent`. The group's `layout.tsx` is where auth protection lives.

Public routes live outside the group:
- `app/page.tsx` → `/` (the boot-check page; will eventually be the landing page)
- `app/auth/callback/route.ts` → `/auth/callback` (magic-link handler)
- `app/auth/dev-login/route.ts` → `/auth/dev-login` (dev-only bypass; gitignored — see [[design-decisions]])

## Auth pattern: layout-level, no middleware

`app/(app)/layout.tsx` calls `supabase.auth.getUser()` and `redirect("/sign-up")` if no user. This works because:

- One redirect call, no middleware matcher patterns to maintain
- Runs in the same render context as the page — errors surface in the dev server log naturally
- Server components render with cookies already attached to the request, so `getUser()` sees the real session

When you add a new route that needs auth, put it inside `app/(app)/`. The redirect target is `/sign-up`, which is intentionally 404 in M2 — the real sign-up page lands in a later milestone. In local dev, use `/auth/dev-login` to authenticate.

## Server vs client: default to server

Server components are the default. Only mark `"use client"` when you actually need browser APIs (`navigator`, `window`, `document`) or React state/effects for interactivity.

As of M2 the codebase has exactly one client component: `components/copy-button.tsx`. It uses `navigator.clipboard.writeText` and `useState` for the "Copied" feedback. Everything else — including all three protected pages — is server-rendered.

The pattern: render the whole page on the server, embed a tiny client component for just the interactive bit. Don't push a page client-side because one button needs `onClick`.

## Server actions, not client-side mutations

Mutations go through `"use server"` actions in `actions.ts` files colocated with the page that calls them. Canonical example: `app/(app)/select-agent/actions.ts` exports `pickAgent(formData)`, and `page.tsx` calls it via `<form action={pickAgent}>`. No client JS needed for the form itself — the browser POSTs natively, the action runs on the server, redirects on success.

Inside the action: re-check auth (don't trust the caller), validate input with a type guard (no `any`), call the `lib/db/` helper, handle expected error reasons (e.g., unique-violation as benign), redirect.

## Route handlers for non-page endpoints

OAuth/auth callbacks use `route.ts` files exporting `GET`/`POST` handlers. They:

1. Read query params from `new URL(request.url).searchParams`
2. Call Supabase auth methods (`exchangeCodeForSession`, `verifyOtp`)
3. Return a `NextResponse.redirect(url)` — the SSR client's `setAll` cookie handler writes the session cookie onto that response

See `app/auth/callback/route.ts` for the canonical version. Do not honor any redirect-target query param from outside the app (e.g., Supabase's `next`) without an allow-list — see [[design-decisions]].

## File naming

CLAUDE.md says: "kebab-case for routes, PascalCase for components, camelCase for utilities."

Where the codebase precedent differs:

- **Component files are kebab-case in practice** (`components/ui/button.tsx`, `components/copy-button.tsx`). Shadcn generated `button.tsx` that way and we matched it. Treat kebab-case as the de-facto convention; revisit CLAUDE.md when there's a third data point pulling the other direction.
- **Route folders are kebab-case**: `select-agent`, `dev-login`, `auth/callback`. Consistent.

## Next 16 specifics that bite

- `cookies()` from `next/headers` returns a Promise. Always `await cookies()` in server code. See `lib/db/server.ts`.
- The `create-next-app` template added `AGENTS.md` at the repo root with a warning that Next 16 has API differences from training data. CLAUDE.md cross-references it. When unsure about a Next API, check `node_modules/next/dist/docs/` instead of relying on training-data memory.
- Route groups with parentheses can confuse shell tooling. Quote paths: `'app/(app)/...'`.

## Database access only via `lib/db/`

CLAUDE.md mandate: "Every database query goes through `lib/db/` — never inline." Two clients live there:

- `lib/db/server.ts` — async, cookie-aware, anon key, typed via `Database` generic from `lib/db/types.ts`
- `lib/db/browser.ts` — sync, anon key, typed; only used in client components

Domain-specific query helpers go in `lib/db/{entity}.ts`. Canonical: `lib/db/agents.ts` exposes `getActiveAgentForUser` and `createAgentForUser`. Server actions and pages call these helpers, not raw `.from("agents").select(...)`.
