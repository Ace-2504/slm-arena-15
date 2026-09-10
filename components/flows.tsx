import React from "react";

/* ============================================================================
   Hand-authored flowchart SVGs — one per box, drawn to references/flowchart-grammar.md.
   Node palette (semantic): green #2f6b4f = smart/optimized action, #2a5c44 = end anchor,
   parchment #ece3cf = neutral/costly step, olive #94823f = wasteful/warning step.
   Dark arrows #3a382f; dashed loops #b7ab8c; left negative-x space holds the input prop.
============================================================================= */

type NodeProps = {
  x: number; y: number; w: number; h?: number;
  kind?: "green" | "anchor" | "neutral" | "olive";
  title: string; sub?: string;
};
function Node({ x, y, w, h = 60, kind = "neutral", title, sub }: NodeProps) {
  const map = {
    green: { fill: "#2f6b4f", stroke: "none", t: "#fff", s: "#cfe3d6" },
    anchor: { fill: "#2a5c44", stroke: "none", t: "#fff", s: "#cfe3d6" },
    neutral: { fill: "#ece3cf", stroke: "#d6c8a6", t: "#4a4636", s: "#6b6450" },
    olive: { fill: "#94823f", stroke: "none", t: "#fff", s: "#efe8d2" },
  }[kind];
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="13" fill={map.fill} stroke={map.stroke}
        strokeWidth={map.stroke === "none" ? 0 : 1.5} />
      <text x={cx} y={sub ? y + h / 2 - 3 : y + h / 2 + 5} textAnchor="middle" fill={map.t}
        fontSize="15" fontWeight="600">{title}</text>
      {sub && <text x={cx} y={y + h / 2 + 16} textAnchor="middle" fill={map.s} fontSize="13">{sub}</text>}
    </g>
  );
}

function Marker({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
        <path d="M0,0 L7,3 L0,6 Z" fill="#3a382f" />
      </marker>
    </defs>
  );
}
const arrow = (id: string) => ({ stroke: "#3a382f", strokeWidth: 2, fill: "none", markerEnd: `url(#${id})` });

/* three stacked "document" props at the left margin */
function DocsProp({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      {[0, 6, 12].map((d, i) => (
        <g key={i} transform={`translate(${x + d},${y + (12 - d)})`}>
          <rect width="42" height="28" rx="5" fill="#eaf3ee" stroke="#2a5c44" strokeWidth="2.2" />
          <line x1="7" y1="11" x2="35" y2="11" stroke="#2a5c44" strokeWidth="1.4" opacity=".55" />
          <line x1="7" y1="18" x2="28" y2="18" stroke="#2a5c44" strokeWidth="1.4" opacity=".55" />
        </g>
      ))}
      <text x={x + 20} y={y + 62} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#8a8472">{label}</text>
    </g>
  );
}

const VB = "-200 0 1360 300";
const svgProps = { viewBox: VB, xmlns: "http://www.w3.org/2000/svg",
  style: { width: "100%", height: "auto", display: "block", marginTop: 6 }, fontFamily: "Figtree, sans-serif" } as const;

/* ---- 1. Live arena ----------------------------------------------------- */
export function FlowArena() {
  const a = "aArena";
  return (
    <svg {...svgProps}><Marker id={a} />
      <DocsProp x={-185} y={118} label="one question" />
      <path d={`M -138 138 C -70 138, -60 130, -12 130`} {...arrow(a)} />
      <Node x={0} y={104} w={210} kind="neutral" title="Held-out question" sub="+ its source document" />
      <line x1="210" y1="134" x2="292" y2="134" {...arrow(a)} />
      <Node x={300} y={104} w={220} kind="green" title="All N models answer" sub="same prompt, in turn" />
      <line x1="520" y1="134" x2="602" y2="134" {...arrow(a)} />
      <Node x={610} y={104} w={230} kind="green" title="Blind judge + gold key" sub="scores each 0–10" />
      <line x1="840" y1="134" x2="922" y2="134" {...arrow(a)} />
      <Node x={930} y={104} w={210} kind="anchor" title="Ranked answers" sub="best to worst" />
      <path d="M 410 104 C 410 40, 725 40, 725 104" stroke="#b7ab8c" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <text x={567} y={34} textAnchor="middle" fontSize="12.5" fontStyle="italic" fill="#9a9078">every model sees the exact same question</text>
    </svg>
  );
}

