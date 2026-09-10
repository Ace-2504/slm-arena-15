"use client";
import { useEffect, useState } from "react";
import ModelText from "@/components/ModelText";
import { MiniBox, Zoomable } from "@/components/mini";
import { FlowArena } from "@/components/flows";

/**
 * BOX 1 — the live arena. One question -> all N models generate LIVE -> every
 * answer is scored LIVE by a blind judge that (for a held-out item) holds the gold key.
 * Tabs: Benchmark (default) | Flowchart.
 *
 * Backend wiring is UNCHANGED from the original arena:
 *   GET  /health                    -> live status pill
 *   POST /generate  (per model)     -> {completion, seconds, tokens}
 *   POST /judge     (once, batched) -> {graded:{[id]:{score, parts, grounded, reason, error?}}}
 */
type Model = { id: string; name: string; family: string; stage: string; site: string };
type Q = { id: string; q: string; ctx: string; gold: string; source: string; answerable: boolean };
type Row = {
  status: "queued" | "generating" | "answered" | "judging" | "done" | "error";
  text: string; secs?: number; tokens?: number;
  score?: number; parts?: Record<string, number>; grounded?: boolean; reason?: string; error?: string;
};

// Endpoint is probed at runtime and overridable via ?api=<url> (quick-tunnel URLs rotate).
const BUILD_ENDPOINT = process.env.NEXT_PUBLIC_INFERENCE_URL || "http://127.0.0.1:8000";

function resolveEndpoint(): string {
  if (typeof window === "undefined") return BUILD_ENDPOINT;
  try {
    const q = new URLSearchParams(window.location.search).get("api");
    if (q !== null) {
      if (q) { localStorage.setItem("slm-api", q); return q; }
      localStorage.removeItem("slm-api");
      return BUILD_ENDPOINT;
    }
    return localStorage.getItem("slm-api") || BUILD_ENDPOINT;
  } catch {
    return BUILD_ENDPOINT;
  }
}
const SOURCE_LABEL: Record<string, string> = {
  "case-law": "US case law", sec: "SEC filings", "fineweb-edu": "Educational web",
};

