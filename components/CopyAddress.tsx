"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // clipboard indisponivel (http local, permissao etc) — ignora silenciosamente
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="clip-corner-lg flex flex-wrap items-center gap-2.5 border border-accent/20 bg-bg/80 px-3.5 py-3">
      <span className="text-[13px] text-accent-dim">&gt;_</span>
      <code className="min-w-[170px] flex-1 break-all font-mono-ui text-[15px] font-semibold text-ink">
        {address}
      </code>
      <motion.button
        type="button"
        onClick={handleCopy}
        whileTap={{ scale: 0.94 }}
        className={`clip-corner-sm min-h-10 flex-none cursor-pointer border px-3.5 py-3 font-mono-ui text-[10px] font-semibold tracking-[0.18em] transition-colors duration-200 ${
          copied
            ? "border-accent bg-accent text-[#08120a] shadow-[0_0_26px_rgba(127,214,138,0.45)]"
            : "border-accent/45 bg-transparent text-accent hover:brightness-110"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? "copied" : "copy"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {copied ? "COPIADO ✓" : "COPIAR"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
