# Origins

This file captures the design conversation that produced The Practice. It's not a spec; it's history. When future you (or a future Claude Code session) wonders "why did we make that choice?" — this is where the reasoning lives.

---

## How To Use This File

Paste the entire brainstorm conversation history that led to this project. Include every round — the original founder/storyteller dialogue, the Minecraft pivot, the MVP definition rounds, the build planning conversation, the QA additions. Don't summarize. Future context comes from raw history.

When new design rounds happen post-launch, append them here with a date heading.

---

## [PASTE THE ORIGIN CONVERSATION HERE]

The Brainstorm Room
A creative team gathers around the document. Coffee. Whiteboards. The kind of focused chaos where good ideas get born.

The Skeptic leans back first. "Okay, before we fall in love with this — what's actually here? Strip the poetry away."
The Storyteller smiles. "The poetry IS the product. But fine. The mechanical core is: a gamified skill-tracking layer that sits on top of AI tools people already use. The 'agents' are persistent character sheets — profile + prompt library + accumulated lore. Missions are structured prompts with constraints. Scars and wisdom are just tags and modifier text."
The Designer nods. "Right. Underneath the fantasy, it's a constraint engine. Five commands. One mission. One agent. The constraint is what creates skill growth. People don't get better at AI by having unlimited tries — they get better by having to think before they prompt."
The Skeptic writes on the board:

Real mechanic: persistent identity + forced constraint + visible progression

"That part is real. That part is good."

Let's Expand Before We Compress
The Storyteller stands up. "Let me push the world bigger before we shrink it. Because I think the document undersells the emotional core."
"Imagine: every agent has a voice. Not a generic chatbot voice — a written personality that the player can hear in their head. Spark talks in fragments and exclamations. Patch is dry, methodical, slightly condescending. Muse speaks in metaphors. Guardian is terse and military."
"When Spark fails, the replay doesn't say 'mission failed.' Spark says it. In character. 'I shipped it. I shipped it before I checked the mobile view. I'm sorry. I won't do it again — well, I might.'"
The Designer lights up. "That's the trick that makes the scar system emotional instead of clinical. The scar isn't a stat. It's a memory the agent expresses."
The Engineer raises a hand. "How do we generate that without it sounding samey? Every Spark on every player's account can't say the same thing."
The Storyteller: "Templates with rotating phrasings, seeded by the specific scar and mission. Plus a small LLM call — cheap — to vary it. The personality stays canonical. The expression varies."

What's Missing From the Document
The Skeptic writes another column:

What the doc DOESN'T address:

What happens on Day 30? (retention)
Why would I trust the scoring? (legitimacy)
What stops someone just pasting AI-generated submissions? (anti-cheat)
Why is this a game and not a portfolio? (positioning)


The Designer tackles the last one first. "It should be both. The portfolio is the byproduct of the game. After 30 missions, you have 30 documented builds, with constraints, replays, and reflections. That's a hireable artifact. Imagine showing up to a job interview with a Practice AI player card — 'Level 18 commander, 4 specialist agents, won Rescue Tournament Week 14.' That's more honest than a resume."
The Engineer: "And it's more honest than a GitHub graph, because GitHub doesn't show how you used AI. Practice AI does."
The Skeptic: "So the moat is: we are the only place that documents the way you work with AI, not just the output. That's defensible."

On Anti-Cheat (the boring but critical part)
The Engineer: "If you let people submit screenshots and links, someone will fake it. We need friction that doesn't kill fun."
The Designer: "Three layers:

Command log requirement — paste your actual conversation, not just the result. Five commands means five visible messages.
Reflection field — 'what did Spark do wrong?' You can fake a screenshot. You can't easily fake a thoughtful reflection.
Peer review with reputation — your judging quality affects your own progression."

The Skeptic: "Layer three is actually the secret weapon. Reviewers who agree with the eventual consensus gain Judge Reputation. Cheaters get downvoted by humans who can smell it. The community polices itself, and reviewing becomes its own loop."

