// Tipos escritos a mao (schema pequeno e estavel — sem `supabase gen types`).

export type ItemRef = {
  id: string;
  slug: string;
  name: string;
};

export type Item = {
  id: string;
  slug: string;
  name: string;
  item_type: string;
  rarity: string | null;
  description: string | null;
  location: {
    dimension?: string;
    biome?: string;
    height?: string;
    method?: string;
    tool?: string;
    alternative?: string;
  } | null;
  tool_required: string | null;
  notes: string | null;
};

export type RecipeIngredient = {
  id: string;
  item_id: string | null;
  item_name_fallback: string | null;
  quantity: number;
  items: ItemRef | null; // embed do postgrest
};

export type Recipe = {
  id: string;
  name: string;
  output_item_id: string | null;
  output_qty: number;
  station: string | null;
  notes: string | null;
  output_item: ItemRef | null;
  recipe_ingredients: RecipeIngredient[];
};

export type TutorialStepItem = {
  id: string;
  item_id: string | null;
  item_name_fallback: string | null;
  quantity: number;
  items: ItemRef | null;
};

export type TutorialStep = {
  id: string;
  step_number: number;
  title: string;
  body: string;
  tutorial_step_items: TutorialStepItem[];
};

export type Tutorial = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  tutorial_steps: TutorialStep[];
};

export type Tip = {
  id: string;
  body: string;
};

export type CommonProblem = {
  id: string;
  question: string;
  causes: string[];
  solution: string | null;
};

export type OriginWeakness = { title: string; impact: string };

export type Origin = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  strengths: string[];
  weaknesses: OriginWeakness[];
  good_for: string[];
  not_recommended_for: string | null;
  playstyle: string | null;
  tip: string | null;
  tips: Tip[];
};

export type ModRelationship = {
  id: string;
  reason: string;
  related_mod: ModRef;
};

export type ModRef = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
};

export type Mod = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  overview: string | null;
  getting_started_steps: string[];
  is_flagship: boolean;
  items: Item[];
  recipes: Recipe[];
  tutorials: Tutorial[];
  tips: Tip[];
  common_problems: CommonProblem[];
  origins: Origin[];
  mod_relationships: ModRelationship[];
};

export type ModCategoryGroup = {
  id: string;
  label: string;
  mods: Mod[];
};

export const CATEGORY_LABELS: Record<string, string> = {
  rpg: "RPG & Poderes",
  mundo: "Exploração & Mundo",
  construcao: "Construção",
  sobrevivencia: "Sobrevivência & Imersão",
  qol: "Mapa & Qualidade de vida",
  performance: "Performance",
  bibliotecas: "Bibliotecas",
};

export const CATEGORY_ORDER = [
  "rpg", "mundo", "construcao", "sobrevivencia", "qol", "performance", "bibliotecas",
];

// pilha de navegacao do modal
export type NavEntry =
  | { type: "list" }
  | { type: "mod"; slug: string }
  | { type: "item"; slug: string }
  | { type: "tutorial"; slug: string }
  | { type: "origin"; slug: string };
