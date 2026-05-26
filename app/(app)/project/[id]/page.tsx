import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getProjectById, type ProjectOperation } from "@/lib/db/projects";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { AGENT_PROFILES } from "@/lib/agent/profiles";

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

  // The agent that shaped this project may differ from the user's currently
  // active one (in V1 it won't, but the data model permits it post-death).
  // For M3 we just show the user's active agent's name as context if available.
  const activeAgent = await getActiveAgentForUser(user.id);
  const agentProfile = activeAgent
    ? AGENT_PROFILES[activeAgent.agentType]
    : null;

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
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Operations
        </h2>
        <ol className="space-y-3">
          {project.operations.map((op, idx) => (
            <li key={op.id}>
              <OperationCard operation={op} active={idx === 0} />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function OperationCard({
  operation,
  active,
}: {
  operation: ProjectOperation;
  active: boolean;
}) {
  return (
    <article
      className={
        active
          ? "rounded-lg border-2 border-foreground bg-card p-5"
          : "rounded-lg border bg-card/40 p-5"
      }
    >
      <header className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span
            className={
              active
                ? "text-xs font-medium uppercase tracking-widest text-foreground"
                : "text-xs font-medium uppercase tracking-widest text-muted-foreground"
            }
          >
            Op {operation.ordinal}
          </span>
          <h3
            className={
              active
                ? "text-xl font-semibold tracking-tight"
                : "text-lg font-medium tracking-tight text-muted-foreground"
            }
          >
            {operation.title}
          </h3>
        </div>
        {active && (
          <span className="text-xs uppercase tracking-widest text-foreground">
            Active
          </span>
        )}
      </header>
      <p
        className={
          active
            ? "mt-3 text-sm leading-relaxed text-foreground"
            : "mt-3 text-sm leading-relaxed text-muted-foreground"
        }
      >
        {operation.description}
      </p>
      {active && (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Coming in the next milestone"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border bg-muted px-4 text-sm font-medium text-muted-foreground"
          >
            Begin Session
          </button>
          <span className="text-xs text-muted-foreground">
            Coming in the next milestone
          </span>
        </div>
      )}
    </article>
  );
}
