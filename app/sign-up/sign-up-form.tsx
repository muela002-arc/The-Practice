"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpWithInvite } from "./actions";
import { INITIAL_SIGNUP_STATE } from "./schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center self-start rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-wait disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {pending ? "Sending…" : "Send magic link"}
    </button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(
    signUpWithInvite,
    INITIAL_SIGNUP_STATE,
  );

  if (state.status === "sent") {
    return (
      <div className="rounded-md border-2 border-foreground bg-card p-6">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Magic link sent
        </p>
        <p className="mt-2 text-base leading-relaxed">
          Check{" "}
          <span className="font-medium text-foreground">{state.email}</span> for
          a sign-in link. Clicking it lands you on agent selection.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          The link expires in an hour. Close this tab and check your email.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11 rounded-md border bg-background px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Invite code
        </span>
        <input
          type="text"
          name="invite_code"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="10-character code"
          className="h-11 rounded-md border bg-background px-4 font-mono text-sm uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        />
        <span className="text-xs text-muted-foreground">
          Someone in The Practice gave you a code. Paste it here.
        </span>
      </label>

      {state.status === "error" && state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
