import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { TICKETS, OPERATOR } from "./data.ts";
import {
  INTERVIEW_SYSTEM,
  INTERVIEW_SCHEMA,
  SYNTH_SYSTEM,
  SYNTH_SCHEMA,
  RULE_PARSE_SYSTEM,
  RULE_PARSE_SCHEMA,
  RUN_SYSTEM,
  RUN_SCHEMA,
} from "./prompts.ts";

const MODEL = "claude-opus-5";
const app = express();
app.use(express.json({ limit: "2mb" }));

const client = new Anthropic();

type Effort = "low" | "medium" | "high";

/** One structured call to Claude. Returns the parsed JSON object. */
async function ask<T>(opts: {
  system: string;
  user: string;
  schema: object;
  effort: Effort;
  maxTokens?: number;
}): Promise<T> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    output_config: {
      effort: opts.effort,
      format: { type: "json_schema", schema: opts.schema },
    },
    messages: [{ role: "user", content: opts.user }],
  } as any);

  if (res.stop_reason === "refusal") {
    throw new Error("Request was declined.");
  }
  const text = res.content.find((b: any) => b.type === "text") as any;
  if (!text) throw new Error("Empty response from Claude.");
  return JSON.parse(text.text) as T;
}

function transcriptOf(turns: { q: string; a: string }[]) {
  if (!turns.length) return "(no questions asked yet)";
  return turns.map((t, i) => `Q${i + 1}: ${t.q}\nHer answer: ${t.a}`).join("\n\n");
}

/* -------------------------------------------------- 1. seed + interview */

app.get("/api/context", (_req, res) => {
  res.json({ operator: OPERATOR, ticketCount: TICKETS.length });
});

app.post("/api/interview", async (req, res) => {
  try {
    const turns = (req.body.turns ?? []) as { q: string; a: string }[];
    const data = await ask({
      system: INTERVIEW_SYSTEM,
      user:
        turns.length === 0
          ? `Open the interview. Ask your first question about how she triages the morning queue. Make it concrete — about a real decision, not her philosophy.`
          : `The interview so far:\n\n${transcriptOf(
              turns
            )}\n\nAsk the next question, or set done=true if you have enough to build her triage tool. You have asked ${turns.length} question(s).`,
      schema: INTERVIEW_SCHEMA,
      effort: "low",
      maxTokens: 3000,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* -------------------------------------------------- 2. synthesize the tool */

app.post("/api/build", async (req, res) => {
  try {
    const turns = (req.body.turns ?? []) as { q: string; a: string }[];
    const data = await ask({
      system: SYNTH_SYSTEM,
      user: `Here is everything she told you.\n\n${transcriptOf(
        turns
      )}\n\nBuild her tool. Produce 5 to 7 rules total, with 1 or 2 of them marked "check".`,
      schema: SYNTH_SCHEMA,
      effort: "medium",
      maxTokens: 8000,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* -------------------------------------------------- 3. her correction */

app.post("/api/rule", async (req, res) => {
  try {
    const { text, existing } = req.body as { text: string; existing: string[] };
    const data = await ask({
      system: RULE_PARSE_SYSTEM,
      user: `Rules her tool already has: ${existing.join(
        ", "
      )}\n\nShe typed:\n"${text}"\n\nTurn it into one rule. Pick an id that doesn't collide with the existing ones.`,
      schema: RULE_PARSE_SCHEMA,
      effort: "low",
      maxTokens: 2000,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* -------------------------------------------------- 4. run the tool */

app.get("/api/tickets", (_req, res) => res.json(TICKETS));

app.post("/api/run", async (req, res) => {
  try {
    const { spec } = req.body as { spec: any };
    const rulesText = spec.rules
      .map(
        (r: any) =>
          `[${r.id}] ${r.title}\n  RULE: ${r.rule}\n  IN HER WORDS: "${r.quote}"`
      )
      .join("\n\n");

    const queue = TICKETS.map(
      (t) =>
        `${t.id} · ${t.received} · ${t.building} #${t.unit} · ${t.tenant} · via ${
          t.channel
        }\n  MESSAGE: "${t.text}"\n  FROM HER FILES: ${
          t.file.length ? t.file.join(" | ") : "nothing on record"
        }`
    ).join("\n\n");

    const data = await ask({
      system: RUN_SYSTEM,
      user: `HER TOOL — "${spec.name}"\nBands: ${spec.bands.join(
        " > "
      )}\n\n${rulesText}\n\n---\n\nTHIS MORNING'S QUEUE (${
        TICKETS.length
      } requests):\n\n${queue}\n\nRun her tool over the whole queue. Return one result per ticket, all ${
        TICKETS.length
      } of them, in the order given.`,
      schema: RUN_SCHEMA,
      effort: "medium",
      maxTokens: 16000,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 8787;
app.listen(PORT, () => {
  const ok = !!process.env.ANTHROPIC_API_KEY;
  console.log(`\n  Mettle API  ·  http://localhost:${PORT}`);
  console.log(
    ok
      ? `  ANTHROPIC_API_KEY loaded  ·  model ${MODEL}\n`
      : `  ⚠  No ANTHROPIC_API_KEY found. Add it to .env and restart.\n`
  );
});
