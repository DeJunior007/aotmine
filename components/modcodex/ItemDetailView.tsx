"use client";

import type { Item, Mod, NavEntry, Recipe } from "@/lib/modcodex/types";
import { BackButton, DetailSection, Pill } from "./shared";
import { RichText } from "./RichText";
import { RecipeCard } from "./RecipeCard";

const LOCATION_FIELDS: { key: keyof NonNullable<Item["location"]>; label: string }[] = [
  { key: "dimension", label: "Dimensão" },
  { key: "biome", label: "Bioma" },
  { key: "height", label: "Altura" },
  { key: "tool", label: "Ferramenta" },
  { key: "method", label: "Método" },
  { key: "alternative", label: "Alternativa" },
];

export function ItemDetailView({
  item,
  mod,
  usedIn,
  onBack,
  onNavigate,
}: {
  item: Item;
  mod: Mod | null;
  usedIn: Recipe[];
  onBack: () => void;
  onNavigate: (entry: NavEntry) => void;
}) {
  return (
    <div>
      <BackButton onClick={onBack} />

      <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-[17px] font-semibold text-ink">{item.name}</h3>
        <Pill>{item.item_type}</Pill>
        {item.rarity && <Pill>{item.rarity}</Pill>}
      </div>

      {mod && (
        <button
          type="button"
          onClick={() => onNavigate({ type: "mod", slug: mod.slug })}
          className="mb-4 cursor-pointer text-[11px] tracking-[0.08em] text-accent/70 hover:text-accent"
        >
          de {mod.name} →
        </button>
      )}

      {item.description && (
        <RichText
          text={item.description}
          onNavigate={onNavigate}
          className="mb-4 text-[12.5px] leading-[1.7] text-text/65"
        />
      )}

      {item.location && (
        <DetailSection title="Onde encontrar">
          <div className="clip-corner-sm grid grid-cols-1 gap-x-4 gap-y-2 border border-accent/14 bg-bg/50 px-3.5 py-3 sm:grid-cols-2">
            {LOCATION_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <div className="text-[9px] font-semibold tracking-[0.12em] text-accent/60 uppercase">
                  {label}
                </div>
                <div className="text-[12px] text-text/70">
                  {item.location?.[key] || <span className="text-text/35">Não confirmado</span>}
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {item.tool_required && (
        <DetailSection title="Ferramenta necessária">
          <div className="text-[12.5px] text-text/65">{item.tool_required}</div>
        </DetailSection>
      )}

      {usedIn.length > 0 && (
        <DetailSection title="Usado em">
          <div className="flex flex-col gap-2">
            {usedIn.map((r) => (
              <RecipeCard key={r.id} recipe={r} onNavigate={onNavigate} />
            ))}
          </div>
        </DetailSection>
      )}

      {item.notes && (
        <DetailSection title="Notas">
          <div className="text-[12px] leading-[1.6] text-text/55">{item.notes}</div>
        </DetailSection>
      )}
    </div>
  );
}
