"use client";

import { useFormStatus } from "react-dom";
import type { AgentType } from "@/lib/agent/system-prompt";
import { SHAPING_LOADING_MESSAGES } from "@/lib/agent/profiles";
import { startProject } from "./actions";

function SubmitButton({ agentType }: { agentType: AgentType }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className="inline-flex h-11 items-center justify-center self-start rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-wait disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {pending ? SHAPING_LOADING_MESSAGES[agentType] : "Shape this into a project"}
    </button>
  );
}

export function StartProjectForm({ agentType }: { agentType: AgentType }) {
  return (
    <form action={startProject} className="flex flex-col gap-4">
      <textarea
        name="brief"
        required
        minLength={10}
        rows={10}
        placeholder="Describe what you want to build. As much detail as you have."
        className="w-full resize-y rounded-md border bg-background p-4 text-base leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      />
      <SubmitButton agentType={agentType} />
    </form>
  );
}
