"use client";
import { useState } from "react";
import DATA from "@/lib/arena-data.json";
import { MiniBox, Zoomable, HBars, GroundedFabBars, RubricBar, GREEN, TAN } from "@/components/mini";
import { FlowLeaderboard, FlowJudge, FlowGrounded } from "@/components/flows";

type LB = {
  id: string; name: string; family: string; stage: string; site: string;
  score: number; grounded: number; fabrication: number; token_f1: number; n: number;
  by_source: Record<string, number>;
};
const BOARD = (DATA.leaderboard as LB[]).slice().sort((a, b) => b.score - a.score);
const N_TOTAL = (DATA as { n_questions_total: number }).n_questions_total;
const SOURCES = [
  { key: "case-law", label: "Case law" },
  { key: "sec", label: "SEC" },
  { key: "fineweb-edu", label: "Web" },
];

/* ============================ BOX 2 — leaderboard ========================= */
export function LeaderboardBox() {
  const graph = (
    <div>
      <div className="mlegend">
        <span><i className="green" />top tier · Gemma 2B (9+/10)</span>
        <span><i className="tan" />weaker · 500M &amp; 125M</span>
      </div>
      <Zoomable className="mdiag"
        caption={`Measured mean blind-judge score (0–10) over all ${N_TOTAL} held-out questions, ${BOARD.length} models ranked best to worst.`}>
        <HBars unit="" rows={BOARD.map((m) => ({
          label: m.name, value: m.score,
          color: m.score >= 8 ? GREEN : TAN,
        }))} max={10} />
      </Zoomable>
      <p className="mcap">Measured mean judge score, 0–10, over all {N_TOTAL} held-out questions — the frozen offline board, not the live run.</p>
    </div>
  );

  const table = (
    <div>
      <Zoomable className="mtable-scroll"
        caption={`The frozen leaderboard: mean /10, grounded %, fabrication % (lower is better), token-F1, and per-source means over ${N_TOTAL} held-out questions.`}>
        <table className="mtable" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>#</th><th>Model</th><th>Size</th><th>Stage</th><th>Mean /10</th>
              <th className="grp">Case law</th><th>SEC</th><th>Web</th>
              <th className="grp">Grounded</th><th>Fabric.↓</th><th>Tok-F1</th><th>n</th>
            </tr>
          </thead>
          <tbody>
            {BOARD.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td><a href={m.site} target="_blank" rel="noreferrer">{m.name}</a></td>
                <td>{m.family}</td><td>{m.stage}</td>
                <td style={{ fontWeight: 700, color: m.score >= 8 ? "#2f6b4f" : "#334155" }}>{m.score.toFixed(2)}</td>
                <td className="grp">{m.by_source?.["case-law"]?.toFixed(2) ?? "–"}</td>
                <td>{m.by_source?.["sec"]?.toFixed(2) ?? "–"}</td>
                <td>{m.by_source?.["fineweb-edu"]?.toFixed(2) ?? "–"}</td>
                <td className="grp">{m.grounded.toFixed(1)}%</td>
                <td>{m.fabrication.toFixed(1)}%</td>
                <td>{m.token_f1.toFixed(3)}</td>
                <td>{m.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Zoomable>
      <p className="mcap">
        <b>Token-F1</b> is raw word overlap with the reference — it punishes correct paraphrase (Gemma
        RAFT reads 0.145 against a 9.74 judge score), which is exactly why the judge, not F1, is the headline.
      </p>
    </div>
  );

  const flow = (
    <div>
      <Zoomable className="mdiag" caption={`Every model answered the same ${N_TOTAL} frozen questions, the blind judge scored each answer, and the per-model average became its place on the board.`}>
        <FlowLeaderboard />
      </Zoomable>
      <p className="mcap">Every contestant sat the same {N_TOTAL}-question exam, one marker graded every paper, and each one&apos;s average mark set their rank.</p>
    </div>
  );

  return (
    <MiniBox
      eyebrow="The leaderboard · frozen evaluation"
      desc={<>The <b>offline scoreboard</b>, not the live run: every model answered the same {N_TOTAL} decontaminated
        held-out questions and a blind judge scored each one. <b>Mean /10</b> is the four-part rubric; <b>grounded %</b>
        is the share of answers free of invented claims; <b>fabrication %</b> (lower is better) counts answers with a
        figure absent from the source.</>}
      tabs={[
        { id: "graph", label: "Graph", panel: graph },
        { id: "table", label: "Table", panel: table },
        { id: "flow", label: "Flowchart", panel: flow },
      ]}
    />
  );
}

/* ============================ BOX 3 — the judge ========================== */
export function JudgeBox() {
  const [mode, setMode] = useState<"heldout" | "closed">("heldout");
  const diagram = (
    <div>
      <div className="mseg">
        <button className={mode === "heldout" ? "sel" : ""} onClick={() => setMode("heldout")}>Held-out · open-book</button>
        <button className={mode === "closed" ? "sel" : ""} onClick={() => setMode("closed")}>Your question · closed-book</button>
      </div>
      <Zoomable className="mdiag" caption="The 0–10 rubric: Correctness 5, Completeness 2, Groundedness 2, Clarity 1 — so a nearly-right answer separates cleanly from a hopeless one.">
        <RubricBar />
      </Zoomable>
      <p className="mexplain">
        {mode === "heldout"
          ? <>On a <b>held-out question</b> the judge is handed the source document and the gold answer, so its score is
            checkable against a known-good reference rather than a popularity contest.</>
          : <>On a question <b>you write</b> there is no answer key, so the judge grades from its own knowledge — still
            blind to which model answered, but a weaker signal, and the arena labels it as such.</>}
      </p>
    </div>
  );

  const flow = (
    <div>
      <Zoomable className="mdiag" caption="The judge reads the answer and the gold key side by side, awards four sub-scores, and adds them to a single mark out of ten.">
        <FlowJudge />
      </Zoomable>
      <p className="mcap">A marker with the answer sheet reads each reply, ticks four boxes, and adds them up to one mark out of ten.</p>
    </div>
  );

  return (
    <MiniBox
      eyebrow="The judge · gemini-3.1-flash-lite"
      desc={<>Every answer is scored by a <b>blind judge</b> that never sees which model produced it and grades one answer at a
        time. Four things keep it honest: a <b>frozen, decontaminated set</b>; <b>identical questions</b> for every model;
        <b> base models prompted few-shot</b> so they show real capability; the <b>RLAIF reward model kept out of scoring</b> so
        it gets no home-field advantage; and <b>grounding scored separately from correctness</b>. Known limit: it is a single
        judge, not yet calibrated against human labels, so treat small gaps cautiously.</>}
      tabs={[
        { id: "diagram", label: "Diagram", panel: diagram },
        { id: "flow", label: "Flowchart", panel: flow },
      ]}
    />
  );
}

/* ==================== BOX 4 — grounded vs fabricated ===================== */
export function GroundedBox() {
  const rows = BOARD.map((m) => ({ label: m.name, grounded: m.grounded, fabrication: m.fabrication }));
  const graph = (
    <div>
      <div className="mlegend">
        <span><i className="green" />grounded % (answer supported by the source)</span>
        <span><i className="olive" />fabrication % (a figure not in the source)</span>
      </div>
      <Zoomable className="mdiag" caption="Measured per model: grounded % (answers with no invented claims, green) against fabrication % (answers with a figure absent from the source, olive), over all held-out questions.">
        <GroundedFabBars rows={rows} />
      </Zoomable>
      <p className="mcap">Measured per model over the {N_TOTAL} held-out questions — grounded % (higher is better) vs fabrication % (lower is better).</p>
    </div>
  );

  const flow = (
    <div>
      <Zoomable className="mdiag" caption="Groundedness checks whether each claim is actually written in the source; fabrication flags a number the source never gives.">
        <FlowGrounded />
      </Zoomable>
      <p className="mcap">One lane checks the answer only says what the document says; the other catches a number the document never mentioned.</p>
    </div>
  );

  return (
    <MiniBox
      eyebrow="Grounded vs fabricated · honesty"
      desc={<>Two honesty signals, scored independently of correctness. <b>Grounded %</b> is the share of answers the judge
        found free of invented claims; <b>fabrication %</b> counts answers that stated a figure not present in the source.
        An answer can be grounded but wrong, or fluent and fabricated — which is why RLAIF fabricates at <b>29.4%</b> even
        while scoring 9.08/10.</>}
      tabs={[
        { id: "graph", label: "Graph", panel: graph },
        { id: "flow", label: "Flowchart", panel: flow },
      ]}
    />
  );
}
