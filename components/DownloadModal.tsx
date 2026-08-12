"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AccessGate } from "./AccessGate";

/**
 * Botao "Baixar agora" + modal com as 3 opcoes de download.
 * Respeita o mesmo gate de senha do resto do site: se `unlocked` for
 * false, o modal mostra o AccessGate em vez dos links — e assim que a
 * senha e aceita (router.refresh() dentro do AccessGate atualiza o cookie
 * lido no server), o proprio modal troca pro conteudo liberado sem fechar.
 */
export function DownloadModal({
  unlocked,
  downloadUrl,
  installerWindowsUrl,
  installerLinuxUrl,
  downloadSizeLabel,
  triggerLabel = "↓ Baixar agora",
  triggerClassName = "clip-corner-btn inline-flex cursor-pointer items-center gap-2.5 bg-linear-to-b from-accent to-accent-mid px-5.5 py-3.75 text-[13px] font-semibold tracking-[0.16em] text-[#08120a] uppercase transition-[box-shadow,transform] duration-250 hover:-translate-y-px hover:shadow-[0_0_38px_rgba(127,214,138,0.42)]",
}: {
  unlocked: boolean;
  downloadUrl: string;
  installerWindowsUrl: string;
  installerLinuxUrl: string;
  /** ex: "466 MB" — mostrado como hint da opcao de zip cru. Sem isso, some o hint de tamanho. */
  downloadSizeLabel?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.98 }}
        className={triggerClassName}
      >
        {triggerLabel}
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-5 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="clip-corner-lg relative w-full max-w-[460px] overflow-hidden border border-accent/26 p-6 font-mono-ui sm:p-7"
                style={{
                  background: "linear-gradient(160deg, rgba(17,21,18,.97), rgba(9,11,10,.98))",
                }}
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="animate-scan pointer-events-none absolute inset-0 h-[2px] bg-linear-to-b from-accent/10 to-transparent" />

                <div className="mb-5 flex items-center justify-between gap-2.5">
                  <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-accent">
                    <span className="animate-blink-cursor">&gt;_</span> DOWNLOAD
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fechar"
                    className="cursor-pointer text-[13px] text-text/40 transition-colors hover:text-accent"
                  >
                    ✕
                  </button>
                </div>

                {unlocked ? (
                  <motion.div
                    key="unlocked"
                    initial={{ opacity: 0, filter: "brightness(2)" }}
                    animate={{ opacity: 1, filter: "brightness(1)" }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col gap-2.5"
                  >
                    <p className="m-0 mb-1 text-[11px] leading-relaxed tracking-[0.08em] text-text/45">
                      Escolha como quer instalar:
                    </p>
                    <ModalOption
                      href={installerWindowsUrl}
                      label="Instalador Windows"
                      hint="Automático · .exe"
                      featured
                    />
                    <ModalOption
                      href={installerLinuxUrl}
                      label="Instalador Linux"
                      hint="Automático · binário"
                      featured
                    />
                    <ModalOption
                      href={downloadUrl}
                      label="Modpack (.zip)"
                      hint={downloadSizeLabel ? `Manual · ${downloadSizeLabel}` : "Manual"}
                    />
                    <p className="m-0 mt-1 text-[10px] leading-relaxed tracking-[0.08em] text-text/32">
                      Não sabe qual escolher? O instalador é o caminho fácil — baixa tudo sozinho.
                    </p>
                  </motion.div>
                ) : (
                  <AccessGate />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function ModalOption({
  href,
  label,
  hint,
  featured = false,
}: {
  href: string;
  label: string;
  hint: string;
  featured?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`clip-corner-btn flex items-center justify-between gap-3 border px-4 py-3.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-[box-shadow,transform,background] duration-200 hover:-translate-y-px ${
        featured
          ? "border-accent/40 bg-accent-deep/40 text-accent hover:bg-accent-deep/65 hover:shadow-[0_0_28px_rgba(127,214,138,0.28)]"
          : "border-accent/16 bg-bg/60 text-text/75 hover:border-accent/35 hover:text-ink"
      }`}
    >
      <span>{label}</span>
      <span className="text-[9px] font-normal tracking-[0.08em] text-text/35 normal-case">
        {hint}
      </span>
    </a>
  );
}
