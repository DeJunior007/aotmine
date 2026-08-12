"use client";

import type { NavEntry, Recipe } from "@/lib/modcodex/types";

export function RecipeCard({
  recipe,
  onNavigate,
}: {
  recipe: Recipe;
  onNavigate: (entry: NavEntry) => void;
}) {
  return (
    <div className="clip-corner-sm border border-accent/14 bg-bg/50 px-3.5 py-3">
      {(recipe.station || recipe.name) && (
        <div className="mb-2 flex items-center justify-between gap-2 text-[9px] font-semibold tracking-[0.12em] text-accent/60 uppercase">
          <span>{recipe.name}</span>
          {recipe.station && (
            <span className="clip-corner-sm border border-accent/18 px-1.5 py-0.5 text-accent/70">
              {recipe.station}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        {recipe.recipe_ingredients.map((ing, i) => (
          <span key={ing.id} className="flex items-center gap-2">
            {i > 0 && <span className="text-text/30">+</span>}
            <IngredientTag
              qty={ing.quantity}
              name={ing.items?.name ?? ing.item_name_fallback ?? "?"}
              onClick={
                ing.items ? () => onNavigate({ type: "item", slug: ing.items!.slug }) : undefined
              }
            />
          </span>
        ))}
        <span className="text-accent/50">→</span>
        <IngredientTag
          qty={recipe.output_qty}
          name={recipe.output_item?.name ?? "?"}
          featured
          onClick={
            recipe.output_item
              ? () => onNavigate({ type: "item", slug: recipe.output_item!.slug })
              : undefined
          }
        />
      </div>
      {recipe.notes && (
        <div className="mt-2 text-[11px] leading-[1.5] text-text/45">{recipe.notes}</div>
      )}
    </div>
  );
}

function IngredientTag({
  qty,
  name,
  onClick,
  featured = false,
}: {
  qty: number;
  name: string;
  onClick?: () => void;
  featured?: boolean;
}) {
  const content = (
    <>
      {qty > 1 && <span className="text-accent/60">{qty}×</span>} {name}
    </>
  );
  const cls = `clip-corner-sm border px-2 py-1 text-[11px] ${
    featured
      ? "border-accent/40 bg-accent-deep/35 text-accent"
      : "border-accent/16 bg-panel/60 text-text/70"
  }`;

  if (!onClick) return <span className={cls}>{content}</span>;
  return (
    <button type="button" onClick={onClick} className={`cursor-pointer ${cls} hover:border-accent/60`}>
      {content}
    </button>
  );
}