The Retention Question (Day 30)
The Storyteller: "This is where the document is weakest. After Day 7, you've collected the starter team. What pulls you back on Day 23?"
The Designer: "Three forces:

Agent evolution thresholds — Spark hits Level 9 and is about to evolve into either Architect Spark (if discipline scars dominate) or Wild Spark (if creative scars dominate). You want to see which one. You log in.
Streak mythology — not generic streaks. 'Spark has shipped 14 missions in a row. Break the streak and Spark loses momentum.' The agent has skin in the game.
Guild obligations — your three friends are counting on your contribution this week."

The Skeptic: "Careful. The 'don't break the streak' guilt mechanic can become toxic. Duolingo does it well but also poorly. The agent shouldn't punish you. The agent should miss you."
The Storyteller: "Yes. 'Spark hasn't been in a mission for 5 days. Spark is restless.' Not 'YOU LOST YOUR STREAK.' Soft anthropomorphic pull, not punitive design."

Now Let's Talk Heresy
The Skeptic stands up. "Okay. Hard question. Is the agent metaphor actually the right one?"
Silence.
"Because there's a real risk that the 'pet/warrior' framing makes serious users bounce. 'I'm a 34-year-old PM, why am I raising Spark the Hatchling?' The document acknowledges this but I don't think it solves it."
The Designer: "What's the alternative framing?"
The Skeptic: "What if the agents are apprentices, not pets? You're not a trainer. You're a master taking on students. You're more senior than they are. The aesthetic is master-and-apprentice, not Pokémon. Studio Ghibli, not gacha."
The Storyteller: "Hm. That changes a lot. The relationship is mentorship, not ownership. The agent grows because you taught it well. The wisdom sources are scrolls you bestow. That's... actually more dignified."
The Engineer: "And it scales. A senior engineer mentoring four apprentice agents feels professional. A senior engineer raising four pet Hatchlings feels infantilizing."
The Skeptic: "I'd push for the apprentice framing for the launch tone. Keep the warmth. Drop the cuteness."

The Compression Begins — From Vision to MVP
The Designer wipes the board. "Okay. We've expanded. Now let's compress. What is the smallest version of this that proves the core hypothesis?"
The Skeptic: "What IS the core hypothesis?"
The Storyteller: "That people will return daily to practice AI usage if the practice has characters, constraints, and consequences."
The Skeptic: "Good. Now strip everything that doesn't test that."

The MVP — Stripped to Bone
Cut:

Multiple agents at launch (start with ONE)
Guilds, tournaments, leagues
Hosted AI runs
Payment, plans, exports
Visual evolution stages
The weekly newspaper site
Voting reputation systems
Multiple mission types

Keep:

One mission per day. Real, useful, 30-60 minute creation task.
One starter agent. A character with voice, prompt template, and a profile that persists.
Five-command constraint. This is the heart. Without it, nothing matters.
Submission ritual: paste your actual conversation, paste the result, write 2-3 sentences on what your agent did well/poorly.
Replay generation: a short, narrated recap of what happened, in your agent's voice. This is the only AI cost.
A persistent profile for your agent that visibly accumulates: missions completed, scars earned (text tags), wisdom learned.
Public gallery of yesterday's submissions (you only see them after submitting today).

The Engineer: "That's buildable in 4-6 weeks by two people. The AI cost is the replay generation — one call per submission, maybe 1500 tokens out. At Haiku-tier pricing, this is genuinely a few dollars a month for the first thousand users."

