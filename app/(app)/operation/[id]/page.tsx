import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { AGENT_PROFILES, SESSION_OPENERS } from "@/lib/agent/profiles";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getOperationById, getProjectById } from "@/lib/db/projects";
import {
  getAgentHistory,
  getOperationIdsWithSessions,
} from "@/lib/db/sessions";
import { CopyButton } from "@/components/copy-button";

export default async function OperationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const operation = await getOperationById(id);
  if (!operation) notFound();

  const project = await getProjectById(user.id, operation.projectId);
  if (!project) notFound();

  // Verify this is the active operation. Active = lowest-ordinal op without
  // a session. The RPC enforces sequential completion server-side too, so
  // this is a UX guard, not a security boundary.
  const operationIds = project.operations.map((op) => op.id);
  const completedIds = await getOperationIdsWithSessions(operationIds);
  const activeOp = project.operations.find((op) => !completedIds.has(op.id));
  if (!activeOp || activeOp.id !== id) {
    redirect(`/project/${project.id}`);
  }

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const history = await getAgentHistory(agent.id);

  const profile = AGENT_PROFILES[agent.agentType];
  const prompt = buildSystemPrompt(
    agent.agentType,
    history.scars,
    history.wisdom,
  );
  const opener = SESSION_OPENERS[agent.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <Link
          href={`/project/${project.id}`}
          className="hover:text-foreground"
        >
          ← {project.title}
        </Link>
        <span>
          Operation {operation.ordinal} of {project.operations.length}
        </span>
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Begin session with {profile.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {operation.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {operation.description}
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            System prompt
          </h2>
          <span className="text-xs text-muted-foreground">
            {history.scars.length > 0 || history.wisdom.length > 0
              ? `Includes ${history.scars.length} scar${history.scars.length === 1 ? "" : "s"} + ${history.wisdom.length} wisdom`
              : "No scars or wisdom yet"}
          </span>
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-card p-4 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
          {prompt}
        </pre>
        <div className="flex items-center gap-3">
          <CopyButton value={prompt} />
          <span className="text-xs text-muted-foreground">
            {prompt.length.toLocaleString()} characters
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-dashed bg-card/40 p-5">
        <p className="text-sm italic text-foreground">{opener}</p>
        <p className="mt-1 text-xs text-muted-foreground">— {profile.name}</p>
      </section>

      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href={`/operation/${operation.id}/submit`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Submit my work →
        </Link>
        <span className="text-xs text-muted-foreground">
          Done with this operation? Paste your work to get a replay.
        </span>
      </section>
    </main>
  );
}
