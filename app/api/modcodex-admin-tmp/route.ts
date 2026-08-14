import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 9 de reseed do ModCodex: fecha o pedido do Deilton revisando
// Epic Fight (tutorial dedicado de arvore de skills/stamina/guard) e
// Ice and Fire (taming/crescimento de dragao, alem da Dragonforge que ja
// tinha sido feita). Categorias de skill (Dodge/Guard/Mobility/
// Revelation/Passive) e o texto "Skills are found in dungeon books or
// sporadically drop from hostile mobs" sao texto oficial do proprio mod
// (epicfight.tip.skill_books no lang.json) - a lista de ~40 skills reais
// tambem vem direto de skill.epicfight.* no lang.json. O ciclo de vida
// do dragao (ovo -> choca -> estagios de crescimento -> comandos
// sit/stand/escort/home) vem de dragon.command.*/message.iceandfire.*
// no lang.json do Ice and Fire.
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

  const { data: modsRows, error: modsError } = await admin
    .from("mods")
    .select("id, slug")
    .in("slug", ["epic-fight", "ice-and-fire"]);
  if (modsError || !modsRows || modsRows.length !== 2) {
    return NextResponse.json({ ok: false, error: modsError?.message ?? "mods not found" }, { status: 500 });
  }
  const modId = Object.fromEntries(modsRows.map((m) => [m.slug, m.id])) as Record<string, string>;

  // ---------------------------- tutorial: skills do Epic Fight ----------------------------
  const { data: insertedTutorial, error: tutorialError } = await admin
    .from("tutorials")
    .insert({
      mod_id: modId["epic-fight"],
      slug: "arvore-de-skills-stamina-e-guard-do-epic-fight",
      title: "Árvore de skills, stamina e guard",
      summary: "Como conseguir skills novas e o que cada categoria faz — texto e lista de skills conferidos no lang.json do mod.",
      sort_order: 0,
    })
    .select("id")
    .single();
  if (tutorialError || !insertedTutorial) {
    return NextResponse.json({ ok: false, step: "tutorial", error: tutorialError?.message }, { status: 500 });
  }

  const steps = [
    {
      step_number: 1,
      title: "Como conseguir Skill Books",
      body: "Segundo o próprio jogo: \"Skills are found in dungeon books or sporadically drop from hostile mobs\" — ou seja, Skill Books vêm de baús de dungeon ou dropam ocasionalmente de mobs hostis. Não tem receita de crafting normal pra maioria delas.",
    },
    {
      step_number: 2,
      title: "As 5 categorias reais de skill",
      body: "Toda skill do Epic Fight cai numa dessas 5 categorias: Dodge (esquiva), Guard (bloqueio/defesa), Mobility (deslocamento em combate), Revelation (habilidades mais fortes/únicas) e Passive (bônus passivos). Existe também uma categoria \"Identity\", ligada a habilidades exclusivas por tipo de arma.",
    },
    {
      step_number: 3,
      title: "Equipar e aprender",
      body: "Um Skill Book só pode ser aprendido depois de equipado — o jogo avisa \"You need to equip [skill] first\". Depois de equipado, use o botão Learn na tela de skills (tecla Open Skill Editor / Skill GUI) pra confirmar o aprendizado.",
    },
    {
      step_number: 4,
      title: "Gerencie sua Stamina",
      body: "Atacar, guardar (Guard) e usar a maioria das skills consome Stamina — uma barra separada da vida. Guardar por muito tempo consome mais stamina ainda (é o \"guard penalty\"). Skills passivas como Adrenaline Fiend (regenera stamina ao matar um mob) e Stamina Pillager (recupera % da stamina faltante ao matar o alvo) ajudam a administrar isso.",
    },
    {
      step_number: 5,
      title: "Guard avançado",
      body: "Guard básico bloqueia ataques frontais. A skill Parrying permite cronometrar o bloqueio certo pra evitar gastar stamina (e bloquear ataques à distância também). Impact Guard reduz ainda mais o consumo de stamina no bloqueio e a penalidade de guarda, além de poder bloquear explosão, fogo, magia e projéteis por uma fração do dano.",
    },
  ];
  const { data: insertedSteps, error: stepsError } = await admin
    .from("tutorial_steps")
    .insert(steps.map((s) => ({ ...s, tutorial_id: insertedTutorial.id })))
    .select("id");

  // ---------------------------- dicas Epic Fight ----------------------------
  const efTips = [
    "Lista de skills reais confirmadas no mod (uma amostra das ~40 existentes): Dodge = Roll, Step, Emergency Escape, Technician; Guard = Guard, Parrying, Impact Guard; Mobility = Blade Rush, Demolition Leap, Grasping Spire, Phantom Ascent; Passive = Endurance, Hyper Vitality, Adaptive Skin, Berserker, Vengeance; Revelation = Eviscerate, Meteor Slam, The Guillotine, Wrathful Lightning, Tsunami, Steel Whirlwind. Cada arma também tem sua própria skill de \"Identity\" (habilidade inata), como Battojutsu, Liechtenauer e Swordmaster.",
    "Toggle Battle/Mining Mode é essencial: no modo mineração seus ataques voltam ao normal do vanilla, sem entrar em combo à toa enquanto você quebra blocos.",
  ];
  const { data: insertedEfTips, error: efTipsError } = await admin
    .from("tips")
    .insert(efTips.map((body) => ({ mod_id: modId["epic-fight"], body })))
    .select("id");

  // ---------------------------- dicas Ice and Fire (dragões) ----------------------------
  const iafTips = [
    "Ciclo de vida do dragão (confirmado nos textos do mod): você começa com um Dragon Egg, que choca depois de um tempo (\"Hatches in:\") num dragão bebê. O dragão cresce em Estágios (\"has grown to Stage...\") até ficar adulto e montável — não nasce pronto pra cavalgar.",
    "Comandos reais de dragão domesticado: Sit (fica parado), Stand/Wander (vagueia livre), Escort (te acompanha), além de marcar um \"home\" (posição de origem) pra ele voltar.",
    "Pra alimentar a Dragonforge (ver tutorial dedicado do mod), você precisa de um dragão adulto domesticado ou acorrentado — dragão bebê/crescendo não serve pra isso ainda.",
  ];
  const { data: insertedIafTips, error: iafTipsError } = await admin
    .from("tips")
    .insert(iafTips.map((body) => ({ mod_id: modId["ice-and-fire"], body })))
    .select("id");

  return NextResponse.json({
    ok: !tutorialError && !stepsError && !efTipsError && !iafTipsError,
    stepsInserted: insertedSteps?.length ?? 0,
    efTipsInserted: insertedEfTips?.length ?? 0,
    iafTipsInserted: insertedIafTips?.length ?? 0,
    errors: {
      stepsError: stepsError?.message ?? null,
      efTipsError: efTipsError?.message ?? null,
      iafTipsError: iafTipsError?.message ?? null,
    },
  });
}
