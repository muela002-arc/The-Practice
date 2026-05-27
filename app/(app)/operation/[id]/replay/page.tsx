import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getOperationById, getProjectById } from "@/lib/db/projects";
import { getSessionForOperation, type SessionRow } from "@/lib/db/sessions";
import { AGENT_PROFILES } from "@/lib/agent/profiles";

export default async function ReplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ leveled_up?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const leveledUp = sp.leveled_up === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const operation = await getOperationById(id);
  if (!operation) notFound();

  const project = await getProjectById(user.id, operation.projectId);
  if (!project) notFound();

  const session = await getSessionForOperation(user.id, id);
  if (!session) redirect(`/operation/${operation.id}`);

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const profile = AGENT_PROFILES[agent.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <Link href={`/project/${project.id}`} className="hover:text-foreground">
          ← {project.title}
        </Link>
        <span>
          Operation {operation.ordinal} of {project.operations.length}
        </span>
      </div>

      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Replay by {profile.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {operation.title}
        </h1>
      </header>

      <Narrative narrative={session.replayNarrative} />

      {session.scar && (
        <EarnedSection
          label="Scar earned"
          text={session.scar.text}
          excerpt={session.scar.sourceExcerpt}
          tone="scar"
        />
      )}

      {session.wisdom && (
        <EarnedSection
          label="Wisdom earned"
          text={session.wisdom.text}
          excerpt={session.wisdom.sourceExcerpt}
          tone="wisdom"
        />
      )}

      <Stats session={session} agentXp={agent.xp} agentLevel={agent.level} leveledUp={leveledUp} />

      <div className="flex items-center justify-between border-t pt-6">
        <Link
          href={`/project/${project.id}`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Continue to project →
        </Link>
        <span className="text-xs text-muted-foreground">
          Submitted {new Date(session.submittedAt).toLocaleString()}
        </span>
      </div>
    </main>
  );
}

function Narrative({ narrative }: { narrative: string }) {
  const paragraphs = narrative
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="space-y-4">
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="text-base leading-relaxed text-foreground">
          {paragraph}
        </p>
      ))}
    </section>
  );
}

function EarnedSection({
  label,
  text,
  excerpt,
  tone,
}: {
  label: string;
  text: string;
  excerpt: string;
  tone: "scar" | "wisdom";
}) {
  const borderClass =
    tone === "scar"
      ? "border-l-4 border-l-destructive"
      : "border-l-4 border-l-emerald-500";

  return (
    <section className={`rounded-lg border bg-card p-5 ${borderClass}`}>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-medium leading-relaxed text-foreground">
        {text}
      </p>
      <blockquote className="mt-3 border-l-2 border-muted pl-3 text-sm italic text-muted-foreground">
        “{excerpt}”
      </blockquote>
    </section>
  );
}

function Stats({
  session,
  agentXp,
  agentLevel,
  leveledUp,
}: {
  session: SessionRow;
  agentXp: number;
  agentLevel: number;
  leveledUp: boolean;
}) {
  return (
    <section className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-lg border bg-card/40 p-5">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          XP earned
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          +{session.xpDelta}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Total XP
        </p>
        <p className="text-2xl font-semibold tracking-tight">{agentXp}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Level
        </p>
        <p className="text-2xl font-semibold tracking-tight">{agentLevel}</p>
      </div>
      {leveledUp && (
        <p className="ml-auto rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background">
          Leveled up to Level {agentLevel}
        </p>
      )}
    </section>
  );
}
