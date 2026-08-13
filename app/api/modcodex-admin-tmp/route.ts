import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rota temporaria de admin, mesmo padrao de sempre. Cadeia completa do
// Ultrahard Steel Ingot + Ice Burst, tudo extraido decompilando o jar do
// Danny's AoT 2.4.3 (IceburstFurnaceBlockEntity, IceburstOreGenerator,
// DannysAot.class) e cruzando os campos ofuscados com os mappings oficiais
// do Yarn 1.21.1+build.3 (cache local do fabric-loom) — nao inventado.
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
  const results: Record<string, unknown> = {};

  const MOD_ID = "0243d289-835c-4467-aa69-0070c844998e"; // dannys-aot

  // --- itens novos ---
  const newItems = [
    {
      slug: "iron-bamboo",
      mod_id: MOD_ID,
      name: "Iron Bamboo",
      item_type: "material",
      description: "Ingrediente base da cadeia do Ultrahard Steel — funde com Raw Iron no Hardened Furnace pra virar Hardened Iron Bamboo.",
      location: {
        method: "Não confirmado. Conferimos receita de craft, loot table (de bloco e de baú), troca de aldeão e geração de mundo (os 6 biomas de Paradis, zero feature de vegetação registrada) — nenhum caminho de sobrevivência encontrado nessa versão (2.4.3).",
        alternative: "Peça pra um operador dar via /give <nick> dannys-aot:iron_bamboo enquanto isso não é confirmado com o autor do mod.",
      },
      notes: "Existe um bloco 'Iron Bamboo Sapling' que cresce quando você usa o item Iron Bamboo nele — mas isso só funciona em cima de um broto que já existe. Não achamos como plantar o primeiro.",
    },
    {
      slug: "hardened-iron-bamboo",
      mod_id: MOD_ID,
      name: "Hardened Iron Bamboo",
      item_type: "material",
      description: "Iron Bamboo fundido com Raw Iron no Hardened Furnace — passo intermediário obrigatório pra chegar no Ultrahard Steel Ingot.",
      location: { method: "Só se produz no Hardened Furnace (ver receita). Não tem fonte no mundo." },
    },
    {
      slug: "hardened-furnace",
      mod_id: MOD_ID,
      name: "Hardened Furnace",
      item_type: "block",
      description: "Fornalha especial (nome interno do bloco é 'iceburst_furnace') — é a única forma de produzir Ultrahard Steel Ingot no mod, e também recarrega Gas Canister com Ice Burst Cluster.",
      location: { method: "Craft — não se encontra pronta em nenhum lugar do mundo." },
      notes: "A mesma fornalha também recarrega Gas Canister do ODM: coloca Ice Burst Cluster + o canister (com menos de 500 de gás) que ela recarrega +25 de gás por ciclo.",
    },
    {
      slug: "block-of-iceburst",
      mod_id: MOD_ID,
      name: "Block of Iceburst",
      item_type: "material",
      description: "4x Ice Burst Cluster compactados num bloco só — usado no craft do Hardened Furnace.",
      location: { method: "Craft (ver receita)." },
    },
    {
      slug: "ice-burst-shard-cluster",
      mod_id: MOD_ID,
      name: "Ice Burst Shard Cluster",
      item_type: "block",
      description: "Estágio maduro da veia de Ice Burst — é o único bloco da veia que realmente solta Ice Burst Cluster ao minerar.",
      location: {
        dimension: "Paradis",
        height: "Y entre -64 e 0",
        method: "Cresce com o tempo a partir do 'Bursting Ice Burst Stone' (a variante mais rara da veia, ~20% dela). Minere só esse estágio maduro pra pegar o item — o Ice Burst Stone cru não dropa nada além dele mesmo.",
      },
      tool_required: "Picareta (Fortune aumenta o drop)",
    },
  ];

  const { data: itemsData, error: itemsError } = await admin
    .from("items")
    .upsert(newItems, { onConflict: "slug" })
    .select("slug");
  results.new_items = { data: itemsData, error: itemsError };

  // --- corrige itens existentes com info imprecisa/incompleta ---
  const { data: iceStoneData, error: iceStoneError } = await admin
    .from("items")
    .update({
      location: {
        dimension: "Paradis",
        height: "Y entre -64 e 0",
        method: "Gera em veias de até 26 blocos, expostas em paredes de caverna (perto de ar). Minerar o bloco cru só devolve ele mesmo — não solta Ice Burst Cluster. Procure a variante 'Bursting' na mesma veia, ela que cresce clusters de verdade com o tempo (ver item [[item:ice-burst-shard-cluster|Ice Burst Shard Cluster]]).",
      },
    })
    .eq("slug", "ice-burst-stone")
    .select("slug");
  results.fix_ice_burst_stone = { data: iceStoneData, error: iceStoneError };

  const { data: iceClusterData, error: iceClusterError } = await admin
    .from("items")
    .update({
      description: "Material craftável a partir de minério — usado em ODM Wires, na fornalha especial, e compactável em Block of Iceburst.",
      location: {
        dimension: "Paradis",
        height: "Y entre -64 e 0",
        method: "Minerado do bloco [[item:ice-burst-shard-cluster|Ice Burst Shard Cluster]] (o estágio maduro da veia, não o Ice Burst Stone cru) — 1 a 2 por bloco, com bônus de Fortune.",
      },
    })
    .eq("slug", "ice-burst-cluster")
    .select("slug");
  results.fix_ice_burst_cluster = { data: iceClusterData, error: iceClusterError };

  const { data: ultrahardData, error: ultrahardError } = await admin
    .from("items")
    .update({
      description: "Material de alto nível usado em quase toda peça do ODM Gear (Cyllinder, Spring, Wires). Não é minerado — só se funde numa fornalha especial.",
      location: {
        method: "NÃO é minerado. Funde no [[item:hardened-furnace|Hardened Furnace]]: 1x [[item:hardened-iron-bamboo|Hardened Iron Bamboo]] + 1x Iron Ingot → 1x Ultrahard Steel Ingot (10 segundos).",
      },
      notes: "O gargalo real da cadeia é o [[item:iron-bamboo|Iron Bamboo]] (ingrediente do passo anterior) — sem ele não dá pra fazer nem o Hardened Iron Bamboo. Veja o item dele.",
    })
    .eq("slug", "ultrahard-steel-ingot")
    .select("slug");
  results.fix_ultrahard_steel = { data: ultrahardData, error: ultrahardError };

  // --- receitas novas ---
  const { data: itemIds } = await admin
    .from("items")
    .select("id, slug")
    .in("slug", [
      "iron-bamboo",
      "hardened-iron-bamboo",
      "hardened-furnace",
      "block-of-iceburst",
      "ice-burst-cluster",
      "ultrahard-steel-ingot",
    ]);
  const idBySlug = Object.fromEntries((itemIds ?? []).map((i: { slug: string; id: string }) => [i.slug, i.id]));

  const { data: recipeBlockIceburst, error: recipeBlockIceburstError } = await admin
    .from("recipes")
    .insert({
      mod_id: MOD_ID,
      name: "Block of Iceburst",
      output_item_id: idBySlug["block-of-iceburst"],
      output_qty: 1,
      station: "Bancada",
      notes: "Padrão 2x2, 4 Ice Burst Cluster preenchendo todos os espaços.",
    })
    .select("id")
    .single();
  results.recipe_block_iceburst = { data: recipeBlockIceburst, error: recipeBlockIceburstError };

  const { data: recipeFurnace, error: recipeFurnaceError } = await admin
    .from("recipes")
    .insert({
      mod_id: MOD_ID,
      name: "Hardened Furnace",
      output_item_id: idBySlug["hardened-furnace"],
      output_qty: 1,
      station: "Bancada",
      notes: "Padrão 3x3: Ferro nas 6 bordas, Ice Burst Cluster e Block of Iceburst nos cantos inferiores, Blast Furnace no meio (ver ingredientes).",
    })
    .select("id")
    .single();
  results.recipe_furnace = { data: recipeFurnace, error: recipeFurnaceError };

  const { data: recipeHardenedBamboo, error: recipeHardenedBambooError } = await admin
    .from("recipes")
    .insert({
      mod_id: MOD_ID,
      name: "Hardened Iron Bamboo",
      output_item_id: idBySlug["hardened-iron-bamboo"],
      output_qty: 1,
      station: "Hardened Furnace",
      notes: "10 segundos de fundição. Precisa de pelo menos 2 de cada ingrediente no slot pra começar.",
    })
    .select("id")
    .single();
  results.recipe_hardened_bamboo = { data: recipeHardenedBamboo, error: recipeHardenedBambooError };

  const { data: recipeUltrahard, error: recipeUltrahardError } = await admin
    .from("recipes")
    .insert({
      mod_id: MOD_ID,
      name: "Ultrahard Steel Ingot",
      output_item_id: idBySlug["ultrahard-steel-ingot"],
      output_qty: 1,
      station: "Hardened Furnace",
      notes: "10 segundos de fundição.",
    })
    .select("id")
    .single();
  results.recipe_ultrahard = { data: recipeUltrahard, error: recipeUltrahardError };

  const ingredients = [
    { recipe_id: (recipeBlockIceburst as { id: string } | null)?.id, item_id: idBySlug["ice-burst-cluster"], quantity: 4 },
    { recipe_id: (recipeFurnace as { id: string } | null)?.id, item_name_fallback: "Iron Ingot (vanilla)", quantity: 6 },
    { recipe_id: (recipeFurnace as { id: string } | null)?.id, item_id: idBySlug["ice-burst-cluster"], quantity: 1 },
    { recipe_id: (recipeFurnace as { id: string } | null)?.id, item_name_fallback: "Blast Furnace (vanilla)", quantity: 1 },
    { recipe_id: (recipeFurnace as { id: string } | null)?.id, item_id: idBySlug["block-of-iceburst"], quantity: 1 },
    { recipe_id: (recipeHardenedBamboo as { id: string } | null)?.id, item_id: idBySlug["iron-bamboo"], quantity: 2 },
    { recipe_id: (recipeHardenedBamboo as { id: string } | null)?.id, item_name_fallback: "Raw Iron (vanilla)", quantity: 2 },
    { recipe_id: (recipeUltrahard as { id: string } | null)?.id, item_id: idBySlug["hardened-iron-bamboo"], quantity: 1 },
    { recipe_id: (recipeUltrahard as { id: string } | null)?.id, item_name_fallback: "Iron Ingot (vanilla)", quantity: 1 },
  ].filter((ing) => ing.recipe_id);

  const { data: ingData, error: ingError } = await admin.from("recipe_ingredients").insert(ingredients).select("id");
  results.ingredients = { data: ingData, error: ingError, count: ingredients.length };

  // --- problema comum, pra quem cair na mesma duvida ---
  const { data: problemData, error: problemError } = await admin
    .from("common_problems")
    .insert({
      mod_id: MOD_ID,
      question: "Onde eu acho/consigo Iron Bamboo pra fazer Ultrahard Steel?",
      causes: [
        "Não existe receita de craft, loot table de bloco/baú, troca de aldeão ou geração de mundo pra esse item na versão atual do mod (2.4.3) — parece uma lacuna real, não falta de sorte procurando.",
      ],
      solution: "Peça pra um operador te dar via /give <nick> dannys-aot:iron_bamboo enquanto isso. Vale perguntar no Discord oficial do mod se é intencional.",
      sort_order: 0,
    })
    .select("id");
  results.common_problem = { data: problemData, error: problemError };

  return NextResponse.json({ ok: true, results });
}
