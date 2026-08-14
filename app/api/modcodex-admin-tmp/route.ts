import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 5 de reseed do ModCodex: Roundabout (JoJo's Bizarre Adventure)
// completo - estava 100% vazio, era o mais urgente. Toda a cadeia de
// aquisicao de Stand foi confirmada decompilando StandArrowItem.class com
// FernFlower (metodos m_5551_/rollStand/grantStand) e cruzando com:
// - data/roundabout/recipes/stand_arrow_shaped.json e meteorite_*.json
//   (receitas reais)
// - data/roundabout/worldgen/structure/meteorite_site.json +
//   structures/meteorite_site.nbt (gunzip+strings) pra achar os blocos
//   reais (roundabout:ancient_meteor, roundabout:impact_mound) e a faixa
//   de altura (60-120 ACIMA do terreno, nao e mineracao subterranea)
// - data/roundabout/loot_tables/blocks/ancient_meteor.json (drop real:
//   Meteorite sem silk touch, com bonus de fortune)
// - data/minecraft/tags/blocks/needs_iron_tool.json +
//   mineable/pickaxe.json (tool tier real)
// - assets/roundabout/lang/en_us.json (nomes reais dos ~30 Stand Discs,
//   keybinds de combate key.roundabout.*, e os itens de comando do
//   Whitesnake / a espada amaldicoada do Anubis, que sao mecanicas
//   especificas ja confirmadas por existirem como itens de verdade)
// Nao inventamos habilidade de nenhum Stand que nao tinha evidencia
// direta no jar - pra a maioria, a orientacao e' abrir o Power Inventory
// no jogo (que mostra a descricao real de cada skill).
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
    .eq("slug", "roundabout")
    .single();
  if (modError || !modRow) {
    return NextResponse.json({ ok: false, error: modError?.message ?? "mod not found" }, { status: 500 });
  }
  const modId = modRow.id as string;

  // recategoriza pra rpg (é essencialmente um sistema de poderes/classe,
  // não só um mod de exploração) e enriquece summary/overview.
  const { error: updateErr } = await admin
    .from("mods")
    .update({
      category: "rpg",
      summary:
        "Mod completo de JoJo's Bizarre Adventure — vire um usuário de Stand: minere meteoritos, crafte a Stand Arrow e sorteie um dos ~30 Stands reais do mod (Star Platinum, The World, Killer Queen, Whitesnake, Tusk e mais), cada um com seu próprio kit de 4 habilidades.",
      overview:
        "Sistema de poderes central do pack: todo jogador pode se tornar um usuário de Stand. Não tem escolha manual de qual Stand — você minera Meteorite (um minério que só aparece numa estrutura que flutua no céu, não debaixo da terra), crafta uma Stand Arrow e a usa (segurando o botão direito, tipo um arco) pra sortear um Stand aleatório do pool do mod. Depois de vinculado, o Stand aparece do seu lado em combate e cada um dos ~30 Stands reais do mod (baseados em Personagens de Jotaro, Joseph, Josuke, Giorno, DIO e outros das Partes 3 a 6 de JoJo) tem 4 habilidades próprias (Skill 1 a 4), visíveis no Power Inventory dentro do jogo. Alguns Stands têm mecânica bem específica já confirmada: o Whitesnake extrai \"discos\" de memória/visão/audição dos alvos e pode implantar discos de comando (fazer o alvo atacar, fugir, esquecer, ou explodir); o Anubis é uma espada amaldiçoada que possui quem a empunha (precisa achar um clérigo pra purificar).",
      getting_started_steps: [
        "Procure uma estrutura \"Meteorite Site\": ela flutua de 60 a 120 blocos ACIMA do chão (olhe pro céu, não cave) em bioma de planície, floresta, montanha, taiga, savana ou selva.",
        "Minere os blocos Ancient Meteor com picareta de ferro ou melhor — sem Silk Touch eles dropam Meteorite (bruto, com bônus de Fortune); com Silk Touch dropam o próprio bloco.",
        "Funda o Meteorite numa fornalha pra virar Meteorite Ingot (ou quebre um Meteor Block da estrutura, que já rende 9 ingots de uma vez).",
        "Crafte a Stand Arrow: 4× Meteorite Ingot + 1× Graveto + 1× Pena.",
        "Segure o botão direito com a Stand Arrow equipada (ela carrega feito um arco). Ao soltar, se você ainda não tem Stand, ela sorteia um aleatório do pool e vincula a você — custa níveis de XP (de graça no criativo).",
        "Configure os controles em Controles → Roundabout Controls: Skill 1-4 (as 4 habilidades do seu Stand), Power Inventory (menu de poderes), Strike Pose, Switch Powers (se tiver mais de um poder) e Toggle Stand EXP Display.",
      ],
    })
    .eq("slug", "roundabout");

  // ---------------------------- itens ----------------------------
  const items = [
    {
      mod_id: modId,
      slug: "meteorite",
      name: "Meteorite",
      item_type: "material",
      description: "Minério bruto — material inicial pra virar um usuário de Stand.",
      location: {
        dimension: "Overworld",
        biome: "Planície, floresta, montanha, taiga, savana ou selva (qualquer bioma com a tag roundabout:has_structure/meteorite_site).",
        height: "60 a 120 blocos ACIMA do topo do terreno — a estrutura flutua no ar, não é subterrânea.",
        method: "Minere o bloco Ancient Meteor dentro da estrutura \"Meteorite Site\" (jigsaw, tamanho pequeno — 1 a 2 peças). Sem Silk Touch dropa Meteorite; Fortune aumenta a quantidade.",
        tool: "Picareta de ferro ou melhor (tag needs_iron_tool) — picareta de pedra pra baixo não quebra o bloco direito.",
      },
      notes: "O Meteor Block encontrado na mesma estrutura já rende 9 Meteorite Ingot direto quando quebrado/craftado, sem precisar fundir.",
    },
    {
      mod_id: modId,
      slug: "meteorite-ingot",
      name: "Meteorite Ingot",
      item_type: "material",
      description: "Ingrediente principal da Stand Arrow — funde do Meteorite bruto ou vem 9 de uma vez de um Meteor Block.",
    },
    {
      mod_id: modId,
      slug: "stand-arrow",
      name: "Stand Arrow",
      item_type: "equipment",
      description: "Item que concede (ou re-sorteia) um Stand aleatório. Usa igual um arco: segura o botão direito pra carregar e solta. Reparável com Meteorite Ingot na bigorna.",
      notes: "Sortear o primeiro Stand custa níveis de XP (config levelsToGetStand); re-sortear um Stand que você já tem custa mais ainda (levelsToRerollStandWithArrow) — nenhum custo no modo criativo.",
    },
    {
      mod_id: modId,
      slug: "anubis-mysterious-sword",
      name: "Mysterious Sword (Anubis)",
      item_type: "equipment",
      description: "Espada amaldiçoada — ao pegar, o Stand Anubis possui quem está empunhando. O jogo avisa que a espada está amaldiçoada e manda procurar um clérigo pra purificar (\"Anubis Cleansed!\").",
    },
  ];
  const { data: insertedItems, error: itemsError } = await admin
    .from("items")
    .insert(items)
    .select("id, slug");
  if (itemsError || !insertedItems) {
    return NextResponse.json({ ok: false, step: "items", error: itemsError?.message }, { status: 500 });
  }
  const itemId = Object.fromEntries(insertedItems.map((i) => [i.slug, i.id])) as Record<string, string>;

  // ---------------------------- receitas ----------------------------
  const recipes = [
    { name: "Meteorite Ingot (fundição)", output_slug: "meteorite-ingot", station: "Fornalha", ingredients: [{ item_slug: "meteorite", quantity: 1 }] },
    {
      name: "Stand Arrow",
      output_slug: "stand-arrow",
      station: "Mesa de trabalho",
      ingredients: [
        { item_slug: "meteorite-ingot", quantity: 4 },
        { fallback: "Graveto", quantity: 1 },
        { fallback: "Pena", quantity: 1 },
      ],
    },
  ] as { name: string; output_slug: string; station: string; notes?: string; ingredients: { item_slug?: string; fallback?: string; quantity: number }[] }[];

  const recipeInsertRows = recipes.map((r) => ({
    mod_id: modId,
    name: r.name,
    output_item_id: itemId[r.output_slug] ?? null,
    output_qty: 1,
    station: r.station,
    notes: r.notes ?? null,
  }));
  const { data: insertedRecipes, error: recipesError } = await admin
    .from("recipes")
    .insert(recipeInsertRows)
    .select("id, name");
  if (recipesError || !insertedRecipes) {
    return NextResponse.json({ ok: false, step: "recipes", error: recipesError?.message }, { status: 500 });
  }
  const recipeIdByName = Object.fromEntries(insertedRecipes.map((r) => [r.name, r.id])) as Record<string, string>;

  const ingredientRows = recipes.flatMap((r) =>
    r.ingredients.map((ing) => ({
      recipe_id: recipeIdByName[r.name],
      item_id: ing.item_slug ? itemId[ing.item_slug] ?? null : null,
      item_name_fallback: ing.fallback ?? null,
      quantity: ing.quantity,
    }))
  );
  const { data: insertedIngredients, error: ingredientsError } = await admin
    .from("recipe_ingredients")
    .insert(ingredientRows)
    .select("id");

  // ---------------------------- dicas (tips) ----------------------------
  const tipBodies = [
    "Os Stands reais do pool incluem (nomes conferidos no arquivo de idioma do mod): Star Platinum, The World, Silver Chariot, Magician's Red, Killer Queen, King Crimson, Whitesnake, Tusk, Purple Haze, Metallica, Cream, Anubis, Emperor, Justice, Cinderella, Green Day, Soft and Wet, Survivor, Achtung Baby, Oasis, D4C, Manhattan Transfer, Pearl Jam, Black Sabbath, White Album, 20th Century Boy, Ratt, Hey Ya!, Mandom, Walking Heart, Diver Down e Planet Waves — cada um tem versão \"+\" (Stand Disc+) mais forte.",
    "A habilidade exata de cada Stand (o que cada Skill 1-4 faz) é mostrada no próprio jogo ao abrir o Power Inventory — evite adivinhar pelo nome, cada implementação pode simplificar o poder original do anime/mangá.",
    "Seu Stand tem um sistema de EXP e nível próprio (guardado no disco do Stand) — ative Toggle Stand EXP Display (tecla configurável) pra acompanhar.",
    "Se você já tem um Stand e usa a Stand Arrow de novo, o jogo tenta \"reroll\" (trocar de Stand) em vez de dar um novo — isso custa mais níveis de XP que o primeiro sorteio.",
    "Use Bonus Guard (tecla configurável, \"Use Offhand / Easy Block\") pra bloquear com o Stand em combate corpo a corpo.",
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
      question: "Não sei o que meu Stand faz / quero outro Stand",
      causes: [
        "O Stand é sorteado aleatoriamente do pool de ~30 — não dá pra escolher direto na primeira vez.",
        "Cada Stand tem um kit de habilidades bem diferente dos outros.",
      ],
      solution: "Abra o Power Inventory pra ver a descrição de cada uma das 4 habilidades do Stand que você tirou. Se quiser trocar, use a Stand Arrow de novo pra tentar um reroll (gasta mais XP que a primeira vez).",
      sort_order: 0,
    })
    .select("id");

  return NextResponse.json({
    ok: !updateErr && !itemsError && !recipesError && !ingredientsError && !tipsError && !problemError,
    itemsInserted: insertedItems.length,
    recipesInserted: insertedRecipes.length,
    ingredientsInserted: insertedIngredients?.length ?? 0,
    tipsInserted: insertedTips?.length ?? 0,
    problemInserted: insertedProblem?.length ?? 0,
    errors: {
      updateErr: updateErr?.message ?? null,
      ingredientsError: ingredientsError?.message ?? null,
      tipsError: tipsError?.message ?? null,
      problemError: problemError?.message ?? null,
    },
  });
}
