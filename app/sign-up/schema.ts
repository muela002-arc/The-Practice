// Form state schema for the sign-up action. Lives outside actions.ts because
// Next.js requires "use server" files to export only async functions.

export type SignUpFormState =
  | { status: "idle"; error: null; email: null }
  | { status: "error"; error: string; email: null }
  | { status: "sent"; error: null; email: string };

export const INITIAL_SIGNUP_STATE: SignUpFormState = {
  status: "idle",
  error: null,
  email: null,
};
