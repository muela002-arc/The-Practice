import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/db/admin";
import { AGENT_PROFILES } from "@/lib/agent/profiles";
import type { AgentType } from "@/lib/agent/system-prompt";
import { generateCardQuote } from "@/lib/llm/card-quote-generator";
import { AgentWorkspace } from "@/components/agent-workspace";

// Public route — no auth required. Reads via service role; projects only
// what is intended to be public. The agent_id in the URL is a uuid (not
// guessable), so this is share-by-link, not discoverable.

type CardData = {
  agentType: AgentType;
  level: number;
  xp: number;
  cardQuote: string;
  topScars: string[];
  topWisdom: string[];
  sessionsCount: number;
};

async function loadCard(agentId: string): Promise<CardData | null> {
  const admin = createAdminClient();

  const { data: agent, error: agentErr } = await admin
    .from("agents")
    .select("id, user_id, agent_type, level, xp, card_quote")
    .eq("id", agentId)
    .maybeSingle();
  if (agentErr || !agent) return null;

  const { data: sessions, error: sessionsErr } = await admin
    .from("sessions")
    .select("scar_text, wisdom_text, submitted_at")
    .eq("user_id", agent.user_id)
    .order("submitted_at", { ascending: false });
  if (sessionsErr) return null;

  const allScars: string[] = [];
  const allWisdom: string[] = [];
  for (const row of sessions ?? []) {
    if (row.scar_text) allScars.push(row.scar_text);
    if (row.wisdom_text) allWisdom.push(row.wisdom_text);
  }

  // Lazy quote generation. First visit pays the ~5s Haiku call; the row's
  // card_quote stays populated thereafter so re-visits and OG-tag fetches
  // are instant.
  let cardQuote = agent.card_quote;
  if (!cardQuote) {
    cardQuote = await generateCardQuote(agent.agent_type, allScars, allWisdom);
    await admin
      .from("agents")
      .update({ card_quote: cardQuote })
      .eq("id", agent.id);
  }

  return {
    agentType: agent.agent_type,
    level: agent.level,
    xp: agent.xp,
    cardQuote,
    topScars: allScars.slice(0, 3),
    topWisdom: allWisdom.slice(0, 3),
    sessionsCount: sessions?.length ?? 0,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const card = await loadCard(id);
  if (!card) {
    return { title: "Agent not found — The Practice" };
  }
  const profile = AGENT_PROFILES[card.agentType];
  const title = `${profile.name} — Level ${card.level} — The Practice`;
  const description = card.cardQuote;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "The Practice",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function AgentCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await loadCard(id);
  if (!card) notFound();

  const profile = AGENT_PROFILES[card.agentType];

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <article className="space-y-8 rounded-2xl border-2 border-foreground bg-card p-8 shadow-sm">
        <AgentWorkspace agentType={card.agentType} animation="idle" />
        <header className="space-y-1 text-center">
          <h1 className="sr-only">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            Level {card.level} · {card.xp} XP · {card.sessionsCount} session
            {card.sessionsCount === 1 ? "" : "s"} completed
          </p>
        </header>

        <blockquote className="border-l-4 border-foreground pl-4 text-lg italic leading-relaxed text-foreground">
          {card.cardQuote}
        </blockquote>

        {card.topScars.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Recent scars
            </h2>
            <ul className="space-y-1.5">
              {card.topScars.map((scar, i) => (
                <li
                  key={i}
                  className="border-l-2 border-l-destructive pl-3 text-sm leading-relaxed text-foreground"
                >
                  {scar}
                </li>
              ))}
            </ul>
          </section>
        )}

        {card.topWisdom.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Recent wisdom
            </h2>
            <ul className="space-y-1.5">
              {card.topWisdom.map((w, i) => (
                <li
                  key={i}
                  className="border-l-2 border-l-emerald-500 pl-3 text-sm leading-relaxed text-foreground"
                >
                  {w}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
          An apprentice agent in The Practice
        </footer>
      </article>
    </main>
  );
}