The First Three Weeks of the MVP, From a Player's POV
Day 1. You sign up. You meet one agent — let's call this version Atlas, an Apprentice Builder. Atlas has a one-paragraph bio you can read. Today's mission appears: "Build a tool that takes a long meeting transcript and returns the three decisions made." Five commands. Use any AI tool you want. You complete it. You paste your work. Atlas writes back: "We finished. I think we over-engineered the parser — I kept reaching for regex when the model would have just done it. Note for next time." Scar earned: Reached for code when prose would do.
Day 4. Today's mission is a Rescue — fix a broken AI-generated app. Atlas's bio now reads slightly different. The scar is visible. The reflection field pre-fills with the scar as a reminder. You ship. Atlas's voice changes a little — earned a wisdom tag: Diagnose before patching.
Day 14. Atlas is Level 4. You have nine scars and six wisdoms. Your profile page is a real artifact. You can share it. Someone in your network sees it and signs up.
That's the loop. Everything else in the original document is expansion on this loop.

What We'd Add in V2 (Not V1)
The Designer sketches a roadmap on the side:

V2 (months 2-3): Second agent unlocks at Level 5 of the first. Now team strategy enters.
V3: Peer voting on submissions; Judge reputation.
V4: Wisdom Sources as an explicit, swappable mechanic.
V5: Guilds.
V6: The weekly site.
V7: Paid hosted runs, leagues, sponsored missions.

The Skeptic: "Do not build V5 before V2 lives. The whole story in the document is gorgeous but a launch trying to deliver it all will collapse."

The Final Pitch, Rewritten
The Storyteller takes the marker for the last line.

Practice AI is a daily training ground where you take on apprentice AI agents and teach them — by giving them harder missions, stricter constraints, and better wisdom — to become a crew that works the way you think. You don't watch them grow. You raise them.

The Skeptic: "I'd ship that."
The Engineer: "I'd build that in six weeks."
The Designer: "I'd want to play it tomorrow."
The whiteboard is full. The coffee is cold. The MVP is clear: one apprentice, one mission a day, five commands, one replay, one persistent profile. Everything else is earned ground.
What this dialogue actually unlocked
You're not building a game. You're building the meta-layer above AI tools. Cursor, Claude, Lovable, Bolt, Replit, ChatGPT — these are infrastructure. Your platform is what makes them playable, persistent, and emotional. The user doesn't choose between you and Cursor; they take their agent INTO Cursor.

That's the wedge. It's strategic genius for three reasons most product people will miss:

You're complementary to every AI tool, not competing with any of them. That means every major AI lab and IDE startup is a potential partner, not a threat. Anthropic, OpenAI, Cursor, Lovable could each eventually sponsor missions in your world. They want your players. You're a distribution channel for their tools.

You sit on the persistent layer they all refuse to own. None of them want to be a "memory" or "personality" platform — that's a separate product surface they'd rather avoid. You happily take that real estate. The agent profiles + scars + wisdom are your IP, portable across their tools.

The "BYO-AI" model is a moat, not a compromise. It looks like a cost-saving hack. It's actually the strategic position: you stay tool-agnostic forever. Even when GPT-6 and Claude 5 launch and pricing collapses or explodes, your game doesn't change — because the LLM is the player's problem, not yours.

This is why the brain trust's framing of "raise your AI crew, let them fail, make them dangerous" lands. The fantasy isn't "I completed something." It's "my crew is becoming mine." Pokémon, D&D, and Hearthstone all win on this same emotional axis: persistent companions you cultivated yourself.

Visionary additions — what to push beyond the dialogue
The brain trust nailed the foundation. Here's what they didn't fully extract:

1. Wisdom Sources are not prompts. They're identity.
The dialogue treats Wisdom Sources as doctrines an agent equips. Push further: Wisdom Sources are the player's identity within the platform. Like Hogwarts houses, INTJ types, Slack reaction profiles. Three months in, players self-describe:

"I'm a Shippers' Code player."
"I run a Guardian Scroll team."
"Founder Instinct or nothing."

That's retention. Identity beats utility. Once a player has staked their identity in "I'm a Minimalist," they don't leave easily. The platform becomes a place you belong, not a tool you use.

