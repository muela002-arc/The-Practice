// Form state schema for the drill submission action. Lives outside actions.ts
// because Next.js requires "use server" files to export only async functions.

export type SubmitDrillFormState = { error: string | null };

export const INITIAL_DRILL_SUBMIT_STATE: SubmitDrillFormState = { error: null };
