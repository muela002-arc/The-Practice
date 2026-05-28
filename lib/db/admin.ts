import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

// Service-role admin client. BYPASSES RLS. Use ONLY in server-side code with
// a specific, deliberate reason. Three sanctioned use cases as of M5:
//
//   1. /auth/dev-login/route.ts (gitignored) — local-dev sign-in bypass
//   2. /agent/[id]/page.tsx — public card render + lazy quote generation
//      (the card page has no auth — service role is how we read the agent
//      row + the user's session history)
//   3. /auth/callback/route.ts — invite-code consumption + new-user code
//      generation (the new user does not yet own the invite code row, so
//      the user-scoped client cannot mutate it)
//
// Add NEW usages only with a clear reason. Never import this into a client
// component. Never use it on a code path that the user could exploit to
// read or mutate other users' data — the projection / WHERE clause IS the
// security boundary when RLS is bypassed.

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith("placeholder")) {
    throw new Error(
      "createAdminClient requires SUPABASE_SERVICE_ROLE_KEY (real, not placeholder)",
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
