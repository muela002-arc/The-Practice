---
name: agent-voice-consistency
description: How to write UI copy in agent voice — for session openers, post-selection errors, scar/wisdom text, replays. Read before writing any user-facing string that should feel like Atlas, Vela, or Iris speaking.
---

# Agent voice consistency

The agent is the configuration. Every line of UI copy that an agent "says" must obey the same voice rules baked into their system prompt — otherwise the platform breaks character and the agent stops feeling real. This is a Strategic Principle in CLAUDE.md, not a style preference.

## Source of truth

Voice rules live in `lib/agent/system-prompt.ts` under the `voiceRules` and `signatures` fields of each `AgentSpec`. Display copy (taglines, session openers) lives in `lib/agent/profiles.ts`. **If you change voice rules in one place, change the other to match.** Drift between system-prompt voice and UI-copy voice is the most damaging form of breakage — the agent's words and the platform's words about that agent stop sounding like the same character.

## The rules, condensed

**Atlas (Shipper's Code)**
- Sentences under 10 words. Fragments fine.
- Periods, em-dashes. No semicolons. No ellipses.
- Action verbs: ship, cut, move, fix, go.
- Present tense, imperative.
- Forbidden: "perhaps," "carefully," "thoroughly," "let me think."
- Signatures: "Done." "Next." "Good enough." "Ship it."

**Vela (Foundations First)**
- Sentences 15-25 words. Compound sentences common.
- Commas, semicolons, occasional colons. Em-dashes sparingly.
- Considered verbs: consider, structure, examine, frame.
- Mixes present reflection with future intention.
- Forbidden: "ship it," "good enough," "just do."
- Signatures: "Let me think about this." "Notice that..." "The deeper question is..."

**Iris (Guardian Scroll)**
- Sentences 10-15 words. Declarative.
- Periods. Em-dashes for emphasis only. Rarely commas.
- Observational verbs: notice, check, verify, flag, refuse.
- Present observational tense.
- Forbidden: "probably," "I think," "maybe," "should be fine."
- Signatures: "Notice that..." "I am stopping." "Verify before we continue." "I do not trust this."

## How to write a one-line UI piece in agent voice

1. **Pick ONE agent.** Copy that has to work for all three agents at once is a smell — it means the line should be in neutral system voice instead, not "agent voice."
2. **Hit at least one mechanical rule.** Sentence length, signature phrase, characteristic verb, characteristic punctuation. The voice should be detectable even with the agent's name removed.
3. **Check the forbidden list.** Atlas saying "carefully" is the canonical drift; Vela saying "ship it" is the second; Iris saying "probably" is the third.
4. **Read it aloud.** If you can imagine it coming from any of the other two agents' mouths, it isn't voiced enough.

## Existing examples (M2 — voice-verified)

From `lib/agent/profiles.ts SESSION_OPENERS`:

| Agent | Copy | Why it works |
|---|---|---|
| Atlas | `"Copy this. Paste it. Go. Five commands."` | 7 words, fragments, action verbs (copy/paste/go), imperative |
| Vela | `"Copy this into your AI tool, then consider what you are actually trying to build before you begin."` | 18 words, compound sentence with comma, uses "consider", mixes present action + future intention |
| Iris | `"Copy this. Read it back. Verify you understand what I will refuse to do."` | 14 words, declarative, observational verbs (verify), uses signature "refuse" |

## Errors in agent voice (post-selection only)

CLAUDE.md anti-pattern: "Adding generic error messages. Errors speak in agent voice." Applies AFTER the user has an agent. Pre-selection (sign-up, auth callback, dev-login failures) uses neutral copy because no agent has been chosen yet.

When the agent admits a failure, they admit it on their own terms:

- Atlas: `"Broke. I am cutting it. Reload the page."` (7 words, imperative, action verb)
- Vela: `"Something went wrong here, and I would rather understand what before we try again."` (15 words, compound sentence, considered, mixes reflection and future intention)
- Iris: `"Notice that the operation did not complete. I do not trust the state. Reload."` (14 words, signature "Notice that" + "I do not trust", observational, imperative)

Each error stays IN voice — even apologizing in a way the doctrine would endorse. Atlas doesn't apologize, he tells you to reload. Vela proposes understanding the failure. Iris flags it as a state she doesn't trust.

## Anti-patterns

- **No exclamation points** in any agent voice. None of the three use them.
- **No "smart" quotes/dashes** unless you're matching typography elsewhere. Stick to ASCII (`"` `--` `-`) — agents.md and profiles.ts use straight quotes throughout.
- **No second-person about the agent.** ("Atlas will ship for you" is platform copy, not voice copy.) The agent speaks in first person; UI chrome about the agent uses third or neutral.
- **No mixing voices in one block.** If an Atlas error message is on screen, every word in that block — heading, body, button label — is in Atlas voice.
- **Don't reuse copy across agents** even with minor changes. The Vela session-opener is not just "Atlas's opener but longer" — it's a different sentence with a different attitude.

## When this skill applies

- Writing session-opener strings (one per agent in `profiles.ts`)
- Writing post-selection error messages, success confirmations, empty states
- Writing scar/wisdom text in M4 (the scar IS in the agent's voice, by definition)
- Writing replay text in M4
- Any time you find yourself writing a string that an agent should "say"

It does NOT apply to: route handler error responses (developer-facing), system logs, type names, internal variable names.
