import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rota temporaria de admin — protegida pelo mesmo DOWNLOAD_PASSWORD, usa a
// service role (unica forma de escrever, RLS so libera select pro anon).
// Existe so pra aplicar esse seed pontual e depois some (mesmo padrao ja
// usado pra migration inicial do ModCodex).
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

  const results: Record<string, unknown> = {};

  const newMods = [
    {
      slug: "aether",
      name: "The Aether",
      category: "mundo",
      summary: "Dimensao celestial acessivel por um portal de agua benta — ilhas flutuantes, mobs proprios e progressao de itens separada do overworld.",
      overview: "Uma dimensao nova inteira, paralela ao Nether — voce constroi um portal com Agua Benta (crafta submergindo um balde de agua num altar com Ouro em volta) e atravessa pra um arquipelago de ilhas flutuantes. Tem sua propria progressao de ferramentas/armaduras (comecando em pedras Aether), mobs exclusivos (Moas, Aerwhales, Cocatrices) e chefes proprios.",
      getting_started_steps: [
        "Construa o Altar de Agua Benta (Ouro ao redor de um bloco d'agua) e produza Agua Benta.",
        "Monte o portal do Aether (mesmo formato do portal do Nether) e ative com a Agua Benta.",
        "No Aether, cuidado com a queda — ilhas flutuantes, sem chao continuo.",
        "Progrida pra ferramentas de Zanite/Gravitite explorando as ilhas e derrotando os chefes proprios da dimensao.",
      ],
      is_flagship: false,
      sort_order: 88,
    },
    {
      slug: "deeper-and-darker",
      name: "Deeper and Darker",
      category: "mundo",
      summary: "Expande o Deep Dark com uma dimensao propria (\"O Vazio\"/Otherside), mobs sculk novos e progressao de itens ligada ao bioma.",
      overview: "Adiciona profundidade ao Deep Dark vanilla: novos mobs sculk (Sculk Leech, Stalker, Sludge, Angler Fish), estruturas proprias e um portal pra uma dimensao paralela construida com blocos de Echo. Tematicamente combina bem com o lado \"ameaca subterranea\" do pack.",
      getting_started_steps: [
        "Explore cavernas profundas/Deep Dark vanilla — os mobs novos aparecem la antes mesmo de abrir a dimensao propria.",
        "Junte Echo Blocks (dropados por mobs do mod) pra montar o portal pra dimensao propria.",
        "Tome cuidado com o Stalker — ele reage a barulho, igual o Warden vanilla.",
      ],
      is_flagship: false,
      sort_order: 89,
    },
    {
      slug: "breath-of-nichirin",
      name: "Breath of Nichirin",
      category: "rpg",
      summary: "Combate inspirado em Demon Slayer — forje uma nichirin sword, aprenda estilos de respiracao e enfrente demonios com um sistema de golpes proprio.",
      overview: "Craft a nichirin sword, escolha/aprenda um estilo de respiracao e use a roda de ataque (tecla dedicada) pra executar golpes especiais. Tem progressao propria de combate, separada do combate vanilla/Better Combat.",
      getting_started_steps: [
        "Craft a nichirin sword (receita propria do mod).",
        "Abra a roda de ataque (tecla \"Open Attack Wheel\", ver Controles) pra escolher/usar golpes de respiracao.",
        "Atencao: esse mod registra bastante tecla nova propria — confira em Opcoes > Controles se alguma ficou destacada em vermelho (conflito) antes de jogar.",
      ],
      is_flagship: false,
      sort_order: 90,
    },
    {
      slug: "thepjotyrs-speedsters",
      name: "ThePjotyr's Speedsters",
      category: "rpg",
      summary: "Poderes de velocista inspirados em The Flash — obtidos por raio+pocoes, Acelerador de Particulas, ou craft, com nivel de velocidade que sobe correndo de verdade.",
      overview: "Pra virar speedster: ou e atingido por um raio enquanto sob efeito simultaneo de velocidade+regeneracao+veneno (chance pequena), ou constroi um Acelerador de Particulas e usa durante tempestade, ou craft um traje proprio. Uma vez speedster, correr sobe o \"Speed Level\" (1 a 10+) — niveis altos liberam correr em parede/agua e ate viajar pra Speed Force (dimensao propria do mod). Tem contrapartidas reais: enquanto fasing (Shift no ultimo slot da hotbar) fica invulneravel mas nao consegue atacar.",
      getting_started_steps: [
        "Escolha um jeito de virar speedster: raio+pocoes, Acelerador de Particulas ou craft direto do traje (ver pagina do mod pra receita exata).",
        "Selecione o ultimo slot da hotbar pra ver o indicador de Speed Level acima dela.",
        "Corra continuamente pra subir de nivel — parar de correr desce o nivel de novo.",
      ],
      is_flagship: false,
      sort_order: 91,
    },
    {
      slug: "owo-lib",
      name: "owo-lib",
      category: "bibliotecas",
      summary: "Biblioteca compartilhada exigida pelo Aether e pelo Deeper and Darker — nao tem conteudo proprio pro jogador.",
      getting_started_steps: [],
      is_flagship: false,
      sort_order: 92,
    },
    {
      slug: "tp-core",
      name: "TP-Core",
      category: "bibliotecas",
      summary: "Biblioteca base exigida pelo ThePjotyr's Speedsters — nao tem conteudo proprio pro jogador.",
      getting_started_steps: [],
      is_flagship: false,
      sort_order: 93,
    },
    {
      slug: "azurelib",
      name: "AzureLib",
      category: "bibliotecas",
      summary: "Biblioteca de animacao/modelos exigida pelo Breath of Nichirin — nao tem conteudo proprio pro jogador.",
      getting_started_steps: [],
      is_flagship: false,
      sort_order: 94,
    },
    {
      slug: "terrablender",
      name: "TerraBlender",
      category: "bibliotecas",
      summary: "Biblioteca de geracao de biomas exigida pelo Breath of Nichirin pra registrar os biomas dele no mundo — nao tem conteudo proprio pro jogador.",
      getting_started_steps: [],
      is_flagship: false,
      sort_order: 95,
    },
  ];

  const { data: modsData, error: modsError } = await admin
    .from("mods")
    .upsert(newMods, { onConflict: "slug" })
    .select("slug");
  results.mods = { data: modsData, error: modsError };

  // Corrige a lacuna do Origin Phantom: a origem so tinha "translucido",
  // sem explicar que o voo/flutuar vem do power origins:phasing (ativa
  // junto com o toggle phantomize). Verificado direto no datapack do
  // Origins mod (data/origins/powers/phasing.json + phantomize.json) e na
  // doc oficial (origins.readthedocs.io) — nao inventado.
  const { data: originData, error: originError } = await admin
    .from("origins")
    .update({
      strengths: [
        "Flutua e atravessa blocos ao ativar o modo Phantom (nao cai, nao precisa de asa/foguete)",
        "Boa furtividade (fica parcialmente translucido)",
      ],
      playstyle:
        "Alto risco, alta recompensa — pressione G (Active Power Primary, padrao) pra ativar o modo Phantom: voce fica translucido e ganha o poder de \"phasing\", que deixa atravessar blocos e flutuar livremente sem cair (so precisa de saciedade acima de 6 pra ativar). Pra descer com seguranca, segure Agachar (Shift) em cima de um bloco — desce devagar, bloco a bloco, sem tomar dano de queda. Aperte G de novo pra desativar. Fora do modo Phantom, queima ao sol e sofre fome acelerada normalmente.",
      tip:
        "O voo do Phantom nao e igual Elytra/Aether — e o power \"phasing\" atravessando blocos livremente enquanto o modo tá ativo (tecla G por padrao). So recomendada depois de ja conhecer bem o pack, porque a combinacao de fome acelerada + fragilidade + sensibilidade solar machuca muito um jogador novo.",
    })
    .eq("slug", "phantom")
    .select("slug");
  results.origin_phantom = { data: originData, error: originError };

  return NextResponse.json({ ok: true, results });
}
