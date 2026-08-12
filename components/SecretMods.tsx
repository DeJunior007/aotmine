"use client";

import { useState } from "react";
import { GarbleNoise } from "./GarbleNoise";
import { DecryptText } from "./DecryptText";
import { DecryptReveal } from "./DecryptReveal";
import { RevealItem } from "./Reveal";

type SecretMod = { name: string; tag: string };

/**
 * 3 cards "classificados" no lugar dos mods em destaque — cada um trancado
 * e revelado por conta propria (nao um cofre unico pros 3). Usa a mesma
 * linguagem de "descriptografar" que ja existe no AccessGate: preview com
 * GarbleNoise (ruido que nunca resolve) ate clicar, e ai troca pra
 * DecryptText (resolve caractere por caractere, da esquerda pra direita)
 * igual o resto do site faz ao destravar.
 */
export function SecretMods({ mods }: { mods: SecretMod[] }) {
  return (
    <>
      {mods.map((mod) => (
        <SecretModCard key={mod.name} mod={mod} />
      ))}
    </>
  );
}

function SecretModCard({ mod }: { mod: SecretMod }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <RevealItem className="border border-accent/40 bg-accent-deep/42 px-4.5 py-4 transition-colors duration-200 hover:bg-accent-deep/70">
        <DecryptReveal>
          <div className="mb-1.75 text-[14px] font-semibold text-ink">
            <DecryptText text={mod.name} />
          </div>
          <div className="text-[10px] tracking-[0.14em] text-accent">
            <DecryptText text={mod.tag} duration={450} delay={120} />
          </div>
        </DecryptReveal>
      </RevealItem>
    );
  }

  return (
    <RevealItem
      role="button"
      tabIndex={0}
      onClick={() => setRevealed(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed(true);
        }
      }}
      className="clip-corner-sm group relative cursor-pointer overflow-hidden border border-accent/22 bg-panel/70 px-4.5 py-4 transition-colors duration-200 hover:border-accent/40 hover:bg-accent-deep/50"
    >
      <span className="animate-scan pointer-events-none absolute inset-0 h-[2px] bg-linear-to-b from-accent/12 to-transparent" />
      <div className="mb-1.75 flex items-center gap-1.5 text-[14px] font-semibold text-ink/80">
        <span aria-hidden>🔒</span>
        <GarbleNoise length={mod.name.length} className="font-mono-ui" />
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] tracking-[0.14em] text-text/40">
        <GarbleNoise length={mod.tag.length} className="font-mono-ui" />
        <span className="text-accent/60 uppercase group-hover:text-accent">destrancar</span>
      </div>
    </RevealItem>
  );
}
