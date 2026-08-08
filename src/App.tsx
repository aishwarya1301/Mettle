import { useEffect, useRef, useState } from "react";
import type { InterviewStep, Result, Rule, Spec, Ticket, Turn, RunOutput } from "./types.ts";
import { post } from "./types.ts";

type Stage = "intro" | "know" | "need" | "build" | "do";

const STEPS: { key: Stage; n: string; label: string }[] = [
  { key: "know", n: "01", label: "What I know" },
  { key: "need", n: "02", label: "What I need" },
  { key: "build", n: "03", label: "What I build" },
  { key: "do", n: "04", label: "What I can now do" },
];

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [run, setRun] = useState<RunOutput | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/tickets").then((r) => r.json()).then(setTickets).catch(() => {});
  }, []);

  const idx = STEPS.findIndex((s) => s.key === stage);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="wordmark">Mettle<span>.</span></div>
        <div className="tagline">Turn what you know into what you can do</div>
        <div className="spacer" />
        <div className="who">
          <div className="av">MV</div>
          <div>
            <b>Marisol Vega</b>{" "}
            <i>· Maintenance Coordinator · 19 yrs</i>
          </div>
        </div>
      </header>

      {stage !== "intro" && (
        <nav className="rail">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`rail-step ${s.key === stage ? "on" : i < idx ? "done" : ""}`}
            >
              <span className="n">{i < idx ? "✓" : s.n}</span>
              {s.label}
            </div>
          ))}
        </nav>
      )}

      <main>
        {err && <div className="wrap"><div className="err">{err}</div></div>}

        {stage === "intro" && <Intro onStart={() => setStage("know")} />}

        {stage === "know" && (
          <Interview
            turns={turns}
            setTurns={setTurns}
            onError={setErr}
            onBuilt={(s) => {
              setSpec(s);
              setStage("need");
            }}
          />
        )}

        {stage === "need" && spec && (
          <Review
            spec={spec}
            setSpec={setSpec}
            onError={setErr}
            hasRun={!!run}
            onRun={() => {
              setRun(null);
              setStage("build");
            }}
          />
        )}

        {stage === "build" && spec && (
          <Board
            spec={spec}
            tickets={tickets}
            run={run}
            setRun={setRun}
            onError={setErr}
            onDone={() => setStage("do")}
            onAdjust={() => setStage("need")}
          />
        )}

        {stage === "do" && spec && run && (
          <Outcome spec={spec} run={run} tickets={tickets} />
        )}
      </main>
    </div>
  );
}

/* ================================================================== intro */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="wrap fade">
      <div className="intro-grid">
        <div>
          <div className="eyebrow">A new interface for expertise</div>
          <h1>
            You already know how to do this.
            <br />
            Now you can build the tool for it.
          </h1>

          <div className="thesis">
            <p className="strike">Learn AI or get left behind.</p>
            <p className="dim">
              The Bay Area went orchards → factories → software → this. Every
              time, the jobs changed. The people who knew how the work actually
              worked did not become worthless.
            </p>
            <p>
              You don't need to learn to code. You need to explain how you
              already solve the problem.
            </p>
          </div>

          <p className="lede">
            Mettle interviews you about one recurring task, turns your judgment
            into a working tool, and runs it on your real data. You review
            every rule. You correct anything wrong. It stays yours.
          </p>

          <button className="btn copper" onClick={onStart}>
            Show Mettle how you do it →
          </button>
        </div>

        <aside className="profile">
          <div className="ph">
            <div className="big-av">MV</div>
            <div>
              <h3>Marisol Vega</h3>
              <div className="sub">Maintenance Coordinator</div>
            </div>
          </div>
          <dl style={{ margin: 0 }}>
            <div className="kv">
              <dt>Portfolio</dt>
              <dd>240 units, three properties, Fremont CA</dd>
            </div>
            <div className="kv">
              <dt>Experience</dt>
              <dd>19 years. No coding, ever.</dd>
            </div>
            <div className="kv">
              <dt>The task</dt>
              <dd>
                Triaging the overnight maintenance queue — every single
                morning, before anything else can happen.
              </dd>
            </div>
            <div className="kv">
              <dt>Today</dt>
              <dd>Tuesday, 8:30 AM. 14 requests came in overnight.</dd>
            </div>
            <div className="kv">
              <dt>The cost</dt>
              <dd>
                About 45 minutes a day. And when she's out, nobody else gets it
                right.
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================== interview */

