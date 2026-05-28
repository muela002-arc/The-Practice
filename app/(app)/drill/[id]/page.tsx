import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { AGENT_PROFILES, SESSION_OPENERS } from "@/lib/agent/profiles";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getDrillById } from "@/lib/db/drills";
import { getAgentHistory, getSessionForDrill } from "@/lib/db/sessions";
import { CopyButton } from "@/components/copy-button";

export default async function DrillPage({
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

  const drill = await getDrillById(id);
  if (!drill) notFound();

  // If the user has already done this drill, send them to the replay.
  const existing = await getSessionForDrill(user.id, id);
  if (existing) redirect(`/drill/${id}/replay`);

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
        <Link href="/drills" className="hover:text-foreground">
          ← All drills
        </Link>
        <span>Drill with {profile.name}</span>
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Drill
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{drill.title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {drill.prompt}
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
          href={`/drill/${drill.id}/submit`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Submit my work →
        </Link>
        <span className="text-xs text-muted-foreground">
          Done with this drill? Paste your work to get a replay.
        </span>
      </section>
    </main>
  );
}
