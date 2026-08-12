"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SecretMod = { name: string; tag: string };

/**
 * Card "cofre" no lugar dos 3 mods em destaque — sem senha de verdade
 * nenhuma, so um cadeado decorativo. Clicou, o cadeado destranca e as
 * duas portas deslizam pros lados revelando os mods (mesmo grid-slot dos
 * outros cards, ocupa 1 linha inteira).
 */
export function SecretMods({ mods }: { mods: SecretMod[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.button
            key="locked"
            type="button"
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            className="clip-corner-md group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden border border-accent/25 bg-accent-deep/30 px-4.5 py-6 text-left transition-colors duration-200 hover:bg-accent-deep/50"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgba(127,214,138,0.05) 0px, rgba(127,214,138,0.05) 2px, transparent 2px, transparent 14px), linear-gradient(160deg, rgba(21,26,22,.9), rgba(9,11,10,.94))",
            }}
          >
            <span className="animate-scan pointer-events-none absolute inset-0 h-[2px] bg-linear-to-b from-accent/15 to-transparent" />

            <motion.span
              aria-hidden
              className="text-[22px] text-accent/80"
              animate={{ rotate: [0, -2, 2, -2, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              🔒
            </motion.span>
            <span className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold tracking-[0.24em] text-accent uppercase">
                Classificado — top secret
              </span>
              <span className="text-[10px] tracking-[0.14em] text-text/40 uppercase">
                {mods.length} arquivos trancados · clique pra destrancar
              </span>
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="unlocked"
            initial="closed"
            animate="open"
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {mods.map((mod, i) => (
              <motion.div
                key={mod.name}
                variants={{
                  closed: { opacity: 0, scaleX: 0, x: i === 0 ? 40 : i === 2 ? -40 : 0 },
                  open: { opacity: 1, scaleX: 1, x: 0 },
                }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                style={{ transformOrigin: i === 0 ? "right" : i === 2 ? "left" : "center" }}
                className="clip-corner-md border border-accent/40 bg-accent-deep/42 px-4.5 py-4 transition-colors duration-200 hover:bg-accent-deep/70"
              >
                <div className="mb-1.75 text-[14px] font-semibold text-ink">{mod.name}</div>
                <div className="text-[10px] tracking-[0.14em] text-accent">{mod.tag}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
