"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DecryptText } from "./DecryptText";

export type ModEntry = {
  name: string;
  desc?: string;
  firstSteps?: string[];
  tips?: string[];
};
export type ModCategory = { id: string; label: string; mods: ModEntry[] };

type Selected = { mod: ModEntry; categoryLabel: string };

/**
 * Botao "Ver todos os mods" + modal estilo "janela de programa": barra de
 * titulo, abas por categoria, busca global e — ao clicar num mod — um
 * "menuzinho" de detalhe com botao voltar, primeiros passos e dicas.
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
  const [selected, setSelected] = useState<Selected | null>(null);
  const [cycle, setCycle] = useState(0);

  // remonta o DecryptText do botao de tempos em tempos — o texto "materializa"
  // nele mesmo, tipo dado chegando de outro lugar (o tal efeito teletransporte)
  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), 5200);
    return () => clearInterval(id);
  }, []);
  // so existe document/body no client — evita mismatch de hidratacao no portal
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  function close() {
    setOpen(false);
    setSelected(null);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, selected]);

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
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        className="animate-glow-pulse clip-corner-lg group relative flex w-full cursor-pointer items-center gap-5 overflow-hidden border border-accent/55 bg-linear-to-br from-accent-deep/50 via-panel/70 to-accent-deep/20 px-5.5 py-5 text-left transition-colors duration-200 hover:border-accent sm:px-7"
      >
        <span className="animate-scan pointer-events-none absolute inset-0 h-[2px] bg-linear-to-b from-accent/30 to-transparent" />

        {/* cantos de mira, tipo HUD militar */}
        <span className="animate-flicker-soft pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 border-t-2 border-l-2 border-accent/70" />
        <span className="animate-flicker-soft pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 border-t-2 border-r-2 border-accent/70" />
        <span className="animate-flicker-soft pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b-2 border-l-2 border-accent/70" />
        <span className="animate-flicker-soft pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b-2 border-r-2 border-accent/70" />

        {/* portal com aneis de pulso — o "teleporte" */}
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
            {"mod_codex.sys // acesso rápido"}
          </div>
          <DecryptText
            key={cycle}
            text={`Ver todos os ${totalJars} mods do modpack`}
            duration={650}
            className="block font-display text-[19px] leading-tight tracking-wide text-ink uppercase sm:text-[23px]"
          />
          <div className="mt-1.5 text-[11px] leading-snug text-text/50">
            RPG, exploração, construção, performance e mais — cada mod com dicas e primeiros
            passos.
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
                      <span className="truncate">
                        mod_codex.sys
                        {selected ? ` › ${selected.mod.name}` : ` — ${listedEntries} entradas carregadas`}
                      </span>
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

                  {!selected && (
                    <>
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
                              className="flex-none cursor-pointer text-[10px] tracking-[0.1em] text-text/40 hover:text-accent"
                            >
                              LIMPAR
                            </button>
                          )}
                        </div>
                      </div>

                      {/* abas por categoria — somem durante a busca */}
                      {!searchResults && (
                        <div className="themed-scrollbar flex gap-1.5 overflow-x-auto border-b border-accent/12 px-4.5 py-2.75">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setTab(cat.id)}
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
                    </>
                  )}

                  {/* conteudo */}
                  <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto px-4.5 py-3.5">
                    <AnimatePresence mode="wait">
                      {selected ? (
                        <ModDetail
                          key={`detail-${selected.mod.name}`}
                          selected={selected}
                          onBack={() => setSelected(null)}
                        />
                      ) : searchResults ? (
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
                              <ModRow
                                key={categoryLabel + mod.name}
                                mod={mod}
                                tag={categoryLabel}
                                onClick={() => setSelected({ mod, categoryLabel })}
                              />
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
                            <ModRow
                              key={mod.name}
                              mod={mod}
                              onClick={() =>
                                setSelected({ mod, categoryLabel: activeCategory.label })
                              }
                            />
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

function ModRow({
  mod,
  tag,
  onClick,
}: {
  mod: ModEntry;
  tag?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-start justify-between gap-4 border-b border-accent/8 px-1 py-2.75 text-left transition-colors duration-150 last:border-b-0 hover:bg-accent-deep/18"
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{mod.name}</div>
        {mod.desc && <div className="mt-0.5 text-[11px] leading-[1.55] text-text/50">{mod.desc}</div>}
      </div>
      <span className="flex flex-none items-center gap-2">
        {tag && (
          <span className="clip-corner-sm border border-accent/18 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-accent/70 uppercase">
            {tag}
          </span>
        )}
        <span className="text-[13px] text-text/25">›</span>
      </span>
    </button>
  );
}

function ModDetail({ selected, onBack }: { selected: Selected; onBack: () => void }) {
  const { mod, categoryLabel } = selected;
  const hasExtras = (mod.firstSteps?.length ?? 0) > 0 || (mod.tips?.length ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-3.5 flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-accent/80 uppercase transition-colors hover:text-accent"
      >
        <span aria-hidden="true">‹</span> Voltar
      </button>

      <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-[17px] font-semibold text-ink">{mod.name}</h3>
        <span className="clip-corner-sm border border-accent/22 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-accent/70 uppercase">
          {categoryLabel}
        </span>
      </div>

      {mod.desc && (
        <p className="m-0 mb-4 text-[12.5px] leading-[1.7] text-text/60">{mod.desc}</p>
      )}

      {mod.firstSteps && mod.firstSteps.length > 0 && (
        <DetailSection title="Primeiros passos">
          {mod.firstSteps.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.65] text-text/65">
              <span className="flex-none font-mono-ui text-[11px] text-accent/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </DetailSection>
      )}

      {mod.tips && mod.tips.length > 0 && (
        <DetailSection title="Dicas">
          {mod.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-[1.65] text-text/65">
              <span className="flex-none text-accent/60">›</span>
              <span>{tip}</span>
            </li>
          ))}
        </DetailSection>
      )}

      {!hasExtras && (
        <p className="m-0 text-[11px] leading-[1.6] text-text/35">
          Biblioteca de suporte — não precisa mexer nela, só faz o resto do modpack funcionar por
          baixo dos panos.
        </p>
      )}
    </motion.div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-accent/70 uppercase">
        {title}
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">{children}</ul>
    </div>
  );
}
