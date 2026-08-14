import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 6 de reseed do ModCodex: aprofunda Iron's Spells 'n Spellbooks
// (pedido do Deilton: como conseguir o 1o spellbook, escolas de magia,
// como aprender/upar magia, staves, dicas de build magico). Tudo
// verificado nos loot_modifiers/loot_tables/recipes reais do jar:
// - o Rotten Spell Book (spellbook mais comum) e injetado via
//   irons_spellbooks:append_loot em CHESTS VANILLA de verdade
//   (data/irons_spellbooks/loot_modifiers/chest_loot/
//   vanilla_generic_loot_modifier.json lista os loot_table_id exatos:
//   buried_treasure, desert_pyramid, jungle_temple, pillager_outpost,
//   shipwreck, simple_dungeon, stronghold, underwater_ruin,
//   woodland_mansion, village, ruined_portal, abandoned_mineshaft).
// - escolas de magia = chaves reais school.irons_spellbooks.* no lang.
// - mana/aprendizado de magia = chaves reais tooltip/ui.irons_spellbooks.*
//   (mana cost, "Hold to Learn (1 Manuscript)", spell precisa ser
//   aprendida antes de castar).
// - staves com receita real (ice/pyrium/graybeard), Eldritch Manuscript
//   com receita real, Mana Ring e Lesser Spell Slot Upgrade com receita
//   real.
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
    .eq("slug", "irons-spells-n-spellbooks")
    .single();
  if (modError || !modRow) {
    return NextResponse.json({ ok: false, error: modError?.message ?? "mod not found" }, { status: 500 });
  }
  const modId = modRow.id as string;

  const { error: updateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Mod de magia com Mana como recurso (não é XP nem cooldown puro) e 10 escolas: Fire, Ice, Lightning, Holy, Ender, Blood, Evocation, Void, Nature e Eldritch. Você não escolhe uma escola \"de classe\" — cada spellbook/scroll que você acha já vem com magias específicas, e para poder castar uma magia ela precisa antes ser \"aprendida\" (Manuscript, ex: Eldritch Manuscript pras magias de Eldritch). Dá pra conjurar segurando o spellbook OU um cajado (staff) — os staves são craftáveis e servem de \"foco\" alternativo.",
      getting_started_steps: [
        "Seu primeiro Spell Book normalmente é o Rotten Spell Book — ele foi injetado pelo próprio mod em baús vanilla comuns: dungeon simples, mineshaft abandonado, templo do deserto/selva, posto de saqueadores, naufrágio, fortaleza, ruína de portal, mansão da floresta e baús de vila. Não precisa de estrutura especial, só farmar baú.",
        "Segure o spellbook com o botão direito pra abrir o menu, veja quais magias ele já tem e equipe nos slots.",
        "Pra castar, você precisa de Mana (atributo Max Mana, regenera com o tempo) — cada magia tem um custo de mana próprio, mostrado na tooltip.",
        "Magias de escolas específicas (ex: Eldritch) exigem aprender antes com um Manuscript correspondente — segure o botão pra \"Hold to Learn\" e consome 1 Manuscript.",
        "Craft um Lesser Spell Slot Upgrade (Hogskin + Magic Cloth) pra abrir mais slots de magia equipada no seu spellbook.",
        "Craft um staff (ex: Ice Staff, Pyrium Staff, Graybeard Staff) como implemento de conjuração alternativo ao livro — cada um tem sua própria receita.",
      ],
    })
    .eq("slug", "irons-spells-n-spellbooks");

  // ---------------------------- itens ----------------------------
  const items = [
    {
      mod_id: modId,
      slug: "rotten-spell-book",
      name: "Rotten Spell Book",
      item_type: "equipment",
      description: "O spellbook mais comum de achar — costuma ser o primeiro grimório de qualquer jogador.",
      location: {
        dimension: "Overworld (e Nether, no caso do baú do posto de saqueadores/naufrágio conta como vanilla também)",
        method: "Injetado pelo próprio mod (global loot modifier) em baús 100% vanilla: Simple Dungeon, Abandoned Mineshaft, Desert/Jungle Temple, Pillager Outpost, Shipwreck, Stronghold (crossing/corridor), Underwater Ruin, Woodland Mansion, Buried Treasure, Ruined Portal e baús de vila (cartographer/temple).",
        alternative: "Não precisa de estrutura própria do mod — qualquer baú vanilla desses já tem chance de dropar.",
      },
    },
    {
      mod_id: modId,
      slug: "eldritch-manuscript",
      name: "Eldritch Manuscript",
      item_type: "consumable",
      description: "Usado pra aprender magias da escola Eldritch — sem aprender, o jogo recusa castar (\"You can't understand this spell...\").",
    },
    { mod_id: modId, slug: "ice-staff", name: "Ice Staff", item_type: "equipment", description: "Cajado de gelo — implemento de conjuração alternativo ao spellbook." },
    { mod_id: modId, slug: "pyrium-staff", name: "Pyrium Staff", item_type: "equipment", description: "Cajado de tier alto feito de Pyrium + Netherite — implemento de conjuração." },
    { mod_id: modId, slug: "graybeard-staff", name: "Graybeard Staff", item_type: "equipment", description: "Cajado inicial simples, craftável cedo no jogo." },
    { mod_id: modId, slug: "mana-ring", name: "Ring of Mana", item_type: "equipment", description: "Anel (Curios) que aumenta seu Max Mana." },
    { mod_id: modId, slug: "lesser-spell-slot-upgrade", name: "Lesser Spell Slot Improvement", item_type: "consumable", description: "Consumível que aumenta a capacidade de magias equipadas no seu spellbook." },
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
  type IngredientSpec = { fallback: string; quantity: number };
  const recipes: { name: string; output_slug: string; station: string; ingredients: IngredientSpec[] }[] = [
    { name: "Eldritch Manuscript", output_slug: "eldritch-manuscript", station: "Mesa de trabalho", ingredients: [{ fallback: "Ancient Knowledge Fragment", quantity: 8 }, { fallback: "Fragmento de Eco (Echo Shard)", quantity: 1 }] },
    { name: "Ice Staff", output_slug: "ice-staff", station: "Mesa de trabalho (sem formato — mistura livre)", ingredients: [{ fallback: "Frosted Helve", quantity: 1 }, { fallback: "Permafrost Shard", quantity: 1 }] },
    { name: "Pyrium Staff", output_slug: "pyrium-staff", station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Pyrium", quantity: 2 }, { fallback: "Magic Cloth", quantity: 1 }, { fallback: "Lingote de Netherite", quantity: 1 }] },
    { name: "Graybeard Staff", output_slug: "graybeard-staff", station: "Mesa de trabalho", ingredients: [{ fallback: "Pá de Madeira", quantity: 1 }, { fallback: "Lingote de Ferro", quantity: 1 }, { fallback: "Arcane Essence", quantity: 1 }] },
    { name: "Ring of Mana", output_slug: "mana-ring", station: "Mesa de trabalho", ingredients: [{ fallback: "Diamante", quantity: 1 }, { fallback: "Arcane Ingot", quantity: 3 }] },
    { name: "Lesser Spell Slot Improvement", output_slug: "lesser-spell-slot-upgrade", station: "Mesa de trabalho", ingredients: [{ fallback: "Hogskin", quantity: 6 }, { fallback: "Magic Cloth", quantity: 3 }] },
  ];

  const recipeInsertRows = recipes.map((r) => ({
    mod_id: modId,
    name: r.name,
    output_item_id: itemId[r.output_slug] ?? null,
    output_qty: 1,
    station: r.station,
    notes: null,
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
      item_id: null,
      item_name_fallback: ing.fallback,
      quantity: ing.quantity,
    }))
  );
  const { data: insertedIngredients, error: ingredientsError } = await admin
    .from("recipe_ingredients")
    .insert(ingredientRows)
    .select("id");

  // ---------------------------- dicas ----------------------------
  const tipBodies = [
    "As 10 escolas de magia reais do mod: Fire, Ice, Lightning, Holy, Ender, Blood, Evocation, Void, Nature e Eldritch — cada spellbook/scroll que você encontra já vem com magias de uma ou mais dessas escolas prontas, não é uma escolha de classe fixa.",
    "Fique de olho no Max Mana e na Mana Regeneration nos seus atributos — sem mana suficiente a magia simplesmente não é castada (\"Not enough mana to cast\").",
    "Spellbooks com nome de tier alto (Ancient Codex, Enchanted Spell Book) tendem a vir de mobs/loot mais difíceis (ex: o Ancient Codex é ligado ao chefe Dead King) — o Rotten Spell Book é só o ponto de partida mais comum.",
    "Dá pra trocar o implemento de conjuração: segurar o próprio spellbook funciona, mas os staves (Ice Staff, Pyrium Staff, Graybeard Staff, etc) são uma alternativa craftável.",
  ];
  const { data: insertedTips, error: tipsError } = await admin
    .from("tips")
    .insert(tipBodies.map((body) => ({ mod_id: modId, body })))
    .select("id");

  return NextResponse.json({
    ok: !updateErr && !itemsError && !recipesError && !ingredientsError && !tipsError,
    itemsInserted: insertedItems.length,
    recipesInserted: insertedRecipes.length,
    ingredientsInserted: insertedIngredients?.length ?? 0,
    tipsInserted: insertedTips?.length ?? 0,
    errors: {
      updateErr: updateErr?.message ?? null,
      ingredientsError: ingredientsError?.message ?? null,
      tipsError: tipsError?.message ?? null,
    },
  });
}
