// Form state schema for the submission action. Lives outside actions.ts
// because Next.js requires "use server" files to export only async functions.
//
// Imported by both submit-form.tsx (for useActionState's initial value) and
// actions.ts (for the action's parameter type — TypeScript erases the type
// import so no non-function export sneaks into the server-action bundle).

export type SubmitFormState = { error: string | null };

export const INITIAL_SUBMIT_STATE: SubmitFormState = { error: null };
