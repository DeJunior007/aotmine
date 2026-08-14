import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 4 de reseed do ModCodex: Iron's Spells 'n Spellbooks e Ice and
// Fire (os 2 pilares que faltavam dos 6 pedidos). Receitas lidas direto
// do JSON real do jar. O tutorial da Dragonforge do Ice and Fire usa o
// texto oficial do proprio mod (assets/iceandfire/lang/bestiary/pt_br_0/
// dragonforge_0..3.txt - ja vem traduzido pro pt-BR pelos autores do mod),
// so reorganizado em passos; nao inventamos nenhum detalhe do mecanismo.
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
    .in("slug", ["irons-spells-n-spellbooks", "ice-and-fire"]);
  if (modsError || !modsRows || modsRows.length !== 2) {
    return NextResponse.json({ ok: false, error: modsError?.message ?? "mods not found" }, { status: 500 });
  }
  const modId = Object.fromEntries(modsRows.map((m) => [m.slug, m.id])) as Record<string, string>;

  const { error: ironsUpdateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Mod de magia com grimórios (spellbooks) por escola. Os spellbooks em si NÃO têm receita de crafting — são loot, encontrados em baús/mobs. O que dá pra craftar é o suporte em volta da magia: a Scroll Forge (estação pra criar pergaminhos de feitiço) e o Upgrade Orb (usado pra subir o nível de um feitiço já aprendido).",
      getting_started_steps: [
        "Ache um spellbook explorando (loot de baú ou de mob) — não existe receita de crafting pra ele nessa versão.",
        "Segure o spellbook e clique com o botão direito pra abrir o menu de feitiços e equipar magias nos slots.",
        "Craft uma Scroll Forge (Polished Deepslate + Crying Obsidian) pra criar pergaminhos de feitiço utilizáveis sem o livro em mãos.",
        "Craft um Empty Upgrade Orb (Arcane Ingot + Cinder Essence + Lingote de Mithril) pra subir de nível um feitiço que você já tem.",
      ],
    })
    .eq("slug", "irons-spells-n-spellbooks");

  const { error: iafUpdateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Dragões (fogo, gelo e relâmpago) e criaturas mitológicas. O item central de progressão é a Dragonforge: uma estrutura multibloco de 3 camadas que, alimentada pelo sopro de um dragão domesticado (ou acorrentado), transforma Lingote de Ferro + Sangue de Dragão em Aço Dracônico (Dragonsteel) — o material mais forte do mod, usado em ferramentas, armas e armadura.",
    })
    .eq("slug", "ice-and-fire");

  // ---------------------------- itens ----------------------------
  const items = [
    // iron's spells
    { mod_id: modId["irons-spells-n-spellbooks"], slug: "empty-upgrade-orb", name: "Empty Upgrade Orb", item_type: "material", description: "Usado pra subir de nível um feitiço que você já aprendeu — spellbooks em si não têm receita, só dropam como loot." },
    { mod_id: modId["irons-spells-n-spellbooks"], slug: "scroll-forge", name: "Scroll Forge", item_type: "block", description: "Estação de trabalho pra criar pergaminhos de feitiço (scrolls) — permite usar magia sem segurar o spellbook." },
    { mod_id: modId["irons-spells-n-spellbooks"], slug: "affinity-ring", name: "Affinity Ring", item_type: "equipment", description: "Anel de afinidade elemental (o nome real muda pro elemento, ex: \"Ring of Fire Affinity\") — craftado com Balde + Mithril Scrap." },
    // ice and fire
    { mod_id: modId["ice-and-fire"], slug: "dragon-horn", name: "Dragon Horn", item_type: "equipment", description: "Instrumento feito de osso de dragão — toca um chamado que afeta dragões por perto." },
    { mod_id: modId["ice-and-fire"], slug: "chain-line", name: "Chain Line", item_type: "equipment", description: "Corrente reforçada usada pra capturar dragões selvagens ou prender qualquer monstro grande — precisa ser fixada num Dragon Bone Wall (dragões destroem paredes normais)." },
    { mod_id: modId["ice-and-fire"], slug: "dragon-bone-wall", name: "Dragon Bone Wall", item_type: "block", description: "Muro de osso de dragão — a única parede forte o bastante pra segurar uma corrente presa a um dragão." },
    { mod_id: modId["ice-and-fire"], slug: "dragonforge-fire-brick", name: "Dragonforge Fire Brick", item_type: "block", description: "Tijolo resistente a fogo de dragão, feito de escama + pedra — bloco base da estrutura da Dragonforge de fogo." },
    { mod_id: modId["ice-and-fire"], slug: "dragonsteel-fire-ingot", name: "Fire Dragonsteel Ingot", item_type: "material", description: "Metal alquímico produzido dentro da Dragonforge (Lingote de Ferro + Sangue de Dragão de Fogo) — não tem receita de bancada normal." },
    { mod_id: modId["ice-and-fire"], slug: "dragonsteel-fire-chestplate", name: "Fire Dragonsteel Chestplate", item_type: "equipment", description: "Peito de Aço Dracônico de Fogo — deixa o alvo pegando fogo por até 15s e empurra longe nos ataques; dá proteção extra contra sopro de dragão." },
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
  type IngredientSpec = { item_slug?: string; fallback?: string; quantity: number };
  const recipes: { mod_id: string; name: string; output_slug: string; station: string; notes?: string; ingredients: IngredientSpec[] }[] = [
    { mod_id: modId["irons-spells-n-spellbooks"], name: "Empty Upgrade Orb", output_slug: "empty-upgrade-orb", station: "Mesa de trabalho", ingredients: [{ fallback: "Arcane Ingot", quantity: 2 }, { fallback: "Cinder Essence", quantity: 4 }, { fallback: "Lingote de Mithril", quantity: 1 }] },
    { mod_id: modId["irons-spells-n-spellbooks"], name: "Scroll Forge", output_slug: "scroll-forge", station: "Mesa de trabalho", ingredients: [{ fallback: "Deepslate Polido", quantity: 3 }, { fallback: "Obsidiana Chorosa", quantity: 4 }] },
    { mod_id: modId["irons-spells-n-spellbooks"], name: "Affinity Ring", output_slug: "affinity-ring", station: "Mesa de trabalho", ingredients: [{ fallback: "Balde", quantity: 1 }, { fallback: "Mithril Scrap", quantity: 1 }] },

    { mod_id: modId["ice-and-fire"], name: "Dragon Horn", output_slug: "dragon-horn", station: "Mesa de trabalho", ingredients: [{ fallback: "Osso de Dragão (Dragonbone)", quantity: 3 }, { fallback: "Vara de madeira (qualquer)", quantity: 1 }] },
    { mod_id: modId["ice-and-fire"], name: "Chain Line", output_slug: "chain-line", station: "Mesa de trabalho", ingredients: [{ fallback: "Corrente (vanilla)", quantity: 3 }] },
    { mod_id: modId["ice-and-fire"], name: "Dragon Bone Wall", output_slug: "dragon-bone-wall", station: "Mesa de trabalho", ingredients: [{ fallback: "Osso de Dragão (Dragonbone)", quantity: 6 }] },
    { mod_id: modId["ice-and-fire"], name: "Dragonforge Fire Brick", output_slug: "dragonforge-fire-brick", station: "Mesa de trabalho", notes: "Rende 4 tijolos por craft.", ingredients: [{ fallback: "Bloco de Escama de Dragão de Fogo", quantity: 5 }, { fallback: "Tijolos de Pedra", quantity: 4 }] },
    {
      mod_id: modId["ice-and-fire"],
      name: "Fire Dragonsteel Ingot",
      output_slug: "dragonsteel-fire-ingot",
      station: "Dragonforge (multibloco, não é bancada)",
      notes: "Não é crafting normal: coloque Lingote de Ferro + Fire Dragon Blood dentro da Dragonforge de fogo já montada e ativa (dragão domesticado/acorrentado soprando fogo nela). Outros itens colocados viram cinza de dragão em vez de virar ingot.",
      ingredients: [{ fallback: "Lingote de Ferro", quantity: 1 }, { fallback: "Fire Dragon Blood", quantity: 1 }],
    },
    { mod_id: modId["ice-and-fire"], name: "Fire Dragonsteel Chestplate", output_slug: "dragonsteel-fire-chestplate", station: "Mesa de trabalho", ingredients: [{ item_slug: "dragonsteel-fire-ingot", quantity: 8 }] },
  ];

  const recipeInsertRows = recipes.map((r) => ({
    mod_id: r.mod_id,
    name: r.name,
    output_item_id: itemId[r.output_slug] ?? null,
    output_qty: r.name === "Dragonforge Fire Brick" ? 4 : 1,
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

  // ---------------------------- tutorial: Dragonforge ----------------------------
  const { data: insertedTutorial, error: tutorialError } = await admin
    .from("tutorials")
    .insert({
      mod_id: modId["ice-and-fire"],
      slug: "montando-a-dragonforge-e-forjando-aco-draconico",
      title: "Montando a Dragonforge e forjando Aço Dracônico",
      summary: "Texto oficial do próprio mod (bestiário, já traduzido pt-BR) reorganizado em passos — nada inventado.",
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
      title: "Junte os materiais",
      body: "Pra fogo: 8 Dragon Bone Block + 17 Dragonforge Fire Brick (cada craft de tijolo rende 4, usando Bloco de Escama de Dragão + Tijolos de Pedra). Existem variantes idênticas pra gelo e relâmpago, trocando os blocos pelo tipo correspondente.",
    },
    {
      step_number: 2,
      title: "Monte as 3 camadas",
      body: "A estrutura tem 3 camadas: a 1ª e a 3ª são iguais (Dragon Bone Block nos cantos, Dragonforge Fire Brick no resto, formando um anel 3x3 vazado no meio); a 2ª camada central tem o Dragonforge Fire Core numa ponta e o Dragonforge Fire Aperture (entrada) na outra. Empilhe a 1ª, depois a 2ª, depois a 3ª por cima.",
    },
    {
      step_number: 3,
      title: "Capture ou domestique um dragão",
      body: "A forja só funciona com um dragão bem perto soprando nela. Pra prender um dragão selvagem, craft uma Chain Line (3 correntes vanilla empilhadas) e fixe numa Dragon Bone Wall — paredes comuns (ex: pedregulho) são destruídas pelo dragão, só a de osso de dragão aguenta.",
    },
    {
      step_number: 4,
      title: "Posicione o dragão de frente pra abertura",
      body: "Com o dragão domesticado ou acorrentado na frente do Dragonforge Fire Aperture, ele passa a soprar fogo (ou gelo/relâmpago, conforme o tipo) pra dentro da forja sempre que houver item válido nela.",
    },
    {
      step_number: 5,
      title: "Forje o Aço Dracônico",
      body: "Coloque 1 Lingote de Ferro + 1 Fire Dragon Blood dentro da forja ativa — o resultado é 1 Fire Dragonsteel Ingot. Qualquer outro item colocado ali vira cinza de dragão em vez de virar metal. Com os lingotes em mãos, crafta na bancada normal ferramentas, armas e armadura de Dragonsteel (ex: 8 lingotes = 1 peitoral).",
    },
  ];
  const { data: insertedSteps, error: stepsError } = await admin
    .from("tutorial_steps")
    .insert(steps.map((s) => ({ ...s, tutorial_id: insertedTutorial.id })))
    .select("id");

  return NextResponse.json({
    ok: !itemsError && !recipesError && !ingredientsError && !tutorialError && !stepsError && !ironsUpdateErr && !iafUpdateErr,
    itemsInserted: insertedItems.length,
    recipesInserted: insertedRecipes.length,
    ingredientsInserted: insertedIngredients?.length ?? 0,
    tutorialInserted: !!insertedTutorial,
    stepsInserted: insertedSteps?.length ?? 0,
    errors: {
      ingredientsError: ingredientsError?.message ?? null,
      stepsError: stepsError?.message ?? null,
      ironsUpdateErr: ironsUpdateErr?.message ?? null,
      iafUpdateErr: iafUpdateErr?.message ?? null,
    },
  });
}
