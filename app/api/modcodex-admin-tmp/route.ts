import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rota temporaria de admin — mesmo padrao ja usado antes (protegida por
// DOWNLOAD_PASSWORD, service role, roda uma vez e some). Dessa vez: auditoria
// completa dos 10 Origins contra o datapack de verdade do mod (nao so o
// Phantom que foi o exemplo dado) — cada power abaixo foi conferido direto
// em data/origins/powers/*.json dentro do Origins-1.13.0-pre.3 jar, nao
// inventado.
export async function POST(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key !== process.env.DOWNLOAD_PASSWORD) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "missing service role env" }, { status: 500 });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const updates: { slug: string; patch: Record<string, unknown> }[] = [
    {
      // origins:throw_ender_pearl — key.origins.primary_active (G), cooldown
      // 30s, spawna origins:enderian_pearl sem gastar item nenhum.
      slug: "enderian",
      patch: {
        strengths: [
          "Alcance extra pra interagir com blocos/entidades",
          "Joga uma pérola de Ender de graça apertando G (Active Power Primary) — sem gastar pérola do inventário, recarga de 30s",
        ],
        playstyle:
          "Focado em teleporte e alcance — aperte G pra atirar uma pérola de Ender que não sai do seu inventário (recarga de 30 segundos), fora isso tem a mesma fragilidade a água do Blazeborn.",
        tip:
          "A pérola de graça (tecla G, 30s de recarga) funciona em combate também — dá pra usar como escape de emergência sem precisar carregar pérola nenhuma no inventário.",
      },
    },
    {
      // origins:shulker_inventory — key.origins.primary_active (G), abre um
      // inventario extra estilo shulker box, drop_on_death:false.
      slug: "shulk",
      patch: {
        strengths: [
          "Aperte G (Active Power Primary) pra abrir um inventário extra tipo shulker box — e não cai no chão se você morrer",
          "Armadura natural mesmo sem equipar nada",
          "Braços fortes — mais dano corpo a corpo e mineração mais rápida",
        ],
        playstyle:
          "Tanque ofensivo sem escudo — aperte G a qualquer momento pra abrir um inventário extra (não perde o conteúdo dele nem morrendo), armadura natural compensa um pouco a falta de escudo, mas o foco é atacar.",
        tip:
          "O inventário extra (tecla G) não dropa quando você morre — é o lugar mais seguro do pack pra guardar item importante enquanto explora.",
      },
    },
    {
      // origins:climbing (via origins:multiple) — NAO e automatico feito
      // aranha vanilla: precisa apertar G pra ativar o modo escalada, e so
      // funciona colado numa parede (ou, agachado, numa quina).
      slug: "arachnid",
      patch: {
        strengths: [
          "Aperte G (Active Power Primary) pra ligar o modo escalada — com ele ativo, encostar numa parede te faz subir nela",
          "Anda em teia de aranha sem ficar preso",
        ],
        playstyle:
          "Mobilidade por escalada em vez de voo — mas não é automático feito aranha vanilla: precisa apertar G pra ligar o modo, e só escala encostado numa parede (ou numa quina, se estiver agachado). Mais frágil em combate direto.",
        tip:
          "Se G não estiver ativado, você não escala nada — é comum achar que tá bugado quando na verdade só esqueceu de ligar o modo escalada.",
      },
    },
    {
      // origins:nine_lives — nome enganoso (parece bonus, mas e attribute
      // add_value -2 em max_health = menos 1 coracao de vida max).
      slug: "feline",
      patch: {
        weaknesses: [
          { title: "Braços fracos", impact: "Dano corpo a corpo reduzido — combate direto fica mais fraco, precisa compensar com arco ou magia." },
          { title: "1 coração a menos", impact: "Vida máxima -2 (1 coração) em relação às outras origens — apesar do nome do poder interno ser \"nine lives\", na prática é uma vida máxima menor, não vidas extras." },
        ],
      },
    },
    {
      // origins:hotblooded (imune a poison+hunger) e origins:burning_wrath
      // (+3 dano enquanto pegando fogo) nao estavam documentados.
      slug: "blazeborn",
      patch: {
        strengths: [
          "Imunidade total a fogo/lava",
          "Também imune a Veneno e Fome (efeitos de status)",
          "+3 de dano de ataque enquanto está pegando fogo — e você é imune ao fogo mesmo",
          "Nasce no Nether — já começa perto de recursos de lá",
        ],
        tip:
          "Já que você é imune a fogo mesmo, se atear fogo de propósito antes de uma luta (isqueiro, lava de raspão) dá +3 de dano de ataque enquanto durar a queima — só evita completamente água por perto.",
      },
    },
    {
      // origins:fresh_air — prevent_sleep abaixo de height 86. Nao listado
      // como fraqueza nenhuma antes.
      slug: "avian",
      patch: {
        weaknesses: [
          { title: "Vegetariano", impact: "Não pode comer carne — sua fonte de comida fica restrita a itens vegetais, o que limita opções de fazenda de comida rápida." },
          { title: "Só dorme lá em cima", impact: "Não consegue dormir em altura abaixo de Y=86 — cama em base no nível do chão simplesmente falha. Precisa de uma cama numa torre/andar alto." },
          { title: "Põe ovos", impact: "Mecânica de reprodução ligada a ovos em vez do sistema normal — efeito situacional, não é desvantagem de combate." },
        ],
        tip:
          "Se escolher Avian, constrói (ou reserva) uma cama lá em cima — abaixo de Y=86 você simplesmente não consegue dormir, mesmo de noite e com mobs por perto.",
      },
    },
    {
      // origins:launch_into_air — tecla G, 30s de cooldown. Ja estava
      // mencionado vagamente, so deixa explicito tecla+recarga.
      slug: "elytrian",
      patch: {
        playstyle:
          "Vive no ar — elytra sempre à mão, e segurando G (Active Power Primary) você se lança pra cima pra ganhar altura sem precisar de penhasco ou foguete (recarga de 30s). Fraco em espaço fechado e limitado na armadura.",
      },
    },
  ];

  const results: Record<string, unknown> = {};
  for (const { slug, patch } of updates) {
    const { data, error } = await admin.from("origins").update(patch).eq("slug", slug).select("slug");
    results[slug] = { data, error };
  }

  return NextResponse.json({ ok: true, results });
}
