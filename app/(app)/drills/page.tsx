import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/db/server";
import { getDrills } from "@/lib/db/drills";
import { getDrillIdsCompletedByUser } from "@/lib/db/sessions";

function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export default async function DrillsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-up");

  const [drills, completedIds] = await Promise.all([
    getDrills(),
    getDrillIdsCompletedByUser(user.id),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/session" className="hover:text-foreground">
          ← Session
        </Link>
      </div>

      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Drills
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Practice without a project
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Each drill is a standalone five-command session — a self-contained
          scenario you work through with your agent. Same flow as a project
          operation: you copy the system prompt into your AI tool, run five
          commands, come back to submit, and earn a replay with scars and
          wisdom. Drills count toward the same agent level.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Refine drills assume you have an artifact to work with. Bring your own.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            All drills
          </h2>
          <span className="text-xs text-muted-foreground">
            {completedIds.size} of {drills.length} completed
          </span>
        </div>
        <ul className="space-y-3">
          {drills.map((drill) => {
            const done = completedIds.has(drill.id);
            return (
              <li key={drill.id}>
                <DrillCard
                  id={drill.id}
                  title={drill.title}
                  prompt={drill.prompt}
                  completed={done}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function DrillCard({
  id,
  title,
  prompt,
  completed,
}: {
  id: string;
  title: string;
  prompt: string;
  completed: boolean;
}) {
  const href = completed ? `/drill/${id}/replay` : `/drill/${id}`;
  const cardClass = completed
    ? "block rounded-lg border bg-card/40 p-5 transition-colors hover:border-foreground"
    : "block rounded-lg border bg-card p-5 transition-colors hover:border-foreground";

  return (
    <Link href={href} className={cardClass}>
      <div className="flex items-baseline justify-between gap-4">
        <h3
          className={
            completed
              ? "text-lg font-medium tracking-tight text-muted-foreground"
              : "text-lg font-semibold tracking-tight text-foreground"
          }
        >
          {title}
        </h3>
        <span
          className={
            completed
              ? "text-xs uppercase tracking-widest text-muted-foreground"
              : "text-xs uppercase tracking-widest text-foreground"
          }
        >
          {completed ? "Completed" : "Open"}
        </span>
      </div>
      <p
        className={
          completed
            ? "mt-2 text-sm leading-relaxed text-muted-foreground/70"
            : "mt-2 text-sm leading-relaxed text-muted-foreground"
        }
      >
        {truncate(prompt)}
      </p>
    </Link>
  );
}
