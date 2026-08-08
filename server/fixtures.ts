// Baked-in demo. Deterministic, offline replacements for the four Claude calls,
// so Mettle can be presented with no API key, no latency, and no chance of a
// live model wobble on stage. Every response matches the same JSON schemas the
// live endpoints return (see prompts.ts), so the UI can't tell the difference.
//
// The one thing that is NOT static is the run: demoRun() reads the current spec
// so the deadbolt correction loop actually works — WO-4484 sits unfiled until
// she adds a lock rule, then fires it. That's the beat the whole demo is built
// around, so it has to respond to her edits, not just replay a recording.

import { TICKETS } from "./data";

/* ------------------------------------------------------------ 1. interview */

type Step = {
  done: boolean;
  question: string;
  why: string;
  suggestions: string[];
  heard: string;
};

// One scripted question per turn. Every draft answer (A) is written so the
// build step below can quote it verbatim — click-to-fill, and the rules still
// trace to "her words".
const INTERVIEW: Step[] = [
  {
    done: false,
    heard: "",
    question:
      "Fourteen came in overnight. Which one do you open first, and what makes you open it before the others?",
    why: "Tells your tool what to surface at the top of the list.",
    suggestions: [
      "Anything that's a safety thing — a gas smell, water actively coming through a ceiling — that jumps the whole line. And at Cedar Terrace I read water twice, because that building stacks and one leak upstairs becomes three units down.",
      "I look for the words that mean it's already moving — 'coming through the ceiling,' 'won't shut off,' a gas smell. Those I don't even finish reading before I'm on the phone.",
    ],
  },
  {
    done: false,
    heard: "Safety and active water jump the line",
    question:
      "Three units in the same building all report weak water pressure, same morning. What goes through your head?",
    why: "Lets your tool group tickets that are really one problem.",
    suggestions: [
      "If they're on the same stack — like C-02 at Cedar — weak pressure across floors means the line, not the units. I send it to the plumbing supervisor as one job, not three vendor visits.",
      "I check whether they share a stack before I dispatch anybody. Three aerator calls on one riser is somebody sending three trucks for one problem. I group them and flag it up.",
    ],
  },
  {
    done: false,
    heard: "Same stack means one riser, not three units",
    question:
      "A tenant's reported the same AC problem three times. What do you do differently on the third call?",
    why: "Tells your tool when to stop repeating a fix that isn't working.",
    suggestions: [
      "Two visits closed and it's back — that's not a repair anymore, that's a replacement conversation, and I loop in my manager instead of sending Delta Mech a third time.",
      "Third visit, I pull the history first. Same fix twice means the fix is wrong. I don't send the truck — I flag it as a repeat and we talk about replacing the unit.",
    ],
  },
  {
    done: false,
    heard: "Third repeat means replace, not re-dispatch",
    question:
      "Something comes in that sounds small — a jammed disposal, a fridge that quit. What makes you move one up, or bill it back?",
    why: "Lets your tool catch chargebacks and the quiet emergencies.",
    suggestions: [
      "A disposal with a fork in it is on the resident — that's a chargeback under the lease, I note it so we don't eat the cost. But a fridge full of groceries that stopped cold, or an older tenant with no heat overnight — those I move up even if they say it's no big deal.",
      "I read who it is, not just what broke. Tenant-caused stuff like something jammed down the disposal gets billed back. But a fridge that died with food in it, or an 81-year-old with no heat playing it down — I don't wait on those.",
    ],
  },
];

const DONE_STEP: Step = {
  done: true,
  question: "",
  why: "",
  suggestions: [],
  heard: "Chargebacks, and the quiet emergencies",
};

export function demoInterview(turns: { q: string; a: string }[]): Step {
  return INTERVIEW[turns.length] ?? DONE_STEP;
}

/* ---------------------------------------------------------------- 2. build */

type Rule = {
  id: string;
  title: string;
  rule: string;
  quote: string;
  confidence: "stated" | "check";
  note: string;
};

