import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 8 de reseed do ModCodex: aprofunda Vampirism (como virar vampiro
// OU cacador - as duas rotas -, arvore de nivel/skills, fraquezas de
// cada lado). Mecanica de infeccao decompilada com FernFlower
// (SanguinareEffect.class / SanguinareEffectInstance.class): confirma
// que "Garlic Bread" e' item curativo real da Sanguinare Vampiris (a
// nao ser que o server desative canCancelSanguinare), e que vampiros
// recem-convertidos ficam "fledgling" (fracos, sem conseguir infectar
// nem virar morcego) ate aprender a skill correspondente. Fraquezas
// (sol/alho/agua benta) e as ~50 skills reais vieram do lang.json do
// mod (skill.vampirism.* / action.vampirism.* / death.attack.*).
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

  const { data: modRow, error: modError } = await admin
    .from("mods")
    .select("id, slug")
    .eq("slug", "vampirism")
    .single();
  if (modError || !modRow) {
    return NextResponse.json({ ok: false, error: modError?.message ?? "mod not found" }, { status: 500 });
  }
  const modId = modRow.id as string;

  const { error: updateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Sistema de facções com 2 caminhos opostos e mutuamente exclusivos:\n\n" +
        "VAMPIRO: você precisa ser mordido (ação \"Infect\" de um vampiro, jogador ou NPC) — isso te dá o efeito Sanguinare Vampiris, uma doença com duração média configurável pelo servidor. Se o efeito expirar sem ser curado, você vira vampiro automaticamente. Comer Garlic Bread cura a Sanguinare antes de virar (a não ser que o servidor tenha desligado essa opção). Ao converter, você começa como \"fledgling\" (fraco: nem consegue infectar outras criaturas nem virar morcego) até destravar a skill \"No longer a fledgling\". Vampiros têm fraquezas reais: dano direto de sol, veneno de armas cobertas de alho, e água benta queima. Em troca, ganham ações fortes: Toggle Batmode (virar morcego), Regeneração, Invisibilidade, Teleporte, Vampire Rage, Summon Bats, Sunscreen (imunidade temporária ao sol, cooldown longo).\n\n" +
        "CAÇADOR: craft a Hunter Research Table (precisa de Vampire Fang — dropado por vampiros) pra começar. Caçadores não têm a mesma fraqueza de sol/água benta, mas começam mais fracos em combate corpo a corpo cru; a compensação vem de equipamento (Stake, Crucifixo, bestas, Garlic Diffuser pra repelir vampiros) e skills de ataque (Increased Attack Damage/Speed).\n\n" +
        "Os dois lados sobem de nível com uma árvore de Level Skills, e no nível máximo desbloqueiam skills de Lord (Vampire Lord / Hunter Lord) — inclui auras que buffam outros membros da mesma facção por perto (Lord Movement Speed, Lord Attack Speed).",
      getting_started_steps: [
        "Caminho Vampiro: procure ser mordido por um vampiro (jogador ou NPC) — a Sanguinare Vampiris começa a contar. Não coma Garlic Bread se quiser virar; espere o efeito expirar sozinho.",
        "Caminho Caçador: consiga um Vampire Fang (drop de vampiro) e crafte a Hunter Research Table (Vampire Fang + Livro + Alho + Tábuas) — ela te marca como Hunter.",
        "As duas facções são mutuamente exclusivas: escolher uma bloqueia a mesa/ritual da outra.",
        "Suba de nível fazendo as atividades da sua facção pra desbloquear Level Skills — no nível máximo, vira Lord (Vampire Lord ou Hunter Lord).",
        "Vampiro recém-convertido é \"fledgling\": não consegue infectar ninguém nem virar morcego até destravar a skill certa — não espere poder morder outros jogadores de cara.",
      ],
    })
    .eq("slug", "vampirism");

  // ---------------------------- dicas ----------------------------
  const tipBodies = [
    "Fraquezas reais do Vampiro: dano direto de luz do sol (a não ser com skill Tough Skin ou ação Sunscreen ativa), armas untadas com alho envenenam, e água benta queima e mata (Splash Bottle of Holy Water é arma de caçador).",
    "Ações reais que o Vampiro pode desbloquear: Toggle Batmode, Regeneration, Invisibility, Teleport, Summon Bats, Vampire Rage, Dark Blood Projectile, Freeze, Revive Fallen, Sunscreen (imunidade temporária ao sol).",
    "Ações/skills reais do Caçador: Vampire Awareness, Potion Resistance, Increased Attack Damage/Speed, Double It (bestas), Crucifix Wielder, e o Garlic Diffuser (item craftável que repele vampiros numa área).",
    "O Stake só executa um vampiro instantaneamente por trás se a vida máxima dele estiver abaixo de um teto configurável — não é instakill garantido contra qualquer vampiro, principalmente Lords com vida alta.",
    "Skills de Lord incluem auras que buffam quem está por perto da mesma facção: Lord Movement Speed e Lord Attack Speed (Vampire Lord e Hunter Lord têm as suas próprias).",
  ];
  const { data: insertedTips, error: tipsError } = await admin
    .from("tips")
    .insert(tipBodies.map((body) => ({ mod_id: modId, body })))
    .select("id");

  // ---------------------------- problema comum ----------------------------
  const { data: insertedProblem, error: problemError } = await admin
    .from("common_problems")
    .insert({
      mod_id: modId,
      question: "Fui mordido e não quero virar vampiro / mordi alguém e nada aconteceu",
      causes: [
        "A conversão só acontece quando o efeito Sanguinare Vampiris (aplicado pela mordida) termina naturalmente — não é instantâneo.",
        "Vampiros recém-criados (fledgling) não conseguem morder/infectar ninguém até destravar a skill certa.",
      ],
      solution: "Pra não virar vampiro: coma Garlic Bread enquanto a Sanguinare Vampiris estiver ativa (cura o efeito) — a não ser que o dono do servidor tenha desativado essa opção na config. Pra conseguir infectar outros como vampiro, primeiro suba de nível até destravar a skill \"No longer a fledgling\".",
      sort_order: 0,
    })
    .select("id");

  return NextResponse.json({
    ok: !updateErr && !tipsError && !problemError,
    tipsInserted: insertedTips?.length ?? 0,
    problemInserted: insertedProblem?.length ?? 0,
    errors: {
      updateErr: updateErr?.message ?? null,
      tipsError: tipsError?.message ?? null,
      problemError: problemError?.message ?? null,
    },
  });
}
