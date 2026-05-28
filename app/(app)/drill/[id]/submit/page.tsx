import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getDrillById } from "@/lib/db/drills";
import { getSessionForDrill } from "@/lib/db/sessions";
import { AGENT_PROFILES } from "@/lib/agent/profiles";
import { SubmitDrillForm } from "./submit-form";

export default async function SubmitDrillPage({
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

  // If the user already completed this drill, send them to the replay.
  const existing = await getSessionForDrill(user.id, id);
  if (existing) redirect(`/drill/${id}/replay`);

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const profile = AGENT_PROFILES[agent.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <Link href={`/drill/${drill.id}`} className="hover:text-foreground">
          ← Back to drill
        </Link>
        <span>Drill with {profile.name}</span>
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Submit your session to {profile.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{drill.title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {drill.prompt}
        </p>
      </header>

      <SubmitDrillForm drillId={drill.id} agentType={agent.agentType} />
    </main>
  );
}
