import { redirect } from "next/navigation";
import { ORDERED_PROFILES, type AgentProfile } from "@/lib/agent/profiles";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { AgentWorkspace } from "@/components/agent-workspace";
import { pickAgent } from "./actions";

export default async function SelectAgentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const existing = await getActiveAgentForUser(user.id);
  if (existing) redirect("/session");

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Pick your agent
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          One choice. No re-rolls.
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          You will raise this agent through every session, every project, every
          scar. Read each Doctrine carefully before you choose. The pick is
          permanent in V1.
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-3">
        {ORDERED_PROFILES.map((profile) => (
          <li key={profile.type}>
            <AgentCard profile={profile} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function AgentCard({ profile }: { profile: AgentProfile }) {
  return (
    <form action={pickAgent} className="h-full">
      <input type="hidden" name="agent" value={profile.type} />
      <button
        type="submit"
        className="group flex h-full w-full flex-col gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        <AgentWorkspace
          agentType={profile.type}
          animation="idle"
          spriteSize={120}
        />
        <div className="space-y-1 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {profile.name}
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {profile.doctrineName}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {profile.tagline}
          </p>
          <p className="pt-2 text-xs text-muted-foreground group-hover:text-foreground">
            Choose {profile.name} →
          </p>
        </div>
      </button>
    </form>
  );
}
