-- ModCodex wiki: schema completo.
-- Aplicada manualmente via rota temporaria (ver README da rota), documentada aqui
-- pra caso o projeto seja linkado ao Supabase CLI no futuro.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create table if not exists mods (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null, -- rpg | mundo | construcao | sobrevivencia | qol | performance | bibliotecas
  summary text,
  overview text,
  getting_started_steps text[] not null default '{}',
  is_flagship boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists origins (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references mods(id) on delete cascade,
  slug text unique not null,
  name text not null,
  summary text not null,
  strengths text[] not null default '{}',
  weaknesses jsonb not null default '[]', -- [{title, impact}]
  good_for text[] not null default '{}',
  not_recommended_for text,
  playstyle text,
  tip text,
  sort_order int not null default 0
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references mods(id) on delete cascade,
  slug text unique not null,
  name text not null,
  item_type text not null, -- material | equipment | consumable | block | other
  rarity text,
  description text,
  location jsonb, -- {dimension, biome, height, method, tool, alternative}
  tool_required text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references mods(id) on delete cascade,
  name text not null,
  output_item_id uuid references items(id),
  output_qty int not null default 1,
  station text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  item_id uuid references items(id),
  item_name_fallback text,
  quantity int not null default 1,
  check (item_id is not null or item_name_fallback is not null)
);

create table if not exists tutorials (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references mods(id) on delete cascade,
  slug text unique not null,
  title text not null,
  summary text,
  sort_order int not null default 0
);

create table if not exists tutorial_steps (
  id uuid primary key default gen_random_uuid(),
  tutorial_id uuid not null references tutorials(id) on delete cascade,
  step_number int not null,
  title text not null,
  body text not null,
  unique (tutorial_id, step_number)
);

create table if not exists tutorial_step_items (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references tutorial_steps(id) on delete cascade,
  item_id uuid references items(id),
  item_name_fallback text,
  quantity int not null default 1,
  check (item_id is not null or item_name_fallback is not null)
);

create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid references mods(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  origin_id uuid references origins(id) on delete cascade,
  body text not null,
  check (num_nonnulls(mod_id, item_id, origin_id) = 1)
);

create table if not exists common_problems (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references mods(id) on delete cascade,
  question text not null,
  causes text[] not null default '{}',
  solution text,
  sort_order int not null default 0
);

create table if not exists mod_relationships (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references mods(id) on delete cascade,
  related_mod_id uuid not null references mods(id) on delete cascade,
  reason text not null,
  check (mod_id <> related_mod_id),
  unique (mod_id, related_mod_id)
);

create index if not exists idx_origins_mod on origins(mod_id);
create index if not exists idx_items_mod on items(mod_id);
create index if not exists idx_recipes_mod on recipes(mod_id);
create index if not exists idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);
create index if not exists idx_recipe_ingredients_item on recipe_ingredients(item_id);
create index if not exists idx_tutorials_mod on tutorials(mod_id);
create index if not exists idx_tutorial_steps_tutorial on tutorial_steps(tutorial_id);
create index if not exists idx_tutorial_step_items_step on tutorial_step_items(step_id);
create index if not exists idx_tips_mod on tips(mod_id);
create index if not exists idx_tips_item on tips(item_id);
create index if not exists idx_tips_origin on tips(origin_id);
create index if not exists idx_common_problems_mod on common_problems(mod_id);
create index if not exists idx_mod_relationships_mod on mod_relationships(mod_id);

-- RLS: leitura publica (anon+authenticated), sem policy de escrita anonima.
do $$
declare t text;
begin
  for t in select unnest(array[
    'mods','origins','items','recipes','recipe_ingredients',
    'tutorials','tutorial_steps','tutorial_step_items','tips',
    'common_problems','mod_relationships'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_public_read'
    ) then
      execute format(
        'create policy %I on %I for select to anon, authenticated using (true)',
        t || '_public_read', t
      );
    end if;
  end loop;
end $$;
