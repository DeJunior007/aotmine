"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DecryptText } from "../DecryptText";
import type { Item, Mod, ModCategoryGroup, NavEntry, Recipe } from "@/lib/modcodex/types";
import { ModList, type SearchHit } from "./ModList";
import { ModDetailView } from "./ModDetailView";
import { ItemDetailView } from "./ItemDetailView";
import { OriginDetailView } from "./OriginDetailView";
import { TutorialView } from "./TutorialView";

/**
 * Botao "Ver todos os mods" (portal com aneis de teleporte) + modal estilo
 * "janela de programa" — agora uma wiki de verdade: lista de mods → detalhe
 * do mod → item/receita/tutorial/origin, com pilha de navegacao (nao so um
 * toggle de 2 niveis) e busca cruzando mods, itens, tutoriais e origins.
 */
export function ModCodexModal({ categories }: { categories: ModCategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<NavEntry[]>([{ type: "list" }]);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), 5200);
    return () => clearInterval(id);
  }, []);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const totalMods = useMemo(
    () => categories.reduce((n, c) => n + c.mods.length, 0),
    [categories]
  );

  // indices pra navegacao/busca sem precisar varrer tudo de novo a cada clique
  const index = useMemo(() => {
    const modBySlug = new Map<string, { mod: Mod; categoryLabel: string }>();
    const itemBySlug = new Map<string, { item: Item; mod: Mod }>();
    const tutorialBySlug = new Map<string, { tutorial: Mod["tutorials"][number]; mod: Mod }>();
    const originBySlug = new Map<string, { origin: Mod["origins"][number]; mod: Mod }>();
    const recipesByIngredientItemId = new Map<string, Recipe[]>();

    for (const cat of categories) {
      for (const mod of cat.mods) {
        modBySlug.set(mod.slug, { mod, categoryLabel: cat.label });
        for (const item of mod.items) itemBySlug.set(item.slug, { item, mod });
        for (const t of mod.tutorials) tutorialBySlug.set(t.slug, { tutorial: t, mod });
        for (const o of mod.origins) originBySlug.set(o.slug, { origin: o, mod });
        for (const r of mod.recipes) {
          for (const ing of r.recipe_ingredients) {
            if (!ing.item_id) continue;
            const list = recipesByIngredientItemId.get(ing.item_id);
            if (list) list.push(r);
            else recipesByIngredientItemId.set(ing.item_id, [r]);
          }
        }
      }
    }
    return { modBySlug, itemBySlug, tutorialBySlug, originBySlug, recipesByIngredientItemId };
  }, [categories]);

  const searchResults: SearchHit[] | null = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits: SearchHit[] = [];
    for (const cat of categories) {
      for (const mod of cat.mods) {
        if (mod.name.toLowerCase().includes(q) || mod.summary?.toLowerCase().includes(q)) {
          hits.push({ kind: "mod", mod, categoryLabel: cat.label });
        }
        for (const item of mod.items) {
          if (item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)) {
            hits.push({ kind: "item", item, mod, categoryLabel: cat.label });
          }
        }
        for (const t of mod.tutorials) {
          if (t.title.toLowerCase().includes(q) || t.summary?.toLowerCase().includes(q)) {
            hits.push({ kind: "tutorial", tutorial: t, mod, categoryLabel: cat.label });
          }
        }
        for (const o of mod.origins) {
          if (o.name.toLowerCase().includes(q) || o.summary.toLowerCase().includes(q)) {
            hits.push({ kind: "origin", origin: o, mod, categoryLabel: cat.label });
          }
        }
      }
    }
    return hits;
  }, [query, categories]);

  function close() {
    setOpen(false);
    setStack([{ type: "list" }]);
    setQuery("");
  }

  function push(entry: NavEntry) {
    setQuery("");
    setStack((s) => [...s, entry]);
  }

  function pop() {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (stack.length > 1) pop();
      else close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, stack.length]);

  const current = stack[stack.length - 1];

  let titleSuffix = ` — ${totalMods} mods carregados`;
  if (current.type === "mod") titleSuffix = ` › ${index.modBySlug.get(current.slug)?.mod.name ?? ""}`;
  if (current.type === "item") titleSuffix = ` › ${index.itemBySlug.get(current.slug)?.item.name ?? ""}`;
  if (current.type === "tutorial") titleSuffix = ` › ${index.tutorialBySlug.get(current.slug)?.tutorial.title ?? ""}`;
  if (current.type === "origin") titleSuffix = ` › ${index.originBySlug.get(current.slug)?.origin.name ?? ""}`;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        className="animate-glow-pulse clip-corner-lg group relative flex w-full cursor-pointer items-center gap-5 overflow-hidden border border-accent/55 bg-linear-to-br from-accent-deep/50 via-panel/70 to-accent-deep/20 px-5.5 py-5 text-left transition-colors duration-200 hover:border-accent sm:px-7"
      >
        <span className="animate-scan pointer-events-none absolute inset-0 h-[2px] bg-linear-to-b from-accent/30 to-transparent" />
        <span className="animate-flicker-soft pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 border-t-2 border-l-2 border-accent/70" />
        <span className="animate-flicker-soft pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 border-t-2 border-r-2 border-accent/70" />
        <span className="animate-flicker-soft pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b-2 border-l-2 border-accent/70" />
        <span className="animate-flicker-soft pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b-2 border-r-2 border-accent/70" />

        <div className="animate-float-soft relative flex h-14 w-14 flex-none items-center justify-center sm:h-16 sm:w-16">
          <span className="animate-portal-ping absolute inset-0 rounded-full border border-accent/60" />
          <span
            className="animate-portal-ping absolute inset-0 rounded-full border border-accent/60"
            style={{ animationDelay: "1.3s" }}
          />
          <span className="clip-corner-sm relative z-10 flex h-10 w-10 items-center justify-center border border-accent/50 bg-bg/70 font-display text-[18px] text-accent sm:h-11 sm:w-11 sm:text-[20px]">
            {"{ }"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[9px] font-semibold tracking-[0.22em] text-accent/60 uppercase">
            {"mod_codex.sys // wiki interativa"}
          </div>
          <DecryptText
            key={cycle}
            text={`Ver todos os ${totalMods} mods do modpack`}
            duration={650}
            className="block font-display text-[19px] leading-tight tracking-wide text-ink uppercase sm:text-[23px]"
          />
          <div className="mt-1.5 text-[11px] leading-snug text-text/50">
            Itens, receitas, tutoriais e Origins — tudo conectado e clicável.
          </div>
        </div>

        <span className="flex-none font-display text-[26px] text-accent transition-transform duration-200 group-hover:translate-x-1.5">
          →
        </span>
      </motion.button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 px-5 py-10 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={close}
              >
                <motion.div
                  className="clip-corner-lg relative flex max-h-[85vh] w-full max-w-[860px] flex-col overflow-hidden border border-accent/28 font-mono-ui"
                  style={{
                    background: "linear-gradient(160deg, rgba(15,19,16,.98), rgba(8,10,9,.99))",
                  }}
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="animate-scan pointer-events-none absolute inset-0 h-[2px] bg-linear-to-b from-accent/8 to-transparent" />

                  <div className="flex items-center justify-between gap-3 border-b border-accent/16 bg-bg/50 px-4.5 py-3">
                    <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-accent">
                      <span className="animate-blink-cursor flex-none">&gt;_</span>
                      <span className="truncate">mod_codex.sys{titleSuffix}</span>
                    </span>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Fechar"
                      className="flex-none cursor-pointer text-[13px] text-text/40 transition-colors hover:text-accent"
                    >
                      ✕
                    </button>
                  </div>

                  {current.type === "list" && (
                    <div className="border-b border-accent/12 px-4.5 py-3">
                      <div className="clip-corner-btn flex items-center gap-2.5 border border-accent/22 bg-bg/70 px-3.5 py-2.75">
                        <span className="animate-blink-cursor text-[12px] text-accent-dim">&gt;_</span>
                        <input
                          type="text"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="buscar mod, item, tutorial, origin…"
                          className="flex-1 border-none bg-transparent text-[13px] tracking-[0.04em] text-ink placeholder:text-text/35 outline-none"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="flex-none cursor-pointer text-[10px] tracking-[0.1em] text-text/40 hover:text-accent"
                          >
                            LIMPAR
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${current.type}-${current.type === "list" ? "list" : current.slug}`}
                      initial={{ opacity: 0, x: current.type === "list" ? -14 : 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex min-h-0 flex-1 flex-col"
                    >
                      {current.type === "list" && (
                        <ModList
                          categories={categories}
                          activeTab={tab}
                          onTabChange={setTab}
                          searchResults={searchResults}
                          onNavigate={push}
                        />
                      )}
                      {current.type === "mod" && (
                        <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
                          {(() => {
                            const found = index.modBySlug.get(current.slug);
                            if (!found) return <NotFound onBack={pop} />;
                            return (
                              <ModDetailView
                                mod={found.mod}
                                categoryLabel={found.categoryLabel}
                                onBack={pop}
                                onNavigate={push}
                              />
                            );
                          })()}
                        </div>
                      )}
                      {current.type === "item" && (
                        <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
                          {(() => {
                            const found = index.itemBySlug.get(current.slug);
                            if (!found) return <NotFound onBack={pop} />;
                            const usedIn = index.recipesByIngredientItemId.get(found.item.id) ?? [];
                            return (
                              <ItemDetailView
                                item={found.item}
                                mod={found.mod}
                                usedIn={usedIn}
                                onBack={pop}
                                onNavigate={push}
                              />
                            );
                          })()}
                        </div>
                      )}
                      {current.type === "tutorial" && (
                        <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
                          {(() => {
                            const found = index.tutorialBySlug.get(current.slug);
                            if (!found) return <NotFound onBack={pop} />;
                            return (
                              <TutorialView tutorial={found.tutorial} onBack={pop} onNavigate={push} />
                            );
                          })()}
                        </div>
                      )}
                      {current.type === "origin" && (
                        <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
                          {(() => {
                            const found = index.originBySlug.get(current.slug);
                            if (!found) return <NotFound onBack={pop} />;
                            return <OriginDetailView origin={found.origin} onBack={pop} />;
                          })()}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="animate-flicker-soft flex flex-wrap items-center justify-between gap-2 border-t border-accent/14 bg-bg/50 px-4.5 py-2.5 text-[9px] tracking-[0.14em] text-text/40">
                    <span>
                      <span className="text-accent">{totalMods} MODS</span> ·{" "}
                      {index.itemBySlug.size} ITENS · {index.tutorialBySlug.size} TUTORIAIS ·{" "}
                      {index.originBySlug.size} ORIGINS
                    </span>
                    <span>{"// FORGE 1.20.1"}</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3.5 flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-accent/80 uppercase hover:text-accent"
      >
        <span aria-hidden="true">‹</span> Voltar
      </button>
      <p className="m-0 text-[12px] text-text/40">Não encontrado.</p>
    </div>
  );
}
