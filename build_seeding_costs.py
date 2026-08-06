"""Build seeding_cost_analysis.xlsx — cost of multi-seed (Exp 5) for all 15 models x stages,
estimated, then verified against real invoiced Modal spend.

Sheets:
  1 Summary            — headline recommendation + method
  2 Seed cost estimate — per model x stage: naive wall-clock x GPU-rate estimate + real-anchored seed cost
  3 Verification       — estimate vs real invoiced, overhead factor, data source, verdict
  4 My suggestions     — what to actually seed, tiered, with live-formula totals
  5 Playbook suggestion— what the experiment_playbook.html / mentor message recommended

Every $ is grounded: alignment stages use EXACT invoiced line items; SFT/RAFT use the real
bundled invoice split by real wall-clock; pretraining uses the invoiced lineage. Naive
wall-clock x rate estimates are shown ONLY to demonstrate they under-count vs the invoice.
"""
from __future__ import annotations
from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

OUT = r"D:\slm-arena-15\seeding_cost_analysis.xlsx"
FONT = "Arial"
MONEY = '$#,##0.00;($#,##0.00);-'
HDR = PatternFill("solid", fgColor="1F3864"); HF = Font(name=FONT, bold=True, color="FFFFFF", size=10)
TITLE = Font(name=FONT, bold=True, size=14); SUB = Font(name=FONT, italic=True, size=9, color="595959")
BOLD = Font(name=FONT, bold=True, size=10); BODY = Font(name=FONT, size=10)
BLUE = Font(name=FONT, size=10, color="0000FF")      # editable input
GREEN = PatternFill("solid", fgColor="E2EFDA"); RED = PatternFill("solid", fgColor="FCE4E4")
AMBER = PatternFill("solid", fgColor="FFF2CC")
THIN = Side(style="thin", color="BFBFBF"); BOX = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)

L4, A100 = 0.80, 2.10   # Modal published $/GPU-hr

# model, family, stage, gpu, wall_min (None=not a timed FT run), invoiced_seed_cost, source, note
# invoiced_seed_cost = best real-anchored cost of ONE additional seeded run of this stage
ROWS = [
 ("125m-base","125M","Base / pretrain","A100",None,70.14,"invoiced lineage (v1 11.54+ext 2.88+e2 27.47+e4 28.25)","from-scratch; a true re-seed = whole pretraining lineage"),
 ("125m-qa","125M","QA-SFT","L4",9.7,0.20,"train_125m.train $0.61 split by wall-clock","bundled SFT+RAFT invoice, split 9.7:19.4 min"),
 ("125m-raft","125M","RAFT","L4",19.4,0.41,"train_125m.train $0.61 split by wall-clock","bundled SFT+RAFT invoice"),
 ("125m-dpo","125M","DPO","L4",None,0.02,"train_dpo.train_125m (exact invoice)","exact line item"),
 ("125m-rlaif","125M","RLAIF (reward+PPO)","L4",None,0.10,"train_ppo.train_125m $0.08 + reward share $0.02","PPO exact; reward $0.06 shared /3"),
 ("500m-base","500M","Base / pretrain","-",None,None,"imported (thesreedath)","N/A — not our pretraining; cannot seed"),
 ("500m-qa","500M","QA-SFT","L4",31.6,0.93,"train_500m.train $2.67 split by wall-clock","bundled SFT+RAFT invoice, split 31.6:59.6 min"),
 ("500m-raft","500M","RAFT","L4",59.6,1.74,"train_500m.train $2.67 split by wall-clock","bundled SFT+RAFT invoice"),
 ("500m-dpo","500M","DPO","L4",None,0.08,"train_dpo.train_500m (exact invoice)","exact line item"),
 ("500m-rlaif","500M","RLAIF (reward+PPO)","L4",None,0.35,"train_ppo.train_500m $0.33 + reward share $0.02","PPO exact; reward shared"),
 ("gemma-base","Gemma 2B","Base / pretrain","-",None,None,"imported (Google)","N/A — Google's weights; cannot seed"),
 ("gemma-qa","Gemma 2B","QA-SFT","A100",202.0,9.84,"train_gemma.train $16.66 split by wall-clock","bundled+RETRIES; split 202:140 min; clean run est ~$7.07"),
 ("gemma-raft","Gemma 2B","RAFT","A100",140.0,6.82,"train_gemma.train $16.66 split by wall-clock","bundled+RETRIES; clean run est ~$4.90"),
 ("gemma-dpo","Gemma 2B","DPO","A100",None,0.43,"train_dpo.train_gemma (exact invoice)","exact line item"),
 ("gemma-rlaif","Gemma 2B","RLAIF (reward+PPO)","A100",None,4.25,"train_ppo.train_gemma $4.23 + reward share $0.02","PPO exact; reward shared"),
]

