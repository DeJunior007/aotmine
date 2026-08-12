"use client";

import type { Mod, ModCategoryGroup, NavEntry } from "@/lib/modcodex/types";
import { Row } from "./shared";

export type SearchHit =
  | { kind: "mod"; mod: Mod; categoryLabel: string }
  | { kind: "item"; item: { slug: string; name: string; description: string | null }; mod: Mod; categoryLabel: string }
  | { kind: "tutorial"; tutorial: { slug: string; title: string; summary: string | null }; mod: Mod; categoryLabel: string }
  | { kind: "origin"; origin: { slug: string; name: string; summary: string }; mod: Mod; categoryLabel: string };

export function ModList({
  categories,
  activeTab,
  onTabChange,
  searchResults,
  onNavigate,
}: {
  categories: ModCategoryGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  searchResults: SearchHit[] | null;
  onNavigate: (entry: NavEntry) => void;
}) {
  const activeCategory = categories.find((c) => c.id === activeTab) ?? categories[0];

  return (
    <>
      {!searchResults && (
        <div className="themed-scrollbar flex gap-1.5 overflow-x-auto border-b border-accent/12 px-4.5 py-2.75">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onTabChange(cat.id)}
              className={`clip-corner-sm flex-none cursor-pointer whitespace-nowrap border px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors duration-150 ${
                cat.id === activeCategory?.id
                  ? "border-accent/50 bg-accent-deep/55 text-accent"
                  : "border-accent/14 text-text/50 hover:border-accent/30 hover:text-text/75"
              }`}
            >
              {cat.label} <span className="text-text/35">[{cat.mods.length}]</span>
            </button>
          ))}
        </div>
      )}

      <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
        {searchResults ? (
          searchResults.length === 0 ? (
            <p className="m-0 py-6 text-center text-[12px] tracking-[0.08em] text-text/40">
              Nenhum resultado encontrado.
            </p>
          ) : (
            <div className="flex flex-col">
              {searchResults.map((hit) => {
                if (hit.kind === "mod") {
                  return (
                    <Row
                      key={`mod-${hit.mod.slug}`}
                      title={hit.mod.name}
                      subtitle={hit.mod.summary}
                      tag={hit.categoryLabel}
                      onClick={() => onNavigate({ type: "mod", slug: hit.mod.slug })}
                    />
                  );
                }
                if (hit.kind === "item") {
                  return (
                    <Row
                      key={`item-${hit.item.slug}`}
                      title={hit.item.name}
                      subtitle={hit.item.description}
                      tag={`ITEM · ${hit.mod.name}`}
                      onClick={() => onNavigate({ type: "item", slug: hit.item.slug })}
                    />
                  );
                }
                if (hit.kind === "tutorial") {
                  return (
                    <Row
                      key={`tut-${hit.tutorial.slug}`}
                      title={hit.tutorial.title}
                      subtitle={hit.tutorial.summary}
                      tag={`TUTORIAL · ${hit.mod.name}`}
                      onClick={() => onNavigate({ type: "tutorial", slug: hit.tutorial.slug })}
                    />
                  );
                }
                return (
                  <Row
                    key={`origin-${hit.origin.slug}`}
                    title={hit.origin.name}
                    subtitle={hit.origin.summary}
                    tag={`ORIGIN · ${hit.mod.name}`}
                    onClick={() => onNavigate({ type: "origin", slug: hit.origin.slug })}
                  />
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col">
            {activeCategory?.mods.map((mod) => (
              <Row
                key={mod.slug}
                title={mod.name}
                subtitle={mod.summary}
                onClick={() => onNavigate({ type: "mod", slug: mod.slug })}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
