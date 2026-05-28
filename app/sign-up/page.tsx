import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Sign up — The Practice",
  description: "An apprentice agent platform. Invite-only.",
};

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          The Practice
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Sign up with an invite code
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Practice is invite-only. Bring a code from someone already inside.
          You will receive a magic link by email; clicking it lands you on agent
          selection.
        </p>
      </header>

      <SignUpForm />
    </main>
  );
}
