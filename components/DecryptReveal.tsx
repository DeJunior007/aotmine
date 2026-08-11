"use client";

import { motion } from "framer-motion";

/** Envolve o conteudo desbloqueado com um "flash" de descriptografia concluida */
export function DecryptReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, filter: "brightness(2.2)" }}
      animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
