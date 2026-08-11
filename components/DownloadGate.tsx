"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function DownloadGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="clip-corner-btn flex items-center gap-2.5 border border-accent/30 bg-bg/80 px-3.5 py-3.5">
        <span className="text-[13px] text-accent-dim">🔒</span>
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="senha de autorização do batalhão"
          className="flex-1 border-none bg-transparent text-[13px] tracking-[0.08em] text-ink placeholder:text-text/35 outline-none"
        />
      </div>

      <motion.button
        type="submit"
        disabled={status === "loading" || !password}
        whileTap={{ scale: 0.98 }}
        className="clip-corner-btn block bg-linear-to-b from-accent to-accent-mid px-4 py-4 text-center text-[13px] font-semibold tracking-[0.14em] text-[#08120a] uppercase transition-[box-shadow,transform,opacity] duration-200 hover:-translate-y-px hover:shadow-[0_0_38px_rgba(127,214,138,0.42)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {status === "loading" ? "Verificando…" : "Liberar acesso"}
      </motion.button>

      {status === "error" && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-0 text-[11px] tracking-[0.08em] text-red-400/80"
        >
          Senha incorreta. Pergunta pro Deilton no grupo.
        </motion.p>
      )}

      <p className="m-0 text-[10px] leading-relaxed tracking-[0.1em] text-text/35">
        Acesso restrito ao Batalhão de Exploração. A senha foi compartilhada
        no grupo — se você não tem, chama lá.
      </p>
    </form>
  );
}
