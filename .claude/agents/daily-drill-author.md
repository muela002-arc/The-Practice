---
name: daily-drill-author
description: Reserved subagent for authoring the 30 daily drills required by M5. The drill mechanic itself is not yet documented. Do not act on this file until the gap is filled in.
---

# daily-drill-author

This subagent is associated with Milestone 5 in `docs/milestones.md`:

- M5 DoD: "30 daily drills authored and tested"
- M5 DoD: "Drill UI works"

The drills mechanic itself is **not described anywhere else** in the project documentation as of M2 close-out.

## What is known

- 30 drills exist by M5 launch
- They have a UI
- They are part of the polish-and-launch milestone
- Drills are distinct from missions/operations (origins.md never uses the word "drill"; it's introduced fresh in milestones.md)

## What is NOT documented (do not invent)

- What a drill is mechanically
- How a drill differs from a mission, an operation, or a session
- The format of drill content (prompt? exercise? scenario?)
- Whether drills run inside The Practice's UI or as paste-into-AI-tool content
- Whether drills are voiced per-agent or are platform content
- The drill-authoring workflow this subagent owns
- Whether drills are mandatory, optional, scheduled, or on-demand

## Do this when starting any task that references `daily-drill-author`

1. Re-read `docs/milestones.md` M5 and `docs/origins.md` for any drill-related design that has been added since M2.
2. If still undocumented, ask the user: "what is a drill mechanically, and what's the authoring workflow this subagent owns?"
3. Do NOT invent the drill mechanic. The user explicitly stated: capture what's decided, do not invent.

## Reference

- `docs/milestones.md` M5 DoD
