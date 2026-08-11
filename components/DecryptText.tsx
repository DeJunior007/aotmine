"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function scramble(len: number) {
  return Array.from({ length: len }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");
}

/** Texto que "descriptografa" ao montar: embaralha caracteres e resolve da esquerda pra direita */
export function DecryptText({
  text,
  className,
  duration = 650,
  delay = 0,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(() => scramble(text.length));

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const chars = text.split("");

    const timer = setTimeout(() => {
      function tick(now: number) {
        if (start === null) start = now;
        const progress = Math.min((now - start) / duration, 1);
        const resolvedCount = Math.floor(progress * chars.length);
        setDisplay(
          chars
            .map((c, i) => (i < resolvedCount ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
            .join("")
        );
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setDisplay(text);
        }
      }
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, duration, delay]);

  return (
    <span className={className} aria-label={text}>
      {display}
    </span>
  );
}
