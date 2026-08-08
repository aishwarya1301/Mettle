# Mettle

**Turn what you know into what you can do.**

Mettle helps a non-technical person build a useful tool for their own work by
explaining how they already solve a problem. The human owns the workflow and
stays the authority; Claude understands, structures, and executes.

    What I know  →  What I need  →  What I build  →  What I can now do

## Run it

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
npm run dev
```

Then open **http://localhost:5180**.

## The demo (about 2 minutes)

**Marisol Vega**, maintenance coordinator, 19 years, 240 units in Fremont. Every
morning she triages the overnight maintenance queue. It takes ~45 minutes, and
when she's out nobody else gets it right.

1. **What I know** — Claude interviews her. Real adaptive questions about
   specific decisions ("Two units both say no hot water — what tells you which
   one you call first?"), each one following the thread of her last answer. Each
   question ships with two draft answers in her voice as a demo shortcut; she
   can edit them or type her own.
2. **What I need** — Claude synthesizes a named triage tool: priority bands plus
   5–7 rules, **every rule quoted back to her own words**. One or two are marked
   *Needs your call* — honest extrapolations Claude wants confirmed.
3. **Review and correct** — she edits any rule, kills the ones that aren't her,
   confirms the inferences, and types new rules in plain English ("if a lock
   doesn't secure, that's same day, period"). Claude writes them into the tool.
   Her changes are badged **Added by you** / **Your correction**.
4. **What I build** — the tool runs against 14 realistic overnight requests.
   Every ticket gets a band, a concrete action, and chips naming **which of her
   rules decided it**. Her own rules render in copper.
5. **What I can now do** — what she owns: a tool that runs tomorrow, coverage
   when she's out, the override on every decision.

### The moment that lands

Three tickets in the mock queue — Cedar Terrace **302, 402, 502** — are all on
plumbing stack C-02, all reporting weak pressure, two with prior work orders
closed as "aerator replaced" and "no issue found." A generic priority list files
them as three routine plumbing work orders.

Marisol's pattern rule catches them as one riser problem, groups them, and sends
them to the plumbing supervisor instead of a vendor. That's the demo: **a rule
she stated in plain English, executing on real data, catching something a
checklist would have missed.**

Also seeded: an 81-year-old tenant reporting no heat and downplaying it; a third
repeat AC visit where the answer is a replacement conversation, not a fourth
vendor truck; a deadbolt that stopped latching; a disposal jam that's a
chargeback.

## Where Claude actually does the work

Four structured calls to `claude-opus-5`, all schema-constrained via
`output_config.format`:

| Endpoint         | What Claude does                                                  | Effort |
| ---------------- | ----------------------------------------------------------------- | ------ |
| `POST /api/interview` | Drives the interview. Decides the next question from the transcript, decides when it has enough, drafts answers in her voice | low |
| `POST /api/build`     | Turns the transcript into a named tool with quoted, ordered rules and honest confidence flags | medium |
| `POST /api/rule`      | Parses her plain-English correction into a rule in the same shape  | low |
| `POST /api/run`       | Executes *her* rules across the whole queue at once — cross-ticket patterns, file facts, groupings | medium |

Every prompt carries the same stance block: she is the authority, the tool is
hers, her expertise is never being extracted for an employer. The run prompt is
explicit that Claude executes her rules rather than second-guessing them.

## Layout

```
server/data.ts      14 mock tickets + operator profile
server/prompts.ts   system prompts + JSON schemas (the actual product thinking)
server/index.ts     Express + Anthropic SDK
src/App.tsx         the four stages
src/styles.css
```
