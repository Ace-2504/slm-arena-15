# SLM Arena (15 models)

The expanded side-by-side arena for the small-language-model family — **15 models**
across the **125M / 500M / Gemma-2-2b** families and their base, QA-SFT, RAFT, DPO, and
RLAIF variants. One prompt is sent to multiple models at once and their answers are
compared in place, so the effect of each fine-tuning stage is visible directly.

This is the larger sibling of [slm-arena-13](https://github.com/Ace-2504/slm-arena-13),
adding the remaining fine-tuned variants to complete the grid.

---

## What's on the page

- **Live head-to-head** — type a prompt (or pick a preset) and watch the models answer
  together.
- **Model map** — base → QA-SFT → RAFT / DPO / RLAIF, per family.
- **Fine-tune breakdown** and a **cost-to-build** view.

Per-model content is data-driven from `lib/arena-data.json`. The repository also holds
experiment-planning material for a multi-seed reproducibility study
(`experiment_playbook.html`, `build_seeding_costs.py`).

---

## Repository layout

| Path | What it is |
| --- | --- |
| `components/ArenaLive.tsx` | Live multi-model head-to-head (calls the inference server) |
| `components/ArenaApp.tsx` | Page composition and state |
| `components/ModelMap.tsx`, `FineTunePie.tsx`, `CostToBuild.tsx` | Lineage map, fine-tune breakdown, build-cost views |
| `lib/arena-data.json` | Per-model data |
| `experiment_playbook.html`, `build_seeding_costs.py` | Experiment-planning material |
| `lib/themes.ts`, `components/ThemePicker.tsx` | Multi-theme design system |

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

The live panel proxies to a multi-model inference server via `NEXT_PUBLIC_INFERENCE_URL`
(build-time env var on Vercel); without it, the page renders and the live demo shows a
"not connected" state. The server that hosts every model lives in
[vizuara-fine-tuning](https://github.com/Ace-2504/vizuara-fine-tuning).

**Stack:** Next.js 14 · React 18 · TypeScript.

---

## Related repositories

- [slm-arena-13](https://github.com/Ace-2504/slm-arena-13) — the 13-model arena
- [slm-frontends](https://github.com/Ace-2504/slm-frontends) — the individual per-model demo sites
- [vizuara-fine-tuning](https://github.com/Ace-2504/vizuara-fine-tuning) — fine-tuning, evaluation, and the inference server

---

Built by **Harman Sandhu** ([@Ace-2504](https://github.com/Ace-2504)).