// Score pill: tan (weak) -> green (strong). Semantic: greener = better.
function scoreColor(s: number) {
  const t = Math.max(0, Math.min(1, s / 10));
  const tan = [199, 186, 152], grn = [47, 107, 79];
  const c = tan.map((v, i) => Math.round(v + (grn[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const scoreText = (s: number) => (s < 3.5 ? "#1e293b" : "#fff");

export default function ArenaLive({ models, questions }: { models: Model[]; questions: Q[] }) {
  const [text, setText] = useState(questions[0]?.q ?? "");
  const [picked, setPicked] = useState<Q | null>(questions[0] ?? null);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [phase, setPhase] = useState<"idle" | "generating" | "judging" | "done">("idle");
  const [done, setDone] = useState(0);
  const [err, setErr] = useState("");
  const [showGold, setShowGold] = useState(false);

  const [live, setLive] = useState<boolean | null>(null);   // null = still probing
  const [endpoint, setEndpoint] = useState(BUILD_ENDPOINT);

  function probe() {
    const ep = resolveEndpoint();
    setEndpoint(ep);
    setLive(null);
    let cancelled = false;
    const t = setTimeout(() => { if (!cancelled) setLive((v) => (v === null ? false : v)); }, 8000);
    fetch(`${ep}/health`, { cache: "no-store" })
      .then((r) => r.ok).catch(() => false)
      .then((ok) => { if (!cancelled) { clearTimeout(t); setLive(ok); } });
    return () => { cancelled = true; clearTimeout(t); };
  }
  useEffect(() => probe(), []);
  const isKnown = picked !== null && picked.q === text.trim();

  function choose(q: Q) {
    setPicked(q); setText(q.q); setRows({}); setPhase("idle"); setShowGold(false); setErr("");
  }
  function edit(v: string) {
    setText(v);
    setPicked(questions.find((q) => q.q === v.trim()) ?? null);
    setShowGold(false);
  }

  async function run() {
    const question = text.trim();
    if (!question || phase === "generating" || phase === "judging") return;
    setErr(""); setDone(0); setShowGold(false); setPhase("generating");
    setRows(Object.fromEntries(models.map((m) => [m.id, { status: "queued", text: "" } as Row])));

    const answers: Record<string, string> = {};
    // Held-out items are GROUNDED questions: the answer lives in a source document. A user-written
    // question has no document, so it is asked closed-book.
    const ctx = isKnown ? (picked?.ctx || undefined) : undefined;

    // Sequential: the GPU serialises generation anyway, and this streams results in.
    for (const m of models) {
      setRows((r) => ({ ...r, [m.id]: { ...r[m.id], status: "generating" } }));
      try {
        const res = await fetch(`${endpoint}/generate`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model_id: m.id, prompt: question, question, context: ctx, max_new_tokens: 120 }),
        });
        if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
        const j = await res.json();
        const a = (j.completion || "").trim();
        answers[m.id] = a;
        setRows((r) => ({ ...r, [m.id]: { status: "answered", text: a || "(empty)", secs: j.seconds, tokens: j.tokens } }));
      } catch (e) {
        setRows((r) => ({ ...r, [m.id]: { status: "error", text: "", error: e instanceof Error ? e.message : String(e) } }));
      }
      setDone((d) => d + 1);
    }

    // Judge every answer that came back — one batched call.
    setPhase("judging");
    setRows((r) => Object.fromEntries(Object.entries(r).map(
      ([k, v]) => [k, v.status === "answered" ? { ...v, status: "judging" } : v])));
    try {
      const jr = await fetch(`${endpoint}/judge`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: ctx, reference: picked?.gold, answers }),
      });
      if (!jr.ok) throw new Error(`${jr.status} ${(await jr.text()).slice(0, 160)}`);
      const g = await jr.json();
      setRows((r) => {
        const next = { ...r };
        for (const [mid, v] of Object.entries(g.graded as Record<string, any>)) {
          next[mid] = v.error
            ? { ...next[mid], status: "done", error: v.error }
            : { ...next[mid], status: "done", score: v.score, parts: v.parts, grounded: v.grounded, reason: v.reason };
        }
        return next;
      });
    } catch (e) {
      setErr(`Judging failed: ${e instanceof Error ? e.message : String(e)}`);
      setRows((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { ...v, status: "done" as const }])));
    }
    setPhase("done");
  }

  const busy = phase === "generating" || phase === "judging";

  // ---- status pill (skill states: ok | wake | off) ----
  const statusCls = busy ? "wake" : live ? "ok" : live === null ? "" : "off";
  const statusTxt = busy ? (phase === "generating" ? `generating ${done}/${models.length}…` : "judging…")
    : live ? "demo available"
    : live === null ? "connecting…"
    : "demo unavailable — click to retry";
  const status = (
    <span className={`mstatus ${statusCls}`} title="live demo status"
      onClick={() => { if (!busy && live === false) probe(); }}>
      <span className="md" /><span>{statusTxt}</span>
    </span>
  );

  const benchmark = (
    <div>
      {/* preset question chips */}
      <div className="mini-presets">
        {questions.slice(0, 6).map((q) => (
          <button key={q.id} className={"mini-preset" + (picked?.id === q.id ? " sel" : "")}
            disabled={busy} onClick={() => choose(q)}>
            {q.q.length > 46 ? q.q.slice(0, 44) + "…" : q.q}
          </button>
        ))}
      </div>

      {/* full dropdown of every held-out question */}
      <select className="mini-select" disabled={busy} value={picked?.id ?? ""}
        onChange={(e) => { const q = questions.find((x) => x.id === e.target.value); if (q) choose(q); }}>
        <option value="">— or pick from all {questions.length} held-out questions —</option>
        {questions.map((q, i) => (
          <option key={q.id} value={q.id}>{i + 1}. {q.q.length > 70 ? q.q.slice(0, 68) + "…" : q.q}</option>
        ))}
      </select>

      <textarea className="mini-ta" rows={3} value={text} onChange={(e) => edit(e.target.value)}
        placeholder="Ask anything — or pick a held-out question above" disabled={busy}
        onKeyDown={(e) => { if (!busy && e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }} />

      <div className="mslabels" style={{ justifyContent: "flex-start", marginBottom: 12 }}>
        <span>{isKnown
          ? "held-out · document supplied · graded against the gold answer"
          : "your question · closed-book · graded without a reference"}</span>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="mini-run" onClick={run} disabled={!live || busy || !text.trim()}>
          {phase === "generating" ? `Generating ${done}/${models.length}…`
            : phase === "judging" ? "Judging…"
            : `Ask all ${models.length} & judge →`}
        </button>
        {isKnown && picked && (
          <button className="mini-preset" disabled={busy} onClick={() => setShowGold((s) => !s)}>
            {showGold ? "hide answer key" : "show answer key"}
          </button>
        )}
      </div>

      {isKnown && picked && showGold && (
        <div className="mkey">
          <div className="mout-lab">Answer key · {SOURCE_LABEL[picked.source] ?? picked.source}</div>
          <p style={{ margin: "0 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)" }}>{picked.gold}</p>
          {picked.ctx && (
            <>
              <div className="mout-lab" style={{ marginTop: 12 }}>Source document given to every model</div>
              <div className="mini-text">{picked.ctx}</div>
            </>
          )}
        </div>
      )}

      {err && <p className="mexplain" style={{ color: "var(--rose)", marginTop: 12 }}>{err}</p>}
      {live === false && !err && (
        <p className="mcap" style={{ marginTop: 12 }}>
          The inference endpoint is unavailable right now. The leaderboard and every other box below
          are unaffected — they render from the frozen offline evaluation.
        </p>
      )}

      {Object.keys(rows).length > 0 && (
        <div className="mres">
          {models.map((m) => {
            const row = rows[m.id];
            if (!row) return null;
            const cls = row.status === "generating" ? "gen" : row.status === "error" ? "err" : "";
            const done = row.status === "done" && row.score !== undefined;
            return (
              <div key={m.id} className={`mcard ${cls}`}>
                <div className="mcard-top">
                  {done ? (
                    <span className="mscore" style={{ background: scoreColor(row.score!), color: scoreText(row.score!) }}
                      title="Blind judge score, 0–10">{row.score!.toFixed(1)}</span>
                  ) : <span className="mscore pend">–</span>}
                  <a href={m.site} target="_blank" rel="noreferrer">{m.name}</a>
                  <span className="mbadge">{m.family}</span>
                  <span className="mbadge">{m.stage}</span>
                  {row.grounded && <span className="mbadge grn">grounded</span>}
                  <span className="mbadge" style={{ marginLeft: "auto" }}>
                    {row.status === "queued" ? "queued"
                      : row.status === "generating" ? "generating…"
                      : row.status === "judging" ? "judging…"
                      : row.status === "error" ? "failed"
                      : `${row.tokens} tok · ${row.secs}s`}
                  </span>
                </div>
                <div className={"mcard-ans" + (row.error ? " err" : "")}>
                  {row.error ? row.error
                    : row.status === "queued" ? "—"
                    : row.text ? <ModelText text={row.text} /> : "…"}
                </div>
                {row.parts && (
                  <div className="mrubric">
                    {[["correctness", 5], ["completeness", 2], ["groundedness", 2], ["clarity", 1]].map(([k, max]) => (
                      <span key={k as string} className="mbadge" title={`${k} out of ${max}`}>
                        {(k as string).slice(0, 4)} {row.parts![k as string]}/{max}
                      </span>
                    ))}
                  </div>
                )}
                {row.reason && <p className="mreason">judge: {row.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const flowchart = (
    <div>
      <Zoomable className="mdiag" caption="Every model answers the very same question, then one blind judge — holding the gold answer key — grades them all and lines them up best to worst.">
        <FlowArena />
      </Zoomable>
      <p className="mcap">
        Everyone in the room is handed the identical question; one impartial marker, who already has
        the answer sheet, grades each reply and lines them up from best to worst.
      </p>
    </div>
  );

  return (
    <MiniBox
      eyebrow={`Live arena · ${models.length} models`}
      status={status}
      desc={<>Pick a <b>held-out question</b> or write your own, and every model answers it in turn.
        A <b>blind judge</b> then scores each answer <b>0–10</b>. A held-out question ships with its
        source document and a gold answer, so the grade is checkable; your own question is asked
        closed-book. Watch all {models.length} take a run at the same prompt, live.</>}
      tabs={[
        { id: "run", label: "Benchmark", panel: benchmark },
        { id: "flow", label: "Flowchart", panel: flowchart },
      ]}
    />
  );
}
