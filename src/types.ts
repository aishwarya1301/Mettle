export type Turn = { q: string; a: string };

export type InterviewStep = {
  done: boolean;
  question: string;
  why: string;
  suggestions: string[];
  heard: string;
};

export type Rule = {
  id: string;
  title: string;
  rule: string;
  quote: string;
  confidence: "stated" | "check";
  note: string;
  /** Set locally when she changes something. Never comes from the server. */
  origin?: "edited" | "added" | "confirmed" | "kept";
};

export type Spec = {
  name: string;
  summary: string;
  bands: string[];
  rules: Rule[];
};

export type Ticket = {
  id: string;
  received: string;
  building: string;
  unit: string;
  tenant: string;
  channel: string;
  text: string;
  file: string[];
};

export type Result = {
  id: string;
  band: string;
  action: string;
  because: string;
  flag: string;
  firedRuleIds: string[];
  linked: string[];
};

export type RunOutput = { callout: string; results: Result[] };

export async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Something went wrong.");
  return j as T;
}