/* ---- 2. Leaderboard ---------------------------------------------------- */
export function FlowLeaderboard() {
  const a = "aLb";
  return (
    <svg {...svgProps}><Marker id={a} />
      <DocsProp x={-185} y={118} label="500 questions" />
      <path d={`M -138 138 C -70 138, -60 130, -12 130`} {...arrow(a)} />
      <Node x={0} y={104} w={220} kind="neutral" title="500 held-out Qs" sub="frozen, decontaminated" />
      <line x1="220" y1="134" x2="302" y2="134" {...arrow(a)} />
      <Node x={310} y={104} w={210} kind="green" title="Each model answers" sub="deterministic decoding" />
      <line x1="520" y1="134" x2="602" y2="134" {...arrow(a)} />
      <Node x={610} y={104} w={220} kind="green" title="Judge scores each" sub="one answer at a time" />
      <line x1="830" y1="134" x2="912" y2="134" {...arrow(a)} />
      <Node x={920} y={104} w={220} kind="anchor" title="Mean /10 per model" sub="the frozen board" />
      <path d="M 415 164 C 415 236, 720 236, 720 164" stroke="#b7ab8c" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <text x={567} y={252} textAnchor="middle" fontSize="12.5" fontStyle="italic" fill="#9a9078">repeat for every model, then average</text>
    </svg>
  );
}

/* ---- 3. The judge ------------------------------------------------------ */
export function FlowJudge() {
  const a = "aJudge";
  return (
    <svg {...svgProps}><Marker id={a} />
      <DocsProp x={-185} y={70} label="the answer" />
      <g>
        <rect x={-183} y={182} width="42" height="28" rx="5" fill="#f6efdc" stroke="#94823f" strokeWidth="2.2" />
        <path d="M -170 190 l 10 6 l 10 -6" stroke="#94823f" strokeWidth="1.8" fill="none" />
        <text x={-162} y={228} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#8a8472">gold key</text>
      </g>
      <path d="M -138 90 C -60 90, -40 118, 8 118" {...arrow(a)} />
      <path d="M -138 196 C -60 196, -40 156, 8 156" {...arrow(a)} />
      <Node x={16} y={108} w={230} kind="green" title="Blind judge reads both" sub="never sees which model" />
      <line x1="246" y1="138" x2="328" y2="138" {...arrow(a)} />
      <Node x={336} y={82} w={250} h={112} kind="neutral"
        title="Four sub-scores" sub="correct 5 · complete 2 · ground 2 · clear 1" />
      <line x1="586" y1="138" x2="668" y2="138" {...arrow(a)} />
      <Node x={676} y={108} w={190} kind="anchor" title="Total /10" sub="added up" />
      <path d="M 131 108 C 131 44, 431 44, 431 82" stroke="#b7ab8c" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <text x={300} y={38} textAnchor="middle" fontSize="12.5" fontStyle="italic" fill="#9a9078">same rubric on every answer</text>
    </svg>
  );
}

/* ---- 4. Grounded vs fabricated (two lanes) ----------------------------- */
export function FlowGrounded() {
  const a = "aGrnd";
  return (
    <svg {...svgProps}><Marker id={a} />
      <DocsProp x={-185} y={118} label="answer + source" />
      <path d="M -138 138 C -90 138, -80 90, -2 90" {...arrow(a)} />
      <path d="M -138 138 C -90 138, -80 210, -2 210" {...arrow(a)} />
      <text x={-150} y={40} fontSize="13" fontWeight="700" letterSpacing=".08em" fill="#2f6b4f">GROUNDED</text>
      <text x={-150} y={56} fontSize="12" fill="#6b6450">every claim is in the source</text>
      <Node x={10} y={62} w={250} kind="neutral" title="Claim checked vs source" sub="is it actually written there?" />
      <line x1="260" y1="92" x2="342" y2="92" {...arrow(a)} />
      <Node x={350} y={62} w={210} kind="green" title="Supported → grounded" sub="counts as honest" />
      <text x={-150} y={190} fontSize="13" fontWeight="700" letterSpacing=".08em" fill="#94823f">FABRICATED</text>
      <text x={-150} y={206} fontSize="12" fill="#6b6450">a number the source never gives</text>
      <Node x={10} y={182} w={250} kind="neutral" title="Figure checked vs source" sub="is that number in the text?" />
      <line x1="260" y1="212" x2="342" y2="212" {...arrow(a)} />
      <Node x={350} y={182} w={210} kind="olive" title="Absent → fabrication" sub="counts against it" />
    </svg>
  );
}

