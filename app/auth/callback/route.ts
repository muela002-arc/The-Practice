import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/db/server";
import {
  claimInviteCode,
  generateInviteCodesForUser,
  userHasClaimedAnyCode,
} from "@/lib/db/invites";

const VALID_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (VALID_OTP_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  let authenticated = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authenticated = !error;
  } else if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    authenticated = !error;
  }

  if (!authenticated) {
    return NextResponse.redirect(`${origin}/?auth-error=1`);
  }

  // Invite code consumption (M5). Two conditions for first-time signup:
  //   1. The user's user_metadata carries an invite_code (set by the sign-up
  //      form's signInWithOtp call)
  //   2. The user has not yet claimed any invite code (this is their first
  //      successful login)
  //
  // If both are true, atomically claim the code and generate 3 fresh codes
  // for them to share. Failures here are logged but do not block sign-in —
  // a user who lands authenticated should never be stranded by invite
  // bookkeeping.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const inviteCode =
      typeof user?.user_metadata?.invite_code === "string"
        ? user.user_metadata.invite_code
        : null;
    if (user && inviteCode) {
      const alreadyClaimed = await userHasClaimedAnyCode(user.id);
      if (!alreadyClaimed) {
        const claimed = await claimInviteCode(inviteCode, user.id);
        if (claimed) {
          await generateInviteCodesForUser(user.id, 3);
        } else {
          console.error(
            "auth/callback: invite code claim failed — code already consumed or missing",
            { userId: user.id, code: inviteCode },
          );
        }
      }
    }
  } catch (err) {
    console.error("auth/callback: invite bookkeeping failed", err);
  }

  // Send authenticated users to /select-agent. The page itself decides
  // whether to render the picker or forward to /session if they have already
  // chosen. We intentionally ignore Supabase's `next` query param (which can
  // default to "/") — there is one post-auth destination.
  return NextResponse.redirect(`${origin}/select-agent`);
}
