import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 3 de reseed do ModCodex: Vampirism e Twilight Forest (mais 2 dos
// 6 pilares RPG/anime). Receitas lidas direto do JSON real do jar; o
// mecanismo do portal do Twilight Forest foi confirmado decompilando
// TFPortalBlock.class + TFTickHandler.class com FernFlower e cruzando com
// as tags data/twilightforest/tags/items/portal/activator.json (diamante)
// e data/twilightforest/tags/blocks/portal/fluid.json (água) - não é lore
// generica de outras versões, é o que essa build 4.3.2508 faz de verdade.
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
    .in("slug", ["vampirism", "twilight-forest"]);
  if (modsError || !modsRows || modsRows.length !== 2) {
    return NextResponse.json({ ok: false, error: modsError?.message ?? "mods not found" }, { status: 500 });
  }
  const modId = Object.fromEntries(modsRows.map((m) => [m.slug, m.id])) as Record<string, string>;

  const { error: vampUpdateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Sistema de facções: qualquer jogador pode virar caçador de vampiros (Hunter) ou vampiro (Vampire), e cada facção tem sua própria árvore de habilidades (Level Skills, liberadas por nível, e Lord Skills, mais fortes). As duas facções têm mesas/estações próprias — o caçador usa a Hunter Research Table, o vampiro usa o Altar (blood altar).",
      getting_started_steps: [
        "Craft uma Hunter Research Table (Vampire Fang + Livro + Alho + Tábuas) pra começar a virar caçador, ou procure um representante/altar de vampiro pra começar o outro caminho.",
        "As duas facções são mutuamente exclusivas — não dá pra ser caçador e vampiro ao mesmo tempo (o jogo bloqueia a mesa do lado oposto se você já escolheu um).",
        "O Stake (estaca) é a arma básica do caçador contra vampiros e mortos-vivos.",
        "Craft um Blood Bottle pra guardar sangue — usado em várias receitas de vampiro (ex: itens do Alchemical Cauldron).",
      ],
    })
    .eq("slug", "vampirism");

  const { error: tfUpdateErr } = await admin
    .from("mods")
    .update({
      overview:
        "Dimensão própria de exploração (build oficial 4.3.2508), com progressão por chefes e estruturas — cada chefe libera acesso a uma área nova. Diferente de dimensões vanilla, não existe um portal de bloco fixo: você mesmo cria o portal jogando o item certo numa poça de água.",
    })
    .eq("slug", "twilight-forest");

  // ---------------------------- itens (vampirism) ----------------------------
  const items = [
    { mod_id: modId["vampirism"], slug: "stake", name: "Stake", item_type: "equipment", description: "Arma básica de caçador contra vampiros e mortos-vivos — uma estaca de madeira." },
    { mod_id: modId["vampirism"], slug: "hunter-research-table", name: "Hunter Research Table", item_type: "block", description: "Estação de trabalho que marca o início do caminho de caçador — só pode ser usada por quem ainda não escolheu facção." },
    { mod_id: modId["vampirism"], slug: "blood-bottle", name: "Blood Bottle", item_type: "consumable", description: "Vidro com sangue — ingrediente base de várias receitas do lado vampiro (Alchemical Cauldron, etc)." },
  ];
  const { data: insertedItems, error: itemsError } = await admin
    .from("items")
    .insert(items)
    .select("id, slug");
  if (itemsError || !insertedItems) {
    return NextResponse.json({ ok: false, step: "items", error: itemsError?.message }, { status: 500 });
  }
  const itemId = Object.fromEntries(insertedItems.map((i) => [i.slug, i.id])) as Record<string, string>;

  // ---------------------------- receitas (vampirism) ----------------------------
  type IngredientSpec = { fallback: string; quantity: number };
  const recipes: { name: string; output_slug: string; station: string; notes?: string; ingredients: IngredientSpec[] }[] = [
    {
      name: "Stake",
      output_slug: "stake",
      station: "Mesa de trabalho",
      ingredients: [
        { fallback: "Vara de madeira (qualquer)", quantity: 2 },
        { fallback: "Tábuas (qualquer madeira)", quantity: 1 },
      ],
    },
    {
      name: "Hunter Research Table",
      output_slug: "hunter-research-table",
      station: "Mesa de trabalho",
      notes: "Exige Vampire Fang — dropado por vampiros/NPCs vampiros.",
      ingredients: [
        { fallback: "Alho (colheita)", quantity: 1 },
        { fallback: "Vampire Fang", quantity: 1 },
        { fallback: "Livro", quantity: 1 },
        { fallback: "Tábuas (qualquer madeira)", quantity: 4 },
      ],
    },
    {
      name: "Blood Bottle",
      output_slug: "blood-bottle",
      station: "Mesa de trabalho",
      notes: "Só existe essa receita manual se a config auto_convert do Vampirism estiver desligada; por padrão o auto-convert já cuida disso.",
      ingredients: [
        { fallback: "Vidro (qualquer)", quantity: 2 },
        { fallback: "Carne Podre", quantity: 1 },
      ],
    },
  ];

  const recipeInsertRows = recipes.map((r) => ({
    mod_id: modId["vampirism"],
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

  // ---------------------------- tutorial (twilight forest) ----------------------------
  const { data: insertedTutorial, error: tutorialError } = await admin
    .from("tutorials")
    .insert({
      mod_id: modId["twilight-forest"],
      slug: "abrindo-o-portal-do-twilight-forest",
      title: "Abrindo o portal pro Twilight Forest",
      summary: "Não existe bloco de portal fixo — você cria um jogando um diamante numa poça de água.",
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
      title: "Cave uma poça de água",
      body: "Faça uma poça de pelo menos 4 blocos de água (tag minecraft:water) num único nível, apoiada em bloco sólido embaixo. Não precisa ser quadrada — o jogo valida o formato automaticamente, só precisa ter no mínimo 4 blocos de água conectados e ficar razoavelmente fechada.",
    },
    {
      step_number: 2,
      title: "Jogue um diamante na água",
      body: "Chegue perto da poça e jogue (tecla Q) um diamante em cima da água — é o único item que ativa o portal nessa build (tag twilightforest:portal/activator). O jogo verifica todo item jogado por você num raio pequeno a cada tick.",
    },
    {
      step_number: 3,
      title: "O portal se forma sozinho",
      body: "Se a poça for válida, o diamante é consumido, um raio cai no local e os blocos de água viram Twilight Forest Portal. Ande por dentro pra ser teleportado. Se nada acontecer, ou a poça é pequena demais ou não está numa configuração que o jogo reconhece como fechada — tente aumentá-la.",
    },
  ];
  const { data: insertedSteps, error: stepsError } = await admin
    .from("tutorial_steps")
    .insert(steps.map((s) => ({ ...s, tutorial_id: insertedTutorial.id })))
    .select("id");

  return NextResponse.json({
    ok: !itemsError && !recipesError && !ingredientsError && !tutorialError && !stepsError && !vampUpdateErr && !tfUpdateErr,
    itemsInserted: insertedItems.length,
    recipesInserted: insertedRecipes.length,
    ingredientsInserted: insertedIngredients?.length ?? 0,
    tutorialInserted: !!insertedTutorial,
    stepsInserted: insertedSteps?.length ?? 0,
    errors: {
      ingredientsError: ingredientsError?.message ?? null,
      stepsError: stepsError?.message ?? null,
      vampUpdateErr: vampUpdateErr?.message ?? null,
      tfUpdateErr: tfUpdateErr?.message ?? null,
    },
  });
}
