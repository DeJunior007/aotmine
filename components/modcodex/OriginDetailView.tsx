"use client";

import type { Origin } from "@/lib/modcodex/types";
import { BackButton, DetailSection } from "./shared";

export function OriginDetailView({ origin, onBack }: { origin: Origin; onBack: () => void }) {
  return (
    <div>
      <BackButton onClick={onBack} />

      <h3 className="m-0 mb-1.5 text-[17px] font-semibold text-ink">{origin.name}</h3>
      <p className="m-0 mb-4 text-[12.5px] leading-[1.7] text-text/60">{origin.summary}</p>

      {origin.strengths.length > 0 && (
        <DetailSection title="Pontos fortes">
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {origin.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-[1.6] text-text/65">
                <span className="flex-none text-accent">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {origin.weaknesses.length > 0 && (
        <DetailSection title="Fraquezas">
          <div className="flex flex-col gap-2.5">
            {origin.weaknesses.map((w, i) => (
              <div key={i} className="clip-corner-sm border border-accent/14 bg-bg/50 px-3.5 py-3">
                <div className="mb-1 text-[12px] font-semibold text-ink">{w.title}</div>
                <div className="text-[11.5px] leading-[1.55] text-text/55">{w.impact}</div>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {origin.playstyle && (
        <DetailSection title="Como isso afeta sua gameplay">
          <p className="m-0 text-[12.5px] leading-[1.65] text-text/65">{origin.playstyle}</p>
        </DetailSection>
      )}

      {origin.good_for.length > 0 && (
        <DetailSection title="Boa para">
          <div className="flex flex-wrap gap-1.5">
            {origin.good_for.map((g, i) => (
              <span
                key={i}
                className="clip-corner-sm border border-accent/22 bg-accent-deep/25 px-2.5 py-1 text-[11px] text-accent"
              >
                {g}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {origin.not_recommended_for && (
        <DetailSection title="Não recomendada para">
          <p className="m-0 text-[12px] leading-[1.6] text-text/55">{origin.not_recommended_for}</p>
        </DetailSection>
      )}

      {origin.tip && (
        <DetailSection title="Dica">
          <p className="m-0 flex gap-2 text-[12.5px] leading-[1.65] text-text/65">
            <span className="flex-none text-accent/60">›</span>
            <span>{origin.tip}</span>
          </p>
        </DetailSection>
      )}

      {origin.tips.length > 0 && (
        <DetailSection title="Mais dicas">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {origin.tips.map((tip) => (
              <li key={tip.id} className="flex gap-2 text-[12.5px] leading-[1.65] text-text/65">
                <span className="flex-none text-accent/60">›</span>
                <span>{tip.body}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
}
