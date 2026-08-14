import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// BATCH 1 de reseed do ModCodex pra troca completa de modpack (Danny's AoT/
// Fabric 1.21.1 -> RPG Anime Modpack/Forge 1.20.1). Apaga todo o conteudo
// do pack antigo (nenhum mod sobreviveu a troca) e recadastra os 76 mods
// reais do pack novo (66 server + 10 client-only, conferido jar a jar em
// server_test/mods/ e mods-client-only/). So dados base aqui (slug/nome/
// categoria/resumo) - conteudo profundo (itens/receitas/tutoriais dos
// mods-pilar) vem nos proximos batches.
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

  // apaga tudo do pack antigo, na ordem certa por causa das FKs.
  const wipeOrder = [
    "tips",
    "common_problems",
    "mod_relationships",
    "tutorial_step_items",
    "tutorial_steps",
    "tutorials",
    "recipe_ingredients",
    "recipes",
    "items",
    "origins",
    "mods",
  ];
  const wipeResults: Record<string, string | null> = {};
  for (const table of wipeOrder) {
    const { error } = await admin.from(table).delete().not("id", "is", null);
    wipeResults[table] = error?.message ?? null;
  }

  type ModRow = {
    slug: string;
    name: string;
    category: string;
    summary: string;
    is_flagship: boolean;
    sort_order: number;
  };

  let n = 0;
  const row = (
    slug: string,
    name: string,
    category: string,
    summary: string,
    is_flagship = false
  ): ModRow => ({ slug, name, category, summary, is_flagship, sort_order: n++ });

  const mods: ModRow[] = [
    // ---- rpg (pilares primeiro) ----
    row(
      "epic-fight",
      "Epic Fight",
      "rpg",
      "Reforma o combate corpo a corpo pra um sistema de combos, guarda e esquiva no estilo anime/souls-like, com barra de stamina — troca o \"clicar botão esquerdo\" padrão do Minecraft por golpes ligados por arma.",
      true
    ),
    row(
      "cataclysm",
      "L_Ender's Cataclysm",
      "rpg",
      "Chefes de fim de jogo (superbosses) espalhados em estruturas de dungeon escondidas, cada uma localizável por um \"olho\" próprio — o pilar de endgame do pack.",
      true
    ),
    row(
      "vampirism",
      "Vampirism",
      "rpg",
      "Sistema de facções: vire caçador de vampiros ou vampiro, cada lado com árvore de habilidades própria (Level Skills / Lord Skills).",
      true
    ),
    row(
      "irons-spells-n-spellbooks",
      "Iron's Spells 'n Spellbooks",
      "rpg",
      "Mod de magia com grimórios (spellbooks) por escola de magia — volta pra fantasia clássica de RPG com conjuração baseada em feitiços.",
      true
    ),
    row(
      "ice-and-fire",
      "Ice and Fire",
      "rpg",
      "Dragões e criaturas mitológicas (hidras, ciclopes, sereias, mirmecoleões, etc) — inclui a Dragonforge, estrutura pra forjar armadura de Dragonsteel com sangue de dragão.",
      true
    ),
    row(
      "ars-nouveau",
      "Ars Nouveau",
      "rpg",
      "Magia baseada em glifos combináveis — monte seus próprios feitiços, crie rituais e invoque familiares mágicos."
    ),
    row(
      "silent-gear",
      "Silent Gear",
      "rpg",
      "Ferramentas, armas e armaduras modulares: escolha cada parte e material pra montar o equipamento do seu jeito."
    ),
    row(
      "spartan-weaponry",
      "Spartan Weaponry",
      "rpg",
      "Arsenal novo de armas corpo a corpo e à distância — lanças, mangual, bestas e mais."
    ),
    row(
      "epic-knights",
      "Epic-Knights: Shields, Armor and Weapons",
      "rpg",
      "Armaduras, escudos e armas de estilo medieval pra completar o visual de combate."
    ),
    row(
      "craziness-awakened",
      "Craziness Awakened",
      "rpg",
      "Revival do clássico Orespawn (\"Orespawned Reawakened\") — minérios, armas e mobs fora da curva, incluindo chefes exclusivos."
    ),

    // ---- mundo (Twilight Forest como pilar) ----
    row(
      "twilight-forest",
      "The Twilight Forest",
      "mundo",
      "Dimensão própria de exploração com progressão por chefes e estruturas (build oficial 4.3.2508). Portal: jogue um diamante numa poça de água de pelo menos 4 blocos.",
      true
    ),
    row(
      "alexs-caves",
      "Alex's Caves",
      "mundo",
      "Biomas de caverna novos e raros escondidos sob a superfície do Overworld."
    ),
    row(
      "alexs-mobs",
      "Alex's Mobs",
      "mundo",
      "Leva de mobs novos e originais espalhados pelo Overworld e outras dimensões."
    ),
    row(
      "mo-creatures",
      "Mo' Creatures: Nostalgia Edition",
      "mundo",
      "Bestiário clássico do Mo' Creatures — dezenas de animais e criaturas novas pelo mundo."
    ),
    row(
      "naturalist",
      "Naturalist",
      "mundo",
      "Fauna nova pro Overworld com comportamento próprio (ursos, lontras, morcegos e mais)."
    ),
    row(
      "enderman-overhaul",
      "Enderman Overhaul",
      "mundo",
      "Endermen variam de aparência conforme o bioma onde nascem."
    ),
    row(
      "terralith",
      "Terralith",
      "mundo",
      "Quase 100 biomas e estruturas novas usando só blocos vanilla, sem descaracterizar o visual padrão do jogo."
    ),
    row(
      "deeper-and-darker",
      "Deeper and Darker",
      "mundo",
      "Expande o Deep Dark: blocos, itens, armadura e mistérios novos pra complementar o bioma."
    ),
    row(
      "roundabout",
      "Roundabout",
      "mundo",
      "Mod temático de JoJo's Bizarre Adventure (Stone Ocean) — adiciona estruturas (Cinderella, sítios de meteorito) e materiais como o minério Aja e a fruta Locacaca."
    ),
    row(
      "mr-dungeons-and-taverns",
      "Dungeons and Taverns",
      "mundo",
      "Datapack de estruturas — dungeons, tavernas e outros pontos de interesse espalhados pelo mundo."
    ),
    row(
      "yungs-better-nether-fortresses",
      "YUNG's Better Nether Fortresses",
      "mundo",
      "Redesenho completo das fortalezas do Nether."
    ),
    row(
      "yungs-better-ocean-monuments",
      "YUNG's Better Ocean Monuments",
      "mundo",
      "Redesenho completo dos monumentos oceânicos."
    ),
    row(
      "natures-spirit",
      "Nature's Spirit",
      "mundo",
      "Expande a flora do jogo com plantas, flores e decoração natural novas."
    ),

    // ---- construcao ----
    row(
      "create",
      "Create",
      "construcao",
      "Tecnologia e contraptions — engrenagens, eixos, esteiras e automação mecânica visual."
    ),
    row(
      "toms-storage",
      "Tom's Simple Storage Mod",
      "construcao",
      "Sistema de armazenamento em rede simples, no estilo vanilla."
    ),

    // ---- sobrevivencia ----
    row(
      "farmers-delight",
      "Farmer's Delight",
      "sobrevivencia",
      "Expansão de fazenda e culinária — pratos, ferramentas e blocos novos de cozinha."
    ),
    row(
      "vinery",
      "[Let's Do] Vinery",
      "sobrevivencia",
      "Cultive uvas, produza vinho e monte sua própria vinícola."
    ),
    row(
      "guard-villagers",
      "Guard Villagers",
      "sobrevivencia",
      "Vilarejos ganham guardas prontos pra defender contra ataques."
    ),

    // ---- qol ----
    row(
      "waystones",
      "Waystones",
      "qol",
      "Marcos de teleporte — ative uma waystone e viaje rápido de volta a ela depois."
    ),
    row(
      "travelers-backpack",
      "Traveler's Backpack",
      "qol",
      "Mochilas grandes e melhoráveis, com integração ao Curios."
    ),
    row(
      "sophisticated-backpacks",
      "Sophisticated Backpacks",
      "qol",
      "Mochilas com upgrades modulares (filtros, funis e mais)."
    ),
    row(
      "natures-compass",
      "Nature's Compass",
      "qol",
      "Localiza o bioma mais próximo de um tipo escolhido."
    ),
    row(
      "veinminer",
      "Veinminer",
      "qol",
      "Minera a veia inteira de um minério de uma vez (como o quick mine de UHC)."
    ),
    row(
      "charm-of-undying",
      "Charm of Undying",
      "qol",
      "Usa o Totem of Undying como acessório (via Curios), sem precisar segurar na mão."
    ),
    row(
      "carry-on",
      "Carry On",
      "qol",
      "Pega e carrega blocos com tile entity (baú, fornalha, etc) só com a mão vazia."
    ),
    row(
      "mouse-tweaks",
      "Mouse Tweaks",
      "qol",
      "Atalhos de mouse extras pra organizar inventário mais rápido."
    ),
    row(
      "clumps",
      "Clumps",
      "qol",
      "Agrupa orbes de XP soltos num só, pra não travar o jogo com centenas deles."
    ),
    row(
      "shulker-box-tooltip",
      "ShulkerBoxTooltip",
      "qol",
      "Mostra o conteúdo de um shulker box na tooltip, sem precisar abrir."
    ),
    row(
      "appleskin",
      "AppleSkin",
      "qol",
      "HUD extra de comida — mostra saturação, regeneração e economia de fome."
    ),
    row(
      "jade",
      "Jade",
      "qol",
      "Mostra informações do bloco ou mob que você está olhando (sucessor do WAILA/Hwyla)."
    ),
    row(
      "jei",
      "Just Enough Items (JEI)",
      "qol",
      "Navegador de itens e receitas — veja como craftar qualquer coisa a qualquer momento."
    ),
    row(
      "xaeros-minimap-worldmap",
      "Xaero's Minimap + Worldmap",
      "qol",
      "Minimapa na tela e mapa em tela cheia auto-preenchido enquanto você explora."
    ),
    row(
      "cut-through",
      "Cut Through",
      "qol",
      "Ataques atravessam bloco transparente (grama alta, etc) sem quebrar o bloco."
    ),
    row(
      "highlighter",
      "Highlighter",
      "qol",
      "Destaca no inventário os itens que você acabou de pegar."
    ),
    row(
      "entity-texture-features",
      "Entity Texture Features",
      "qol",
      "Suporte a texturas de entidade no formato OptiFine (aleatórias, emissivas, etc) via resource pack."
    ),
    row(
      "entity-model-features",
      "Entity Model Features",
      "qol",
      "Suporte a modelos de entidade customizados (CEM) no formato OptiFine."
    ),
    row(
      "not-enough-animations",
      "NotEnoughAnimations",
      "qol",
      "Adiciona e melhora animações em terceira pessoa."
    ),
    row(
      "3d-skin-layers",
      "3d-Skin-Layers",
      "qol",
      "Renderiza a segunda camada da sua skin (jaqueta, mangas) em 3D de verdade, não achatada."
    ),
    row(
      "ambientsounds",
      "AmbientSounds",
      "qol",
      "Expande os sons ambiente do Minecraft por bioma — vento, grutas, criaturas ao longe."
    ),
    row(
      "chat-heads",
      "Chat Heads",
      "qol",
      "Mostra a cabeça de quem está falando do lado da mensagem no chat."
    ),
    row(
      "betterf3",
      "BetterF3",
      "qol",
      "Substitui a tela de debug (F3) padrão por uma versão mais legível e customizável."
    ),

    // ---- performance ----
    row(
      "oculus",
      "Oculus",
      "performance",
      "Fork não-oficial do Iris feito pra funcionar com Forge — habilita shaderpacks no formato OptiFine/Iris. Testado ao vivo com 82 shaders carregados sem crash."
    ),
    row(
      "embeddium",
      "Embeddium",
      "performance",
      "Fork do Rubidium (que por sua vez é fork do Sodium) com patches pro Forge — otimização de renderização."
    ),
    row(
      "oculus-flywheel-compat",
      "Oculus Flywheel Compat",
      "performance",
      "Permite a otimização por instancing do Flywheel (usado pelo Create) funcionar junto com o Oculus."
    ),

    // ---- bibliotecas ----
    row("curios", "Curios API", "bibliotecas", "API de acessórios/equipamento flexível, usada por vários mods do pack (Vampirism, Iron's Spells, Traveler's Backpack, etc)."),
    row("geckolib", "GeckoLib 4", "bibliotecas", "Motor de animação 3D por keyframes, usado por vários mods de mob/entidade do pack."),
    row("citadel", "Citadel", "bibliotecas", "Biblioteca de código compartilhada por vários mods do Alexthe666 (Ice and Fire, Alex's Mobs, Alex's Caves)."),
    row("creativecore", "CreativeCore", "bibliotecas", "Coremod de apoio usado por mods como Mo' Creatures."),
    row("cloth-config", "Cloth Config v10 API", "bibliotecas", "API de telas de configuração usada por vários mods do pack."),
    row("architectury", "Architectury", "bibliotecas", "API intermediária que facilita mods multiplataforma (Forge/Fabric)."),
    row("balm", "Balm", "bibliotecas", "Camada de abstração usada pelos mods do Blay (ex: Waystones)."),
    row("irons-lib", "Iron's Lib", "bibliotecas", "Funcionalidade e conteúdo compartilhado dos mods do Iron431 (Iron's Spells 'n Spellbooks)."),
    row("player-animator", "Player Animator", "bibliotecas", "Biblioteca de animação de jogador usada pelo Iron's Spells 'n Spellbooks."),
    row("puzzles-lib", "Puzzles Lib", "bibliotecas", "Biblioteca de apoio dos mods do Fuzs (Cut Through)."),
    row("iceberg", "Iceberg", "bibliotecas", "Biblioteca de eventos, helpers e utilidades pra facilitar outros mods."),
    row("attributefix", "AttributeFix", "bibliotecas", "Estende os limites máximos de atributo do Minecraft pra permitir valores mais altos."),
    row("lionfishapi", "LionfishAPI", "bibliotecas", "Biblioteca de apoio do L_Ender's Cataclysm."),
    row("yungs-api", "YUNG's API", "bibliotecas", "Biblioteca compartilhada pelos mods do YUNG (Better Nether Fortresses, Better Ocean Monuments)."),
    row("terrablender", "TerraBlender", "bibliotecas", "Biblioteca pra adicionar biomas de forma compatível com o sistema de terreno do Minecraft, usada pelo Terralith."),
    row("lithostitched", "Lithostitched", "bibliotecas", "Biblioteca de configurabilidade e compatibilidade de geração de mundo."),
    row("resourcefulconfig", "Resourcefulconfig", "bibliotecas", "Biblioteca pra criar arquivos de configuração multiplataforma."),
    row("resourcefullib", "Resourceful Lib", "bibliotecas", "Biblioteca de apoio do time Resourceful, usada pelo Enderman Overhaul."),
    row("silent-lib", "Silent Lib", "bibliotecas", "Biblioteca compartilhada dos mods Silent (Silent Gear)."),
    row("sophisticated-core", "Sophisticated Core", "bibliotecas", "Base compartilhada dos mods Sophisticated (Sophisticated Backpacks)."),
    row("pehkui", "Pehkui", "bibliotecas", "Biblioteca que permite redimensionar a maioria das entidades, usada por outros mods do pack."),
  ];

  const { data: insertedMods, error: insertError } = await admin
    .from("mods")
    .insert(mods)
    .select("id, slug");

  return NextResponse.json({
    ok: !insertError,
    wipeResults,
    modsInserted: insertedMods?.length ?? 0,
    insertError: insertError?.message ?? null,
  });
}
