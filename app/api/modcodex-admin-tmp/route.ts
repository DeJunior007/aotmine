import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 7 de reseed do ModCodex: Ars Nouveau em profundidade (como
// comecar, glifos iniciais, progressao, rituais/familiares). Tudo
// verificado nos recipes reais (tipo customizado "ars_nouveau:glyph") e
// no proprio texto de descricao dos glifos no lang.json do mod - as 3
// magias que o jogador ja comeca sabendo sao literalmente marcadas como
// "A spell you start with" no texto oficial (Break, Harm, Projectile).
// Nao existe "Arcane Codex" nessa versao do mod - o item real e o
// "Annotated Codex", que serve pra COMPARTILHAR glifos com outros
// jogadores (nao pra aprender magia nova) - corrigido aqui pra nao
// repetir um nome que não existe no jar.
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
    .eq("slug", "ars-nouveau")
    .single();
  if (modError || !modRow) {
    return NextResponse.json({ ok: false, error: modError?.message ?? "mod not found" }, { status: 500 });
  }
  const modId = modRow.id as string;

  const { error: updateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Magia por composição: você monta um feitiço combinando \"Glifos\" (forma + augments) dentro do próprio Novice Spell Book, em vez de escolher magias prontas. Todo jogador já começa sabendo 3 glifos (confirmado no texto oficial do mod): Break (quebra blocos), Harm (dano) e Projectile (lança projétil). Pra aprender glifos novos, você constrói um Enchanting Apparatus cercado de Arcane Pedestals: coloca os itens pedidos em cima dos pedestais e gasta níveis de XP. Não existe um item \"Arcane Codex\" nessa versão — o item parecido é o Annotated Codex, que serve pra compartilhar glifos já aprendidos com outro jogador (consome XP pra gravar, e o outro jogador aprende ao usar o codex gravado), não pra aprender magia nova sozinho.",
      getting_started_steps: [
        "Crafte um Novice Spell Book: Livro + Picareta, Machado, Pá e Espada de Ferro (as 4 ferramentas de ferro, numa receita sem formato fixo).",
        "Segure o spell book e abra o menu de criação de feitiço — você já pode montar magias simples com Break, Harm e Projectile, que você já sabe de início.",
        "Pra aprender glifos novos: construa um Enchanting Apparatus (Diamante + Lingote de Ouro + Sourcestone + pepitas de ouro) cercado de Arcane Pedestals (Sourcestone + pepita de ouro + Gema de Fonte/Source Gem).",
        "Coloque nos pedestais os itens pedidos pela receita do glifo (ex: pra Glyph of Light, um Lampião + uma Tocha) e confirme — isso consome níveis de XP.",
        "Pra rituais (como invocar um familiar), craft um Ritual Brazier (Arcane Pedestal + Bloco de Fonte + 3 Lingotes de Ouro) e realize a Ritual of Binding perto da criatura que quer virar familiar (ex: Wixie, Starbuncle, Drygmy, Whirlisprig, Bookwyrm).",
      ],
    })
    .eq("slug", "ars-nouveau");

  // ---------------------------- itens ----------------------------
  const items = [
    { mod_id: modId, slug: "novice-spell-book", name: "Novice Spell Book", item_type: "equipment", description: "Grimório inicial — já vem com Break, Harm e Projectile disponíveis pra montar feitiços." },
    { mod_id: modId, slug: "glyph-of-light", name: "Glyph of Light", item_type: "other", description: "Glifo de exemplo aprendido no Enchanting Apparatus — cria uma fonte de luz permanente ou dá Visão Noturna quando usado em si mesmo." },
    { mod_id: modId, slug: "enchanting-apparatus", name: "Enchanting Apparatus", item_type: "block", description: "Estação central pra aprender glifos novos — precisa de Arcane Pedestals ao redor com os itens da receita." },
    { mod_id: modId, slug: "arcane-pedestal", name: "Arcane Pedestal", item_type: "block", description: "Pedestal auxiliar do Enchanting Apparatus — segura os itens-ingrediente durante o aprendizado de um glifo." },
    { mod_id: modId, slug: "ritual-brazier", name: "Ritual Brazier", item_type: "block", description: "Bloco usado pra realizar rituais, incluindo a Ritual of Binding pra conseguir familiares." },
    { mod_id: modId, slug: "annotated-codex", name: "Annotated Codex", item_type: "consumable", description: "Grava os glifos que VOCÊ já sabe (custa XP por glifo). Outro jogador pode usar o codex gravado pra aprender os mesmos glifos, consumindo o item — é uma ferramenta de compartilhar conhecimento entre jogadores, não de aprender sozinho." },
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
  const recipes: { name: string; output_slug: string; station: string; notes?: string; ingredients: IngredientSpec[] }[] = [
    { name: "Novice Spell Book", output_slug: "novice-spell-book", station: "Mesa de trabalho (sem formato)", ingredients: [{ fallback: "Livro", quantity: 1 }, { fallback: "Pá de Ferro", quantity: 1 }, { fallback: "Picareta de Ferro", quantity: 1 }, { fallback: "Machado de Ferro", quantity: 1 }, { fallback: "Espada de Ferro", quantity: 1 }] },
    { name: "Glyph of Light", output_slug: "glyph-of-light", station: "Enchanting Apparatus", notes: "Custa 27 níveis de XP (recipe type ars_nouveau:glyph).", ingredients: [{ fallback: "Lampião", quantity: 1 }, { fallback: "Tocha", quantity: 1 }] },
    { name: "Arcane Pedestal", output_slug: "arcane-pedestal", station: "Mesa de trabalho", ingredients: [{ fallback: "Sourcestone", quantity: 5 }, { fallback: "Pepita de Ouro", quantity: 4 }, { fallback: "Gema de Fonte (Source Gem)", quantity: 1 }] },
    { name: "Enchanting Apparatus", output_slug: "enchanting-apparatus", station: "Mesa de trabalho", ingredients: [{ fallback: "Sourcestone", quantity: 2 }, { fallback: "Pepita de Ouro", quantity: 4 }, { fallback: "Lingote de Ouro", quantity: 2 }, { fallback: "Diamante", quantity: 1 }] },
    { name: "Ritual Brazier", output_slug: "ritual-brazier", station: "Mesa de trabalho", ingredients: [{ fallback: "Arcane Pedestal", quantity: 1 }, { fallback: "Bloco de Fonte (Source Block)", quantity: 1 }, { fallback: "Lingote de Ouro", quantity: 3 }] },
    { name: "Annotated Codex", output_slug: "annotated-codex", station: "Mesa de trabalho", ingredients: [{ fallback: "Pergaminho em Branco (Blank Parchment)", quantity: 1 }, { fallback: "Couro", quantity: 1 }] },
  ];

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
    "Familiares reais confirmados no mod, cada um obtido fazendo a Ritual of Binding perto da criatura correspondente: Wixie (aumenta duração de poções e aplica poção em inimigos), Starbuncle (dá Speed II, e um Nugget de Ouro vira detecção de minério de ouro por tempo curto), Drygmy (+2 de dano em magias de Terra, chance de looting extra), Whirlisprig (reduz custo de magias de Terra pela metade, saturação extra ao comer), Bookwyrm (pega item/XP sozinho num raio de 5 blocos), Amethyst Golem (reduz metade do knockback recebido e empurra atacantes).",
    "Break, Harm e Projectile são as únicas 3 magias que todo jogador já começa sabendo — qualquer outra precisa ser aprendida no Enchanting Apparatus antes de aparecer na lista de montagem de feitiço.",
    "O Annotated Codex não ensina magia nova por conta própria: ele só copia os glifos que VOCÊ já sabe pra outro jogador aprender, e custa XP proporcional ao número de glifos gravados.",
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
