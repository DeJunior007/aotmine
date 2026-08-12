"use client";

import type { NavEntry, Tutorial } from "@/lib/modcodex/types";
import { BackButton } from "./shared";
import { RichText } from "./RichText";

export function TutorialView({
  tutorial,
  onBack,
  onNavigate,
}: {
  tutorial: Tutorial;
  onBack: () => void;
  onNavigate: (entry: NavEntry) => void;
}) {
  return (
    <div>
      <BackButton onClick={onBack} />

      <h3 className="m-0 mb-1.5 text-[17px] font-semibold text-ink">{tutorial.title}</h3>
      {tutorial.summary && (
        <p className="m-0 mb-4 text-[12.5px] leading-[1.7] text-text/60">{tutorial.summary}</p>
      )}

      <div className="flex flex-col gap-3.5">
        {tutorial.tutorial_steps.map((step) => (
          <div key={step.id} className="clip-corner-sm border border-accent/16 bg-bg/50 px-4 py-3.5">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="clip-corner-sm border border-accent/25 px-2 py-1 font-mono-ui text-[11px] text-accent">
                {String(step.step_number).padStart(2, "0")}
              </span>
              <div className="text-[13px] font-semibold text-ink">{step.title}</div>
            </div>
            <RichText
              text={step.body}
              onNavigate={onNavigate}
              className="mb-2 text-[12.5px] leading-[1.65] text-text/65"
            />
            {step.tutorial_step_items.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {step.tutorial_step_items.map((si) => {
                  const label = si.items?.name ?? si.item_name_fallback ?? "?";
                  const content = (
                    <>
                      {si.quantity > 1 && <span className="text-accent/60">{si.quantity}×</span>} {label}
                    </>
                  );
                  return si.items ? (
                    <button
                      key={si.id}
                      type="button"
                      onClick={() => onNavigate({ type: "item", slug: si.items!.slug })}
                      className="clip-corner-sm cursor-pointer border border-accent/30 bg-accent-deep/25 px-2 py-1 text-[11px] text-accent hover:border-accent/60"
                    >
                      {content}
                    </button>
                  ) : (
                    <span
                      key={si.id}
                      className="clip-corner-sm border border-accent/14 bg-panel/60 px-2 py-1 text-[11px] text-text/60"
                    >
                      {content}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