function Interview({
  turns,
  setTurns,
  onBuilt,
  onError,
}: {
  turns: Turn[];
  setTurns: (t: Turn[]) => void;
  onBuilt: (s: Spec) => void;
  onError: (e: string) => void;
}) {
  const [step, setStep] = useState<InterviewStep | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(true);
  const [building, setBuilding] = useState(false);
  const started = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function next(t: Turn[]) {
    setBusy(true);
    setStep(null);
    try {
      const s = await post<InterviewStep>("/api/interview", { turns: t });
      setStep(s);
      if (s.done) build(t);
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function build(t: Turn[]) {
    setBuilding(true);
    try {
      const s = await post<Spec>("/api/build", { turns: t });
      s.rules = s.rules.map((r) => ({ ...r, origin: "kept" as const }));
      onBuilt(s);
    } catch (e: any) {
      onError(e.message);
      setBuilding(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    next([]);
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, busy]);

  function submit() {
    if (!draft.trim() || !step) return;
    const t = [...turns, { q: step.question, a: draft.trim() }];
    setTurns(t);
    setDraft("");
    next(t);
  }

  return (
    <div className="narrow fade">
      <div className="eyebrow">Step 01 · What I know</div>
      <h2 style={{ marginBottom: 6 }}>Show me how you do it</h2>
      <p className="lede">
        Not what the manual says. What you actually do at 8:30 in the morning.
      </p>

      <div className="chat">
        {turns.map((t, i) => (
          <div className="ex" key={i}>
            <div className="qlab">Question {i + 1}</div>
            <p className="q">{t.q}</p>
            <div className="answer">
              <div className="who-said">Marisol</div>
              {t.a}
            </div>
          </div>
        ))}

        {busy && (
          <div className="thinking">
            <span className="dots"><i /><i /><i /></span>
            {turns.length === 0 ? "Reading your file…" : "Following that thread…"}
          </div>
        )}

        {building && (
          <div className="ex">
            <div className="thinking">
              <span className="dots"><i /><i /><i /></span>
              Turning what you said into a working tool…
            </div>
          </div>
        )}

        {step?.done && !building && !busy && (
          <div className="ex">
            <button className="btn copper" onClick={() => build(turns)}>
              Build my tool again ↻
            </button>
          </div>
        )}

        {step && !step.done && !busy && !building && (
          <div className="ex">
            {step.heard && (
              <div className="heard">Noted — {step.heard}</div>
            )}
            <div className="qlab" style={{ marginTop: 16 }}>
              Question {turns.length + 1}
            </div>
            <p className="q">{step.question}</p>
            <div className="why">{step.why}</div>

            <div className="composer">
              <textarea
                value={draft}
                autoFocus
                placeholder="Answer in your own words…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
              />
              {step.suggestions?.length > 0 && (
                <div className="picks">
                  <div className="plab">Demo shortcut — click to fill, then edit</div>
                  {step.suggestions.map((s, i) => (
                    <button className="pick" key={i} onClick={() => setDraft(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="crow">
                <button className="btn" onClick={submit} disabled={!draft.trim()}>
                  Send answer
                </button>
                <span className="dim" style={{ fontSize: 12.5 }}>⌘↵</span>
                <div style={{ flex: 1 }} />
                {turns.length >= 3 && (
                  <button className="btn ghost sm" onClick={() => build(turns)}>
                    That's enough — build it
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>
    </div>
  );
}

/* ================================================================= review */

function Review({
  spec,
  setSpec,
  onRun,
  onError,
  hasRun,
}: {
  spec: Spec;
  setSpec: (s: Spec) => void;
  onRun: () => void;
  onError: (e: string) => void;
  hasRun: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [buf, setBuf] = useState("");
  const [newRule, setNewRule] = useState("");
  const [adding, setAdding] = useState(false);

  const touched = spec.rules.filter((r) => r.origin !== "kept").length;
  const [killed, setKilled] = useState(0);

  function update(rules: Rule[]) {
    setSpec({ ...spec, rules });
  }

  function saveEdit(id: string) {
    update(
      spec.rules.map((r) =>
        r.id === id ? { ...r, rule: buf, origin: "edited", confidence: "stated", note: "" } : r
      )
    );
    setEditing(null);
  }

  function remove(id: string) {
    setKilled((k) => k + 1);
    update(spec.rules.filter((r) => r.id !== id));
  }

  function keep(id: string) {
    update(
      spec.rules.map((r) =>
        r.id === id ? { ...r, confidence: "stated", origin: "confirmed", note: "" } : r
      )
    );
  }

  async function add() {
    if (!newRule.trim()) return;
    setAdding(true);
    try {
      const r = await post<Rule>("/api/rule", {
        text: newRule.trim(),
        existing: spec.rules.map((x) => x.id),
      });
      update([...spec.rules, { ...r, origin: "added" }]);
      setNewRule("");
    } catch (e: any) {
      onError(e.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="wrap fade">
      <div className="eyebrow">Step 02 · What I need</div>
      <h2 style={{ marginBottom: 6 }}>Here's what I built from what you said</h2>
      <p className="lede">
        Every rule is traced back to your words. Change anything that's wrong,
        delete anything that isn't you, add whatever's missing. Nothing runs
        until you say so.
      </p>

      <div className="spec-head">
        <div>
          <div className="toolname">
            <h2>{spec.name}</h2>
            <span className="owned">Marisol's tool</span>
          </div>
          <p className="dim" style={{ margin: "6px 0 0", maxWidth: 620 }}>
            {spec.summary}
          </p>
        </div>
        <div className="bands">
          {spec.bands.map((b) => (
            <span className="bandchip" key={b}>{b}</span>
          ))}
        </div>
      </div>

      <div className="rules">
        {spec.rules.map((r) => (
          <div
            className={`rule ${r.confidence === "check" ? "check" : ""} ${
              r.origin === "added"
                ? "added"
                : r.origin === "edited" || r.origin === "confirmed"
                ? "edited"
                : ""
            }`}
            key={r.id}
          >
            <div className="rule-top">
              <h4>{r.title}</h4>
              {r.origin === "added" ? (
                <span className="tag yours">Added by you</span>
              ) : r.origin === "edited" ? (
                <span className="tag yours">Your correction</span>
              ) : r.origin === "confirmed" ? (
                <span className="tag yours">You confirmed this</span>
              ) : r.confidence === "check" ? (
                <span className="tag check">Needs your call</span>
              ) : (
                <span className="tag stated">From your words</span>
              )}
              <div className="spacer" />
              <div className="ractions">
                {editing === r.id ? (
                  <button className="btn sm" onClick={() => saveEdit(r.id)}>
                    Save
                  </button>
                ) : (
                  <>
                    {r.confidence === "check" && (
                      <button className="icobtn" onClick={() => keep(r.id)}>
                        Yes, that's right
                      </button>
                    )}
                    <button
                      className="icobtn"
                      onClick={() => {
                        setEditing(r.id);
                        setBuf(r.rule);
                      }}
                    >
                      Edit
                    </button>
                    <button className="icobtn kill" onClick={() => remove(r.id)}>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing === r.id ? (
              <textarea value={buf} autoFocus onChange={(e) => setBuf(e.target.value)} />
            ) : (
              <div className="rule-body">{r.rule}</div>
            )}

            {r.quote && <div className="quote">“{r.quote}”</div>}

            {r.confidence === "check" && r.note && (
              <div className="note">
                <b>I extrapolated this.</b> {r.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="addrule">
        <div className="plab">Something missing? Say it how you'd say it out loud</div>
        <textarea
          value={newRule}
          placeholder="e.g. If a lock or a door doesn't secure, that's same day no matter what — I don't leave someone with a door that won't lock."
          onChange={(e) => setNewRule(e.target.value)}
        />
        <button className="btn ghost sm" onClick={add} disabled={!newRule.trim() || adding}>
          {adding ? "Writing it in…" : "Add to my tool"}
        </button>
      </div>

      <div className="stickybar">
        <button className="btn copper" onClick={onRun}>
          {hasRun
            ? "Run it again with my changes →"
            : "Run it on this morning's queue →"}
        </button>
        <span className="dim" style={{ fontSize: 13.5 }}>
          {spec.rules.length} rules
          {touched > 0 && ` · ${touched} changed by you`}
          {killed > 0 && ` · ${killed} removed`}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== board */

const BAND_ORDER = ["EMERGENCY", "SAME DAY", "THIS WEEK", "SCHEDULE OUT"];

function Board({
  spec,
  tickets,
  run,
  setRun,
  onDone,
  onError,
  onAdjust,
}: {
  spec: Spec;
  tickets: Ticket[];
  run: RunOutput | null;
  setRun: (r: RunOutput) => void;
  onDone: () => void;
  onError: (e: string) => void;
  onAdjust: () => void;
}) {
  const [cursor, setCursor] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (run) return;
    const tick = setInterval(
      () => setCursor((c) => Math.min(c + 1, tickets.length)),
      480
    );
    post<RunOutput>("/api/run", { spec })
      .then(setRun)
      .catch((e) => onError(e.message))
      .finally(() => clearInterval(tick));
    return () => clearInterval(tick);
  }, []);

  if (!run) {
    return (
      <div className="narrow fade">
        <div className="eyebrow">Step 03 · What I build</div>
        <h2 style={{ marginBottom: 6 }}>Running {spec.name}</h2>
        <p className="lede">
          Your {spec.rules.length} rules against the {tickets.length} requests
          that came in overnight.
        </p>
        <div className="thinking">
          <span className="dots"><i /><i /><i /></span>
          Reading the whole queue before deciding any of it…
        </div>
        <div style={{ marginTop: 18 }}>
          {tickets.slice(0, cursor).map((t) => (
            <div
              key={t.id}
              className="fade"
              style={{
                display: "flex",
                gap: 12,
                padding: "7px 0",
                borderTop: "1px solid var(--line)",
                fontSize: 13,
              }}
            >
              <span style={{ fontFamily: "var(--mono)", color: "var(--faint)" }}>
                {t.id}
              </span>
              <span style={{ color: "var(--muted)" }}>
                {t.building} #{t.unit}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ color: "var(--sage)" }}>read</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const byId = new Map(tickets.map((t) => [t.id, t]));
  const ruleById = new Map(spec.rules.map((r) => [r.id, r]));
  const bands = spec.bands.length ? spec.bands : BAND_ORDER;
  const flagged = run.results.filter((r) => r.flag).length;
  const gaps = run.results.filter((r) => r.firedRuleIds.length === 0).length;

  // Anything Claude banded off-menu, plus any ticket it skipped, still shows.
  const known = new Set(bands.map((b) => b.toUpperCase()));
  const seen = new Set(run.results.map((r) => r.id));
  const strays: Result[] = [
    ...run.results.filter((r) => !known.has(r.band.toUpperCase())),
    ...tickets
      .filter((t) => !seen.has(t.id))
      .map((t) => ({
        id: t.id,
        band: "Unfiled",
        action: "No rule covered this one — your call.",
        because: "Nothing in your tool matched. Add a rule and re-run.",
        flag: "",
        firedRuleIds: [],
        linked: [],
      })),
  ];

  const section = (band: string, rows: Result[], bi: number) => (
    <section className={`bandsec b${Math.min(bi, 3)}`} key={band}>
      <div className="bandhead">
        <h3>{band}</h3>
        <span className="ct">{rows.length}</span>
        <span className="bar" />
      </div>
      <div className="tgrid">
        {rows.map((r) => {
          const t = byId.get(r.id);
          if (!t) return null;
          return (
            <article className={`tk ${r.flag ? "hot" : ""}`} key={r.id}>
              <div className="tk-h">
                <span className="id">{r.id}</span>
                <span className="loc">
                  {t.building} #{t.unit}
                </span>
                <span className="spacer" />
                <span className="ch">
                  {t.received} · {t.channel}
                </span>
              </div>
              <div className="tk-msg">
                “{t.text}”
                {t.file.length > 0 && (
                  <span className="ff">file: {t.file.join(" · ")}</span>
                )}
              </div>
              <div className="tk-d">
                <div className="act">{r.action}</div>
                <div className="bc">{r.because}</div>
                <div className="chips">
                  {r.firedRuleIds.length === 0 ? (
                    <span className="chip gap">No rule of yours yet</span>
                  ) : (
                    r.firedRuleIds.map((id) => {
                      const rule = ruleById.get(id);
                      const mine = rule && rule.origin !== "kept";
                      return (
                        <span className={`chip ${mine ? "yours" : ""}`} key={id}>
                          {rule ? rule.title : id}
                        </span>
                      );
                    })
                  )}
                </div>
                {r.flag && (
                  <div className="flagline">
                    <span>◆</span>
                    {r.flag}
                  </div>
                )}
                {r.linked.length > 0 && (
                  <div className="linked">grouped with {r.linked.join(", ")}</div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="wrap fade">
      <div className="eyebrow">Step 03 · What I build</div>
      <h2 style={{ marginBottom: 6 }}>{spec.name} — Tuesday morning</h2>
      <p className="lede">
        {run.results.length} requests, triaged by your rules. Every decision
        shows which of your rules made it.
      </p>

      {run.callout && (
        <div className="callout">
          <span className="mark">Your rule caught this</span>
          <p>{run.callout}</p>
        </div>
      )}

      {bands.map((band, bi) => {
        const rows = run.results.filter(
          (r) => r.band.toUpperCase() === band.toUpperCase()
        );
        return rows.length ? section(band, rows, bi) : null;
      })}

      {strays.length > 0 && section("Unfiled", strays, 3)}

      <div className="stickybar">
        <button className="btn copper" onClick={onDone}>
          This is right → keep it
        </button>
        <button className="btn ghost" onClick={onAdjust}>
          Something's off — change a rule and re-run
        </button>
        <span className="dim" style={{ fontSize: 13.5 }}>
          {flagged} decisions a generic priority list would have gotten wrong
          {gaps > 0 && ` · ${gaps} not covered by a rule yet`}
        </span>
      </div>
    </div>
  );
}

/* ================================================================ outcome */

function Outcome({
  spec,
  run,
  tickets,
}: {
  spec: Spec;
  run: RunOutput;
  tickets: Ticket[];
}) {
  const mine = spec.rules.filter((r) => r.origin !== "kept").length;
  const flagged = run.results.filter((r) => r.flag).length;

  return (
    <div className="wrap fade">
      <div className="eyebrow">Step 04 · What I can now do</div>
      <h1 style={{ maxWidth: 760 }}>
        Marisol just built software for her own expertise.
      </h1>
      <p className="lede" style={{ maxWidth: 700 }}>
        She didn't write code. She didn't write a prompt. She explained how she
        already does the job, corrected what was wrong, and now she has a tool
        that runs it.
      </p>

      <div className="stats">
        <div className="stat">
          <div className="v">45 min → 40 sec</div>
          <div className="l">Her morning triage, every day</div>
        </div>
        <div className="stat hi">
          <div className="v">{flagged}</div>
          <div className="l">
            Calls this morning that only her judgment gets right
          </div>
        </div>
        <div className="stat">
          <div className="v">
            {spec.rules.length}
            <span style={{ fontSize: 18, color: "var(--muted)" }}> rules</span>
          </div>
          <div className="l">
            All traced to her words{mine > 0 && ` · ${mine} she corrected herself`}
          </div>
        </div>
      </div>

      <div className="ownership">
        <h3>What she owns now</h3>
        <ul>
          <li>
            <span className="tick">✓</span>
            <span>
              <b>A tool, not an answer.</b> {spec.name} runs tomorrow morning
              too, and the morning after that.
            </span>
          </li>
          <li>
            <span className="tick">✓</span>
            <span>
              <b>Coverage when she's out.</b> The judgment that used to live
              only in her head now runs the queue when she's on vacation — as
              her deputy, not her replacement.
            </span>
          </li>
          <li>
            <span className="tick">✓</span>
            <span>
              <b>The override, always.</b> Every decision names the rule that
              made it. She can change any rule in plain English and re-run.
            </span>
          </li>
          <li>
            <span className="tick">✓</span>
            <span>
              <b>Her expertise, made legible.</b> Nineteen years that were
              invisible on a résumé are now a working artifact she can point
              at.
            </span>
          </li>
        </ul>
      </div>

      <div className="closing">
        <p className="big">
          Every technological transition changes jobs. It doesn't erase human
          capability.
        </p>
        <p>
          Orchards to factories to software to this. Fremont still runs on
          people who know how the work actually works — the maintenance
          coordinators, the shift supervisors, the schedulers, the estimators.
          They've been told to learn AI. What they actually need is a way to
          turn nineteen years of judgment into something that runs.
        </p>
        <p style={{ fontWeight: 600, color: "var(--ink)", marginTop: 18 }}>
          Everyone should be able to build software for the work they
          understand. That's Mettle.
        </p>
        <button
          className="btn ghost"
          style={{ marginTop: 20 }}
          onClick={() => location.reload()}
        >
          ↺ Run the demo again
        </button>
      </div>
    </div>
  );
}
