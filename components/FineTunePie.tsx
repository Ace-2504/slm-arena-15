"use client";
import { MiniBox, Zoomable, HBars, GREEN, TAN } from "@/components/mini";
import { FlowFineTune } from "@/components/flows";

/**
 * BOX 6 — the fine-tuning breakdown, per model. Was a pie; now RANKED HORIZONTAL BARS
 * per the skill's chart grammar. Every SFT and RAFT run that was invoiced, summing to the
 * $19.94 fine-tuning row. Real $ only.
 */
export type Slice = { model: string; stage: string; cost: number };
export const FT_SLICES: Slice[] = [
  { model: "Gemma 2B", stage: "QA-SFT", cost: 9.84 },
  { model: "Gemma 2B", stage: "RAFT", cost: 6.82 },
  { model: "SLM-500M", stage: "SFT + RAFT · one Modal app", cost: 2.67 },
  { model: "SLM-125M", stage: "RAFT", cost: 0.41 },
  { model: "SLM-125M", stage: "QA-SFT", cost: 0.20 },
];
const TOTAL = FT_SLICES.reduce((a, s) => a + s.cost, 0);
const RANKED = FT_SLICES.slice().sort((a, b) => b.cost - a.cost);

export default function FineTuneBox() {
  const graph = (
    <div>
      <div className="mlegend">
        <span><i className="green" />Gemma 2B · where it went</span>
        <span><i className="tan" />125M &amp; 500M</span>
      </div>
      <Zoomable className="mdiag" caption={`Measured fine-tuning spend per run, ranked, summing to the $${TOTAL.toFixed(2)} fine-tuning bill; Gemma 2B is 84% of it.`}>
        <HBars max={RANKED[0].cost} rows={RANKED.map((s) => ({
          label: `${s.model} · ${s.stage.split(" · ")[0]}`,
          value: s.cost,
          color: s.model === "Gemma 2B" ? GREEN : TAN,
          valueLabel: `$${s.cost.toFixed(2)}`,
        }))} />
      </Zoomable>
      <p className="mcap">Measured per-run fine-tuning cost — <b>Gemma 2B is 84%</b> of the ${TOTAL.toFixed(2)} bill (it ran on an A100 while the 125M and 500M fine-tunes ran on an L4).</p>
    </div>
  );

  const flow = (
    <div>
      <Zoomable className="mdiag" caption="Per-model fine-tune cost is driven by model size × training steps: a bigger model needs a bigger GPU, and size moves the bill more than steps do.">
        <FlowFineTune />
      </Zoomable>
      <p className="mcap">The bigger the model, the pricier the GPU it has to sit on — so its size, more than how long you train, is what sets the bill.</p>
    </div>
  );

  const footer = (
    <div className="msub">
      <div className="msubc"><div className="k">Total fine-tuning</div><div className="v">${TOTAL.toFixed(2)}</div></div>
      <div className="msubc"><div className="k">Gemma 2B share</div><div className="v">84<small>%</small></div></div>
    </div>
  );

  return (
    <MiniBox
      eyebrow="The fine-tuning breakdown · per run"
      desc={<>The <b>$19.94 fine-tuning</b> line, split per run. Every SFT and RAFT job that was invoiced is here — the
        <b> 500M SFT and RAFT</b> were billed by Modal as one app ($2.67 for both), so they show as a single bar. Gemma 2B
        dominates because it is fifteen times the size of the 125M and needed an A100.</>}
      tabs={[
        { id: "graph", label: "Graph", panel: graph },
        { id: "flow", label: "Flowchart", panel: flow },
      ]}
      footer={footer}
    />
  );
}
