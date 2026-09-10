"use client";
import { MiniBox, Zoomable, HBars, GREEN, TAN } from "@/components/mini";
import { FlowCost } from "@/components/flows";

/**
 * BOX 5 — where the GPU money went. Modal figures are invoiced totals read off the
 * workspace dashboard, not wall-clock × an assumed rate. Gemini is the combined API
 * spend for dataset generation and judging, in rupees, as billed. Real $ only.
 */
export const MODAL_TOTAL = 116.39;
export const GEMINI_INR = 2215;

export const PHASES: { phase: string; detail: string; cost: number }[] = [
  { phase: "125M pretraining", detail: "four legs — v1, extension, e2, e4 — from random weights", cost: 70.14 },
  { phase: "Fine-tuning", detail: "QA-SFT + RAFT across the 125M, 500M and Gemma 2B families", cost: 19.94 },
  { phase: "Evaluation", detail: "models × 500 held-out questions on Modal", cost: 19.19 },
  { phase: "Alignment", detail: "DPO and RLAIF (reward model + PPO) on all three families", cost: 5.23 },
  { phase: "Earlier SFT study", detail: "the 125M data-scaling run that preceded this build", cost: 1.66 },
  { phase: "Probes & smoke tests", detail: "capability probes and pipeline dry-runs", cost: 0.18 },
  { phase: "Image builds & exports", detail: "container builds, checkpoint downloads", cost: 0.05 },
];

const RANKED = PHASES.slice().sort((a, b) => b.cost - a.cost);

export default function CostBox() {
  const graph = (
    <div>
      <div className="mlegend">
        <span><i className="green" />pretraining · where it went</span>
        <span><i className="tan" />everything else</span>
      </div>
      <Zoomable className="mdiag" caption={`Measured Modal spend by phase, invoiced totals, $${MODAL_TOTAL.toFixed(2)} across all seven phases.`}>
        <HBars max={MODAL_TOTAL} rows={RANKED.map((p, i) => ({
          label: p.phase, value: p.cost, color: i === 0 ? GREEN : TAN,
          valueLabel: `$${p.cost.toFixed(2)}`,
        }))} />
      </Zoomable>
      <p className="mcap">Measured Modal GPU spend, invoiced — pretraining the 125M from scratch is <b>60%</b> of the whole ${MODAL_TOTAL.toFixed(2)} bill.</p>
    </div>
  );

  const table = (
    <div>
      <Zoomable className="mtable-scroll" caption={`Every Modal phase with its invoiced cost and share of the $${MODAL_TOTAL.toFixed(2)} total.`}>
        <table className="mtable" style={{ minWidth: 560 }}>
          <thead><tr><th>Phase</th><th>Cost</th><th>Share</th></tr></thead>
          <tbody>
            {RANKED.map((p) => (
              <tr key={p.phase}>
                <td>{p.phase}<div style={{ fontFamily: "Figtree,sans-serif", fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{p.detail}</div></td>
                <td>${p.cost.toFixed(2)}</td>
                <td>{((p.cost / MODAL_TOTAL) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr><td style={{ fontWeight: 700 }}>Total invoiced</td><td style={{ fontWeight: 700 }}>${MODAL_TOTAL.toFixed(2)}</td><td>100%</td></tr>
          </tbody>
        </table>
      </Zoomable>
      <p className="mcap">Evaluation ($19.19) cost <b>nearly four times</b> all the alignment work ($5.23) combined — the line most projects never publish.</p>
    </div>
  );

  const flow = (
    <div>
      <Zoomable className="mdiag" caption="The money flows pretraining → fine-tuning → evaluation → alignment, all billed on a single Modal account totalling $116.39.">
        <FlowCost />
      </Zoomable>
      <p className="mcap">Almost all the money was spent teaching the model to read in the first place; everything after that was comparatively cheap.</p>
    </div>
  );

  const footer = (
    <div className="msub three">
      <div className="msubc"><div className="k">Modal · GPU</div><div className="v">${MODAL_TOTAL.toFixed(2)}</div></div>
      <div className="msubc"><div className="k">Gemini API</div><div className="v">₹{GEMINI_INR.toLocaleString("en-IN")}</div></div>
      <div className="msubc"><div className="k">Modal accounts</div><div className="v">1</div></div>
    </div>
  );

  return (
    <MiniBox
      eyebrow="Where the GPU money went · Modal"
      desc={<>Two bills built this: <b>Modal</b> for every GPU hour (${MODAL_TOTAL.toFixed(2)}, invoiced), and the
        <b> Gemini API</b> for generating the training data and running the judge (₹{GEMINI_INR.toLocaleString("en-IN")}).
        The seven Modal phases below are real invoiced totals, not wall-clock times multiplied by an assumed rate.</>}
      tabs={[
        { id: "graph", label: "Graph", panel: graph },
        { id: "table", label: "Table", panel: table },
        { id: "flow", label: "Flowchart", panel: flow },
      ]}
      footer={footer}
    />
  );
}
