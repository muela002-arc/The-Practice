import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import {
  AGENT_PROFILES,
  PROJECT_BRIEFING_OPENERS,
} from "@/lib/agent/profiles";
import { StartProjectForm } from "./start-project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const profile = AGENT_PROFILES[agent.agentType];
  const opener = PROJECT_BRIEFING_OPENERS[agent.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-10 px-6 py-16">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/session" className="hover:text-foreground">
          ← Back to session
        </Link>
        <span>New project with {profile.name}</span>
      </div>

      <header className="space-y-3">
        <p className="text-2xl leading-relaxed tracking-tight">{opener}</p>
        <p className="text-xs text-muted-foreground">— {profile.name}</p>
      </header>

      <StartProjectForm agentType={agent.agentType} />
    </main>
  );
}