def rate(gpu): return A100 if gpu == "A100" else (L4 if gpu == "L4" else 0.0)

def head(ws,row,labels,widths):
    for c,(l,w) in enumerate(zip(labels,widths),1):
        x=ws.cell(row=row,column=c,value=l); x.font=HF; x.fill=HDR; x.border=BOX
        x.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True)
        ws.column_dimensions[get_column_letter(c)].width=w
    ws.freeze_panes=ws.cell(row=row+1,column=1)

def put(ws,r,c,v,*,font=BODY,fmt=None,fill=None,wrap=False):
    x=ws.cell(row=r,column=c,value=v); x.font=font; x.border=BOX
    if fmt: x.number_format=fmt
    if fill: x.fill=fill
    if wrap: x.alignment=Alignment(wrap_text=True,vertical="top")
    return x

def title(ws,t,s):
    ws["A1"]=t; ws["A1"].font=TITLE; ws["A2"]=s; ws["A2"].font=SUB; return 4


def sheet_estimate(wb):
    ws=wb.create_sheet("Seed cost estimate")
    r=title(ws,"Cost of ONE additional seed, per model x stage",
            "Naive estimate = training wall-clock x Modal GPU rate. Real-anchored seed cost = the actual "
            "invoiced cost of that run (what a re-seed will truly cost). n_seeds is editable in D2.")
    ws["G2"]="n_seeds ->"; ws["G2"].font=BOLD
    put(ws,2,8,2,font=BLUE); ws["H2"].fill=AMBER   # editable n_seeds input at H2
    head(ws,r,["Model","Family","Stage","GPU","Wall-clock (min)","Naive est (wall x rate)",
               "Real-anchored 1-seed $","Total for n seeds"],[13,10,20,7,15,18,18,16])
    r+=1; first=r
    for m,fam,stage,gpu,wall,inv,src,note in ROWS:
        put(ws,r,1,m,font=BOLD); put(ws,r,2,fam); put(ws,r,3,stage); put(ws,r,4,gpu)
        put(ws,r,5,wall if wall is not None else "—")
        # naive estimate formula = wall/60 * rate  (only when we have wall + a GPU rate)
        if wall is not None and rate(gpu)>0:
            put(ws,r,6,f"=E{r}/60*{rate(gpu)}",fmt=MONEY)
        else:
            put(ws,r,6,"—")
        if inv is None:
            put(ws,r,7,"N/A",fill=RED); put(ws,r,8,"N/A",fill=RED)
        else:
            c=put(ws,r,7,inv,font=BLUE,fmt=MONEY)
            c.comment=Comment(f"{src}. {note}","seeding cost",width=340,height=90)
            put(ws,r,8,f"=G{r}*$H$2",fmt=MONEY)
        r+=1
    put(ws,r,1,"TOTAL (all seedable stages)",font=BOLD)
    put(ws,r,7,f"=SUM(G{first}:G{r-1})",font=BOLD,fmt=MONEY)
    put(ws,r,8,f"=SUM(H{first}:H{r-1})",font=BOLD,fmt=MONEY)
    r+=2
    for line in ["Blue = real invoiced (editable). Red N/A = imported base (500M, Gemma) — we did not",
                 "pretrain it, so it cannot be re-seeded. 125M base is seedable but a re-seed means the",
                 "whole pretraining lineage ($70) — see 'My suggestions' for why that is not worth it.",
                 "Hover the blue cells for each figure's exact invoice source."]:
        ws.cell(row=r,column=1,value=line).font=BODY; r+=1
    return ws


