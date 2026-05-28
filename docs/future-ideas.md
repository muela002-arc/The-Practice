# Future Ideas

Captured design decisions for features not yet built.
Add here instead of building prematurely.

---

## The Practice CLI

### What it is
A local submission terminal that lets players submit sessions
from their own IDE or terminal, without leaving their workspace.
The website stays the hub — agent card, project board, replay,
scars, XP. The CLI is just a new input channel feeding the
same backend.

### The core insight
The CLI isn't about reducing friction. It's about evidence.
A developer who completes a session in their actual Cursor or
VS Code workspace, on a real project, has more credible proof
than someone who did a drill on a website. The Practice becomes
the scoring layer on top of real work.

### How it works
```bash
npm install -g the-practice-cli
practice auth        # links to your Practice account via token
practice status      # shows agent name, level, active project
practice session     # prints your current system prompt to copy
practice submit      # prompts for transcript, output, reflection
                     # sends only those three fields to the API
                     # your code never leaves your machine
```

### The privacy guarantee
The CLI is open source. Anyone can read it and verify it only
sends transcript text, output description, and reflection —
identical to what the web app sends today. Zero code. Zero files.
Zero repository access. This is a technical guarantee, not a
policy.

### The competition angle
The CLI stamps each submission with a verified timestamp and
the agent's current state. The replay becomes a provable
artifact — this agent, at this level, completed this work,
on this date. A portfolio piece nobody can fake.

### What this costs to build
The API already exists. The CLI calls the same endpoints
the web app calls:
- GET /api/agent/status
- GET /api/agent/system-prompt
- POST /api/sessions/submit

The CLI is ~200 lines of Node. The website changes nothing.
No parallel surfaces. One backend, two input channels.

### What a user sees
$ practice submit
Transcript (paste your conversation, then Ctrl+D):

[user pastes]

Output (one line describing what you shipped):

CSV export working, tested on 3 files

Reflection (2-3 sentences):

Atlas kept pushing me to ship before testing edge cases.
I did. The scar is fair.

Submitting...
Replay generated.
Atlas shipped the CSV export in 3 commands. Skipped error handling.
Scar earned: "Shipped without testing the edge case."
XP earned: +95
View full replay: thepractice.app/replay/abc123

### When to build it
After soft launch. Specifically: when 3 or more users
independently say "I wish I could do this from my terminal."
That signal means build it. Without that signal, don't.

### Positioning
Not "for developers." For builders — anyone using AI tools
to make real things, regardless of technical background.
The terminal is the input. The website is the game.

---

## Other ideas to capture here as they come up

(append below as new ideas surface)