export const DEMO_SPEC = {
  name: "Morning Queue",
  summary:
    "Reads the whole overnight queue before deciding any of it, then sorts each request into a band and names the rule that made the call. Groups tickets that are really one problem and flags the ones a plain list would get wrong.",
  bands: ["EMERGENCY", "SAME DAY", "THIS WEEK", "SCHEDULE OUT"],
  rules: <Rule[]>[
    {
      id: "safety-first",
      title: "Safety jumps the line",
      rule: "If a request mentions a gas or rotten-egg smell, or water actively coming through a ceiling or wall, band it EMERGENCY and act before reading the rest.",
      quote:
        "Anything that's a safety thing — a gas smell, water actively coming through a ceiling — that jumps the whole line.",
      confidence: "stated",
      note: "",
    },
    {
      id: "riser-pattern",
      title: "Same stack, one riser",
      rule: "If two or more units on the same plumbing stack report weak pressure, treat it as one riser job to the plumbing supervisor — not separate vendor visits.",
      quote:
        "If they're on the same stack — like C-02 at Cedar — weak pressure across floors means the line, not the units. I send it to the plumbing supervisor as one job, not three vendor visits.",
      confidence: "stated",
      note: "",
    },
    {
      id: "repeat-replace",
      title: "Third visit means replace",
      rule: "If the same unit has two closed work orders for the same problem and it's back, stop dispatching — pull the history and open a replacement conversation with your manager.",
      quote:
        "Two visits closed and it's back — that's not a repair anymore, that's a replacement conversation, and I loop in my manager instead of sending Delta Mech a third time.",
      confidence: "stated",
      note: "",
    },
    {
      id: "quiet-emergency",
      title: "Food at risk moves up",
      rule: "If a fridge or freezer has failed with food inside, band it SAME DAY even when the tenant downplays it, and arrange a loaner or ice if it can't be fixed fast.",
      quote:
        "A fridge full of groceries that stopped cold — those I move up even if they say it's no big deal.",
      confidence: "stated",
      note: "",
    },
    {
      id: "tenant-chargeback",
      title: "Tenant-caused is a chargeback",
      rule: "If the damage is tenant-caused — something jammed down a disposal — clear it, but note the lease chargeback so the cost doesn't land on us.",
      quote:
        "A disposal with a fork in it is on the resident — that's a chargeback under the lease, I note it so we don't eat the cost.",
      confidence: "stated",
      note: "",
    },
    {
      id: "vulnerable-heat",
      title: "No heat, vulnerable tenant",
      rule: "If a tenant who is elderly or lives alone reports no heat on a cold night, band it EMERGENCY — not SAME DAY — even if they say they're managing.",
      quote:
        "An older tenant with no heat overnight — those I move up even if they say it's no big deal.",
      confidence: "check",
      note: "You grouped this with 'move up,' which could mean SAME DAY. I raised it to EMERGENCY given a 44° overnight and a tenant living alone — confirm that's how high you want it.",
    },
    {
      id: "cedar-water",
      title: "Read water twice at Cedar",
      rule: "At Cedar Terrace, when one unit reports a leak, pre-check the unit directly below on the same stack before it reports — one leak upstairs becomes three units down.",
      quote:
        "At Cedar Terrace I read water twice, because that building stacks and one leak upstairs becomes three units down.",
      confidence: "check",
      note: "You said this about active leaks. I turned it into a step — proactively checking the unit below — rather than just a mindset. Confirm you want the tool to flag the downstairs unit on its own.",
    },
  ],
};

/* ----------------------------------------------------------- 3. add a rule */

// Parse her plain-English correction. The lock/door case gets a stable id so
// demoRun() can pick it up on the re-run; anything else gets a generic rule
// that still quotes her verbatim.
export function demoRule(text: string, existing: string[]): Rule {
  const t = text.trim();
  if (/\b(lock|deadbolt|door|secure|latch|bolt)\b/i.test(t)) {
    return {
      id: uniqueId("lock-secure", existing),
      title: "A door that won't lock is same day",
      rule: "If a lock, deadbolt, or door won't secure, band it SAME DAY at minimum — never leave a unit that can't lock overnight.",
      quote: t,
      confidence: "stated",
      note: "",
    };
  }
  return {
    id: uniqueId("added-rule", existing),
    title: titleFrom(t),
    rule: t,
    quote: t,
    confidence: "stated",
    note: "",
  };
}

function titleFrom(text: string): string {
  const words = text.replace(/^if\s+/i, "").split(/\s+/).slice(0, 5).join(" ");
  return words.length > 3 ? words.replace(/[.,]$/, "") : "Your new rule";
}

