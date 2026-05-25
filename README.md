# The Practice

A meta-layer above AI tools. Users raise apprentice AI agents by sending them into real creation work.

## Getting Started

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. `npm run dev`

## Stack

Next.js 15, TypeScript, Tailwind, Supabase, Anthropic API. Deployed on Vercel.

## Documentation

- `/CLAUDE.md` — project constitution, read first
- `/docs/origins.md` — design history
- `/docs/agents.md` — the three starter agents
- `/docs/doctrines.md` — the three Doctrines
- `/docs/milestones.md` — build plan
- `/.claude/skills/` — codebase wisdom
- `/.claude/agents/` — specialized subagents

## First Claude Code Session

Open Claude Code in this repo. Use this prompt:

> Read CLAUDE.md, then read the files in /docs and /.claude. Confirm you understand the project. Then scaffold the Next.js 15 project with TypeScript, Tailwind, shadcn/ui, and Supabase client setup. Don't build any features yet — just the empty Next.js app deployed to Vercel. End with: the dev server runs, a hello-world page loads, and the Supabase client connects successfully. Update CLAUDE.md's "Current Milestone" status when done.