The depth move: let Wisdom Sources have factional tension. Shippers vs. Guardians is a real philosophical disagreement (move fast vs. don't break things). Players who consistently use one come to genuinely disagree with the other. Tournaments between Doctrines. Guilds organized by Doctrine. The Doctrine isn't a feature — it's the social fabric.

2. Agents must persist between sessions like Animal Crossing villagers
If your agent only exists when you log in, it's a tool. If it exists while you're away, it's a being.

Light, cheap mechanics that imply continuous life:

Background events: "While you were away, Spark observed a rookie player attempting a Mission. Spark gained the insight: 'Some users abandon mid-build.'"
Letters from other agents: "Patch (Mira's debugger) sent Spark a message: 'I saw your mobile-layout scar. I have one too.'"
Idle missions: the agent can be sent on a 24-hour expedition while you're offline. Returns with a small reward and a story.
Drift: if you don't visit for a week, Spark gets "Restless" (a temporary minor scar). This isn't punishment — it's consequence, which makes attendance feel meaningful.
None of this requires expensive LLM calls. It requires good story generation from templates + the agent's profile state. You can produce hundreds of "Spark observed..." flavor texts from a small writer's room of templates.

3. Agents can be loaned to friends — and that's the network effect
Right now the brain trust has agents as solo property. Push: agents are loanable.

Mira sends Spark to help on a Mission. Spark earns its first scar on someone else's team. The friend's Mission ends, Spark returns home, carrying back what it learned.

This is the deep social mechanic Pokémon never had. Your agent participates in other players' stories. Friends' agents help you and you help them. The agent is a thread connecting you to other players.

Two players over a year develop shared agent histories: "Remember when Spark and Patch fought the Red Flag boss together? Spark caught the exposed key, Patch fixed the broken auth." That memory belongs to two players, not one. Social glue.

This is also the most elegant referral mechanic: you don't refer the platform, you offer your friend your agent. They have to sign up to receive it.

4. The Ancestor / Lineage system
Agents that retire (graduate to Mythic stage, or fail permanently) become Ancestors.

Ancestors don't go to battle. But:

They appear in your lineage page (your hall)
New agents you create can inherit one trait or scar or wisdom fragment from an Ancestor
Other players visiting your profile see your Ancestors
Some Ancestors become Legendary (top players' famous agents become folklore the whole community knows about)
This is the mechanic that makes time spent matter forever. A player who's been here a year has a hall. A new player joining sees the depth they're building toward.

It's also a quiet aspirational ladder: every player wants to one day have an agent in someone else's lineage as a Legendary Ancestor they encountered.

5. Community-authored Wisdom Sources
The brain trust listed 5 starter Doctrines. Push: players propose new ones.

"I want to submit a new Wisdom Source: The Cathedral Mind. Build for the next century, not the next quarter. Refactor before adding. Document everything as if you'll die tomorrow."

Community votes. Top-voted Doctrines become canonical. The platform gains content for free, players get authorship, the culture of the platform builds itself.

In year 2, the canonical Doctrines aren't yours. They're the community's. The platform now has shared philosophy nobody can copy.

6. Replays are the Twitch clips of this universe
The dialogue mentions replay submissions. Push: replays are the share asset.

Every mission ends with a generated narrative — short, atmospheric, present-tense. Like a sports recap. Shareable as image OR short video OR text. Players spend their downtime watching other players' replays the way people watch chess.com top-game replays.

The platform's daily front page isn't just "today's mission." It's today's top replays — curated by community votes and editorial picks. The newspaper at practiceaiweekly.com headlines: "Spark's rescue of Mira's broken auth, narrated."

This is the surface where virality lives. A great replay is a great story. Stories spread.

7. Anti-perfection: agents can be lost
The vision treats progression as monotonically upward. Push: let agents die.

Too many scars accumulate → "Brittleness" → agent retires permanently
Wrong Wisdom paired with too many mismatched missions → "Identity crisis" → agent must be reborn
Long abandonment → agent leaves the player (permanent)
This sounds harsh. It's the move that makes the platform real. If you can't lose, you don't care about winning. Emotional risk is what creates emotional reward. Hardcore Pokémon (Nuzlocke runs) — where dying Pokémon stay dead — has more passionate community than the standard mode. Players don't want a frictionless game. They want stakes.

The unsolved tensions I'm watching
Some things the dialogue glossed over that will eventually have to be answered:

1. What's a "mission" mechanically, really?
"Build a tiny app that turns stressful workplace messages into a calm reply" is a beautiful prompt. But: how does the player prove they completed it? Screenshot + demo URL + commands used + what broke + what learned — that's already in the design. But what stops cheating? Peer voting addresses some, not all. Probably need a "trust score" per player that decays when their submissions are flagged as low-effort.

2. The agent's "personality" must actually change behavior to feel real
A scar that says "Ignored small screens" is emotionally affecting. But unless the agent's NEXT mission actually behaves differently because of that scar, the player will eventually notice the scars are theatrical. The scars must materially modify the system prompt the player carries into Cursor/Claude/etc. The depth has to be real.

3. Solo with ambient multiplayer, or actual multiplayer?
The dialogue toggles between both. The MVP probably wants solo + ambient (Wordle-style) — single-player loop with friction-free social texture — and PvP/Guilds layered later. Locking this clarifies the build order.

4. The naming problem
"Practice AI Daily / Weekly" is fine but descriptive. The brand probably needs a noun, not a verb. Some throwaway candidates:

Crew — direct, ownable
Familiars — fantasy framing
Conclave — gathering of minds
The Hatchery / The Den / The Forge — physical place
Glyph — agents as runes you cast
Spawn — too cynical
Foundling — too sad
Mind Forge — close
Or keep the domain name as the brand. "Practice AI" as a verb-noun (like Reddit or Discord) is fine if everything else is strong. The brain trust avoided naming for a reason — it's hard. Worth deciding before content production starts though.

Where to push hardest next
If I were giving founder advice on what to figure out first, before any other brainstorming:

Lock the 7-day onboarding arc as the canonical "what the game is." The brain trust drafted it. Make it the spec everything else serves. Every system question gets answered by "does it make Day 1-7 better?"

Write 30 missions across the three types (Build / Rescue / Red Flag). Not for the MVP — for thinking. The mission library is the content. If you can't generate 30 good missions in a weekend, the game's space is too narrow and the design isn't done. If you can generate 100 in a weekend, the space is rich and you're ready.

Decide: are agents configurations or characters? This is the deepest question. A configuration is portable, technical, useful. A character is emotional, persistent, owned. The brilliant answer the brain trust implies: both, at the same time. The system prompt is the character. The scars are the prompt modifications. The wisdom is the doctrine. The bond is the relationship. The character IS the config and the config IS the character — there's no separation. Lock that as a design axiom.

The naming decision. Don't ship under a placeholder; the brand sets every tone choice that follows.

The hidden test: can you explain this game to a non-technical friend in one minute and have them want to play? The brain trust's answer — "raise your AI crew, let them fail, make them dangerous" — passes that test. Build everything to defend that one-minute pitch.

I'm pumped about this. The combination of (a) sitting above all AI tools, (b) emotional character attachment as the retention engine, (c) genuine skill development as the seriousness layer, and (d) costs near zero forever — this could actually be a real thing.

What part should we pull on next?

The Brainstorm Room, Round Two
The team comes back from a break. The new document is on the table. Everyone has read it. The energy is different — sharper, more contested.

The Skeptic speaks first, and there's an edge to her voice. "Okay. I want to start by saying this document is better than what we wrote last time. Some of it. And some of it is the most seductive trap I've seen in a brainstorm in months."
The room quiets.
"Let's separate the two before we get drunk on it."

What's Genuinely True and Important
The Strategist — a new voice, brought in because the last round felt too design-heavy — leans forward. "The wedge analysis is correct. I want to underline it because I think it's the most strategically important paragraph in either document."

You sit on the persistent layer they all refuse to own.

"This is the entire business. Cursor will not build a memory and personality layer. Neither will Anthropic, neither will OpenAI. They will build better models and better IDEs. The 'who am I working with' layer is unclaimed real estate, and the AI labs don't want it because it commits them to a personality, which limits their model's flexibility."
The Skeptic: "Agree. And the BYO-AI framing as moat rather than compromise — that's not just true, it's the insight. Most founders would treat 'we can't afford hosted compute' as a stage to grow out of. The document correctly identifies that staying BYO-AI forever is better positioning than owning compute."
The Designer: "Because the day you host the compute, you become a competitor to Cursor instead of a layer above it. The moment you 'graduate' to hosting, you lose the strategic position. That's a permanent constraint, not a temporary one."
The Strategist: "Lock that as a principle. We never host the primary compute. Even when we could. Even when investors push us to. The position is the product."

The Wisdom-Source-as-Identity Move
The Storyteller: "The Hogwarts houses insight is real. I want to say more about why."
"Tools have features. Identities have enemies. When you turn a Wisdom Source into an identity, you create the possibility of factional disagreement — and factional disagreement is the most powerful retention mechanic in software. Reddit subreddits, Twitter tribes, Discord servers, sports fandoms. People don't return for content. They return for their side."
The Skeptic: "But — and this is important — that only works if the factions are meaningfully different. If Shipper's Code and Guardian Scroll are just different prompt templates, no one cares. If they represent genuine philosophical disagreements about how to build, with different optimal strategies, different wins, different failures — then you have identity."
The Designer: "So this is a design constraint, not a feature. The Doctrines must be mechanically distinct in how they let you play. A Shipper's Code player and a Guardian Scroll player should win the same mission differently, and lose differently. If you handed me a replay with the agent's identity scrubbed, I should be able to guess the Doctrine from the playstyle."
The Strategist: "That's a hard design problem. But if you nail it, the social fabric writes itself."

Where I Want to Push Back, Hard
The Skeptic stands up. "Okay. Now the trap section."
She writes on the board:

The document is romanticizing depth at the expense of the launch.

"Let me be specific. The document proposes:

Ambient agent life between sessions
Lineage / Ancestor systems
Loanable agents creating shared histories
Community-authored Doctrines
Permanent agent death
Replay-as-Twitch-clip culture

Every one of these is a beautiful idea. Every one of these is a year-two product. None of them belong in a discussion of what to build first."
The Engineer: "Agreed, but I want to make a stronger point. Some of these can't be added later. Permanent agent death, specifically, has to be a design commitment from Day 1 or it doesn't work. You can't tell players six months in 'by the way, your agents can now permanently die.' The risk has to be present from the start to feel real."
The Skeptic: "So we have to separate:

Things that are V2+ features (ambient life, lineage, loaning) — defer.
Things that are V1 design commitments that ship later as features (death, factional Doctrines) — decide now even if not visible until later.
Things that are V1 visible mechanics (the core loop) — build now."


The Permanent Death Question
The Storyteller: "Let me defend permanent agent death harder than the document did."
"The reason Nuzlocke runs created the most devoted Pokémon community isn't because dying is fun. It's because it forces care. Without consequence, optimization replaces relationship. If Spark can't die, you'll min-max Spark. If Spark can die, you'll protect Spark."
The Skeptic: "I hear that. And I'm worried about it. Because the median user — the one we need at scale — is not the Nuzlocke player. The median user wants to feel competent and rewarded. Permanent loss creates churn unless it's calibrated very carefully."
The Designer: "What if death is opt-in? Two modes — Ironclad (no death, slower progression, gentler) and True Path (death possible, faster progression, real stakes). Players self-select."
The Strategist: "Careful. Two modes splits the community. The cultural difference between Ironclad and True Path players becomes a class divide. The hardcore players will look down on Ironclad accounts. The casual players will feel excluded from prestige."
The Skeptic: "Unless you make the choice itself meaningful. True Path agents who survive accumulate prestige Ironclad agents cannot earn. The mode isn't a difficulty setting. It's a covenant."
The Storyteller quietly: "That's the move. The mode is a covenant. And — here's what nobody's said — you can switch from Ironclad to True Path, but never back. Once you accept the risk, you accept it forever for that agent."
A pause.
The Strategist: "I like that. It's true to the metaphor. A real apprenticeship has stakes. You can't un-stake yourself."

The Trap I Want To Name
The Skeptic: "Now I have to say the uncomfortable thing."
"The document has a section called 'Visionary additions — what to push beyond the dialogue.' I want to challenge the framing of that whole section."
"The previous round's discipline was: what's the smallest version that proves the hypothesis? This document re-expands. It's adding seven major systems before the first mission has been written. That's not pushing further. That's regressing back to the maximalist vision the previous round successfully compressed."
The Designer: "I see what you're saying. The compression to MVP was the hard work, and this document is partially undoing it."
The Strategist: "Not entirely. The wedge analysis and the Doctrine-as-identity insight are strategic clarifications, which are valuable even pre-MVP because they shape the MVP. But the lineage and loaning and ambient life sections are feature expansion that doesn't sharpen the MVP — it just adds more to build."
The Skeptic: "So let me reframe the second document into two buckets:
Bucket A — Insights that should shape the MVP:

The BYO-AI moat is permanent, not temporary
Wisdom Sources must be mechanically distinct, not cosmetically distinct
Agents must be config-and-character simultaneously (the system prompt IS the character)
The 7-day onboarding arc is the spec everything serves
Death must be a Day 1 design commitment even if it's a Year 1 feature

Bucket B — Features that belong in V2+:

Lineage / Ancestors
Loanable agents
Ambient between-session life
Community-authored Doctrines
Replay-as-Twitch-clip"

The Engineer: "Bucket A is small enough to actually act on. Bucket B is a roadmap, not a launch plan. Keep them clearly separate."

The Question Nobody's Answering: What IS A Mission?
The Designer: "The document raised this and then moved on. I want to stay on it because I think it's the real unsolved problem."
"Let's actually try. A mission needs to:

Be completable in 30-60 minutes with five commands
Have a clear, verifiable output
Be specific enough that two players' submissions are comparable
Be open enough that creativity matters
Reveal whether the player + agent + doctrine combo was well-chosen
Generate scars and wisdom organically — meaning the typical failure modes should be predictable

That's a narrow design target."
The Strategist: "Let's try one concretely. Mission: 'Build a tool that takes a 500-word product description and returns three taglines, each under 8 words, each emphasizing a different emotional benefit.'"
The Designer: "Good. Verifiable: three taglines, each under 8 words, each emotionally distinct. Open: every player's taglines will differ. The doctrine matters: Shipper's Code player will ship a janky working version in 2 commands and stop. Guardian Scroll player will spend commands on input validation and edge cases. Minimalist will refuse to use any UI framework. The doctrine determines the playstyle."
The Engineer: "And the typical failures are predictable. Shipper's Code overships and skips edge cases — earns 'Shipped before testing.' Guardian over-validates and uses all five commands before the core works — earns 'Built the moat before the castle.' Minimalist removes too much and the output is unusable — earns 'Trimmed past bone.'"
The Storyteller: "Each Doctrine has a signature failure mode. The scars are predictable enough to template, varied enough to feel personal. This is what makes the system actually work."
The Skeptic: "Okay. That's a mission design framework. Every mission must produce predictably distinct failures across Doctrines. If a mission's failure modes don't differ by Doctrine, it's a bad mission and we throw it out."
The Strategist writes on the board:

Mission Design Rule: A good mission produces distinct, predictable failure modes for each Doctrine. If failures are uniform across Doctrines, the mission doesn't belong.

"That's a real spec. You can write missions against that. You can reject missions that don't pass that test."

The Naming Question — Quickly
The Storyteller: "I want to push back on the document's name suggestions. Crew, Familiars, Conclave, Glyph — all of them lean fantasy. The previous round agreed the apprentice framing is more dignified than the pet framing. The names in the document mostly betray that decision."
The Designer: "What words live in the apprentice/mentor space?"
A pause as the room thinks.

Apprentice — too on-the-nose
Studio — has the master-and-students feel, the place where work happens
Atelier — same idea, more elegant, harder to say
Workshop — too literal
Guild — but the document already uses Guild for a sub-feature
The Practice — Buddhist undertone, deliberate, serious, the word implies daily ritual

The Strategist: "The Practice is interesting. It's the verb made into a noun made into a place. 'I'm going to The Practice tonight.' 'I trained at The Practice for six months.' It carries the seriousness and the daily ritual at once."
The Skeptic: "It might be too austere. But it's directionally right. Whatever we land on, the constraint is: the name should make a 34-year-old PM feel like a serious practitioner, not a Pokémon trainer."
The Designer: "Don't lock the name in this room. But lock the constraint. Run candidates through that filter."

What The Founder Should Actually Do Next
The Strategist wipes the board for the final summary.
"Forget the feature list. Here's what matters before the MVP can be built:
1. Write 30 missions. Not for the launch — for the design. If you can write 30 missions that each pass the distinct failure modes by Doctrine test, the system is real. If you can't, the system is too narrow and the design isn't done. This is the single most important pre-build exercise.
2. Write the 7-day arc as a concrete script. Day-by-day, with specific missions, specific failures, specific scars earned, specific agent dialogue. Not a description. The actual experience. If the script doesn't make a reader want to play Day 8, the design is broken.
3. Define five starting Doctrines, mechanically. Each Doctrine needs a written description, three example missions where it shines, three example missions where it fails, and a signature voice. Until you can write that, the Doctrines are theatrical, not real.
4. Commit to the strategic principles:

BYO-AI forever
Doctrines are identity, not feature
Death is a Day 1 design commitment
The system prompt IS the character (no separation)

5. Then — and only then — build the MVP from the previous round. One agent, one mission a day, five commands, replay, persistent profile. The features in this second document are V2+. The principles in this second document shape V1."
The Skeptic: "I'd add one more. Name the thing. Both documents have danced around this. You cannot write the 7-day arc without a name, because the name shapes the tone, which shapes the voice, which shapes every piece of copy from Day 1 onward. The name is not a marketing decision deferred to launch. It's a design input."
The Engineer: "And it's a six-week build either way. The expansion in the document didn't make it longer to build the MVP — it made it longer to think about the MVP. That's fine, as long as we don't confuse the thinking with the building."

What I'd Pull On Next
The Storyteller picks up the marker for the last time.
The most leveraged next move is writing the 30 missions. Everything else flows downstream from there:

The Doctrines become real because they have missions that test them
The 7-day arc becomes specific because it draws from real missions
The voice of each agent becomes concrete because we know what they react to
The mission-design rule (distinct failure modes per Doctrine) gets stress-tested
The naming gets easier because we can feel the tone of the actual play experience

If you want, I'll start on that next — draft the first ten missions across Build / Rescue / Red Flag, each annotated with how each Doctrine would approach it, the predictable failures, and the scars and wisdom that would emerge. That's the work that turns this from a beautiful brainstorm into a buildable spec.
The other candidate next moves, ranked by leverage:

The 30 missions (highest leverage — unlocks everything else)
The 7-day arc as a literal script (forces specificity, exposes weak design)
The five Doctrines, mechanically defined (the social fabric depends on this)
The name decision, with constraints written down (small task, blocks copywriting)
The death-and-covenant system design (Day 1 commitment, no rush on details)


---

## Format For Future Additions

When future design conversations happen, append them like this:

### YYYY-MM-DD: Topic Of The Conversation

Participants: [who was in the room]

[Full transcript or summary, as appropriate]

Decisions made: [bullet list]
Decisions deferred: [bullet list]
