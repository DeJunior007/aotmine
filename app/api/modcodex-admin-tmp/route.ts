import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 2 de reseed do ModCodex: conteudo profundo de Epic Fight e
// L_Ender's Cataclysm (2 dos 6 pilares RPG/anime do pack novo). Toda
// receita abaixo foi lida direto do JSON de receita real dentro do jar
// (data/<modid>/recipes/*.json) - nenhuma foi inventada. Os alvos dos
// "olhos" do Cataclysm foram confirmados cruzando
// items/DungeonEyeItem.class (decompilado com FernFlower) com as tags
// data/cataclysm/tags/worldgen/structure/eye_of_*_located.json.
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
    .in("slug", ["epic-fight", "cataclysm"]);
  if (modsError || !modsRows || modsRows.length !== 2) {
    return NextResponse.json({ ok: false, error: modsError?.message ?? "mods not found" }, { status: 500 });
  }
  const modId = Object.fromEntries(modsRows.map((m) => [m.slug, m.id])) as Record<string, string>;

  // ---- atualiza overview/getting_started dos 2 mods ----
  const { error: efUpdateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Troca o combate padrão de \"clicar e pronto\" por um sistema de combos, guarda e esquiva no estilo anime/souls-like. Cada arma (adaga, espadão, lança, tachi, luva, etc) tem um jogo de combos e uma habilidade inata própria — e existe uma barra de Stamina separada da barra de vida: guardar, atacar e usar habilidades consome stamina, e ela regenera com o tempo.",
      getting_started_steps: [
        "Equipe uma arma do Epic Fight (ex: Iron Longsword) e ataque normalmente — os golpes agora encadeiam em combos.",
        "Abra Controles → Epic Fight Combat pra dar bind nas ações: Attack, Guard, Dodge Skill, Weapon Innate Skill, Mobility Skill e Lock-on ficam sem tecla padrão até você configurar.",
        "Guard bloqueia ataques frontais consumindo stamina; segurar guarda por muito tempo custa mais stamina ainda.",
        "Toggle Battle/Mining Mode alterna entre o modo de combate (combos) e o modo de mineração (comportamento vanilla) — útil pra minerar sem entrar em combo sem querer.",
      ],
    })
    .eq("slug", "epic-fight");

  const { error: catUpdateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Adiciona chefes de fim de jogo (superbosses) guardados em estruturas de dungeon escondidas pelo mundo. Cada estrutura tem um \"olho\" próprio, craftável, que funciona como um Eye of Ender customizado: joga na mão e ele voa na direção da estrutura mais próxima daquele tipo (a pesquisa é feita nas tags de mundo do próprio Cataclysm — não precisa saber onde procurar de antemão).",
      getting_started_steps: [
        "Craft o \"olho\" da estrutura que você quer achar (ex: Eye of Abyss pra Sunken City) — cada um usa um Ender Eye de base mais materiais temáticos diferentes.",
        "Use o item (clique direito) em qualquer lugar do Overworld: ele soa e voa na direção da estrutura mais próxima daquele tipo, igual o Eye of Ender aponta pra Stronghold.",
        "O item tem um cooldown de alguns segundos antes de poder ser jogado de novo se quiser reajustar a direção andando.",
        "As estruturas ficam bem longe do spawn de propósito — leve suprimento pra viagem longa antes de seguir o olho.",
      ],
    })
    .eq("slug", "cataclysm");

  // ============================ EPIC FIGHT ============================
  type ItemRow = {
    mod_id: string;
    slug: string;
    name: string;
    item_type: string;
    description: string;
    notes?: string | null;
  };
  const efItems: ItemRow[] = [
    { mod_id: modId["epic-fight"], slug: "iron-longsword", name: "Iron Longsword", item_type: "equipment", description: "Espada longa de ferro — alcance maior que a espada vanilla, combos de duas mãos." },
    { mod_id: modId["epic-fight"], slug: "diamond-longsword", name: "Diamond Longsword", item_type: "equipment", description: "Versão de diamante da Longsword — tier intermediário antes do upgrade pra netherite." },
    { mod_id: modId["epic-fight"], slug: "netherite-longsword", name: "Netherite Longsword", item_type: "equipment", description: "Tier máximo da Longsword — upgrade de smithing igual as ferramentas vanilla de netherite." },
    { mod_id: modId["epic-fight"], slug: "iron-dagger", name: "Iron Dagger", item_type: "equipment", description: "Arma curta e rápida — golpes mais frequentes, alcance menor." },
    { mod_id: modId["epic-fight"], slug: "iron-greatsword", name: "Iron Greatsword", item_type: "equipment", description: "Espada pesada de duas mãos — golpes lentos com alcance de área maior." },
    { mod_id: modId["epic-fight"], slug: "iron-spear", name: "Iron Spear", item_type: "equipment", description: "Arma de alcance — combos que atingem em linha reta à frente." },
    { mod_id: modId["epic-fight"], slug: "iron-tachi", name: "Iron Tachi", item_type: "equipment", description: "Espada curva rápida — combos de corte contínuo, estilo katana longa." },
    { mod_id: modId["epic-fight"], slug: "epicfight-glove", name: "Glove", item_type: "equipment", description: "Luva desarmada — troca a arma por combos de soco e chute." },
  ];

  // ============================ CATACLYSM ============================
  const eyeTargets: Record<string, string> = {
    "eye-of-mech": "Ancient Factory",
    "eye-of-flame": "Burning Arena",
    "eye-of-void": "Ruined Citadel",
    "eye-of-monstrous": "Soul Black Smith",
    "eye-of-abyss": "Sunken City",
    "eye-of-desert": "Cursed Pyramid",
    "eye-of-curse": "Frosted Prison",
    "eye-of-storm": "Acropolis",
  };
  const catItems: ItemRow[] = [
    { mod_id: modId["cataclysm"], slug: "eye-of-mech", name: "Eye of Mech", item_type: "material", description: `Aponta pra estrutura Ancient Factory mais próxima quando usado (como um Eye of Ender customizado).`, notes: "Alvo: cataclysm:ancient_factory (tag eye_of_mech_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-flame", name: "Eye of Flame", item_type: "material", description: `Aponta pra estrutura Burning Arena mais próxima quando usado.`, notes: "Alvo: cataclysm:burning_arena (tag eye_of_flame_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-void", name: "Eye of Void", item_type: "material", description: `Aponta pra estrutura Ruined Citadel mais próxima quando usado.`, notes: "Alvo: cataclysm:ruined_citadel (tag eye_of_ruined_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-monstrous", name: "Eye of Monstrous", item_type: "material", description: `Aponta pra estrutura Soul Black Smith mais próxima quando usado.`, notes: "Alvo: cataclysm:soul_black_smith (tag eye_of_monstrous_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-abyss", name: "Eye of Abyss", item_type: "material", description: `Aponta pra estrutura Sunken City mais próxima quando usado.`, notes: "Alvo: cataclysm:sunken_city (tag eye_of_abyss_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-desert", name: "Eye of Desert", item_type: "material", description: `Aponta pra estrutura Cursed Pyramid mais próxima quando usado.`, notes: "Alvo: cataclysm:cursed_pyramid (tag eye_of_desert_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-curse", name: "Eye of Curse", item_type: "material", description: `Aponta pra estrutura Frosted Prison mais próxima quando usado.`, notes: "Alvo: cataclysm:frosted_prison (tag eye_of_curse_located)." },
    { mod_id: modId["cataclysm"], slug: "eye-of-storm", name: "Eye of Storm", item_type: "material", description: `Aponta pra estrutura Acropolis mais próxima quando usado.`, notes: "Alvo: cataclysm:acropolis (tag eye_of_storm_located)." },
    { mod_id: modId["cataclysm"], slug: "black-steel-sword", name: "Black Steel Sword", item_type: "equipment", description: "Espada de tier inicial do Cataclysm, feita de Black Steel Ingot — um passo acima do ferro vanilla." },
  ];

  void eyeTargets; // usado só pra documentar os alvos nos comentarios/description acima

  const allItems = [...efItems, ...catItems];
  const { data: insertedItems, error: itemsError } = await admin
    .from("items")
    .insert(allItems)
    .select("id, slug");
  if (itemsError || !insertedItems) {
    return NextResponse.json({ ok: false, step: "items", error: itemsError?.message }, { status: 500 });
  }
  const itemId = Object.fromEntries(insertedItems.map((i) => [i.slug, i.id])) as Record<string, string>;

  // ---------------------------- receitas ----------------------------
  type IngredientSpec = { item_slug?: string; fallback?: string; quantity: number };
  type RecipeSpec = {
    mod_id: string;
    name: string;
    output_slug: string;
    output_qty: number;
    station: string;
    notes?: string;
    ingredients: IngredientSpec[];
  };

  const recipes: RecipeSpec[] = [
    // ---- epic fight ----
    { mod_id: modId["epic-fight"], name: "Iron Longsword", output_slug: "iron-longsword", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Espada de Ferro", quantity: 1 }, { fallback: "Lingote de Ferro", quantity: 2 }] },
    { mod_id: modId["epic-fight"], name: "Diamond Longsword", output_slug: "diamond-longsword", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Espada de Diamante", quantity: 1 }, { fallback: "Diamante", quantity: 2 }] },
    { mod_id: modId["epic-fight"], name: "Netherite Longsword", output_slug: "netherite-longsword", output_qty: 1, station: "Bigorna Ferrada (Smithing Table)", notes: "Upgrade igual o de ferramentas vanilla: base + adição + template na bigorna ferrada.", ingredients: [{ item_slug: "diamond-longsword", quantity: 1 }, { fallback: "Lingote de Netherite", quantity: 1 }, { fallback: "Template de Upgrade de Netherite", quantity: 1 }] },
    { mod_id: modId["epic-fight"], name: "Iron Dagger", output_slug: "iron-dagger", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Ferro", quantity: 1 }, { fallback: "Graveto", quantity: 1 }] },
    { mod_id: modId["epic-fight"], name: "Iron Greatsword", output_slug: "iron-greatsword", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Ferro", quantity: 6 }, { fallback: "Tábuas (qualquer madeira)", quantity: 1 }] },
    { mod_id: modId["epic-fight"], name: "Iron Spear", output_slug: "iron-spear", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Espada de Ferro", quantity: 1 }, { fallback: "Graveto", quantity: 2 }] },
    { mod_id: modId["epic-fight"], name: "Iron Tachi", output_slug: "iron-tachi", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Ferro", quantity: 2 }, { fallback: "Espada de Ferro", quantity: 1 }] },
    { mod_id: modId["epic-fight"], name: "Glove", output_slug: "epicfight-glove", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Pepita de Ferro", quantity: 2 }, { fallback: "Couro", quantity: 2 }] },

    // ---- cataclysm ----
    { mod_id: modId["cataclysm"], name: "Eye of Mech", output_slug: "eye-of-mech", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Bloco de Redstone", quantity: 4 }, { fallback: "Lingote de Ferro", quantity: 4 }, { fallback: "Olho de Ender", quantity: 1 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Flame", output_slug: "eye-of-flame", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Pó de Blaze", quantity: 3 }, { fallback: "Fragmento de Netherite", quantity: 2 }, { fallback: "Olho de Ender", quantity: 1 }, { fallback: "Areia das Almas", quantity: 3 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Void", output_slug: "eye-of-void", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Pilar de Purpur", quantity: 2 }, { fallback: "Casca de Shulker", quantity: 2 }, { fallback: "Tijolos de End Stone", quantity: 2 }, { fallback: "Olho de Ender", quantity: 1 }, { fallback: "Bloco de Purpur", quantity: 2 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Monstrous", output_slug: "eye-of-monstrous", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Balde de Lava", quantity: 2 }, { fallback: "Fragmento de Netherite", quantity: 2 }, { fallback: "Blackstone", quantity: 2 }, { fallback: "Olho de Ender", quantity: 1 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Abyss", output_slug: "eye-of-abyss", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Obsidiana Chorosa", quantity: 4 }, { fallback: "Obsidiana", quantity: 4 }, { fallback: "Olho de Ender", quantity: 1 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Desert", output_slug: "eye-of-desert", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Ouro", quantity: 1 }, { fallback: "Arenito Cinzelado", quantity: 2 }, { fallback: "Esmeralda", quantity: 1 }, { fallback: "Arbusto Seco", quantity: 1 }, { fallback: "Olho de Ender", quantity: 1 }, { fallback: "Cacto", quantity: 1 }, { fallback: "Carne Podre", quantity: 1 }, { fallback: "Osso", quantity: 1 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Curse", output_slug: "eye-of-curse", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Ouro", quantity: 4 }, { fallback: "Osso", quantity: 1 }, { fallback: "Membrana de Phantom", quantity: 2 }, { fallback: "Olho de Ender", quantity: 1 }, { fallback: "Carne Podre", quantity: 1 }] },
    { mod_id: modId["cataclysm"], name: "Eye of Storm", output_slug: "eye-of-storm", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Fragmento de Prismarine", quantity: 2 }, { fallback: "Para-raios", quantity: 1 }, { fallback: "Diamante", quantity: 2 }, { fallback: "Olho de Ender", quantity: 1 }, { fallback: "Cristais de Prismarine", quantity: 2 }, { fallback: "Balde de Água", quantity: 1 }] },
    { mod_id: modId["cataclysm"], name: "Black Steel Sword", output_slug: "black-steel-sword", output_qty: 1, station: "Mesa de trabalho", ingredients: [{ fallback: "Lingote de Aço Negro", quantity: 2 }, { fallback: "Graveto", quantity: 1 }] },
  ];

  const recipeInsertRows = recipes.map((r) => ({
    mod_id: r.mod_id,
    name: r.name,
    output_item_id: itemId[r.output_slug] ?? null,
    output_qty: r.output_qty,
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
  // nomes de receita sao unicos dentro desse batch, entao dá pra mapear por nome
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

  return NextResponse.json({
    ok: !itemsError && !recipesError && !ingredientsError && !efUpdateErr && !catUpdateErr,
    itemsInserted: insertedItems.length,
    recipesInserted: insertedRecipes.length,
    ingredientsInserted: insertedIngredients?.length ?? 0,
    ingredientsError: ingredientsError?.message ?? null,
    efUpdateErr: efUpdateErr?.message ?? null,
    catUpdateErr: catUpdateErr?.message ?? null,
  });
}
