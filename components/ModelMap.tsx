"use client";
import { Zoomable } from "@/components/mini";

/**
 * Intro "build map" — every training stage across every size, each cell linking to that model's
 * own site. Data-driven: families and stages are read from the model list, so the same panel
 * renders 13 or 15 models. Not one of the six experiment boxes — it orients the reader first.
 */
type Model = { id: string; name: string; family: string; stage: string; site: string };
const STAGE_ORDER = ["Base", "QA SFT", "RAFT", "DPO", "RLAIF"];
const STAGE_LABEL: Record<string, string> = {
  "Base": "base", "QA SFT": "qa", "RAFT": "raft", "DPO": "dpo", "RLAIF": "rlaif",
};

export default function ModelMap({ models }: { models: Model[] }) {
  const families = models.reduce<string[]>((acc, m) => acc.includes(m.family) ? acc : [...acc, m.family], []);
  const stages = STAGE_ORDER.filter((s) => models.some((m) => m.stage === s));
  const at = (fam: string, stage: string) => models.find((m) => m.family === fam && m.stage === stage);

  return (
    <div className="mintro">
      <div className="mini-eyebrow">The build · {models.length} models in this arena</div>
      <p className="desc" style={{ marginBottom: 12 }}>
        One training pipeline, three sizes. <b>125M</b> and <b>500M</b> were trained from scratch;
        <b> Gemma&nbsp;2B</b> is Google&apos;s pretrained base. Click any cell to open that model&apos;s
        own site — training details, cost, architecture and evaluation.
      </p>
      <Zoomable className="mtable-scroll" caption="The build map: five training stages (base → QA-SFT → RAFT → DPO → RLAIF) across three model sizes, each cell a link to that model's own site.">
        <table className="mtable" style={{ minWidth: 440 }}>
          <thead>
            <tr><th>Stage</th>{families.map((f) => <th key={f} style={{ textAlign: "center" }}>{f}</th>)}</tr>
          </thead>
          <tbody>
            {stages.map((st) => (
              <tr key={st}>
                <td>{st}</td>
                {families.map((fam) => {
                  const m = at(fam, st);
                  return (
                    <td key={fam} style={{ textAlign: "center" }}>
                      {m ? (
                        <a className="mchip" href={m.site} target="_blank" rel="noreferrer">
                          {fam} · {STAGE_LABEL[st] ?? st.toLowerCase()}
                        </a>
                      ) : <span style={{ color: "var(--dim)" }} title="not published for this size">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Zoomable>
    </div>
  );
}
