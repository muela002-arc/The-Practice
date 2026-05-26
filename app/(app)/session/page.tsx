import { redirect } from "next/navigation";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { AGENT_PROFILES, SESSION_OPENERS } from "@/lib/agent/profiles";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { CopyButton } from "@/components/copy-button";

export default async function SessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const agent = await getActiveAgentForUser(user.id);
  if (!agent) redirect("/select-agent");

  const profile = AGENT_PROFILES[agent.agentType];
  const prompt = buildSystemPrompt(agent.agentType);
  const opener = SESSION_OPENERS[agent.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Session with {profile.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.name} — {profile.doctrineName}
        </h1>
        <p className="text-muted-foreground">
          Paste the system prompt into Claude, ChatGPT, Cursor, or wherever you
          do the work. Run your five commands. Come back when the session is done.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          System prompt
        </h2>
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
        <button
          type="button"
          disabled
          className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border bg-muted px-4 text-sm font-medium text-muted-foreground"
          aria-disabled="true"
          title="Coming in the next session"
        >
          Submit my work
        </button>
        <span className="text-xs text-muted-foreground">
          Coming in the next session
        </span>
      </section>
    </main>
  );
}
