"use client";
import ArenaLive from "@/components/ArenaLive";
import ModelMap from "@/components/ModelMap";
import CostBox from "@/components/CostToBuild";
import FineTuneBox from "@/components/FineTunePie";
import { LeaderboardBox, JudgeBox, GroundedBox } from "@/components/boxes";
import { ZoomProvider } from "@/components/mini";
import DATA from "@/lib/arena-data.json";

type Q = { id: string; q: string; ctx: string; gold: string; source: string; answerable: boolean };
type Model = { id: string; name: string; family: string; stage: string; site: string };

const MODELS = DATA.models as Model[];
const QS = DATA.questions as Q[];
const N_TOTAL = (DATA as { n_questions_total: number }).n_questions_total;
const N_ARENA = (DATA as { n_questions_arena?: number }).n_questions_arena ?? QS.length;

// Everything reads from the data file, so the same page renders 13 or 15 models.
const N = MODELS.length;
const SIZES = MODELS.reduce<string[]>((a, m) => a.includes(m.family) ? a : [...a, m.family], []).length;
const STAGES = MODELS.reduce<string[]>((a, m) => a.includes(m.stage) ? a : [...a, m.stage], []).length;

const STATS: { k: string; v: string }[] = [
  { k: "Models", v: String(N) },
  { k: "Sizes", v: String(SIZES) },
  { k: "Stages", v: String(STAGES) },
  { k: "Held-out Qs", v: String(N_TOTAL) },
  { k: "In the arena", v: String(N_ARENA) },
  { k: "Blind judge", v: "1" },
];

export default function ArenaApp() {
  return (
    <ZoomProvider>
      <div className="wrap">
        <div className="mnav">
          <span className="eyebrow">SLM Engineering</span>
          <span className="mbrand">Trained, fine-tuned &amp; aligned by Harman Sandhu</span>
        </div>

        {/* hero */}
        <header className="hero">
          <div className="rule" />
          <div className="eyebrow">Head-to-head · {N} models, one question</div>
          <h1>SLM <span className="g">Arena</span></h1>
          <p>
            {N} small language models — three sizes (<b>125M</b>, <b>500M</b>, <b>Gemma&nbsp;2B</b>) across their
            training stages — answer the <b>same</b> question live, then a blind judge holding the
            gold answer key scores every one of them <b>0–10</b>.
          </p>
        </header>

        {/* stat strip */}
        <div className="mini-wrap" style={{ margin: "24px 0 0" }}>
          <div className="msub" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))" }}>
            {STATS.map((s) => (
              <div key={s.k} className="msubc"><div className="k">{s.k}</div><div className="v">{s.v}</div></div>
            ))}
          </div>
        </div>

        {/* orient the reader: the build map */}
        <div className="mini-wrap" style={{ margin: "16px 0 0" }}>
          <ModelMap models={MODELS} />
        </div>

        {/* SECTION 1 */}
        <div className="mini-wrap">
          <div className="msec-head"><em>Section 1</em> · Ask one question, watch every model answer it live, then see how they finished on the full test set.</div>
          <div className="mini-grid">
            <ArenaLive models={MODELS} questions={QS} />
            <LeaderboardBox />
          </div>
          <div className="mlesson">
            The lesson in both: <b>a live answer and a frozen average are the same test seen twice.</b>
            The arena lets you watch one question decided in real time; the leaderboard is that exact
            grading repeated over {N_TOTAL} questions and averaged. Watching Gemma&nbsp;2B answer cleanly
            while the 125M base returns noise is the same story the {String(N)}-row board tells at a glance —
            capability climbs steeply with size, and every stage is judged on identical questions.
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="mini-wrap">
          <div className="msec-head"><em>Section 2</em> · A blind judge with the answer key grades every answer on a four-part rubric, and that judge is what keeps the ranking honest.</div>
          <div className="mini-grid">
            <JudgeBox />
            <GroundedBox />
          </div>
          <div className="mlesson">
            The lesson in both: <b>one honest scorer, and honesty measured apart from correctness.</b>
            The judge never sees which model wrote an answer and, for held-out questions, grades against a
            known gold key — so the ranking is checkable, not a popularity contest. And because grounding is
            scored separately, you can see the failure that a single score hides: RLAIF still reads well at
            9.08/10 while fabricating a figure not in the source <b>29.4%</b> of the time.
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="mini-wrap">
          <div className="msec-head"><em>Section 3</em> · Building all of this cost real GPU money, and most of it went to one place.</div>
          <div className="mini-grid">
            <CostBox />
            <FineTuneBox />
          </div>
          <div className="mlesson">
            The lesson in both: <b>teaching a model to read from scratch dwarfs everything after it.</b>
            Pretraining the 125M is <b>60%</b> of the $116.39 GPU bill; all the fine-tuning across three
            families comes to $19.94, and within that one model — Gemma&nbsp;2B — is 84% of the spend because
            size, not training time, drives the GPU you have to rent. Every figure here is an invoiced total,
            not a wall-clock estimate.
          </div>
        </div>

        <footer>
          <span>Arena built &amp; models aligned by Harman Sandhu</span>
          <span>Small language models · live generation, judged by Gemini</span>
        </footer>
      </div>
    </ZoomProvider>
  );
}