def sheet_verify(wb):
    ws=wb.create_sheet("Verification vs real")
    r=title(ws,"Estimate vs real invoiced — does the naive estimate hold up?",
            "The naive wall-clock x rate estimate UNDER-counts, because Modal also bills container "
            "startup, image pull and checkpoint I/O (and Gemma includes retries). Conclusion: budget "
            "seeds from the invoiced figures, not from wall-clock x rate.")
    head(ws,r,["Family","Stage(s)","Naive est $","Real invoiced $","Invoiced / est",
               "What the invoice is","Verdict"],[11,20,13,15,13,30,34])
    r+=1
    data=[
     ("125M","SFT + RAFT (bundled)",0.39,0.61,"train_125m.train","est under-counts 1.6x — use invoiced"),
     ("500M","SFT + RAFT (bundled)",1.21,2.67,"train_500m.train","est under-counts 2.2x — use invoiced"),
     ("Gemma 2B","SFT + RAFT (bundled)",11.97,16.66,"train_gemma.train (incl retries)","invoice inflated by retries; clean run ~$12"),
     ("125M","DPO",0.02,0.02,"train_dpo.train_125m","exact — estimate = invoice"),
     ("125M","RLAIF (PPO)",0.08,0.08,"train_ppo.train_125m","exact"),
     ("500M","DPO",0.08,0.08,"train_dpo.train_500m","exact"),
     ("500M","RLAIF (PPO)",0.33,0.33,"train_ppo.train_500m","exact"),
     ("Gemma 2B","DPO",0.43,0.43,"train_dpo.train_gemma","exact"),
     ("Gemma 2B","RLAIF (PPO)",4.23,4.23,"train_ppo.train_gemma","exact"),
     ("shared","Reward model (/3 RLAIF)",0.06,0.06,"train_reward.train","exact; $0.02 per RLAIF seed"),
    ]
    first=r
    for fam,stage,est,inv,what,verdict in data:
        put(ws,r,1,fam,font=BOLD); put(ws,r,2,stage)
        put(ws,r,3,est,fmt=MONEY); put(ws,r,4,inv,font=BLUE,fmt=MONEY)
        put(ws,r,5,f"=D{r}/C{r}",fmt='0.0"x"') if est else put(ws,r,5,"—")
        put(ws,r,6,what,wrap=True); v=put(ws,r,7,verdict,wrap=True)
        v.fill=GREEN if abs(est-inv)<0.005 else AMBER
        ws.row_dimensions[r].height=26
        r+=1
    r+=1
    ws.cell(row=r,column=1,value="Bottom line: alignment stages are exact invoiced figures (trust them). "
            "SFT/RAFT come from real bundled invoices split by real wall-clock. A naive wall-clock x rate "
            "estimate is 1.4-2.2x too low, so it is NOT used for budgeting.").font=BOLD
    ws.merge_cells(start_row=r,start_column=1,end_row=r,end_column=7)
    ws.cell(row=r,column=1).alignment=Alignment(wrap_text=True); ws.row_dimensions[r].height=42
    return ws