/* ---- 5. Where the GPU money went (flow) -------------------------------- */
export function FlowCost() {
  const a = "aCost";
  return (
    <svg {...svgProps}><Marker id={a} />
      <g transform="translate(-186,116)">
        <rect x="0" y="0" width="34" height="34" rx="5" fill="#eaf3ee" stroke="#2a5c44" strokeWidth="2.2" />
        <rect x="9" y="9" width="16" height="16" rx="2" fill="#2f6b4f" />
        {[0, 10, 20, 30].map((o) => <line key={"t" + o} x1={4 + o} y1="0" x2={4 + o} y2="-5" stroke="#2a5c44" strokeWidth="2" />)}
        {[0, 10, 20, 30].map((o) => <line key={"b" + o} x1={4 + o} y1="34" x2={4 + o} y2="39" stroke="#2a5c44" strokeWidth="2" />)}
        <text x="17" y="58" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#8a8472">GPU $</text>
      </g>
      <path d="M -140 133 C -80 133, -70 130, -12 130" {...arrow(a)} />
      <Node x={0} y={104} w={210} kind="green" title="Pretraining" sub="$70.14 · 60%" />
      <line x1="210" y1="134" x2="272" y2="134" {...arrow(a)} />
      <Node x={280} y={104} w={190} kind="neutral" title="Fine-tuning" sub="$19.94" />
      <line x1="470" y1="134" x2="532" y2="134" {...arrow(a)} />
      <Node x={540} y={104} w={190} kind="neutral" title="Evaluation" sub="$19.19" />
      <line x1="730" y1="134" x2="792" y2="134" {...arrow(a)} />
      <Node x={800} y={104} w={190} kind="neutral" title="Alignment" sub="$5.23" />
      <path d="M 105 104 C 105 44, 895 44, 895 104" stroke="#b7ab8c" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <text x={500} y={34} textAnchor="middle" fontSize="12.5" fontStyle="italic" fill="#9a9078">all billed on one Modal account · $116.39 total</text>
    </svg>
  );
}

/* ---- 6. Fine-tune cost drivers ----------------------------------------- */
export function FlowFineTune() {
  const a = "aFt";
  return (
    <svg {...svgProps}><Marker id={a} />
      <text x={-150} y={110} fontSize="13" fontWeight="700" letterSpacing=".06em" fill="#8a8472">WHAT YOU PAY FOR</text>
      <Node x={10} y={70} w={200} kind="neutral" title="Model size" sub="125M · 500M · 2B" />
      <Node x={10} y={168} w={200} kind="neutral" title="Training steps" sub="+ the GPU it needs" />
      <path d="M 210 100 C 280 100, 290 128, 342 128" {...arrow(a)} />
      <path d="M 210 198 C 280 198, 290 160, 342 160" {...arrow(a)} />
      <Node x={350} y={114} w={210} kind="green" title="GPU-hours × rate" sub="bigger model → A100" />
      <line x1="560" y1="144" x2="642" y2="144" {...arrow(a)} />
      <Node x={650} y={114} w={220} kind="anchor" title="Per-model $" sub="Gemma 2B = 84%" />
      <path d="M 455 114 C 455 54, 760 54, 760 114" stroke="#b7ab8c" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <text x={607} y={44} textAnchor="middle" fontSize="12.5" fontStyle="italic" fill="#9a9078">size drives the bill more than steps</text>
    </svg>
  );
}
