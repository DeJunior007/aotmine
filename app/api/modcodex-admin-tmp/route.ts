import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rota temporaria de admin, mesmo padrao de sempre. Corrige a receita do
// ODM Gear: conferi o json real (data/dannys-aot/recipe/odm_gear.json) e a
// info antiga tava errada em dois pontos:
// 1. Nao e crafado "na Bigorna" como estacao/interacao - e uma receita de
//    Bancada normal (minecraft:crafting_shaped) que CONSOME uma Bigorna
//    (minecraft:anvil) como ingrediente comum, junto com o resto.
// 2. Leva 2x ODM Cyllinder, nao 1x (padrao "   /CLC/SAS": C=Cyllinder nos
//    dois lados da fileira do meio).
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
  const RECIPE_ID = "dfa15bdc-ae82-47ec-96a4-0eb1af4b0ee9"; // ODM Gear
  const CYLLINDER_ITEM_ID = "1ac428e6-d64a-4329-9201-bb60e6cf2f62";

  const { data: recipeData, error: recipeError } = await admin
    .from("recipes")
    .update({
      station: "Bancada",
      notes: "Padrão: linha do meio Cyllinder-Couro-Cyllinder, linha de baixo Spring-Bigorna-Spring (a Bigorna é consumida como ingrediente, não é uma estação/interação).",
    })
    .eq("id", RECIPE_ID)
    .select("id");
  const { data: qtyData, error: qtyError } = await admin
    .from("recipe_ingredients")
    .update({ quantity: 2 })
    .eq("recipe_id", RECIPE_ID)
    .eq("item_id", CYLLINDER_ITEM_ID)
    .select("id");
  const { data: anvilData, error: anvilError } = await admin
    .from("recipe_ingredients")
    .insert({ recipe_id: RECIPE_ID, item_name_fallback: "Bigorna (vanilla, consumida)", quantity: 1 })
    .select("id");

  return NextResponse.json({
    ok: true,
    recipe: { data: recipeData, error: recipeError },
    cyllinder_qty_fix: { data: qtyData, error: qtyError },
    anvil_ingredient: { data: anvilData, error: anvilError },
  });
}
