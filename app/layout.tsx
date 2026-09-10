import "./globals.css";
import type { Metadata } from "next";
import DATA from "@/lib/arena-data.json";

// Count reads from the data file, so the same layout serves the 13- and 15-model arenas.
const N = (DATA.models as unknown[]).length;

export const metadata: Metadata = {
  title: `SLM Arena · ${N} models, one question, a judge with the answer key`,
  description:
    `Head-to-head replay of ${N} small language models on the same held-out legal and financial ` +
    `questions — each answer scored 0–10 by a blind judge that was handed the gold answer.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
