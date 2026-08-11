"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function scramble(len: number) {
  return Array.from({ length: len }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");
}

/** Ruido de caracteres que nunca resolve — usado como preview "criptografado" no gate bloqueado */
export function GarbleNoise({ length, className }: { length: number; className?: string }) {
  const [display, setDisplay] = useState(() => scramble(length));

  useEffect(() => {
    const id = setInterval(() => setDisplay(scramble(length)), 130);
    return () => clearInterval(id);
  }, [length]);

  return (
    <span className={className} aria-hidden="true">
      {display}
    </span>
  );
}