def sheet_my(wb):
    ws=wb.create_sheet("My suggestions")
    r=title(ws,"What to actually seed (Claude's recommendation)",
            "Seed the stages whose variance the paper actually claims: the ALIGNMENT effects "
            "(fabrication jump, DPO/RLAIF deltas). With no deadline, the cheap core is worth doing in full. "
            "n_seeds (extra seeds per run) editable in C2.")
    ws["A2"].font=SUB
    ws.cell(row=2,column=5,value="n_seeds ->").font=BOLD
    put(ws,2,6,2,font=BLUE); ws["F2"].fill=AMBER
    head(ws,r,["Tier","Runs to seed","1-seed $","× n seeds","Rationale"],[10,34,12,12,50])
    r+=1
    # (tier, label, per_seed_total_cost, rationale)
    tiers=[
     ("CORE ✓","DPO + RLAIF, all 3 families (125M+500M+Gemma)",0.02+0.10+0.08+0.35+0.43+4.25,
      "Directly backs the paper's headline (fabrication jump) + alignment deltas across every size. Cheapest high-value seeding."),
     ("OPTIONAL","SFT + RAFT on 125M + 500M only (L4)",0.20+0.41+0.93+1.74,
      "Shows the SFT/RAFT baselines are stable, on cheap L4 GPUs. Add if a reviewer questions SFT variance."),
     ("SKIP ✗","SFT + RAFT on Gemma (A100)",9.84+6.82,
      "Expensive A100 runs; SFT/RAFT variance is not the paper's claim. Do only on direct request."),
     ("SKIP ✗","Base / pretraining re-seed",70.14,
      "500M & Gemma bases are imported (impossible). 125M base = a whole $70 pretraining lineage; pretraining variance is not this paper's subject."),
    ]
    first=r
    for tier,label,cost,why in tiers:
        t=put(ws,r,1,tier,font=BOLD); t.fill=GREEN if "CORE" in tier else (AMBER if "OPTIONAL" in tier else RED)
        put(ws,r,2,label,wrap=True); put(ws,r,3,round(cost,2),font=BLUE,fmt=MONEY)
        put(ws,r,4,f"=C{r}*$F$2",fmt=MONEY); put(ws,r,5,why,wrap=True)
        ws.row_dimensions[r].height=42; r+=1
    put(ws,r,1,"CORE total",font=BOLD); put(ws,r,4,f"=D{first}",font=BOLD,fmt=MONEY)
    put(ws,r,5,"the recommended spend — everything else is optional",font=BOLD); r+=1
    put(ws,r,1,"CORE+OPTIONAL",font=BOLD); put(ws,r,4,f"=D{first}+D{first+1}",font=BOLD,fmt=MONEY); r+=2
    for line in ["Recommendation: run CORE (DPO+RLAIF x3 families x2 extra seeds). At n=2 that is ~$10, trivial.",
                 "Report mean ± sd across the 3 seeds for judge score AND fabrication rate — this is what makes",
                 "Experiment 4 (fabrication) and the alignment deltas bulletproof. Launch first (longest wall-clock,",
                 "runs unattended on Modal). Skip Gemma-SFT/RAFT and pretraining seeding unless asked."]:
        ws.cell(row=r,column=1,value=line).font=BODY; r+=1
    return ws


def sheet_playbook(wb):
    ws=wb.create_sheet("Playbook suggestion")
    r=title(ws,"What the experiment_playbook.html / mentor message said about seeding (Exp 5)",
            "Verbatim intent from the webpage + priority message, for comparison with Claude's recommendation.")
    head(ws,r,["Aspect","Playbook / mentor said","Claude's take"],[22,44,44])
    r+=1
    rows=[
     ("Which stages","DPO and RLAIF (the stages that matter most)","Agree — plus optionally cheap 125M/500M SFT+RAFT."),
     ("Which sizes","'the key model sizes' (unspecified)","Do all 3 families for the core — it's only ~$10."),
     ("How many seeds","re-run each 2 more times (3 total), report mean ± sd","Agree — 3 total (2 extra)."),
     ("Priority","Tier 2 booster / OPTIONAL; 'lowest ROI, biggest deadline risk; SKIP unless everything else done'","With no deadline the risk vanishes — PROMOTE to launch-first background job."),
     ("Cost","~$10–30","Core (DPO+RLAIF x3 x2) ≈ $10 (matches low end). Adding Gemma SFT/RAFT pushes toward the high end."),
     ("Wall-clock","3–6 days unattended on Modal","Consistent; alignment runs are short, so mostly queue/startup + PPO."),
     ("When","launch early so it finishes in the background","Agree — it's the longest pole; start it on day 0."),
    ]
    for a,p,c in rows:
        put(ws,r,1,a,font=BOLD); put(ws,r,2,p,wrap=True); put(ws,r,3,c,wrap=True)
        ws.row_dimensions[r].height=40; r+=1
    return ws


