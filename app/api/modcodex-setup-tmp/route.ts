import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

// Rota temporaria: aplica a migration do ModCodex + popula o seed real.
// Removida do repo assim que a carga for confirmada.
// SQL inline (nao le supabase/migrations/*.sql em runtime — o tracer de build da
// Vercel nao garante incluir um arquivo referenciado so por caminho dinamico).
const MIGRATION_SQL = `
create extension if not exists "pgcrypto";

create table if not exists mods (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
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
  weaknesses jsonb not null default '[]',
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
  item_type text not null,
  rarity text,
  description text,
  location jsonb,
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
`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SeedMod = { name: string; desc?: string; firstSteps?: string[]; tips?: string[] };
type SeedCategory = { id: string; label: string; mods: SeedMod[] };

// Espelha o MOD_CATALOG atual de app/page.tsx (migracao mecanica pros ~90 mods
// que ainda nao ganharam conteudo profundo).
const CATALOG: SeedCategory[] = [
  {
    id: "rpg",
    label: "RPG & Poderes",
    mods: [
      { name: "Origins", desc: "Escolha sua origem ao nascer no mundo — cada uma com poderes e limitações diferentes. É o primeiro mod que decide como você vai jogar." },
      { name: "Danny's AoT", desc: "ODM Gear, titãs e a dimensão de Paradis — o mod central do modpack." },
      { name: "Spell Engine", desc: "Sistema de magias e habilidades ativas em tempo real, com combos.", firstSteps: ["Consiga um item de feitiço inicial — procura por \"spell\" no REI pra ver onde craftar ou achar.", "Feitiços ficam vinculados a itens equipáveis — segure ou equipe o item certo pra conjurar.", "Abre o menu de combos pra ver quais combinações você já desbloqueou."], tips: ["Cada feitiço gasta mana/cooldown — fica de olho na barra antes de spammar.", "Combina melhor junto do Spell Power pra escalar o dano das magias.", "Testa um feitiço novo num mob fraco antes de levar pra luta grande — cada um tem uma janela de uso diferente."] },
      { name: "Spell Power", desc: "Progressão de poder mágico — complementa o Spell Engine.", firstSteps: ["Ganha pontos de poder mágico conforme usa magias — é tipo um nível separado do XP normal.", "Fica de olho na barra de poder mágico na tela, ela cresce enquanto você joga com o Spell Engine."], tips: ["Focar num \"caminho\" de magia só rende mais que espalhar pouco em cada um.", "Combina bem com Artifacts que dão bônus mágico."] },
      { name: "Artifacts", desc: "Itens equipáveis com efeitos únicos, tipo relíquias de RPG.", firstSteps: ["Artefatos aparecem como loot em masmorras e estruturas — Dungeons Arise, Structory e Yung's ajudam a achar mais.", "Equipa no slot de artefato do inventário (mesmo menu do Trinkets)."], tips: ["Nem todo artefato serve pro seu build — lê o efeito com calma antes de equipar.", "Alguns têm efeito negativo junto do positivo — é um trade-off, não é upgrade grátis."] },
      { name: "Trinkets", desc: "Slots extras de acessório pra equipar artefatos e outros itens.", firstSteps: ["Abre o inventário e procura a aba extra de slots de acessório.", "Qualquer item marcado como \"trinket\" por outro mod (Artifacts, por exemplo) encaixa ali."], tips: ["É só a \"prateleira\" onde os acessórios de outros mods encaixam — sozinho ele não adiciona itens novos."] },
      { name: "Better Combat", desc: "Combos, animações e reações de combate mais fluidas.", firstSteps: ["Já funciona automático — o ataque normal já vira combo mais fluido, não precisa configurar nada.", "Segura o botão de ataque perto de um mob pra ver as animações de combo novas."], tips: ["Combina muito bem com Combat Roll pra um combate estilo \"ação\" de verdade.", "Dá pra ajustar a sensibilidade pelo ModMenu se achar rápido ou lento demais."] },
      { name: "Combat Roll", desc: "Esquiva com rolamento — dodge de verdade, não só andar pra trás.", firstSteps: ["A tecla de esquiva costuma ser dupla batida de direção ou uma tecla dedicada — confere em ModMenu → Controls."], tips: ["Rolar tem um cooldown curto — não dá pra ficar rolando infinito pra fugir de tudo.", "Rola PRA FORA do ataque, não em cima dele — timing importa mais que reflexo puro."] },
      { name: "Adventurez", desc: "Conteúdo extra de aventura: mobs, itens e progressão.", firstSteps: ["Adiciona itens e mobs novos espalhados pelo mundo normal — só de explorar você já vai encontrando."], tips: ["Bom mod pra quem gosta de progressão orgânica, sem precisar seguir um guia à risca."] },
      { name: "Bountiful", desc: "Sistema de contratos — aceite bounties e complete objetivos por recompensa.", firstSteps: ["Procure o quadro de recompensas (bounty board) numa vila — ele gera contratos aleatórios.", "Aceite um contrato, cumpra o objetivo (matar um mob, entregar um item) e volte pra pegar a recompensa."], tips: ["Contratos expiram — não aceite um que você não vai conseguir terminar a tempo.", "Bom jeito de ganhar recursos sem precisar farmar sem rumo nenhum."] },
      { name: "Simply Swords", desc: "Lanças, glaives, katanas, chakrams e outras armas novas — mais opção de combate corpo a corpo.", firstSteps: ["Craft pelas receitas normais — aparecem no REI junto dos itens vanilla.", "É compatível oficialmente com o Better Combat — os combos novos funcionam com as armas novas também."], tips: ["Cada arma tem alcance/velocidade diferente — testa mais de uma pra achar seu estilo.", "Boa opção pra variar contra titã — o ODM Gear cuida da mobilidade, a arma certa cuida do dano."] },
      { name: "More Bows and Arrows", desc: "Cerca de 50 arcos e flechas novos, cada um com característica própria.", firstSteps: ["Craft normal — procura no REI pelo nome do arco.", "Flechas especiais (fogo, veneno, etc) combinam com arcos específicos — confere a descrição do item."], tips: ["Bom complemento pro combate corpo a corpo do Simply Swords — cobre o alcance."] },
      { name: "Progressive Archery", desc: "Cadeia de progressão pro arco, igual ferramenta e espada evoluem por tier.", firstSteps: ["Craft o arco básico e vai fazendo upgrade conforme junta material melhor, igual picareta.", "Integrado com o Trinkets — alguns bônus de arco aparecem nos slots de acessório."], tips: ["Combina com o More Bows and Arrows — um dá variedade, o outro dá progressão."] },
      { name: "Bosses of Mass Destruction", desc: "3 chefes opcionais com arena própria: Night Lich (mago), Void Blossom (flor colossal) e Obsidilith (monólito de obsidiana).", firstSteps: ["Procure os altares/estruturas de invocação de cada chefe espalhados pelo mundo.", "Prepara equipamento antes — cada chefe tem mecânica própria de arena."], tips: ["Fica totalmente separado do Danny's AoT — arena e tema diferentes, não compete com os titãs."] },
    ],
  },
  {
    id: "mundo",
    label: "Exploração & Mundo",
    mods: [
      { name: "Naturalist", desc: "47 animais selvagens novos — ursos, leões, girafas, rinocerontes, tubarões e muito mais, cada um com comportamento próprio.", firstSteps: ["Os animais aparecem nos biomas certos (savana pra leão e girafa, floresta pra urso e veado, mar pra tubarão e baleia) — só explorar já acha.", "Alguns têm interação especial — tenta se aproximar com um item específico na mão pra ver o que rola."], tips: ["Predadores caçam de verdade — não é só decoração, alguns bichos são perigosos de verdade.", "Bom mod pra combinar com fazendas e exibições — muitos são \"criáveis\" tipo um zoológico."] },
      { name: "Terralith", desc: "Biomas e terrenos completamente reformulados — muito mais variedade pra explorar.", firstSteps: ["Já funciona automático em qualquer mundo novo — os biomas novos aparecem só de explorar."], tips: ["Se o mundo já existia antes de instalar, os biomas novos só aparecem em chunks nunca gerados antes — bem longe do spawn."] },
      { name: "Repurposed Structures", desc: "Estruturas vanilla espalhadas em mais biomas e variações.", firstSteps: ["Nada de novo pra aprender — templos, iglus, naufrágios e companhia passam a aparecer em mais lugares."] },
      { name: "Structory", desc: "Novas estruturas e masmorras escondidas pelo mundo.", firstSteps: ["Procure construções novas espalhadas pelo mapa, geralmente com loot bom — vale ir mais longe do spawn."], tips: ["Algumas estruturas têm puzzle ou armadilha — cuidado ao entrar sem se preparar."] },
      { name: "Dungeons Arise", desc: "Masmorras customizadas, maiores e mais perigosas.", firstSteps: ["Aparecem geradas naturalmente pelo mundo — normalmente grandes e visíveis de longe."], tips: ["São mais difíceis que masmorra vanilla — vai preparado com armadura, cura e, se der, gente junto."] },
      { name: "Yung's Better Dungeons", desc: "Masmorras vanilla revisadas — mais interessantes e desafiadoras.", firstSteps: ["Substitui a masmorra clássica (sala de spawner) por uma versão revisada e maior."] },
      { name: "Yung's Better Strongholds", desc: "Fortalezas revisadas, com layouts novos.", firstSteps: ["O Eye of Ender ainda guia até lá do mesmo jeito — só o layout de dentro que muda."] },
      { name: "Waystones", desc: "Marque pontos e teleporte rápido entre eles depois.", firstSteps: ["Ache ou construa uma waystone (estrutura própria do mod) e ative ela chegando perto.", "Abre o menu de waystones pra teleportar entre qualquer uma que você já ativou."], tips: ["Ótimo pra cortar tempo de viagem entre base, vila e masmorras favoritas."] },
      { name: "Alex's Caves: Refabricated", desc: "5 biomas de caverna raros escondidos no subsolo, cada um com mobs e loot próprios.", firstSteps: ["Cava fundo — os biomas são raros e ficam nas profundezas, não é logo de cara.", "Cada bioma novo tem perigo e recompensa próprios — vai preparado."], tips: ["Porte da comunidade (não oficial), mas ativo e testado por bastante gente."] },
      { name: "Eternal Nether", desc: "Estruturas e mobs novos no Nether — continuação do clássico Bygone Nether.", firstSteps: ["Explora além do que já conhece no Nether — as estruturas novas ficam espalhadas pelos biomas."], tips: ["Dá mais motivo pra voltar no Nether depois do portal inicial."] },
    ],
  },
  {
    id: "construcao",
    label: "Construção",
    mods: [
      { name: "Macaw's", desc: "Pontes, Portas, Móveis, Cercas, Janelas, Caminhos, Telhados e Alçapões — pacote gigante de blocos decorativos, 8 mods num só.", firstSteps: ["As receitas seguem o padrão vanilla (madeira + formato) — procura no REI pelo bloco base que você já tem."], tips: ["É o pacote todo junto — se não achar uma receita numa categoria (portas, por exemplo), procura nas outras, o catálogo é enorme."] },
      { name: "Supplementaries", desc: "Blocos utilitários e decorativos extras (sinos, luminárias, etc.).", firstSteps: ["Craftável com material vanilla — dá uma olhada no REI pra ver o que já dá pra fazer."], tips: ["Muita coisa é decorativa, mas alguns blocos têm função real (redstone, iluminação inteligente)."] },
      { name: "Chipped", desc: "Blocos decorativos customizáveis com texturas próprias.", firstSteps: ["Permite personalizar a textura de certos blocos decorativos direto no menu do próprio bloco."] },
    ],
  },
  {
    id: "sobrevivencia",
    label: "Sobrevivência & Imersão",
    mods: [
      { name: "Farmer's Delight", desc: "Culinária de verdade — novas plantações, pratos e fogão. Comida deixa de ser só trigo e carne crua.", firstSteps: ["Craft a tábua de corte e a panela — são a base de tudo no mod.", "Planta as culturas novas (tomate, etc) perto da sua fazenda de sempre."], tips: ["Alguns mods que já tínhamos (Supplementaries, Bountiful) ganham receita extra com ele instalado."] },
      { name: "Comforts", desc: "Saco de dormir e rede — avança a noite sem precisar fixar spawn numa cama.", firstSteps: ["Craft o saco de dormir com lã e leva na mochila pra qualquer expedição.", "A rede vira noite em dia, útil se você quer ficar acordado durante o dia."], tips: ["Ótimo pra quem explora longe da base e não quer arriscar mudar o spawn."] },
      { name: "Explorer's Compass", desc: "Aponta a estrutura mais próxima de um tipo escolhido.", firstSteps: ["Craft e clique direito pra abrir o menu de escolha de estrutura.", "Ele mira a direção certa — segue caminhando até achar."], tips: ["Corta muito o tempo de \"andar às cegas\" procurando vila ou masmorra."] },
      { name: "Balanced Ore Detector", desc: "Prospecção por eco-localização — não é raio-x, ainda dá trabalho achar o minério.", firstSteps: ["Craft o detector e usa numa superfície sólida — ele solta 3 estalos que ecoam.", "O eco muda de som e volume dependendo da distância do minério."], tips: ["Configurável — dá pra ajustar o quanto ele facilita, se achar fácil ou difícil demais."] },
      { name: "Easy Villager Fabric", desc: "Gerencia, cria e reproduz aldeões em blocos de vidro — economia de trocas sem sofrimento.", firstSteps: ["Craft o bloco de captura e usa nele pra guardar um aldeão.", "Coloca em displays de vidro pra reproduzir e comerciar em fila."], tips: ["Bom complemento do trade do mercador errante — cobre tanto aldeão fixo quanto errante."] },
      { name: "Gravestones", desc: "Protege seus itens quando você morre — cria uma lápide com tudo guardado dentro.", firstSteps: ["Automático — ao morrer, uma lápide aparece no lugar com seus itens.", "Volta lá e clica na lápide pra recuperar tudo."], tips: ["Essencial numa run onde um titã pode te pegar de surpresa — ninguém perde o inventário inteiro por azar."] },
      { name: "Wandering Trader Trades", desc: "+70 trocas novas pro mercador errante.", firstSteps: ["Só esperar um mercador errante aparecer — as trocas novas já vêm misturadas nele."], tips: ["Passivo — não precisa fazer nada diferente, só enriquece quem já existia."] },
      { name: "Iron Chests", desc: "Baús com tiers, de cobre até obsidiana — cada um com mais espaço que o anterior.", firstSteps: ["Craft o tier mais baixo (cobre) primeiro e upgrada conforme minera material melhor.", "Upgrade é direto: combina baú + material em cima do próprio baú."], tips: ["Bom passo intermediário antes de pensar em rede de armazenamento maior."] },
      { name: "Croptopia", desc: "+250 comidas, 58 plantações e árvores frutíferas novas.", firstSteps: ["Planta as culturas novas junto da fazenda que já tem.", "Muitas receitas novas de comida — confere no REI."], tips: ["Overlap parcial com o Farmer's Delight — os dois juntos dão bastante variedade de comida, sem conflito técnico entre eles."] },
      { name: "Beekeeping", desc: "Apicultura — mel e itens relacionados, comidas e bebidas novas.", firstSteps: ["Constrói uma colmeia perto de flores e colhe o mel depois que as abelhas trabalharem."], tips: ["Complemento pequeno de progressão de comida, baixo risco de conflito com qualquer coisa."] },
      { name: "Actual Fishing", desc: "Pesca de verdade — puxa peixe vivo da água em vez de esperar a vara fisgar sozinha.", firstSteps: ["Usa a vara normal — a diferença aparece na hora de fisgar, agora é ativo."], tips: ["Muda só a mecânica da pescaria, não mexe em mais nada do jogo."] },
    ],
  },
  {
    id: "qol",
    label: "Mapa & Qualidade de vida",
    mods: [
      { name: "Xaero's Minimap + Worldmap", desc: "Minimapa e mapa completo do mundo, com waypoints.", firstSteps: ["O minimapa já aparece no canto da tela assim que você entra no mundo.", "Tecla M abre o mapa completo (worldmap)."], tips: ["Clique direito no mapa pra criar waypoints personalizados (base, masmorra, o que quiser).", "Death points marcam sozinhos onde você morreu — ajuda a recuperar os itens depois."] },
      { name: "Jade", desc: "Mostra informação do bloco/mob que você mira, tipo um HUD de inspeção.", firstSteps: ["Só mirar num bloco ou mob já mostra a informação na tela, não precisa apertar nada."], tips: ["Dá pra configurar o que aparece (vida do mob, progresso do bloco) no config do mod."] },
      { name: "Roughly Enough Items (REI)", desc: "Visualizador de receitas e itens — abre com uma tecla.", firstSteps: ["Tecla padrão R (ou o ícone lateral) abre o catálogo de itens e receitas.", "Segure R em cima de um item no inventário pra ver a receita dele na hora."], tips: ["Funciona também pra ver \"pra que esse item serve\" (usage), não só a receita dele."] },
      { name: "Inventory Profiles Next", desc: "Organiza e ordena inventário/baú automaticamente.", firstSteps: ["Clique com o botão do meio (ou a tecla configurada) num baú/inventário pra ordenar automático."], tips: ["Dá pra criar regras de ordenação customizadas no config, se quiser mais controle."] },
      { name: "Mouse Tweaks", desc: "Arrasta e solta itens mais rápido com o mouse.", firstSteps: ["Já funciona sozinho: arraste segurando o botão sobre vários slots pra mover/dividir itens em massa."] },
      { name: "ModMenu", desc: "Tela central pra configurar todos os mods que têm config.", firstSteps: ["Vai em Options (ou o botão que aparece na tela título) e procura \"Mods\" — lista tudo e abre o config de quem tem."] },
      { name: "Zoomify", desc: "Zoom na câmera com uma tecla.", firstSteps: ["Tecla padrão C — segura pra dar zoom na câmera."], tips: ["Dá pra trocar a tecla e o nível de zoom pelo ModMenu."] },
      { name: "Controlify", desc: "Suporte completo a controle (joystick).", firstSteps: ["Conecta o controle antes de abrir o jogo — ele detecta automático."], tips: ["Tem perfis prontos pra Xbox, PlayStation e genérico no menu do próprio mod."] },
      { name: "Better Third Person", desc: "Câmera em terceira pessoa mais suave e configurável.", firstSteps: ["Aperta F5 (padrão do Minecraft) pra entrar em terceira pessoa — a câmera já vem mais suave."], tips: ["Ajusta distância e ângulo da câmera pelo ModMenu se quiser um enquadramento diferente."] },
      { name: "Not Enough Animations", desc: "Animações extras do personagem (sentar, rastejar, etc.).", firstSteps: ["Automático — sentar (clicando em escada/degrau certo) e rastejar em espaço baixo já funcionam sem configurar nada."] },
      { name: "AppleSkin", desc: "Mostra saturação e regeneração de fome na tela.", firstSteps: ["Só olhar a barra de fome — agora ela mostra também a saturação escondida por baixo."] },
      { name: "Traveler's Backpack", desc: "Mochila extra equipável, com upgrades.", firstSteps: ["Craft a mochila (receita padrão com couro/material de bicho — confere no REI) e equipa nas costas.", "Clique direito no ar (ou a tecla configurada) pra abrir o inventário dela sem tirar."], tips: ["Dá pra fazer upgrade dela (mais espaço, tanque de água) dependendo do que você encontrar."] },
      { name: "Presence Footsteps", desc: "Sons de passos que mudam com o tipo de piso.", firstSteps: ["Automático — só andar em superfícies diferentes já muda o som."] },
      { name: "Sound Physics Remastered", desc: "Áudio realista — eco e abafamento de som por ambiente.", firstSteps: ["Automático — cavernas e ambientes fechados já ganham eco na hora."] },
      { name: "Bobby", desc: "Mantém chunks carregados de longe no client, visual mais completo.", firstSteps: ["Aumenta a distância de chunks carregados no seu client além do que o servidor manda — ajusta a distância no config do mod se quiser."], tips: ["É só visual/client — não muda a distância real de simulação (mobs, redstone) do servidor."] },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    mods: [
      { name: "Sodium + Lithium", desc: "Motor de renderização e de física otimizados — mais FPS, menos travamento.", firstSteps: ["Não precisa fazer nada — já otimiza render e física assim que o jogo abre."], tips: ["Se quiser mexer em configs avançadas, agora tem um menu de vídeo próprio do Sodium, bem mais rápido que o vanilla."] },
      { name: "Indium", desc: "Compatibilidade do Sodium com mods que mexem em iluminação.", firstSteps: ["Só existe pra fazer o Sodium funcionar com mods de iluminação — não tem nada pra configurar."] },
      { name: "Krypton", desc: "Otimiza a rede — menos lag de conexão com o servidor.", firstSteps: ["Automático, otimiza a rede em segundo plano — sem tela nem configuração."] },
      { name: "FerriteCore", desc: "Reduz uso de memória RAM do jogo.", firstSteps: ["Automático — só roda por baixo dos panos reduzindo o consumo de RAM."] },
      { name: "ModernFix", desc: "Correções e otimizações gerais de carregamento.", firstSteps: ["Automático na maior parte — algumas otimizações têm config próprio se quiser mexer."] },
      { name: "C2ME", desc: "Geração de chunks em paralelo — mundo carrega mais rápido.", firstSteps: ["Automático — só faz o mundo carregar mais rápido enquanto você anda ou voa."] },
      { name: "EntityCulling", desc: "Para de renderizar entidades que não estão realmente visíveis.", firstSteps: ["Automático — simplesmente não renderiza entidades escondidas atrás de blocos ou fora da visão."] },
    ],
  },
  {
    id: "bibliotecas",
    label: "Bibliotecas",
    mods: [
      { name: "Fabric API" }, { name: "Fabric Language Kotlin" }, { name: "GeckoLib" },
      { name: "Player Animation Lib" }, { name: "Cloth Config" }, { name: "Cardinal Components API" },
      { name: "Forge Config API Port" }, { name: "MidnightLib" }, { name: "LibIPN" }, { name: "Kambrik" },
      { name: "Prickle" }, { name: "Resourceful Lib" }, { name: "Lithostitched" }, { name: "Moonlight" },
      { name: "Bookshelf" }, { name: "Puzzles Lib" }, { name: "Athena" }, { name: "AAA Particles" },
      { name: "EnchDesc" }, { name: "Continuity" }, { name: "Balm" }, { name: "Yung's API" },
      { name: "Architectury API" }, { name: "Fzzy Config" }, { name: "PneumonoCore" }, { name: "MonoLib" },
      { name: "UnionLib" }, { name: "CreativeCore" },
    ],
  },
];

// Origins reais, extraidas de data/origins/origins/*.json do jar do mod (10 origins
// confirmadas — bate com "Registry contains 10 origins" no log de boot).
const ORIGINS = [
  {
    slug: "human", name: "Human", summary: "A origem padrão — sem poderes especiais, sem penalidades. Joga o Minecraft normal, sem risco e sem vantagem.",
    strengths: ["Nenhuma limitação — come, anda na água, pega sol sem problema", "Mais previsível pra quem tá começando"],
    weaknesses: [], good_for: ["Quem tá testando o servidor pela primeira vez", "Quem prefere jogar sem mecânica extra pra pensar"],
    not_recommended_for: "Quem quer aproveitar o sistema de Origins de verdade — sem poder nenhum, é basicamente jogar sem o mod.",
    playstyle: "Igual ao Minecraft vanilla — nenhum poder ativo/passivo, nenhuma restrição.",
    tip: "Boa escolha só pra primeira sessão, enquanto você decide qual origem de verdade quer testar depois (dá pra trocar com um item específico).",
  },
  {
    slug: "avian", name: "Avian", summary: "Origem alada — queda lenta e bônus no ar, mas vegetariana e reprodução por ovos.",
    strengths: ["Queda lenta — sem dano de queda normal", "Regenera fôlego mais rápido debaixo d'água", "Impulso extra no ar (tailwind)", "Bônus de conforto em espaço aberto"],
    weaknesses: [
      { title: "Vegetariano", impact: "Não pode comer carne — sua fonte de comida fica restrita a itens vegetais, o que limita opções de fazenda de comida rápida." },
      { title: "Põe ovos", impact: "Mecânica de reprodução ligada a ovos em vez do sistema normal — efeito situacional, não é desvantagem de combate." },
    ],
    good_for: ["Exploração vertical (torres, penhascos, quedas)", "Combinar com o início do ODM Gear — reduz o medo de errar uma manobra"],
    not_recommended_for: "Quem depende de carne como base de comida ou não quer lidar com restrição alimentar.",
    playstyle: "Foco em mobilidade aérea/vertical — cai sem se machucar, se dá bem em espaços abertos.",
    tip: "Combina bem com o começo do ODM Gear — a queda lenta ajuda a sobreviver aos erros de manobra enquanto você ainda tá aprendendo o gancho.",
  },
  {
    slug: "arachnid", name: "Arachnid", summary: "Escala paredes como uma aranha, mas é frágil e só come carne.",
    strengths: ["Escala paredes (climbing)", "Anda em teia de aranha sem ficar preso"],
    weaknesses: [
      { title: "Carnívoro", impact: "Só come carne — plantações e comidas vegetais não saciam fome, restringe a base alimentar." },
      { title: "Frágil", impact: "Recebe mais dano que o normal — precisa compensar com armadura ou cautela extra em combate." },
      { title: "Artrópode", impact: "Sofre efeito de armas/poções feitas contra artrópodes — vira alvo fácil pra esse tipo específico." },
    ],
    good_for: ["Exploração vertical sem elytra/ODM Gear", "Builds de combate carnívoro"],
    not_recommended_for: "Quem já sofre com sobrevivência básica — a fragilidade + dependência de carne torna o early game mais arriscado.",
    playstyle: "Mobilidade por escalada em vez de voo — bom pra cavernas e estruturas verticais, mas mais frágil em combate direto.",
    tip: "A fragilidade dói mais contra titã — se escolher essa origem, prioriza armadura cedo.",
  },
  {
    slug: "elytrian", name: "Elytrian", summary: "Nasce com elytra equipada e voa livremente, mas só usa armadura leve e sofre em espaço fechado.",
    strengths: ["Já nasce com elytra e pode se lançar no ar sem foguete toda hora", "Combate aéreo melhorado"],
    weaknesses: [
      { title: "Armadura leve", impact: "Só pode usar armaduras leves — peças mais protetoras ficam fora de alcance, limitando o teto de defesa." },
      { title: "Claustrofobia", impact: "Sofre penalidade em espaços fechados/apertados — cavernas estreitas e masmorras viram desafio extra." },
      { title: "Mais dano cinético", impact: "Recebe mais dano de queda/impacto que o normal — precisa administrar melhor os pousos." },
    ],
    good_for: ["Exploração aérea de longa distância", "Combate no ar"],
    not_recommended_for: "Quem pretende passar muito tempo em masmorras/cavernas fechadas, ou quer usar armadura pesada.",
    playstyle: "Vive no ar — elytra sempre à mão, mobilidade extrema, mas fraco em espaço fechado e limitado na armadura.",
    tip: "Se sua ideia é usar o ODM Gear como meio de voo principal, pensa se quer os dois sistemas de mobilidade juntos ou prefere uma origem que complemente em vez de repetir a função dele.",
  },
  {
    slug: "blazeborn", name: "Blazeborn", summary: "Imune a fogo e nasce no Nether, mas água causa dano de verdade.",
    strengths: ["Imunidade total a fogo/lava", "Nasce no Nether — já começa perto de recursos de lá", "Bônus quando está pegando fogo"],
    weaknesses: [
      { title: "Vulnerabilidade à água", impact: "Água causa dano direto — chuva, rio, oceano e até um balde jogado nele viram ameaça real, não só desconforto." },
      { title: "Dano de bola de neve e poções", impact: "Itens inofensivos pra qualquer outra origem (neve, poções de cura de outro jogador) causam dano nele." },
    ],
    good_for: ["Quem quer basear a run no Nether", "Combate contra mobs de fogo/lava sem medo"],
    not_recommended_for: "Quem quer explorar bioma de água, praia ou construir perto de rio/oceano sem se planejar.",
    playstyle: "Imune a fogo, mas literalmente ferido por água — a run inteira gira em torno de evitar água.",
    tip: "Se pegar essa origem, evita completamente pontes/barcos sobre água aberta sem necessidade.",
  },
  {
    slug: "enderian", name: "Enderian", summary: "Alcance extra e afinidade com pérola de Ender, mas vulnerável à água e hostil a abóbora.",
    strengths: ["Alcance extra pra interagir com blocos/entidades", "Afinidade com pérola de Ender pra teleporte"],
    weaknesses: [
      { title: "Vulnerabilidade à água", impact: "Mesmo problema do Blazeborn — água causa dano, limita exploração aquática." },
      { title: "Ódio de abóbora", impact: "Efeito negativo relacionado a abóbora, referência aos endermen vanilla que evitam olhar pra ela." },
      { title: "Dano de poções", impact: "Poções de cura/benefício de outros jogadores causam dano nele em vez de ajudar." },
    ],
    good_for: ["Exploração do End", "Quem gosta de jogar com teleporte constante"],
    not_recommended_for: "Quem quer nadar/pescar/explorar oceano sem restrição.",
    playstyle: "Focado em teleporte e alcance, com a mesma fragilidade a água do Blazeborn.",
    tip: "Evita carregar abóbora no inventário — a própria origem já é hostil a esse item.",
  },
  {
    slug: "feline", name: "Feline", summary: "Imune a queda e ágil, mas com braços fracos no corpo a corpo.",
    strengths: ["Imunidade total a dano de queda", "Pulo com corrida melhorado", "Passos silenciosos", "Visão no escuro", "Assusta creepers, evitando explosão por perto"],
    weaknesses: [
      { title: "Braços fracos", impact: "Dano corpo a corpo reduzido — combate direto fica mais fraco, precisa compensar com arco ou magia." },
    ],
    good_for: ["Exploração vertical sem medo de queda", "Combate furtivo", "Quem prefere dano à distância"],
    not_recommended_for: "Quem quer focar 100% em combate corpo a corpo com espada.",
    playstyle: "Ágil e seguro em altura, mas fraco na porrada — combina bem com arco ou magia pra compensar.",
    tip: "Como os braços são fracos, considera usar arco (More Bows and Arrows) ou magia (Spell Engine) como dano principal em vez de espada.",
  },
  {
    slug: "merling", name: "Merling", summary: "Vive n'água com respiração e natação melhoradas, mas sofre penalidade em terra firme.",
    strengths: ["Respira embaixo d'água sem limite", "Enxerga bem debaixo d'água", "Minera mais rápido embaixo d'água", "Nada mais rápido"],
    weaknesses: [
      { title: "Aquático", impact: "Fora d'água sofre penalidade contínua — precisa se manter perto de água regularmente ou a run fica desconfortável em terra firme." },
    ],
    good_for: ["Exploração de oceano e caverna aquática", "Bases construídas perto/dentro d'água"],
    not_recommended_for: "Quem quer construir uma base totalmente em terra firme longe de água, ou explorar deserto/savana por muito tempo.",
    playstyle: "Vive n'água — precisa se manter hidratado (literalmente) ou sofre penalidade em terra.",
    tip: "Planeja a base perto de rio, lago ou oceano — com essa origem, longe d'água vira desconfortável rápido.",
  },
  {
    slug: "phantom", name: "Phantom", summary: "Etéreo e furtivo, mas queima ao sol e sofre fome acelerada — a origem mais punitiva do pack.",
    strengths: ["Pode ficar parcialmente translúcido/atravessar situações normais", "Boa furtividade"],
    weaknesses: [
      { title: "Queima ao sol", impact: "Luz do dia direta causa dano — precisa se abrigar ou evitar exposição solar, parecido com zumbi/esqueleto vanilla." },
      { title: "Fome constante", impact: "Perde saciedade mais rápido que o normal — precisa comer com mais frequência." },
      { title: "Frágil", impact: "Recebe mais dano — combinado com a fome acelerada, é a origem com mais restrições simultâneas do pack." },
    ],
    good_for: ["Jogador experiente que gosta de desafio", "Furtividade/exploração noturna"],
    not_recommended_for: "Iniciantes — é a origem com mais restrições simultâneas (sol, fome, fragilidade) do pack.",
    playstyle: "Alto risco, alta recompensa — furtivo e etéreo, mas queima no sol, come mais rápido e apanha mais fácil.",
    tip: "Só recomendada depois de já conhecer bem o pack — a combinação de fome acelerada + fragilidade + sensibilidade solar machuca muito um jogador novo.",
  },
  {
    slug: "shulk", name: "Shulk", summary: "Inventário extra e braços fortes, mas sem escudo e com mais exaustão.",
    strengths: ["Inventário extra tipo shulker — carrega mais sem mochila", "Armadura natural mesmo sem equipar nada", "Braços fortes — mais dano corpo a corpo e mineração mais rápida"],
    weaknesses: [
      { title: "Sem escudo", impact: "Não pode usar escudo — perde a defesa de bloqueio, precisa confiar em esquiva (Combat Roll) ou armadura." },
      { title: "Mais exaustão", impact: "Gasta saciedade mais rápido em atividade física — precisa comer com mais frequência que o normal." },
    ],
    good_for: ["Combate corpo a corpo agressivo (já que não tem escudo mesmo)", "Mineração rápida"],
    not_recommended_for: "Quem depende de escudo pra jogar defensivo.",
    playstyle: "Tanque ofensivo sem escudo — armadura natural compensa um pouco, mas o foco é atacar, não bloquear.",
    tip: "Sem escudo, o Combat Roll (esquiva) vira sua defesa principal — treina o timing da rolada.",
  },
];

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.DOWNLOAD_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const step = req.nextUrl.searchParams.get("step") || "all";

  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "sem POSTGRES_URL" }, { status: 500 });
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  const log: string[] = [];

  try {
    await client.connect();

    if (step === "all" || step === "migrate") {
      await client.query(MIGRATION_SQL);
      log.push("migration aplicada");
    }

    if (step === "all" || step === "seed") {
      await client.query("begin");

      // 1) mods do catalogo mecanico
      const modIdBySlug = new Map<string, string>();
      let order = 0;
      for (const cat of CATALOG) {
        for (const m of cat.mods) {
          const slug = slugify(m.name);
          const res = await client.query(
            `insert into mods (slug, name, category, summary, getting_started_steps, sort_order)
             values ($1,$2,$3,$4,$5,$6)
             on conflict (slug) do update set summary = excluded.summary
             returning id`,
            [slug, m.name, cat.id, m.desc ?? null, m.firstSteps ?? [], order++]
          );
          const modId = res.rows[0].id as string;
          modIdBySlug.set(slug, modId);
          for (const tip of m.tips ?? []) {
            await client.query(
              `insert into tips (mod_id, body) values ($1,$2)`,
              [modId, tip]
            );
          }
        }
      }
      log.push(`mods inseridos: ${modIdBySlug.size}`);

      // 2) Danny's AoT — conteudo profundo real
      const aotId = modIdBySlug.get("dannys-aot")!;
      await client.query(
        `update mods set is_flagship = true, overview = $2 where id = $1`,
        [
          aotId,
          "O sistema central do mod é o ODM Gear (Omni-Directional Mobility Gear) — um equipamento que permite se mover rapidamente pelo mundo usando ganchos e propulsão a gás. Ele é montado a partir de peças craftadas numa bigorna, e cada peça tem sua própria cadeia de fabricação com materiais próprios do mod, como o [[item:ultrahard-steel-ingot|Ultrahard Steel Ingot]]. Além do ODM Gear, o mod adiciona os titãs (de Titãs Puros aos Nove Titãs — Colossal, Ataque, Blindado, Fritz e outros) e a dimensão de Paradis, acessível por um portal próprio. Se você nunca usou o mod, comece pelo tutorial [[tutorial:primeiro-odm-gear|Como conseguir seu primeiro ODM Gear]].",
        ]
      );

      const items: Record<string, string> = {};
      const itemDefs: { slug: string; name: string; item_type: string; description: string; location: object | null }[] = [
        { slug: "odm-gear", name: "ODM Gear", item_type: "equipment", description: "O equipamento principal do mod — ganchos + propulsão a gás pra se mover rápido pelo mundo.", location: null },
        { slug: "odm-cyllinder", name: "ODM Cyllinder", item_type: "component", description: "Componente central do ODM Gear, monta os fios e o gás.", location: null },
        { slug: "odm-spring", name: "ODM Spring", item_type: "component", description: "Componente de mola do ODM Gear.", location: null },
        { slug: "odm-wires", name: "ODM Wires", item_type: "component", description: "Fios usados em quase todos os componentes do ODM Gear.", location: null },
        { slug: "ultrahard-steel-ingot", name: "Ultrahard Steel Ingot", item_type: "material", description: "Material base de quase toda a cadeia de crafting do ODM Gear. Não encontramos receita nem loot table pra ele nos dados do mod — provavelmente é processado na 'Hardened Furnace' via lógica própria do mod, não uma receita de dados comum.", location: { method: "Não confirmado — sem receita/loot table nos dados do mod" } },
        { slug: "ice-burst-cluster", name: "Ice Burst Cluster", item_type: "material", description: "Material usado no ODM Cyllinder.", location: { method: "Minerado do bloco Ice Burst Stone (confirmado via loot table)" } },
        { slug: "ice-burst-stone", name: "Ice Burst Stone", item_type: "block", description: "Bloco que dropa Ice Burst Cluster ao ser minerado.", location: { dimension: "Não confirmado" } },
      ];
      for (const it of itemDefs) {
        const res = await client.query(
          `insert into items (mod_id, slug, name, item_type, description, location)
           values ($1,$2,$3,$4,$5,$6) on conflict (slug) do update set description = excluded.description returning id`,
          [aotId, it.slug, it.name, it.item_type, it.description, it.location ? JSON.stringify(it.location) : null]
        );
        items[it.slug] = res.rows[0].id;
      }

      async function addRecipe(name: string, outputSlug: string, outputQty: number, station: string, ingredients: { slug?: string; fallback?: string; qty: number }[]) {
        const r = await client.query(
          `insert into recipes (mod_id, name, output_item_id, output_qty, station) values ($1,$2,$3,$4,$5) returning id`,
          [aotId, name, items[outputSlug], outputQty, station]
        );
        const recipeId = r.rows[0].id;
        for (const ing of ingredients) {
          await client.query(
            `insert into recipe_ingredients (recipe_id, item_id, item_name_fallback, quantity) values ($1,$2,$3,$4)`,
            [recipeId, ing.slug ? items[ing.slug] : null, ing.fallback ?? null, ing.qty]
          );
        }
        return recipeId;
      }

      await addRecipe("ODM Gear", "odm-gear", 1, "Bigorna", [
        { slug: "odm-cyllinder", qty: 1 },
        { fallback: "Couro (vanilla)", qty: 1 },
        { slug: "odm-spring", qty: 2 },
      ]);
      await addRecipe("ODM Cyllinder", "odm-cyllinder", 1, "Bancada", [
        { slug: "odm-wires", qty: 4 },
        { slug: "ultrahard-steel-ingot", qty: 4 },
        { slug: "ice-burst-cluster", qty: 1 },
      ]);
      await addRecipe("ODM Spring", "odm-spring", 1, "Bancada", [
        { slug: "ultrahard-steel-ingot", qty: 2 },
        { slug: "odm-wires", qty: 1 },
      ]);
      await addRecipe("ODM Wires", "odm-wires", 1, "Bancada", [
        { fallback: "Barbante (vanilla)", qty: 8 },
        { slug: "ultrahard-steel-ingot", qty: 1 },
      ]);
      log.push("receitas do ODM Gear inseridas");

      const tut = await client.query(
        `insert into tutorials (mod_id, slug, title, summary) values ($1,$2,$3,$4) returning id`,
        [aotId, "primeiro-odm-gear", "Como conseguir seu primeiro ODM Gear", "Passo a passo da cadeia de crafting real do ODM Gear, do material base até o primeiro voo."]
      );
      const tutId = tut.rows[0].id;
      const steps: { title: string; body: string; items: { slug?: string; fallback?: string; qty: number }[] }[] = [
        { title: "Consiga Ultrahard Steel Ingot", body: "Base de quase toda a cadeia. Não temos confirmação de como obtê-lo (não achamos receita nem loot table nos dados do mod — provavelmente envolve a 'Hardened Furnace'). Se souber o método real, nos ajude a documentar.", items: [{ slug: "ultrahard-steel-ingot", qty: 7 }] },
        { title: "Craft ODM Wires", body: "8x Barbante + 1x [[item:ultrahard-steel-ingot|Ultrahard Steel Ingot]] numa bancada.", items: [{ fallback: "Barbante (vanilla)", qty: 8 }, { slug: "ultrahard-steel-ingot", qty: 1 }] },
        { title: "Craft 2x ODM Spring", body: "Cada Spring: 2x [[item:ultrahard-steel-ingot|Ultrahard Steel Ingot]] + 1x [[item:odm-wires|ODM Wires]] numa bancada.", items: [{ slug: "ultrahard-steel-ingot", qty: 4 }, { slug: "odm-wires", qty: 2 }] },
        { title: "Consiga Ice Burst Cluster", body: "Minere o bloco [[item:ice-burst-stone|Ice Burst Stone]] — ele dropa o Cluster ao ser quebrado.", items: [{ slug: "ice-burst-cluster", qty: 1 }] },
        { title: "Craft ODM Cyllinder", body: "4x [[item:odm-wires|ODM Wires]] + 4x [[item:ultrahard-steel-ingot|Ultrahard Steel Ingot]] + 1x [[item:ice-burst-cluster|Ice Burst Cluster]] numa bancada.", items: [{ slug: "odm-wires", qty: 4 }, { slug: "ultrahard-steel-ingot", qty: 4 }, { slug: "ice-burst-cluster", qty: 1 }] },
        { title: "Monte o ODM Gear na Bigorna", body: "1x [[item:odm-cyllinder|ODM Cyllinder]] + 1x Couro + 2x [[item:odm-spring|ODM Spring]] — só monta numa Bigorna, não numa bancada comum.", items: [{ slug: "odm-cyllinder", qty: 1 }, { fallback: "Couro (vanilla)", qty: 1 }, { slug: "odm-spring", qty: 2 }] },
        { title: "Use pela primeira vez", body: "Equipe o ODM Gear e pratica num lugar seguro. Teclas padrão: Hook Left / Hook Right pra ganchar, Reload Blade pra recarregar a lâmina. Confira/ajuste no ModMenu se precisar remapear.", items: [] },
      ];
      let stepN = 1;
      for (const s of steps) {
        const sr = await client.query(
          `insert into tutorial_steps (tutorial_id, step_number, title, body) values ($1,$2,$3,$4) returning id`,
          [tutId, stepN++, s.title, s.body]
        );
        const stepId = sr.rows[0].id;
        for (const it of s.items) {
          await client.query(
            `insert into tutorial_step_items (step_id, item_id, item_name_fallback, quantity) values ($1,$2,$3,$4)`,
            [stepId, it.slug ? items[it.slug] : null, it.fallback ?? null, it.qty]
          );
        }
      }
      log.push("tutorial do ODM Gear inserido");

      await client.query(
        `insert into common_problems (mod_id, question, causes) values ($1,$2,$3)`,
        [aotId, "Não consigo craftar o ODM Gear", [
          "Falta um dos 3 componentes (ODM Cyllinder, Couro ou os 2 ODM Spring)",
          "Não está usando uma Bigorna — o ODM Gear só é montado nela, não numa bancada comum",
          "Algum componente foi craftado errado — confira a receita de cada peça separadamente",
        ]]
      );
      await client.query(
        `insert into common_problems (mod_id, question, causes) values ($1,$2,$3)`,
        [aotId, "Os ganchos do ODM Gear não estão funcionando", [
          "Confira se as teclas Hook Left / Hook Right estão configuradas (podem ter sido remapeadas ou conflitar com outro mod)",
          "Pode ser necessário recarregar a lâmina (tecla Reload Blade) antes de usar",
        ]]
      );

      for (const [slug, reason] of [
        ["origins", "Algumas origens (como Elytrian, que já dá elytra e voo) podem sobrepor com a mobilidade do ODM Gear — vale escolher uma que complemente em vez de repetir a função de voo/gancho."],
        ["better-combat", "O combate corpo a corpo do ODM Gear (lâmina) se beneficia dos combos e animações do Better Combat."],
        ["simply-swords", "Armas extras do Simply Swords são compatíveis com o Better Combat e podem ser usadas como alternativa à lâmina do ODM Gear."],
        ["trinkets", "Slots de acessório do Trinkets podem equipar artefatos que dão bônus de combate, complementando o combate contra titãs."],
      ] as const) {
        const relatedId = modIdBySlug.get(slug);
        if (relatedId) {
          await client.query(
            `insert into mod_relationships (mod_id, related_mod_id, reason) values ($1,$2,$3) on conflict do nothing`,
            [aotId, relatedId, reason]
          );
        }
      }
      log.push("problemas comuns e relacionamentos do Danny's AoT inseridos");

      // 3) Origins — 10 origins reais
      const originsModId = modIdBySlug.get("origins")!;
      await client.query(
        `update mods set is_flagship = true, overview = $2 where id = $1`,
        [originsModId, "Origins deixa você escolher uma origem ao nascer no mundo — cada uma com poderes e limitações reais, não é só cosmético. O servidor roda com 1 layer de origem ativa (uma escolha só). Dá pra trocar depois com um item específico (orb of origin)."]
      );
      let originOrder = 0;
      for (const o of ORIGINS) {
        const r = await client.query(
          `insert into origins (mod_id, slug, name, summary, strengths, weaknesses, good_for, not_recommended_for, playstyle, tip, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           on conflict (slug) do update set summary = excluded.summary returning id`,
          [originsModId, o.slug, o.name, o.summary, o.strengths, JSON.stringify(o.weaknesses), o.good_for, o.not_recommended_for, o.playstyle, o.tip, originOrder++]
        );
        void r;
      }
      log.push(`origins inseridas: ${ORIGINS.length}`);

      await client.query("commit");
    }

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    await client.query("rollback").catch(() => {});
    return NextResponse.json({ error: String(err), log }, { status: 500 });
  } finally {
    await client.end();
  }
}
