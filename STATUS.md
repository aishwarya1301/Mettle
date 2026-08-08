# Mettle — build status

**Status: done and verified end-to-end against the live API.**

Run it: `npm run dev` → **http://localhost:5180**

---

## ⚠️ One thing to do

You pasted your API key into chat, so it's in the transcript. It's written to
`.env` (gitignored, `chmod 600`) and works. **Rotate it after the hackathon.**

---

## What's built

| Piece | State |
| --- | --- |
| Vite + React + TS front end, Express + Anthropic SDK back end | ✅ |
| `claude-opus-5`, four schema-constrained calls via `output_config.format` | ✅ |
| Anthropic SDK upgraded 0.70 → 0.116 (so `output_config` is typed) | ✅ |
| 14 realistic overnight tickets (`server/data.ts`) | ✅ |
| System prompts + JSON schemas (`server/prompts.ts`) | ✅ |
| `POST /api/interview` — adaptive interview | ✅ live-tested |
| `POST /api/build` — transcript → tool spec | ✅ live-tested (~20s) |
| `POST /api/rule` — plain English → rule | ✅ live-tested |
| `POST /api/run` — execute her rules on the queue | ✅ live-tested (~30–37s) |
| Correct → re-run loop (changes actually change the output) | ✅ live-tested |
| Four-stage UI | ✅ `tsc --noEmit` clean, `vite build` clean |

**Not done:** I never clicked through the UI in a real browser — no screenshot
tooling in this environment. Types and build are clean and the data contracts
are verified, but give it one dry run before you present.

## Latency to plan around

- Interview question: ~3–5s each
- Build the tool: **~20s**
- Run the queue: **~30–37s**

Both long steps have real loading states (the run animates through tickets as
"read"). Budget ~2.5 min for a live demo including your talking.

## Verified output from the live API

**Tool Claude named:** "Morning Queue" — 7 rules, 5 quoted from her, 2 flagged
`Needs your call` as honest extrapolations.

**The callout it generated, unprompted:**

> "You caught that 302, 402 and 502 aren't three low-pressure tickets — they're
> stack C-02, and 402 already got billed for an aerator."

**The correction loop, proven:** the deadbolt ticket (WO-4484, "didn't lock at
all last night") initially landed in SCHEDULE OUT because no rule covered it.
She types *"if a lock or a door doesn't secure, that's same day no matter what"*
→ Claude writes it into the tool → re-run → **WO-4484 moves to SAME DAY**, firing
her rule, badged in copper as hers.

## Suggested 2-minute demo path

1. **Intro (15s).** Read the crossed-out "Learn AI or get left behind." Marisol,
   19 years, 240 units, 45 min every morning.
2. **Interview (35s).** Answer 3 questions using the demo shortcuts — but *edit
   one* on camera so it's visibly her words. Make sure one answer includes the
   stack/riser story. Hit **"That's enough — build it."**
3. **Review (30s).** Point at the quotes under each rule: *every rule traces to
   something she said.* Point at a **Needs your call** rule — Claude saying
   plainly what it extrapolated. Type the lock rule into the add box.
4. **Run (35s).** While it runs, say the thesis line. Then land on the copper
   callout — the riser catch — and the copper chips showing which of *her* rules
   decided each ticket.
5. **Outcome (15s).** "She just built software for her own expertise, and she
   can't code."

**If you want the strongest version:** run it *once without* the lock rule, show
the deadbolt sitting at the bottom marked "No rule of yours yet", then hit
"Something's off — change a rule and re-run" and watch it move. Costs an extra
30s but it's the most convincing thing in the demo.

## Fixes made during testing

- Interview was inventing building names ("Rosewood"). The persona block now
  carries the real properties, stacks, and vendor names — output is consistent
  with the ticket data.
- Tickets no rule covered were all being dumped into SCHEDULE OUT, including the
  unlockable door. Now they get sensible judgment bands and are visibly marked
  **"No rule of yours yet"** — which reframes a gap as an invitation to correct,
  and sets up the re-run beat.
- Added the correct → re-run loop, off-menu-band and skipped-ticket fallbacks,
  and a retry if the build call fails mid-interview.

## Where the product thinking lives

`server/prompts.ts`. Every prompt carries the same stance block: she is the
authority, the tool is hers, her expertise is never being extracted for an
employer, and Claude never uses the words AI / model / prompt with her. The run
prompt is explicit that Claude **executes** her rules rather than second-guessing
them — if her rule says same-day, it goes same-day.
