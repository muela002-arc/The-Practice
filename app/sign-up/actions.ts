"use server";

import { createClient } from "@/lib/db/server";
import { validateInviteCode } from "@/lib/db/invites";
import type { SignUpFormState } from "./schema";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUpWithInvite(
  _prevState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const emailRaw = formData.get("email");
  const codeRaw = formData.get("invite_code");

  if (typeof emailRaw !== "string" || typeof codeRaw !== "string") {
    return { status: "error", error: "Missing form fields.", email: null };
  }

  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim().toUpperCase();

  if (!EMAIL_REGEX.test(email)) {
    return {
      status: "error",
      error: "That email does not look right. Try again.",
      email: null,
    };
  }
  if (code.length === 0) {
    return {
      status: "error",
      error: "Paste your invite code.",
      email: null,
    };
  }

  // Pre-validate the code. The atomic claim happens at /auth/callback when
  // the user actually completes sign-in — this check avoids sending a magic
  // link to someone whose code we already know is bad.
  const validation = await validateInviteCode(code);
  if (!validation.valid) {
    const reason =
      validation.reason === "not-found"
        ? "That invite code is not valid."
        : validation.reason === "already-used"
          ? "That invite code has already been used."
          : "Could not validate your invite code right now. Try again in a moment.";
    return { status: "error", error: reason, email: null };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        invite_code: code,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      error: error.message,
      email: null,
    };
  }

  return { status: "sent", error: null, email };
}
