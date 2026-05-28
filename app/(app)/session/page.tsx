import { redirect } from "next/navigation";
import Link from "next/link";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { AGENT_PROFILES, SESSION_OPENERS } from "@/lib/agent/profiles";
import { createClient } from "@/lib/db/server";
import { getActiveAgentForUser } from "@/lib/db/agents";
import { getUserInviteCodes, type InviteCodeRow } from "@/lib/db/invites";
import { CopyButton } from "@/components/copy-button";
import { AgentWorkspace } from "@/components/agent-workspace";

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

  // Invite codes are M5. If 0010 has not been applied, the query will throw —
  // catch and degrade to "no codes yet" so the rest of the page still renders.
  let inviteCodes: InviteCodeRow[] = [];
  try {
    inviteCodes = await getUserInviteCodes(user.id);
  } catch {
    inviteCodes = [];
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      <AgentWorkspace
        agentType={agent.agentType}
        animation="idle"
        showName
      />
      <p className="text-muted-foreground">
        Paste the system prompt into Claude, ChatGPT, Cursor, or wherever you
        do the work. Run your five commands. Come back when the session is done.
      </p>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="flex flex-col items-start gap-2 rounded-lg border-2 border-foreground bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Start a project
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Bring a brief. {profile.name} will shape it into 3-5 operations
            sized for five-command sessions.
          </p>
          <Link
            href="/project/new"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Start a Project →
          </Link>
        </article>
        <article className="flex flex-col items-start gap-2 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Try a drill
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Standalone five-command sessions. No project commitment. Same
            replay, scars, wisdom, XP.
          </p>
          <Link
            href="/drills"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-md border-2 border-foreground bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Try a Drill →
          </Link>
        </article>
      </section>

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

      <section className="space-y-3 border-t pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your agent card
          </h2>
          <Link
            href={`/agent/${agent.id}`}
            className="text-sm text-foreground underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"
          >
            View card →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          A public, shareable page showing {profile.name}&apos;s level, scars,
          and wisdom. Bring it to a job interview or send it to a friend.
        </p>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your invite codes
        </h2>
        <InviteCodesList codes={inviteCodes} />
      </section>
    </main>
  );
}

function InviteCodesList({ codes }: { codes: InviteCodeRow[] }) {
  if (codes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You have no invite codes yet. They are generated automatically when you
        sign up with an invite. (If you arrived via dev-login or before the
        invite system existed, a teammate can seed three codes for you from the
        Supabase SQL editor.)
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {codes.map((c) => {
        const used = c.usedBy !== null;
        return (
          <li
            key={c.id}
            className={
              used
                ? "flex items-center justify-between gap-3 rounded-md border bg-card/40 px-4 py-3"
                : "flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3"
            }
          >
            <div className="flex items-baseline gap-3">
              <code
                className={
                  used
                    ? "font-mono text-sm tracking-wider text-muted-foreground line-through"
                    : "font-mono text-sm tracking-wider text-foreground"
                }
              >
                {c.code}
              </code>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {used ? "Used" : "Available"}
              </span>
            </div>
            {!used && <CopyButton value={c.code} label="Copy code" />}
          </li>
        );
      })}
    </ul>
  );
}
