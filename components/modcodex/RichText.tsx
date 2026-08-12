"use client";

import type { NavEntry } from "@/lib/modcodex/types";

const LINK_RE = /\[\[(\w+):([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Texto com paragrafos (separados por linha em branco) e links tipo wiki
 * `[[tipo:slug|Rotulo]]` — cada um vira um botao clicavel que empurra na
 * pilha de navegacao do ModCodex.
 */
export function RichText({
  text,
  onNavigate,
  className = "",
}: {
  text: string;
  onNavigate: (entry: NavEntry) => void;
  className?: string;
}) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className={className}>
      {paragraphs.map((para, pi) => (
        <p key={pi} className="m-0 mb-3 last:mb-0">
          {renderParagraph(para, onNavigate)}
        </p>
      ))}
    </div>
  );
}

function renderParagraph(para: string, onNavigate: (entry: NavEntry) => void) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  LINK_RE.lastIndex = 0;

  while ((match = LINK_RE.exec(para)) !== null) {
    const [full, type, slug, label] = match;
    if (match.index > lastIndex) {
      parts.push(para.slice(lastIndex, match.index));
    }
    const navType = type as NavEntry["type"];
    parts.push(
      <button
        key={key++}
        type="button"
        onClick={() =>
          onNavigate(
            navType === "list" ? { type: "list" } : ({ type: navType, slug } as NavEntry)
          )
        }
        className="cursor-pointer border-b border-dashed border-accent/50 text-accent hover:border-accent hover:text-accent-bright"
      >
        {label ?? slug}
      </button>
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex < para.length) parts.push(para.slice(lastIndex));
  return parts;
}
