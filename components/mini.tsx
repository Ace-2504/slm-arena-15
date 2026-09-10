"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* ============================================================================
   Shared toolkit for the minimal experiment-box design.
   - Zoom lightbox (one shared modal per page, like the skill's zoomable())
   - MiniBox / tab contract (data-attribute pattern -> React state)
   - Inline-SVG chart helpers (ranked horizontal bars, paired grounded/fabricated,
     the rubric stack) drawn to the skill's geometry.
   Semantic palette is law: green #2f6b4f = better/best/grounded, tan #c7ba98 =
   baseline/weaker, olive #94823f = warning/fabrication/cost annotation.
============================================================================= */

export const GREEN = "#2f6b4f";
export const GREEN_DK = "#2a5c44";
export const TAN = "#c7ba98";
export const OLIVE = "#94823f";

/* ---- Zoom lightbox ------------------------------------------------------ */
type ZoomFn = (html: string, cap: string) => void;
const ZoomCtx = createContext<ZoomFn>(() => {});
export const useZoom = () => useContext(ZoomCtx);

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [z, setZ] = useState<{ html: string; cap: string } | null>(null);
  const open = useCallback<ZoomFn>((html, cap) => setZ({ html, cap }), []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setZ(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <ZoomCtx.Provider value={open}>
      {children}
      {z && (
        <div className="zoom-modal" onClick={(e) => { if (e.target === e.currentTarget) setZ(null); }}>
          <div className="zoom-card">
            <button className="zoom-close" aria-label="Close" onClick={() => setZ(null)}>×</button>
            <div className="zoom-body" dangerouslySetInnerHTML={{ __html: z.html }} />
            <div className="zoom-cap">{z.cap}</div>
          </div>
        </div>
      )}
    </ZoomCtx.Provider>
  );
}

/** Wrap any chart/flowchart/table; clones its <svg>/<table> into the shared modal. */
export function Zoomable({ caption, className, children }: {
  caption: string; className?: string; children: React.ReactNode;
}) {
  const open = useZoom();
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`${className ?? ""} zoomable`} title="Click to zoom"
      onClick={() => {
        const el = ref.current; if (!el) return;
        const svg = el.querySelector("svg"); const tbl = el.querySelector("table");
        const inner = svg ? svg.outerHTML : tbl ? tbl.outerHTML : null;
        if (inner) open(inner, caption);
      }}>
      {children}
    </div>
  );
}

/* ---- MiniBox + the tab contract ---------------------------------------- */
export type TabDef = { id: string; label: string; panel: React.ReactNode };

