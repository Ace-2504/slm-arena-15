import "./globals.css";
import type { Metadata } from "next";
import DATA from "@/lib/arena-data.json";

// Read the count off the data file so this arena's metadata can never disagree with
// how many models it actually ships (13-model vs 15-model build).
const N = DATA.models.length;

export const metadata: Metadata = {
  title: `SLM Arena · ${N} models, one question, a judge with the answer key`,
  description: `Head-to-head replay of ${N} small language models on the same held-out legal/financial questions — each answer scored by a blind LLM judge that was handed the gold answer.`,
};

const NO_FLASH = `(function(){try{var t=localStorage.getItem('slm-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="parchment">
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
