import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getOperationById, getProjectById } from "@/lib/db/projects";
import { getOperationIdsWithSessions } from "@/lib/db/sessions";
import { AGENT_PROFILES } from "@/lib/agent/profiles";
import { SubmitForm } from "./submit-form";

export default async function SubmitOperationPage({
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

  // Same active-op guard as /operation/[id]/page.tsx. The RPC enforces this
  // server-side too — this is the UX layer that catches the wrong-route case
  // before the user fills the form.
  const operationIds = project.operations.map((op) => op.id);
  const completedIds = await getOperationIdsWithSessions(operationIds);
  const activeOp = project.operations.find((op) => !completedIds.has(op.id));
  if (!activeOp || activeOp.id !== id) {
    redirect(`/project/${project.id}`);
  }

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const profile = AGENT_PROFILES[agent.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <Link href={`/operation/${operation.id}`} className="hover:text-foreground">
          ← Back to session
        </Link>
        <span>
          Operation {operation.ordinal} of {project.operations.length}
        </span>
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Submit your session to {profile.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {operation.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {operation.description}
        </p>
      </header>

      <SubmitForm operationId={operation.id} agentType={agent.agentType} />
    </main>
  );
}
