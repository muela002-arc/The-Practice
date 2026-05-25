# Milestones

## Milestone 1: The Walking Skeleton (Week 1)
**Goal:** signup, agent selection, empty profile — deployed.
**Definition of Done:**
- Vercel deploy URL exists
- Signup via magic link works
- Three agents to choose from at signup
- Profile page shows the chosen agent
- qa-security-reviewer audits auth and env vars
- RLS policies block cross-user reads (verified manually)

## Milestone 2: The Agent System Prompt (Week 2)
**Goal:** generate a system prompt the user can copy into Claude/ChatGPT/etc.
**Definition of Done:**
- "Start a Session" button generates the system prompt
- Copy-to-clipboard works
- The system prompt produces distinct behavior across the three agents (verified by manual Claude paste test)
- qa-voice-auditor reviews all three base prompts

## Milestone 3: The Project Flow (Week 3)
**Goal:** user describes a project, agent shapes it, project board exists.
**Definition of Done:**
- Project creation conversation works in all three agent voices
- Five canonical test projects pass qa-loop-tester
- Project board UI complete
- Operations are sized correctly (each fits in five commands)

## Milestone 4: The Session and Replay Loop (Week 4)
**Goal:** full loop works end-to-end.
**Definition of Done:**
- Session submission flow complete
- Replay generation works with correct voice
- Scars and wisdom are earned, tied to source excerpts
- System prompt updates to reflect scars/wisdom
- Complete project run-through (one canonical project, all operations) succeeds

## Milestone 5: Polish, Daily Drills, Soft Launch (Week 5-6)
**Goal:** product is good enough to send to 50 real users.
**Definition of Done:**
- 30 daily drills authored and tested
- Drill UI works
- Shareable agent card page exists
- Invite system functional
- All prior QA gates re-run and pass
- Full security audit by qa-security-reviewer
- Soft launch to 50 invited users