export function MiniBox({ eyebrow, status, desc, tabs, footer }: {
  eyebrow: React.ReactNode;
  status?: React.ReactNode;
  desc: React.ReactNode;
  tabs: TabDef[];
  footer?: React.ReactNode;
}) {
  const [sel, setSel] = useState(tabs[0]?.id);
  return (
    <div className="mini-box">
      {status ? (
        <div className="mini-top"><div className="mini-eyebrow">{eyebrow}</div>{status}</div>
      ) : (
        <div className="mini-eyebrow">{eyebrow}</div>
      )}
      <p className="desc">{desc}</p>
      <div className="mtabs">
        {tabs.map((t) => (
          <button key={t.id} className={"mtab" + (sel === t.id ? " sel" : "")} onClick={() => setSel(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} className="mtp" hidden={sel !== t.id}>{t.panel}</div>
      ))}
      {footer}
    </div>
  );
}

/* ---- Inline-SVG charts (skill geometry) -------------------------------- */

export type HBarRow = { label: string; value: number; color: string; valueLabel?: string };

/** Ranked horizontal bar chart. Rows are drawn in the order given (pre-sort them). */
export function HBars({ rows, max, unit = "" }: { rows: HBarRow[]; max?: number; unit?: string }) {
  const W = 700, labelW = 172, rightW = 78, rowH = 24, padTop = 8, padBot = 6;
  const barMax = W - labelW - rightW;
  const H = padTop + padBot + rows.length * rowH;
  const top = (max ?? Math.max(...rows.map((r) => r.value))) || 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img">
      {rows.map((r, i) => {
        const y = padTop + i * rowH;
        const barH = 13, barY = y + (rowH - barH) / 2;
        const w = Math.max(2, (r.value / top) * barMax);
        return (
          <g key={i}>
            <text x={labelW - 8} y={barY + 10} textAnchor="end" fontSize="12"
              fontFamily="Figtree, sans-serif" fill="#334155">{r.label}</text>
            <rect x={labelW} y={barY} width={barMax} height={barH} rx="7" fill="#f8f7f3" />
            <rect x={labelW} y={barY} width={w} height={barH} rx="7" fill={r.color} />
            <text x={labelW + barMax + 6} y={barY + 10} textAnchor="start" fontSize="11"
              fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#1e293b">
              {r.valueLabel ?? r.value.toFixed(2)}{unit}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Paired grounded (green) vs fabrication (olive) bars per model, 0–100%. */
export function GroundedFabBars({ rows }: {
  rows: { label: string; grounded: number; fabrication: number }[];
}) {
  const W = 700, labelW = 172, rightW = 60, rowH = 34, padTop = 8, padBot = 6;
  const barMax = W - labelW - rightW;
  const H = padTop + padBot + rows.length * rowH;
  const scale = (v: number) => Math.max(1.5, (v / 100) * barMax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img">
      {rows.map((r, i) => {
        const y = padTop + i * rowH;
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + 18} textAnchor="end" fontSize="12"
              fontFamily="Figtree, sans-serif" fill="#334155">{r.label}</text>
            {/* grounded (green) */}
            <rect x={labelW} y={y + 4} width={barMax} height={9} rx="4.5" fill="#f8f7f3" />
            <rect x={labelW} y={y + 4} width={scale(r.grounded)} height={9} rx="4.5" fill={GREEN} />
            <text x={labelW + barMax + 5} y={y + 12} fontSize="10.5"
              fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#2f6b4f">{r.grounded.toFixed(0)}%</text>
            {/* fabrication (olive) */}
            <rect x={labelW} y={y + 18} width={barMax} height={9} rx="4.5" fill="#f8f7f3" />
            <rect x={labelW} y={y + 18} width={scale(r.fabrication)} height={9} rx="4.5" fill={OLIVE} />
            <text x={labelW + barMax + 5} y={y + 26} fontSize="10.5"
              fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#94823f">{r.fabrication.toFixed(0)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

/** The 0–10 rubric as one stacked segmented bar. */
export function RubricBar() {
  const segs = [
    { name: "Correctness", pts: 5, color: GREEN },
    { name: "Completeness", pts: 2, color: TAN },
    { name: "Groundedness", pts: 2, color: GREEN_DK },
    { name: "Clarity", pts: 1, color: OLIVE },
  ];
  const W = 700, x0 = 12, barMax = W - 24, barY = 34, barH = 46, total = 10;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${W} 150`} xmlns="http://www.w3.org/2000/svg" role="img">
      <text x={x0} y={20} fontSize="12.5" fontFamily="Figtree, sans-serif" fill="#64748b">
        One answer, four sub-scores, ten points total</text>
      {segs.map((s, i) => {
        const w = (s.pts / total) * barMax;
        const x = x0 + acc;
        acc += w;
        const light = s.color === TAN;
        return (
          <g key={i}>
            <rect x={x} y={barY} width={w - 2} height={barH} rx="6" fill={s.color} />
            <text x={x + (w - 2) / 2} y={barY + barH / 2 + 2} textAnchor="middle" fontSize="18"
              fontFamily="JetBrains Mono, monospace" fontWeight="800" fill={light ? "#4a4636" : "#fff"}>{s.pts}</text>
            <text x={x + (w - 2) / 2} y={barY + barH + 20} textAnchor="middle" fontSize="12.5"
              fontFamily="Figtree, sans-serif" fontWeight="700" fill="#334155">{s.name}</text>
            <text x={x + (w - 2) / 2} y={barY + barH + 37} textAnchor="middle" fontSize="10.5"
              fontFamily="JetBrains Mono, monospace" fill="#94a3b8">{s.pts}/{total} pts</text>
          </g>
        );
      })}
    </svg>
  );
}
