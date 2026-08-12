"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export type ModEntry = { name: string; desc?: string };
export type ModCategory = { id: string; label: string; mods: ModEntry[] };

/**
 * Botao "Ver todos os mods" + modal estilo "janela de programa": barra de
 * titulo, abas por categoria e busca global — pra achar qualquer mod rapido
 * sem precisar rolar a pagina inteira.
 */
export function ModCodexModal({
  categories,
  totalJars,
}: {
  categories: ModCategory[];
  totalJars: number;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  // so existe document/body no client — evita mismatch de hidratacao no portal
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const listedEntries = useMemo(
    () => categories.reduce((n, c) => n + c.mods.length, 0),
    [categories]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits: { categoryLabel: string; mod: ModEntry }[] = [];
    for (const cat of categories) {
      for (const mod of cat.mods) {
        if (mod.name.toLowerCase().includes(q) || mod.desc?.toLowerCase().includes(q)) {
          hits.push({ categoryLabel: cat.label, mod });
        }
      }
    }
    return hits;
  }, [query, categories]);

  const activeCategory = categories.find((c) => c.id === tab) ?? categories[0];

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="clip-corner-sm flex h-full w-full flex-col justify-center border border-dashed border-accent/24 px-4.5 py-4 text-left transition-colors duration-200 hover:border-accent/50 hover:bg-accent-deep/25"
      >
        <div className="mb-1.75 font-display text-[22px] text-accent">{"{ }"}</div>
        <div className="text-[10px] tracking-[0.14em] text-text/45">
          VER TODOS OS {totalJars} MODS →
        </div>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 px-5 py-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="clip-corner-lg relative flex max-h-[82vh] w-full max-w-[820px] flex-col overflow-hidden border border-accent/28 font-mono-ui"
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

              {/* barra de titulo, tipo janela de programa */}
              <div className="flex items-center justify-between gap-3 border-b border-accent/16 bg-bg/50 px-4.5 py-3">
                <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-accent">
                  <span className="animate-blink-cursor flex-none">&gt;_</span>
                  <span className="truncate">mod_codex.sys — {listedEntries} entradas carregadas</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="flex-none text-[13px] text-text/40 transition-colors hover:text-accent"
                >
                  ✕
                </button>
              </div>

              {/* busca global */}
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
                    placeholder="buscar um mod pelo nome…"
                    className="flex-1 border-none bg-transparent text-[13px] tracking-[0.04em] text-ink placeholder:text-text/35 outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="flex-none text-[10px] tracking-[0.1em] text-text/40 hover:text-accent"
                    >
                      LIMPAR
                    </button>
                  )}
                </div>
              </div>

              {/* abas por categoria — somem durante a busca */}
              {!searchResults && (
                <div className="flex gap-1.5 overflow-x-auto border-b border-accent/12 px-4.5 py-2.75">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTab(cat.id)}
                      className={`clip-corner-sm flex-none whitespace-nowrap border px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors duration-150 ${
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

              {/* conteudo */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
                <AnimatePresence mode="wait">
                  {searchResults ? (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col"
                    >
                      {searchResults.length === 0 ? (
                        <p className="m-0 py-6 text-center text-[12px] tracking-[0.08em] text-text/40">
                          Nenhum mod encontrado pra &ldquo;{query}&rdquo;.
                        </p>
                      ) : (
                        searchResults.map(({ categoryLabel, mod }) => (
                          <ModRow key={categoryLabel + mod.name} mod={mod} tag={categoryLabel} />
                        ))
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeCategory?.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col"
                    >
                      {activeCategory?.mods.map((mod) => (
                        <ModRow key={mod.name} mod={mod} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* barra de status */}
              <div className="animate-flicker-soft flex flex-wrap items-center justify-between gap-2 border-t border-accent/14 bg-bg/50 px-4.5 py-2.5 text-[9px] tracking-[0.14em] text-text/40">
                <span>
                  {listedEntries} ITENS LISTADOS ·{" "}
                  <span className="text-accent">{totalJars} MODS NO TOTAL</span>
                </span>
                <span>{"// FABRIC 1.21.1"}</span>
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

function ModRow({ mod, tag }: { mod: ModEntry; tag?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-accent/8 px-1 py-2.75 transition-colors duration-150 last:border-b-0 hover:bg-accent-deep/18">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{mod.name}</div>
        {mod.desc && <div className="mt-0.5 text-[11px] leading-[1.55] text-text/50">{mod.desc}</div>}
      </div>
      {tag && (
        <span className="clip-corner-sm flex-none border border-accent/18 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-accent/70 uppercase">
          {tag}
        </span>
      )}
    </div>
  );
}
