"use client";

import type { Mod, NavEntry } from "@/lib/modcodex/types";
import { BackButton, DetailSection, Row } from "./shared";
import { RichText } from "./RichText";
import { RecipeCard } from "./RecipeCard";

export function ModDetailView({
  mod,
  categoryLabel,
  onBack,
  onNavigate,
}: {
  mod: Mod;
  categoryLabel: string;
  onBack: () => void;
  onNavigate: (entry: NavEntry) => void;
}) {
  const hasDeepContent =
    mod.items.length > 0 ||
    mod.recipes.length > 0 ||
    mod.tutorials.length > 0 ||
    mod.origins.length > 0;

  return (
    <div>
      <BackButton onClick={onBack} />

      <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
        <h3 className="m-0 text-[17px] font-semibold text-ink">{mod.name}</h3>
        <span className="clip-corner-sm border border-accent/22 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-accent/70 uppercase">
          {categoryLabel}
        </span>
      </div>

      {mod.summary && <p className="m-0 mb-4 text-[12.5px] leading-[1.7] text-text/60">{mod.summary}</p>}

      {mod.overview && (
        <DetailSection title="Visão geral">
          <RichText
            text={mod.overview}
            onNavigate={onNavigate}
            className="text-[12.5px] leading-[1.7] text-text/65"
          />
        </DetailSection>
      )}

      {mod.getting_started_steps.length > 0 && (
        <DetailSection title="Comece aqui">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {mod.getting_started_steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.65] text-text/65">
                <span className="flex-none font-mono-ui text-[11px] text-accent/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {mod.origins.length > 0 && (
        <DetailSection title="Origins">
          {mod.origins.map((o) => (
            <Row
              key={o.slug}
              title={o.name}
              subtitle={o.summary}
              onClick={() => onNavigate({ type: "origin", slug: o.slug })}
            />
          ))}
        </DetailSection>
      )}

      {mod.items.length > 0 && (
        <DetailSection title="Itens">
          {mod.items.map((item) => (
            <Row
              key={item.slug}
              title={item.name}
              subtitle={item.description}
              tag={item.item_type}
              onClick={() => onNavigate({ type: "item", slug: item.slug })}
            />
          ))}
        </DetailSection>
      )}

      {mod.recipes.length > 0 && (
        <DetailSection title="Receitas">
          <div className="flex flex-col gap-2">
            {mod.recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} onNavigate={onNavigate} />
            ))}
          </div>
        </DetailSection>
      )}

      {mod.tutorials.length > 0 && (
        <DetailSection title="Tutoriais">
          {mod.tutorials.map((t) => (
            <Row
              key={t.slug}
              title={t.title}
              subtitle={t.summary}
              tag={`${t.tutorial_steps.length} passos`}
              onClick={() => onNavigate({ type: "tutorial", slug: t.slug })}
            />
          ))}
        </DetailSection>
      )}

      {mod.tips.length > 0 && (
        <DetailSection title="Dicas">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {mod.tips.map((tip) => (
              <li key={tip.id} className="flex gap-2 text-[12.5px] leading-[1.65] text-text/65">
                <span className="flex-none text-accent/60">›</span>
                <span>{tip.body}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {mod.common_problems.length > 0 && (
        <DetailSection title="Problemas comuns">
          <div className="flex flex-col gap-3">
            {mod.common_problems.map((p) => (
              <div key={p.id} className="clip-corner-sm border border-accent/14 bg-bg/50 px-3.5 py-3">
                <div className="mb-1.5 text-[12.5px] font-semibold text-ink">&ldquo;{p.question}&rdquo;</div>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {p.causes.map((cause, i) => (
                    <li key={i} className="flex gap-2 text-[11.5px] leading-[1.55] text-text/55">
                      <span className="flex-none font-mono-ui text-accent/60">{i + 1}.</span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
                {p.solution && (
                  <div className="mt-1.5 text-[11.5px] leading-[1.55] text-accent/80">{p.solution}</div>
                )}
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {mod.mod_relationships.length > 0 && (
        <DetailSection title="Mods relacionados">
          <div className="flex flex-col gap-2">
            {mod.mod_relationships.map((rel) => (
              <div key={rel.id} className="clip-corner-sm border border-accent/14 bg-bg/50 px-3.5 py-3">
                <button
                  type="button"
                  onClick={() => onNavigate({ type: "mod", slug: rel.related_mod.slug })}
                  className="cursor-pointer text-[12.5px] font-semibold text-accent hover:text-accent-bright"
                >
                  {rel.related_mod.name}
                </button>
                <div className="mt-1 text-[11.5px] leading-[1.55] text-text/55">{rel.reason}</div>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {!hasDeepContent && mod.tips.length === 0 && mod.getting_started_steps.length === 0 && (
        <p className="m-0 text-[11px] leading-[1.6] text-text/35">
          {mod.category === "bibliotecas"
            ? "Biblioteca de suporte — não precisa mexer nela, só faz o resto do modpack funcionar por baixo dos panos."
            : "Ainda sem conteúdo detalhado no ModCodex (receitas/tutoriais). O mod funciona normal no pack — essa página só ainda não foi documentada a fundo."}
        </p>
      )}
    </div>
  );
}