function uniqueId(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/* ------------------------------------------------------------------ 4. run */

type Result = {
  id: string;
  band: string;
  action: string;
  because: string;
  flag: string;
  firedRuleIds: string[];
  linked: string[];
};

// A rule id in the spec that governs locks/doors, if she's added one.
function lockRuleId(spec: { rules: Rule[] }): string | null {
  const hit = spec.rules.find(
    (r) =>
      /lock|deadbolt|door|secure|latch|bolt/i.test(r.id) ||
      /lock|deadbolt|door|secure|latch|won'?t catch/i.test(`${r.title} ${r.rule}`)
  );
  return hit ? hit.id : null;
}

export function demoRun(spec: { name: string; bands: string[]; rules: Rule[] }): {
  callout: string;
  results: Result[];
} {
  const lockId = lockRuleId(spec);

  // Only fire a rule id that still exists in her spec (she may have removed one).
  const have = new Set(spec.rules.map((r) => r.id));
  const fired = (ids: string[]) => ids.filter((id) => have.has(id));

  const base: Record<string, Omit<Result, "id">> = {
    "WO-4471": {
      band: "EMERGENCY",
      action: "Call the gas utility now; tell 118 not to use the range; in-house tech on site.",
      because: "A gas smell is a safety call — it jumps the whole line.",
      flag: "Gas smell — safety, not a routine appliance ticket.",
      firedRuleIds: fired(["safety-first"]),
      linked: [],
    },
    "WO-4472": {
      band: "EMERGENCY",
      action: "In-house tech to 309 to shut the source, then 209. Now, not on a route.",
      because: "Water actively coming through a ceiling — safety, before anything else.",
      flag: "309 above is vacant — the leak's been running unwatched.",
      firedRuleIds: fired(["safety-first"]),
      linked: [],
    },
    "WO-4473": {
      band: "SAME DAY",
      action: "Hold for the stack C-02 inspection — one job, not a separate visit.",
      because: "Same stack as 402 and 502, all weak pressure — that's the riser.",
      flag: "",
      firedRuleIds: fired(["riser-pattern"]),
      linked: ["WO-4474", "WO-4475"],
    },
    "WO-4474": {
      band: "SAME DAY",
      action: "Send the plumbing supervisor to inspect stack C-02 as one job.",
      because: "Same stack, weak pressure across floors — the line, not three units.",
      flag: "402 was 'fixed' with an aerator — it's the stack, not the aerator.",
      firedRuleIds: fired(["riser-pattern"]),
      linked: ["WO-4473", "WO-4475"],
    },
    "WO-4475": {
      band: "SAME DAY",
      action: "Roll into the stack C-02 inspection with 302 and 402.",
      because: "Third unit on C-02 reporting the same trickle — one riser job.",
      flag: "",
      firedRuleIds: fired(["riser-pattern"]),
      linked: ["WO-4473", "WO-4474"],
    },
    "WO-4476": {
      band: "EMERGENCY",
      action: "In-house tech for heat first stop; call to confirm 411 is warm now.",
      because: "No heat overnight, tenant is 81 and lives alone — you don't wait on those.",
      flag: "81, lives alone, 44° overnight — she's downplaying it.",
      firedRuleIds: fired(["vulnerable-heat"]),
      linked: [],
    },
    "WO-4477": {
      band: "SAME DAY",
      action: "Pull the WO history; loop in your manager on replacing the unit — no third truck.",
      because: "Two AC visits closed and it's back — that's a replacement conversation now.",
      flag: "Third AC visit, same vendor — stop patching.",
      firedRuleIds: fired(["repeat-replace"]),
      linked: [],
    },
    "WO-4478": {
      band: "THIS WEEK",
      action: "Log the sighting; add to the next pest route — neighbors are clear.",
      because: "First sighting, adjacent units quiet — worth logging, not urgent. No rule of yours yet.",
      flag: "",
      firedRuleIds: [],
      linked: [],
    },
    "WO-4479": {
      band: "SAME DAY",
      action: "In-house tech to swap the detector battery today.",
      because: "A chirping detector is a quick same-day swap — my call, no rule of yours covers it.",
      flag: "",
      firedRuleIds: [],
      linked: [],
    },
    "WO-4480": {
      band: "THIS WEEK",
      action: "In-house tech to clear it; note the §7 chargeback so we don't eat the cost.",
      because: "Fork down the disposal is tenant-caused — that's a chargeback under the lease.",
      flag: "Fork in the disposal — bill it back under the lease.",
      firedRuleIds: fired(["tenant-chargeback"]),
      linked: [],
    },
    "WO-4481": {
      band: "SAME DAY",
      action: "In-house tech today; if it can't be fixed fast, arrange a loaner or ice.",
      because: "A fridge full of groceries that stopped cold — you move those up.",
      flag: "Food's at risk — sounds minor, isn't.",
      firedRuleIds: fired(["quiet-emergency"]),
      linked: [],
    },
    "WO-4482": {
      band: "SCHEDULE OUT",
      action: "Batch onto the next Alder Court route — tenant says no rush.",
      because: "Cosmetic and still usable — schedule out. No rule of yours covers it.",
      flag: "",
      firedRuleIds: [],
      linked: [],
    },
    "WO-4483": {
      band: "SCHEDULE OUT",
      action: "Add to the next route — order a replacement wand.",
      because: "Minor and non-urgent — batch it. No rule of yours covers it.",
      flag: "",
      firedRuleIds: [],
      linked: [],
    },
    // The deadbolt — the correction loop lives here.
    "WO-4484": lockId
      ? {
          band: "SAME DAY",
          action: "In-house tech to fix the deadbolt today; confirm it locks before you close it.",
          because: "A door that won't lock overnight is same day — your rule.",
          flag: "Ground-floor entry that didn't lock last night — security.",
          firedRuleIds: [lockId],
          linked: [],
        }
      : {
          band: "SCHEDULE OUT",
          action: "Route it with the other door hardware this week.",
          because: "No rule of yours covers a lock yet, so a generic pass files it as routine.",
          flag: "",
          firedRuleIds: [],
          linked: [],
        },
  };

  const results: Result[] = TICKETS.map((t) => ({ id: t.id, ...base[t.id] }));

  return {
    callout:
      "You caught that 302, 402 and 502 aren't three routine tickets — they're one riser on stack C-02, and 402 already paid for an aerator that was never the fix.",
    results,
  };
}
