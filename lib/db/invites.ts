import { randomInt } from "node:crypto";
import { createClient } from "@/lib/db/server";
import { createAdminClient } from "@/lib/db/admin";

// 10-char codes from a no-confusables alphabet. ~10^15 combinations, so
// collisions on insert are effectively zero — but we retry just in case.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 10;

export type InviteCodeRow = {
  id: string;
  code: string;
  createdBy: string | null;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
};

function generateCode(): string {
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return result;
}

// Check whether a code exists AND is unused. Pre-validation step in the
// sign-up form's server action — saves the user a round-trip through
// Supabase Auth on an invalid code. Atomic consumption happens later in
// /auth/callback via claimInviteCode.
export async function validateInviteCode(
  code: string,
): Promise<
  | { valid: true }
  | { valid: false; reason: "not-found" | "already-used" | "lookup-failed" }
> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .select("id, used_by")
    .eq("code", code)
    .maybeSingle();
  if (error) return { valid: false, reason: "lookup-failed" };
  if (!data) return { valid: false, reason: "not-found" };
  if (data.used_by !== null) return { valid: false, reason: "already-used" };
  return { valid: true };
}

// Atomically claim a code for the given user. Returns true if claimed, false
// if the code was already consumed by someone else (race) or doesn't exist.
export async function claimInviteCode(
  code: string,
  userId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .update({
      used_by: userId,
      used_at: new Date().toISOString(),
    })
    .eq("code", code)
    .is("used_by", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// Generate 3 fresh invite codes for the given user. Each insert retries on
// the unique constraint in case of a collision (negligibly rare).
export async function generateInviteCodesForUser(
  userId: string,
  count = 3,
): Promise<string[]> {
  const admin = createAdminClient();
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let inserted = false;
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      const code = generateCode();
      const { error } = await admin.from("invite_codes").insert({
        code,
        created_by: userId,
      });
      if (!error) {
        codes.push(code);
        inserted = true;
      } else if (error.code !== "23505") {
        throw error;
      }
      // 23505 = unique_violation → loop and try a new random code
    }
    if (!inserted) {
      throw new Error(
        "generateInviteCodesForUser: 5 collisions in a row — extremely unlikely, check the alphabet/length",
      );
    }
  }
  return codes;
}

// Returns whether this user has already had ANY invite code bound to them
// (their "used_by"). Used at /auth/callback to detect first-time login.
export async function userHasClaimedAnyCode(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .select("id")
    .eq("used_by", userId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// List the codes this user created (their 3 invites to share). Goes through
// the user-scoped client so RLS gates the read (created_by = auth.uid()).
export async function getUserInviteCodes(
  userId: string,
): Promise<InviteCodeRow[]> {
  void userId;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invite_codes")
    .select("id, code, created_by, used_by, used_at, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    createdBy: r.created_by,
    usedBy: r.used_by,
    usedAt: r.used_at,
    createdAt: r.created_at,
  }));
}