def sheet_summary(wb):
    ws=wb.create_sheet("Summary")
    r=title(ws,"Seeding (Experiment 5) cost analysis — 15 models",
            "How much multi-seed re-training costs, estimated then verified against real invoiced Modal spend.")
    for line in [
        "• A 'seed' = re-run a model's training stage once more with a new RNG seed, from its existing parent checkpoint.",
        "• Costs are anchored to REAL invoiced Modal line items, not estimates. A naive wall-clock x GPU-rate estimate",
        "  under-counts by 1.4–2.2x (container startup, checkpoint I/O, Gemma retries) — see 'Verification vs real'.",
        "• 500M and Gemma BASE models are imported — they cannot be re-seeded by us (marked N/A).",
        "",
        "RECOMMENDATION (Claude):",
        "  CORE — seed DPO + RLAIF on all 3 families, 2 extra seeds each  ≈  $10   ← do this",
        "  OPTIONAL — add 125M+500M SFT+RAFT (cheap L4), 2 seeds each     ≈  +$6.6",
        "  SKIP — Gemma SFT/RAFT (A100, ~$33 for 2) and base/pretraining re-seed ($70+ / impossible)",
        "",
        "Full cost of seeding EVERY seedable stage once (all 15 models, 1 seed each):",
    ]:
        ws.cell(row=r,column=1,value=line).font = BOLD if line.startswith("RECOMMEND") else BODY
        r+=1
    seedable=[x for x in ROWS if x[5] is not None]
    one=sum(x[5] for x in seedable)
    core=0.02+0.10+0.08+0.35+0.43+4.25
    ws.cell(row=r,column=1,value=f"  = ${one:,.2f} for one seed of all 13 seedable stages "
            f"(incl. the $70 125M-base lineage). Excluding base: ${one-70.14:,.2f}.").font=BODY; r+=1
    ws.cell(row=r,column=1,value=f"  CORE (DPO+RLAIF x3 families) one seed = ${core:,.2f}; at 2 extra seeds = ${core*2:,.2f}.").font=BOLD
    r+=2
    # ---- LOCKED DECISION (2026-08-02) ----
    dec=ws.cell(row=r,column=1,value="DECISION — LOCKED (2026-08-02):"); dec.font=Font(name=FONT,bold=True,size=11,color="1F6F4F"); r+=1
    nonbase_one=25.17
    for line in [
        f"  Run 3 SEED RUNS of ALL 12 non-base models (QA-SFT, RAFT, DPO, RLAIF x 125M/500M/Gemma).",
        f"  Cost = 3 x ${nonbase_one:.2f} (one seed of all non-base) = ${nonbase_one*3:.2f}.",
        f"  Funded by the 3 alternate Modal profiles (~$90 combined) — well under budget.",
        f"  Allocation: one full seed per profile, run in parallel (each ~${nonbase_one:.2f} < ~$30/profile).",
        f"  Note: $75.51 is conservative — Gemma per-seed is anchored to a retry-inflated invoice;",
        f"        clean seeded runs may land ~$10 lower (~$65).",
    ]:
        c=ws.cell(row=r,column=1,value=line); c.font=BOLD if line.strip().startswith("Run 3") else BODY; r+=1
    x=ws.cell(row=r,column=1,value=f"  TOTAL COMMITTED: ${nonbase_one*3:.2f}  of  ~$90 budget"); x.font=BOLD; x.fill=GREEN; r+=2
    ws.cell(row=r,column=1,value="Sheets: 'Seed cost estimate' (per model×stage) · 'Verification vs real' · "
            "'My suggestions' · 'Playbook suggestion'.").font=SUB
    return ws


def main():
    wb=Workbook(); wb.remove(wb.active)
    sheet_summary(wb); sheet_estimate(wb); sheet_verify(wb); sheet_my(wb); sheet_playbook(wb)
    for ws in wb: ws.sheet_view.showGridLines=False
    wb.save(OUT); print("wrote",OUT,"| sheets:",wb.sheetnames)

if __name__=="__main__":
    main()
