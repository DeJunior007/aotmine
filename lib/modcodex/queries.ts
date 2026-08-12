import { createSupabaseClient } from "@/lib/supabase/client";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CommonProblem,
  type Item,
  type ItemRef,
  type Mod,
  type ModCategoryGroup,
  type ModRef,
  type Origin,
  type Recipe,
  type RecipeIngredient,
  type Tip,
  type Tutorial,
  type TutorialStep,
  type TutorialStepItem,
} from "./types";

/**
 * Busca todo o conteudo do ModCodex do Supabase e monta a arvore aninhada em
 * JS — varias queries simples em vez de um embed unico gigante do PostgREST
 * (mais robusto: cada FK usada em embed aqui e' de mao unica/nao ambigua).
 * Roda no Server Component (app/page.tsx), volume de dados e pequeno.
 */
export async function getModCodex(): Promise<ModCategoryGroup[]> {
  const supabase = createSupabaseClient();

  const [
    modsRes,
    itemsRes,
    recipesRes,
    ingredientsRes,
    tutorialsRes,
    stepsRes,
    stepItemsRes,
    tipsRes,
    problemsRes,
    originsRes,
    relationshipsRes,
  ] = await Promise.all([
    supabase.from("mods").select("*").order("sort_order"),
    supabase.from("items").select("*"),
    supabase.from("recipes").select("*, output_item:items(id,slug,name)"),
    supabase.from("recipe_ingredients").select("*, items(id,slug,name)"),
    supabase.from("tutorials").select("*").order("sort_order"),
    supabase.from("tutorial_steps").select("*").order("step_number"),
    supabase.from("tutorial_step_items").select("*, items(id,slug,name)"),
    supabase.from("tips").select("*"),
    supabase.from("common_problems").select("*").order("sort_order"),
    supabase.from("origins").select("*").order("sort_order"),
    supabase.from("mod_relationships").select("*"),
  ]);

  const firstError = [
    modsRes, itemsRes, recipesRes, ingredientsRes, tutorialsRes, stepsRes,
    stepItemsRes, tipsRes, problemsRes, originsRes, relationshipsRes,
  ].find((r) => r.error);
  if (firstError?.error) {
    throw new Error(`ModCodex query failed: ${firstError.error.message}`);
  }

  const mods = modsRes.data ?? [];
  const items = (itemsRes.data ?? []) as Item[];
  const recipesRaw = recipesRes.data ?? [];
  const ingredientsRaw = (ingredientsRes.data ?? []) as (RecipeIngredient & { recipe_id: string })[];
  const tutorialsRaw = tutorialsRes.data ?? [];
  const stepsRaw = (stepsRes.data ?? []) as (TutorialStep & { tutorial_id: string })[];
  const stepItemsRaw = (stepItemsRes.data ?? []) as (TutorialStepItem & { step_id: string })[];
  const tips = (tipsRes.data ?? []) as (Tip & { mod_id: string | null; item_id: string | null; origin_id: string | null })[];
  const problems = (problemsRes.data ?? []) as (CommonProblem & { mod_id: string })[];
  const originsRaw = originsRes.data ?? [];
  const relationships = (relationshipsRes.data ?? []) as { id: string; mod_id: string; related_mod_id: string; reason: string }[];

  const modBySlugId = new Map(mods.map((m) => [m.id, m]));
  const ingredientsByRecipe = groupBy(ingredientsRaw, (i) => i.recipe_id);
  const stepItemsByStep = groupBy(stepItemsRaw, (i) => i.step_id);
  const tipsByMod = groupBy(tips.filter((t) => t.mod_id), (t) => t.mod_id as string);
  const tipsByOrigin = groupBy(tips.filter((t) => t.origin_id), (t) => t.origin_id as string);
  const problemsByMod = groupBy(problems, (p) => p.mod_id);
  const itemsByMod = groupBy(items, (i) => (i as unknown as { mod_id: string }).mod_id);
  const relationshipsByMod = groupBy(relationships, (r) => r.mod_id);

  const recipes: (Recipe & { mod_id: string })[] = recipesRaw.map((r) => ({
    ...(r as unknown as Recipe & { mod_id: string }),
    output_item: (r as unknown as { output_item: ItemRef | null }).output_item,
    recipe_ingredients: ingredientsByRecipe.get(r.id) ?? [],
  }));
  const recipesByModFinal = groupBy(recipes, (r) => r.mod_id);

  const tutorialSteps: TutorialStep[] = stepsRaw.map((s) => ({
    ...s,
    tutorial_step_items: stepItemsByStep.get(s.id) ?? [],
  }));
  const stepsByTutorialFinal = groupBy(tutorialSteps, (s) => (s as unknown as { tutorial_id: string }).tutorial_id);

  const tutorials: (Tutorial & { mod_id: string })[] = tutorialsRaw.map((t) => ({
    ...(t as unknown as Tutorial & { mod_id: string }),
    tutorial_steps: stepsByTutorialFinal.get(t.id) ?? [],
  }));
  const tutorialsByMod = groupBy(tutorials, (t) => t.mod_id);

  const origins: Origin[] = originsRaw.map((o) => ({
    ...(o as unknown as Origin),
    tips: tipsByOrigin.get(o.id) ?? [],
  }));
  const originsByModFinal = groupBy(origins, (o) => (o as unknown as { mod_id: string }).mod_id);

  const fullMods: Mod[] = mods.map((m) => ({
    ...(m as unknown as Mod),
    items: itemsByMod.get(m.id) ?? [],
    recipes: recipesByModFinal.get(m.id) ?? [],
    tutorials: tutorialsByMod.get(m.id) ?? [],
    tips: tipsByMod.get(m.id) ?? [],
    common_problems: problemsByMod.get(m.id) ?? [],
    origins: originsByModFinal.get(m.id) ?? [],
    mod_relationships: (relationshipsByMod.get(m.id) ?? []).map((r) => {
      const related = modBySlugId.get(r.related_mod_id);
      const relatedRef: ModRef = related
        ? { id: related.id, slug: related.slug, name: related.name, category: related.category, summary: related.summary }
        : { id: r.related_mod_id, slug: "", name: "Mod removido", category: "", summary: null };
      return { id: r.id, reason: r.reason, related_mod: relatedRef };
    }),
  }));

  const byCategory = groupBy(fullMods, (m) => m.category);
  return CATEGORY_ORDER.filter((id) => byCategory.has(id)).map((id) => ({
    id,
    label: CATEGORY_LABELS[id] ?? id,
    mods: byCategory.get(id) ?? [],
  }));
}

function groupBy<T, K>(arr: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of arr) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}
