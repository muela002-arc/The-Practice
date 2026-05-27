import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getProjectById, type ProjectOperation } from "@/lib/db/projects";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getOperationIdsWithSessions } from "@/lib/db/sessions";
import { AGENT_PROFILES } from "@/lib/agent/profiles";

type OpStatus = "completed" | "active" | "pending";

export default async function ProjectBoardPage({
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

  const project = await getProjectById(user.id, id);
  if (!project) notFound();

  // Active operation is the lowest-ordinal op without a session. M4 derives
  // completion from sessions rather than storing it on operations.
  const operationIds = project.operations.map((op) => op.id);
  const completedIds = await getOperationIdsWithSessions(operationIds);
  const activeIndex = project.operations.findIndex(
    (op) => !completedIds.has(op.id),
  );

  const opsWithStatus = project.operations.map(
    (op, idx): { op: ProjectOperation; status: OpStatus } => {
      if (completedIds.has(op.id)) return { op, status: "completed" };
      if (idx === activeIndex) return { op, status: "active" };
      return { op, status: "pending" };
    },
  );

  const activeAgent = await getActiveAgentForUser(user.id);
  const agentProfile = activeAgent
    ? AGENT_PROFILES[activeAgent.agentType]
    : null;

  const allComplete = activeIndex === -1;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/session" className="hover:text-foreground">
          ← Session
        </Link>
        {agentProfile && <span>Project with {agentProfile.name}</span>}
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Project
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          {project.title}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {project.goal}
        </p>
        {allComplete && (
          <p className="pt-2 text-sm font-medium text-foreground">
            All operations completed.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Operations
        </h2>
        <ol className="space-y-3">
          {opsWithStatus.map(({ op, status }) => (
            <li key={op.id}>
              <OperationCard operation={op} status={status} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function OperationCard({
  operation,
  status,
}: {
  operation: ProjectOperation;
  status: OpStatus;
}) {
  const isActive = status === "active";
  const isCompleted = status === "completed";

  return (
    <article
      className={
        isActive
          ? "rounded-lg border-2 border-foreground bg-card p-5"
          : "rounded-lg border bg-card/40 p-5"
      }
    >
      <header className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span
            className={
              isActive
                ? "text-xs font-medium uppercase tracking-widest text-foreground"
                : "text-xs font-medium uppercase tracking-widest text-muted-foreground"
            }
          >
            Op {operation.ordinal}
          </span>
          <h3
            className={
              isActive
                ? "text-xl font-semibold tracking-tight"
                : "text-lg font-medium tracking-tight text-muted-foreground"
            }
          >
            {operation.title}
          </h3>
        </div>
        {isActive && (
          <span className="text-xs uppercase tracking-widest text-foreground">
            Active
          </span>
        )}
        {isCompleted && (
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Completed
          </span>
        )}
      </header>
      <p
        className={
          isActive
            ? "mt-3 text-sm leading-relaxed text-foreground"
            : "mt-3 text-sm leading-relaxed text-muted-foreground"
        }
      >
        {operation.description}
      </p>
      {isActive && (
        <div className="mt-5 flex items-center gap-3">
          <Link
            href={`/operation/${operation.id}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Begin Session →
          </Link>
        </div>
      )}
    </article>
  );
}
