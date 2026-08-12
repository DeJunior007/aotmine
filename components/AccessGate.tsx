"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GarbleNoise } from "./GarbleNoise";

export function AccessGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "granted">("idle");

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
        setStatus("granted");
        setTimeout(() => router.refresh(), 550);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="clip-corner-lg border border-accent/22 p-6 sm:p-7"
      style={{ background: "linear-gradient(160deg, rgba(21,26,22,.92), rgba(11,14,12,.92))" }}
    >
      <div className="mb-5 flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-accent">
          🔒 ACESSO CRIPTOGRAFADO
        </span>
        <span className="animate-flicker-soft text-[9px] tracking-[0.16em] text-text/30">
          {"// LOCKED"}
        </span>
      </div>

      {/* preview embaralhado dos dados escondidos */}
      <div className="mb-5 flex flex-col gap-2">
        <div className="clip-corner-sm flex items-center justify-between gap-3 border border-accent/12 bg-bg/60 px-3.5 py-3">
          <span className="text-[10px] tracking-[0.14em] text-text/40">ENDEREÇO</span>
          <GarbleNoise length={26} className="font-mono-ui text-[13px] text-accent/40" />
        </div>
        <div className="clip-corner-sm flex items-center justify-between gap-3 border border-accent/12 bg-bg/60 px-3.5 py-3">
          <span className="text-[10px] tracking-[0.14em] text-text/40">MODPACK</span>
          <GarbleNoise length={18} className="font-mono-ui text-[13px] text-accent/40" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="clip-corner-btn flex items-center gap-2.5 border border-accent/30 bg-bg/80 px-3.5 py-3.5">
          <span className="animate-blink-cursor text-[13px] text-accent-dim">&gt;_</span>
          <input
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={password}
            disabled={status === "granted"}
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
          disabled={status === "loading" || status === "granted" || !password}
          whileTap={{ scale: 0.98 }}
          className={`clip-corner-btn block px-4 py-4 text-center text-[13px] font-semibold tracking-[0.14em] uppercase transition-[box-shadow,transform,opacity] duration-200 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${
            status === "granted"
              ? "bg-accent text-[#08120a] shadow-[0_0_38px_rgba(127,214,138,0.5)]"
              : "bg-linear-to-b from-accent to-accent-mid text-[#08120a] hover:-translate-y-px hover:shadow-[0_0_38px_rgba(127,214,138,0.42)] disabled:opacity-50"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              {status === "loading" && "Verificando…"}
              {status === "granted" && "✓ Acesso concedido — descriptografando…"}
              {(status === "idle" || status === "error") && "Descriptografar acesso"}
            </motion.span>
          </AnimatePresence>
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
          Endereço do servidor e download do modpack ficam ocultos até a
          autorização. A senha foi compartilhada no grupo — se você não tem,
          chama lá.
        </p>
      </form>
    </div>
  );
}
