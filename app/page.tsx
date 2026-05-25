import { createClient } from "@/lib/db/server";

type SupabaseStatus =
  | { state: "ok"; usingPlaceholder: boolean }
  | { state: "missing-env" }
  | { state: "instantiation-failed"; message: string };

async function checkSupabase(): Promise<SupabaseStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { state: "missing-env" };

  try {
    await createClient();
    return {
      state: "ok",
      usingPlaceholder: url.includes("placeholder.supabase.co"),
    };
  } catch (err) {
    return {
      state: "instantiation-failed",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function Home() {
  const supabase = await checkSupabase();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Milestone 0
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">The Practice</h1>
        <p className="text-muted-foreground">
          Scaffold is up. Features start at Milestone 1.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Boot checks
        </h2>
        <ul className="space-y-2 text-sm">
          <Row label="Next.js" status="ok" detail="App Router, server component rendered." />
          <Row label="Tailwind v4" status="ok" detail="This page uses Tailwind utilities." />
          <Row label="shadcn/ui" status="ok" detail="components.json present, lib/utils.ts in place." />
          <SupabaseRow status={supabase} />
        </ul>
      </section>
    </main>
  );
}

function Row({
  label,
  status,
  detail,
}: {
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
}) {
  const dot =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${dot}`} />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">— {detail}</span>
    </li>
  );
}

function SupabaseRow({ status }: { status: SupabaseStatus }) {
  if (status.state === "missing-env") {
    return (
      <Row
        label="Supabase"
        status="fail"
        detail="NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing. Check .env.local."
      />
    );
  }
  if (status.state === "instantiation-failed") {
    return (
      <Row
        label="Supabase"
        status="fail"
        detail={`Client failed to instantiate: ${status.message}`}
      />
    );
  }
  return (
    <Row
      label="Supabase"
      status={status.usingPlaceholder ? "warn" : "ok"}
      detail={
        status.usingPlaceholder
          ? "Client instantiated with placeholder credentials. Swap in a real project to enable auth/db."
          : "Client instantiated with configured credentials."
      }
    />
  );
}
