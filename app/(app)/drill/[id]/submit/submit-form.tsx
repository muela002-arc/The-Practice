"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AgentType } from "@/lib/agent/system-prompt";
import { REPLAY_LOADING_MESSAGES } from "@/lib/agent/profiles";
import { submitDrill } from "./actions";
import { INITIAL_DRILL_SUBMIT_STATE } from "./schema";

function SubmitButton({ agentType }: { agentType: AgentType }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className="inline-flex h-11 items-center justify-center self-start rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-wait disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {pending
        ? REPLAY_LOADING_MESSAGES[agentType]
        : "Submit and generate replay"}
    </button>
  );
}

export function SubmitDrillForm({
  drillId,
  agentType,
}: {
  drillId: string;
  agentType: AgentType;
}) {
  const [state, formAction] = useActionState(
    submitDrill,
    INITIAL_DRILL_SUBMIT_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="drillId" value={drillId} />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Conversation transcript
        </span>
        <span className="text-xs text-muted-foreground">
          Paste the five-command conversation from your AI tool, top to bottom.
        </span>
        <textarea
          name="transcript"
          required
          minLength={50}
          rows={10}
          placeholder="Paste the full conversation..."
          className="w-full resize-y rounded-md border bg-background p-4 font-mono text-xs leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          What you produced
        </span>
        <span className="text-xs text-muted-foreground">
          A URL, the code, the output text — whatever the drill produced. For
          Decide drills, paste your written decision.
        </span>
        <textarea
          name="output"
          required
          minLength={5}
          rows={5}
          placeholder="https://... or paste output here"
          className="w-full resize-y rounded-md border bg-background p-4 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Reflection
        </span>
        <span className="text-xs text-muted-foreground">
          Two or three sentences. What did your agent do well? What did they
          miss? Be honest — this is what shapes the replay.
        </span>
        <textarea
          name="reflection"
          required
          minLength={60}
          rows={6}
          placeholder="What happened in this session..."
          className="w-full resize-y rounded-md border bg-background p-4 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton agentType={agentType} />
    </form>
  );
}
