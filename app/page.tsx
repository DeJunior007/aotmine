import { cookies } from "next/headers";
import Image from "next/image";
import { CopyAddress } from "@/components/CopyAddress";
import { EmblemCube } from "@/components/EmblemCube";
import { AccessGate } from "@/components/AccessGate";
import { DecryptReveal } from "@/components/DecryptReveal";
import { DownloadModal } from "@/components/DownloadModal";
import { ModCodexModal, type ModCategory } from "@/components/ModCodexModal";
import { HeroReveal, RevealSection, RevealStagger, RevealItem } from "@/components/Reveal";

const SERVER_ADDRESS = "minecraft.smartcal.com.br:25565";
const DOWNLOAD_URL = "https://minecraft.smartcal.com.br/danny-aot-modpack.zip";
const TLAUNCHER_URL = "https://tlauncher.org";
const INSTALLER_LINUX_URL = "https://minecraft.smartcal.com.br/InstalarDannysAoT-linux";
const INSTALLER_WINDOWS_URL = "https://minecraft.smartcal.com.br/InstalarDannysAoT.exe";

const SHADERS = [
  {
    name: "Rethinking Voxels",
    weight: "PESADO",
  },
  {
    name: "Complementary Unbound",
    weight: "PESADO",
  },
  {
    name: "Photon Shader",
    weight: "PESADO",
  },
  {
    name: "BSL Shaders",
    weight: "MÉDIO",
  },
  {
    name: "Sildur's Vibrant Shaders",
    weight: "LEVE",
  },
];

const MODS = [
  { name: "Danny's AoT", tag: "ODM • TITÃS • PARADIS", featured: true },
  { name: "Sodium + Lithium", tag: "PERFORMANCE" },
  { name: "Xaero's Minimap + Worldmap", tag: "MAPA" },
  { name: "Macaw's", tag: "CONSTRUÇÃO" },
  { name: "Terralith", tag: "EXPLORAÇÃO" },
];

// catalogo completo — RPG primeiro (Origins decide a classe logo de cara),
// depois mundo, construcao, QoL/mapa e performance. As bibliotecas de
// suporte (Fabric API, Kotlin, GeckoLib etc.) viram a ultima aba, so pra
// quem quiser conferir — nao atrapalham quem quer achar um mod rapido.
const TOTAL_MODS = 76;
const DOWNLOAD_SIZE = "222 MB";

const MOD_CATALOG: ModCategory[] = [
  {
    id: "rpg",
    label: "RPG & Poderes",
    mods: [
      {
        name: "Origins",
        desc: "Escolha sua origem ao nascer no mundo — cada uma com poderes e limitações diferentes. É o primeiro mod que decide como você vai jogar.",
        firstSteps: [
          "Ao entrar num mundo novo, o jogo já abre a tela de escolha de origem — dá uma boa olhada antes de decidir, trocar depois exige um item especial.",
          "Abre o menu de origens (tecla O por padrão) pra ver os poderes ativos e passivos da sua escolha.",
          "Escolha pensando no seu estilo: combate, exploração ou suporte — cada origem empurra pra um lado.",
        ],
        tips: [
          "Dá pra trocar de origem depois com um item específico (orb of origin) — não é uma escolha permanente de verdade.",
          "Algumas origens têm desvantagens reais (não pode comer certas coisas, toma dano de sol) — lê com atenção.",
          "O servidor roda com 1 layer de origem ativa, então é uma escolha só, não acumula várias.",
        ],
      },
      {
        name: "Danny's AoT",
        desc: "ODM Gear, titãs e a dimensão de Paradis — o mod central do modpack.",
        firstSteps: [
          "Craft o ODM Gear básico assim que puder — procura por \"ODM\" no REI (tecla R) pra ver a receita.",
          "Titãs não aparecem logo de cara, só depois que você avança um pouco — não se assuste se demorar.",
          "A dimensão de Paradis tem portal próprio — procure pela estrutura de entrada especial pelo mundo.",
        ],
        tips: [
          "É o mod \"dono da casa\" do servidor — qualquer bug ou dúvida sobre ele, chama no grupo em vez de tentar mexer por fora.",
          "O gás do ODM Gear acaba — carrega recarga ou fica perto de um posto de reabastecimento.",
          "Treina a manobra de gancho num lugar seguro antes de encarar um titã de verdade.",
        ],
      },
      {
        name: "Spell Engine",
        desc: "Sistema de magias e habilidades ativas em tempo real, com combos.",
        firstSteps: [
          "Consiga um item de feitiço inicial — procura por \"spell\" no REI pra ver onde craftar ou achar.",
          "Feitiços ficam vinculados a itens equipáveis — segure ou equipe o item certo pra conjurar.",
          "Abre o menu de combos pra ver quais combinações você já desbloqueou.",
        ],
        tips: [
          "Cada feitiço gasta mana/cooldown — fica de olho na barra antes de spammar.",
          "Combina melhor junto do Spell Power pra escalar o dano das magias.",
          "Testa um feitiço novo num mob fraco antes de levar pra luta grande — cada um tem uma janela de uso diferente.",
        ],
      },
      {
        name: "Spell Power",
        desc: "Progressão de poder mágico — complementa o Spell Engine.",
        firstSteps: [
          "Ganha pontos de poder mágico conforme usa magias — é tipo um nível separado do XP normal.",
          "Fica de olho na barra de poder mágico na tela, ela cresce enquanto você joga com o Spell Engine.",
        ],
        tips: [
          "Focar num \"caminho\" de magia só rende mais que espalhar pouco em cada um.",
          "Combina bem com Artifacts que dão bônus mágico.",
        ],
      },
      {
        name: "Artifacts",
        desc: "Itens equipáveis com efeitos únicos, tipo relíquias de RPG.",
        firstSteps: [
          "Artefatos aparecem como loot em masmorras e estruturas — Dungeons Arise, Structory e Yung's ajudam a achar mais.",
          "Equipa no slot de artefato do inventário (mesmo menu do Trinkets).",
        ],
        tips: [
          "Nem todo artefato serve pro seu build — lê o efeito com calma antes de equipar.",
          "Alguns têm efeito negativo junto do positivo — é um trade-off, não é upgrade grátis.",
        ],
      },
      {
        name: "Trinkets",
        desc: "Slots extras de acessório pra equipar artefatos e outros itens.",
        firstSteps: [
          "Abre o inventário e procura a aba extra de slots de acessório.",
          "Qualquer item marcado como \"trinket\" por outro mod (Artifacts, por exemplo) encaixa ali.",
        ],
        tips: [
          "É só a \"prateleira\" onde os acessórios de outros mods encaixam — sozinho ele não adiciona itens novos.",
        ],
      },
      {
        name: "Better Combat",
        desc: "Combos, animações e reações de combate mais fluidas.",
        firstSteps: [
          "Já funciona automático — o ataque normal já vira combo mais fluido, não precisa configurar nada.",
          "Segura o botão de ataque perto de um mob pra ver as animações de combo novas.",
        ],
        tips: [
          "Combina muito bem com Combat Roll pra um combate estilo \"ação\" de verdade.",
          "Dá pra ajustar a sensibilidade pelo ModMenu se achar rápido ou lento demais.",
        ],
      },
      {
        name: "Combat Roll",
        desc: "Esquiva com rolamento — dodge de verdade, não só andar pra trás.",
        firstSteps: [
          "A tecla de esquiva costuma ser dupla batida de direção ou uma tecla dedicada — confere em ModMenu → Controls.",
        ],
        tips: [
          "Rolar tem um cooldown curto — não dá pra ficar rolando infinito pra fugir de tudo.",
          "Rola PRA FORA do ataque, não em cima dele — timing importa mais que reflexo puro.",
        ],
      },
      {
        name: "Adventurez",
        desc: "Conteúdo extra de aventura: mobs, itens e progressão.",
        firstSteps: [
          "Adiciona itens e mobs novos espalhados pelo mundo normal — só de explorar você já vai encontrando.",
        ],
        tips: ["Bom mod pra quem gosta de progressão orgânica, sem precisar seguir um guia à risca."],
      },
      {
        name: "Bountiful",
        desc: "Sistema de contratos — aceite bounties e complete objetivos por recompensa.",
        firstSteps: [
          "Procure o quadro de recompensas (bounty board) numa vila — ele gera contratos aleatórios.",
          "Aceite um contrato, cumpra o objetivo (matar um mob, entregar um item) e volte pra pegar a recompensa.",
        ],
        tips: [
          "Contratos expiram — não aceite um que você não vai conseguir terminar a tempo.",
          "Bom jeito de ganhar recursos sem precisar farmar sem rumo nenhum.",
        ],
      },
    ],
  },
  {
    id: "mundo",
    label: "Exploração & Mundo",
    mods: [
      {
        name: "Naturalist",
        desc: "47 animais selvagens novos — ursos, leões, girafas, rinocerontes, tubarões e muito mais, cada um com comportamento próprio.",
        firstSteps: [
          "Os animais aparecem nos biomas certos (savana pra leão e girafa, floresta pra urso e veado, mar pra tubarão e baleia) — só explorar já acha.",
          "Alguns têm interação especial — tenta se aproximar com um item específico na mão pra ver o que rola.",
        ],
        tips: [
          "Predadores caçam de verdade — não é só decoração, alguns bichos são perigosos de verdade.",
          "Bom mod pra combinar com fazendas e exibições — muitos são \"criáveis\" tipo um zoológico.",
        ],
      },
      {
        name: "Terralith",
        desc: "Biomas e terrenos completamente reformulados — muito mais variedade pra explorar.",
        firstSteps: ["Já funciona automático em qualquer mundo novo — os biomas novos aparecem só de explorar."],
        tips: [
          "Se o mundo já existia antes de instalar, os biomas novos só aparecem em chunks nunca gerados antes — bem longe do spawn.",
        ],
      },
      {
        name: "Repurposed Structures",
        desc: "Estruturas vanilla espalhadas em mais biomas e variações.",
        firstSteps: [
          "Nada de novo pra aprender — templos, iglus, naufrágios e companhia passam a aparecer em mais lugares.",
        ],
      },
      {
        name: "Structory",
        desc: "Novas estruturas e masmorras escondidas pelo mundo.",
        firstSteps: ["Procure construções novas espalhadas pelo mapa, geralmente com loot bom — vale ir mais longe do spawn."],
        tips: ["Algumas estruturas têm puzzle ou armadilha — cuidado ao entrar sem se preparar."],
      },
      {
        name: "Dungeons Arise",
        desc: "Masmorras customizadas, maiores e mais perigosas.",
        firstSteps: ["Aparecem geradas naturalmente pelo mundo — normalmente grandes e visíveis de longe."],
        tips: ["São mais difíceis que masmorra vanilla — vai preparado com armadura, cura e, se der, gente junto."],
      },
      {
        name: "Yung's Better Dungeons",
        desc: "Masmorras vanilla revisadas — mais interessantes e desafiadoras.",
        firstSteps: ["Substitui a masmorra clássica (sala de spawner) por uma versão revisada e maior."],
      },
      {
        name: "Yung's Better Strongholds",
        desc: "Fortalezas revisadas, com layouts novos.",
        firstSteps: ["O Eye of Ender ainda guia até lá do mesmo jeito — só o layout de dentro que muda."],
      },
      {
        name: "Waystones",
        desc: "Marque pontos e teleporte rápido entre eles depois.",
        firstSteps: [
          "Ache ou construa uma waystone (estrutura própria do mod) e ative ela chegando perto.",
          "Abre o menu de waystones pra teleportar entre qualquer uma que você já ativou.",
        ],
        tips: ["Ótimo pra cortar tempo de viagem entre base, vila e masmorras favoritas."],
      },
    ],
  },
  {
    id: "construcao",
    label: "Construção",
    mods: [
      {
        name: "Macaw's",
        desc: "Pontes, Portas, Móveis, Cercas, Janelas, Caminhos, Telhados e Alçapões — pacote gigante de blocos decorativos, 8 mods num só.",
        firstSteps: [
          "As receitas seguem o padrão vanilla (madeira + formato) — procura no REI pelo bloco base que você já tem.",
        ],
        tips: [
          "É o pacote todo junto — se não achar uma receita numa categoria (portas, por exemplo), procura nas outras, o catálogo é enorme.",
        ],
      },
      {
        name: "Supplementaries",
        desc: "Blocos utilitários e decorativos extras (sinos, luminárias, etc.).",
        firstSteps: ["Craftável com material vanilla — dá uma olhada no REI pra ver o que já dá pra fazer."],
        tips: ["Muita coisa é decorativa, mas alguns blocos têm função real (redstone, iluminação inteligente)."],
      },
      {
        name: "Chipped",
        desc: "Blocos decorativos customizáveis com texturas próprias.",
        firstSteps: ["Permite personalizar a textura de certos blocos decorativos direto no menu do próprio bloco."],
      },
    ],
  },
  {
    id: "qol",
    label: "Mapa & Qualidade de vida",
    mods: [
      {
        name: "Xaero's Minimap + Worldmap",
        desc: "Minimapa e mapa completo do mundo, com waypoints.",
        firstSteps: [
          "O minimapa já aparece no canto da tela assim que você entra no mundo.",
          "Tecla M abre o mapa completo (worldmap).",
        ],
        tips: [
          "Clique direito no mapa pra criar waypoints personalizados (base, masmorra, o que quiser).",
          "Death points marcam sozinhos onde você morreu — ajuda a recuperar os itens depois.",
        ],
      },
      {
        name: "Jade",
        desc: "Mostra informação do bloco/mob que você mira, tipo um HUD de inspeção.",
        firstSteps: ["Só mirar num bloco ou mob já mostra a informação na tela, não precisa apertar nada."],
        tips: ["Dá pra configurar o que aparece (vida do mob, progresso do bloco) no config do mod."],
      },
      {
        name: "Roughly Enough Items (REI)",
        desc: "Visualizador de receitas e itens — abre com uma tecla.",
        firstSteps: [
          "Tecla padrão R (ou o ícone lateral) abre o catálogo de itens e receitas.",
          "Segure R em cima de um item no inventário pra ver a receita dele na hora.",
        ],
        tips: ["Funciona também pra ver \"pra que esse item serve\" (usage), não só a receita dele."],
      },
      {
        name: "Inventory Profiles Next",
        desc: "Organiza e ordena inventário/baú automaticamente.",
        firstSteps: ["Clique com o botão do meio (ou a tecla configurada) num baú/inventário pra ordenar automático."],
        tips: ["Dá pra criar regras de ordenação customizadas no config, se quiser mais controle."],
      },
      {
        name: "Mouse Tweaks",
        desc: "Arrasta e solta itens mais rápido com o mouse.",
        firstSteps: ["Já funciona sozinho: arraste segurando o botão sobre vários slots pra mover/dividir itens em massa."],
      },
      {
        name: "ModMenu",
        desc: "Tela central pra configurar todos os mods que têm config.",
        firstSteps: ["Vai em Options (ou o botão que aparece na tela título) e procura \"Mods\" — lista tudo e abre o config de quem tem."],
      },
      {
        name: "Zoomify",
        desc: "Zoom na câmera com uma tecla.",
        firstSteps: ["Tecla padrão C — segura pra dar zoom na câmera."],
        tips: ["Dá pra trocar a tecla e o nível de zoom pelo ModMenu."],
      },
      {
        name: "Controlify",
        desc: "Suporte completo a controle (joystick).",
        firstSteps: ["Conecta o controle antes de abrir o jogo — ele detecta automático."],
        tips: ["Tem perfis prontos pra Xbox, PlayStation e genérico no menu do próprio mod."],
      },
      {
        name: "Better Third Person",
        desc: "Câmera em terceira pessoa mais suave e configurável.",
        firstSteps: ["Aperta F5 (padrão do Minecraft) pra entrar em terceira pessoa — a câmera já vem mais suave."],
        tips: ["Ajusta distância e ângulo da câmera pelo ModMenu se quiser um enquadramento diferente."],
      },
      {
        name: "Not Enough Animations",
        desc: "Animações extras do personagem (sentar, rastejar, etc.).",
        firstSteps: [
          "Automático — sentar (clicando em escada/degrau certo) e rastejar em espaço baixo já funcionam sem configurar nada.",
        ],
      },
      {
        name: "AppleSkin",
        desc: "Mostra saturação e regeneração de fome na tela.",
        firstSteps: ["Só olhar a barra de fome — agora ela mostra também a saturação escondida por baixo."],
      },
      {
        name: "Traveler's Backpack",
        desc: "Mochila extra equipável, com upgrades.",
        firstSteps: [
          "Craft a mochila (receita padrão com couro/material de bicho — confere no REI) e equipa nas costas.",
          "Clique direito no ar (ou a tecla configurada) pra abrir o inventário dela sem tirar.",
        ],
        tips: ["Dá pra fazer upgrade dela (mais espaço, tanque de água) dependendo do que você encontrar."],
      },
      {
        name: "Presence Footsteps",
        desc: "Sons de passos que mudam com o tipo de piso.",
        firstSteps: ["Automático — só andar em superfícies diferentes já muda o som."],
      },
      {
        name: "Sound Physics Remastered",
        desc: "Áudio realista — eco e abafamento de som por ambiente.",
        firstSteps: ["Automático — cavernas e ambientes fechados já ganham eco na hora."],
      },
      {
        name: "Bobby",
        desc: "Mantém chunks carregados de longe no client, visual mais completo.",
        firstSteps: [
          "Aumenta a distância de chunks carregados no seu client além do que o servidor manda — ajusta a distância no config do mod se quiser.",
        ],
        tips: ["É só visual/client — não muda a distância real de simulação (mobs, redstone) do servidor."],
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    mods: [
      {
        name: "Sodium + Lithium",
        desc: "Motor de renderização e de física otimizados — mais FPS, menos travamento.",
        firstSteps: ["Não precisa fazer nada — já otimiza render e física assim que o jogo abre."],
        tips: ["Se quiser mexer em configs avançadas, agora tem um menu de vídeo próprio do Sodium, bem mais rápido que o vanilla."],
      },
      {
        name: "Indium",
        desc: "Compatibilidade do Sodium com mods que mexem em iluminação.",
        firstSteps: ["Só existe pra fazer o Sodium funcionar com mods de iluminação — não tem nada pra configurar."],
      },
      {
        name: "Krypton",
        desc: "Otimiza a rede — menos lag de conexão com o servidor.",
        firstSteps: ["Automático, otimiza a rede em segundo plano — sem tela nem configuração."],
      },
      {
        name: "FerriteCore",
        desc: "Reduz uso de memória RAM do jogo.",
        firstSteps: ["Automático — só roda por baixo dos panos reduzindo o consumo de RAM."],
      },
      {
        name: "ModernFix",
        desc: "Correções e otimizações gerais de carregamento.",
        firstSteps: ["Automático na maior parte — algumas otimizações têm config próprio se quiser mexer."],
      },
      {
        name: "C2ME",
        desc: "Geração de chunks em paralelo — mundo carrega mais rápido.",
        firstSteps: ["Automático — só faz o mundo carregar mais rápido enquanto você anda ou voa."],
      },
      {
        name: "EntityCulling",
        desc: "Para de renderizar entidades que não estão realmente visíveis.",
        firstSteps: ["Automático — simplesmente não renderiza entidades escondidas atrás de blocos ou fora da visão."],
      },
    ],
  },
  {
    id: "bibliotecas",
    label: "Bibliotecas",
    mods: [
      { name: "Fabric API" },
      { name: "Fabric Language Kotlin" },
      { name: "GeckoLib" },
      { name: "Player Animation Lib" },
      { name: "Cloth Config" },
      { name: "Cardinal Components API" },
      { name: "Forge Config API Port" },
      { name: "MidnightLib" },
      { name: "LibIPN" },
      { name: "Kambrik" },
      { name: "Prickle" },
      { name: "Resourceful Lib" },
      { name: "Lithostitched" },
      { name: "Moonlight" },
      { name: "Bookshelf" },
      { name: "Puzzles Lib" },
      { name: "Athena" },
      { name: "AAA Particles" },
      { name: "EnchDesc" },
      { name: "BOMD" },
      { name: "Continuity" },
      { name: "Balm" },
      { name: "Yung's API" },
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Instale o TLauncher",
    body: (
      <>
        Baixe direto do site oficial{" "}
        <a href={TLAUNCHER_URL} target="_blank" rel="noopener noreferrer">
          tlauncher.org
        </a>{" "}
        — cuidado com clones em outros sites.
      </>
    ),
    tips: [
      "Escolha a versão certa pro seu sistema (Windows, Linux ou Mac).",
      'Se o Windows/antivírus reclamar, é normal — o TLauncher não passa pela verificação da Microsoft. Clique em "Mais informações" → "Executar assim mesmo".',
      "Não precisa de conta Microsoft/Mojang. Escolha um apelido e pronto, é modo offline.",
      "Abra o TLauncher pelo menos uma vez antes do próximo passo (ele precisa criar a pasta do jogo primeiro).",
    ],
  },
  {
    n: "02",
    title: "Baixe o instalador do modpack",
    body: (
      <>
        Clica no botão <Strong>↓ Baixar agora</Strong> lá no topo da página e escolhe o
        instalador do seu sistema (<Strong>Windows</Strong> ou <Strong>Linux</Strong>). Não é o
        .zip dos mods — é um programinha (<Strong>InstalarDannysAoT</Strong>) que faz tudo
        sozinho: baixa o modpack mais atual, instala os mods e o config certos, configura o
        Fabric na versão certa e já deixa o servidor cadastrado.
      </>
    ),
    tips: [
      "A senha de acesso é a mesma pro modpack e pros instaladores — pede pro Deilton no grupo se não tiver.",
      'Se o antivírus reclamar do executável, é o mesmo alerta genérico de qualquer programa não-assinado — pode liberar.',
    ],
  },
  {
    n: "03",
    title: "Rode o instalador",
    body: (
      <>
        Dá dois cliques nele e espera terminar. No Linux, se não abrir direto, clique com o
        botão direito → <Strong>Executar como programa</Strong> (ou{" "}
        <Code>chmod +x</Code> + rodar pelo terminal).
      </>
    ),
    tips: [
      "Ele mostra o progresso do download e cada etapa no terminal/console que abrir junto — é normal demorar um pouco na primeira vez (o pacote tem mais de 150 MB).",
      'No final aparece "Tudo pronto!" — se aparecer algum "ERRO", tira print e manda no grupo.',
      "Rodar de novo no futuro (quando o modpack for atualizado) é seguro — ele substitui só o que mudou, sem bagunçar nada que você já tinha.",
    ],
  },
  {
    n: "04",
    title: "Entre no servidor",
    body: (
      <>
        Abra o TLauncher, selecione o perfil <Strong>&ldquo;Danny&apos;s AoT&rdquo;</Strong> (o
        instalador já criou ele pra você) → <Strong>Play</Strong>. No jogo:{" "}
        <Strong>Multiplayer</Strong> → o servidor <Code className="text-accent">{SERVER_ADDRESS}</Code>{" "}
        já deve aparecer pronto na lista.
      </>
    ),
    tips: [
      "Se o servidor não aparecer na lista, adicione manualmente com o botão de copiar endereço lá em cima.",
      "O primeiro carregamento do mundo costuma ser mais lento (baixando os assets dos mods). Se cair no meio, tenta entrar de novo.",
    ],
  },
];

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

function Code({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <code className={`border border-accent/20 px-1.5 py-px font-mono-ui ${className}`}>
      {children}
    </code>
  );
}

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="clip-corner-sm border border-accent/22 px-2.75 py-1.5 font-mono-ui text-[11px] font-semibold tracking-[0.14em] text-text/62">
      {children}
    </span>
  );
}

export default async function Home() {
  const jar = await cookies();
  const unlocked = jar.get("paradis_clearance")?.value === "1";

  return (
    <>
      {/* aviso mobile — so o emblema, minimalista, pedindo pra acessar pelo desktop */}
      <div className="bg-grid flex min-h-screen flex-col items-center justify-center gap-5 px-8 text-center font-mono-ui text-text md:hidden">
        <div className="clip-corner-md flex h-20 w-20 items-center justify-center border border-accent/45 bg-panel/80">
          <Image
            src="/emblem.png"
            alt="Emblema do servidor"
            width={34}
            height={46}
            style={{
              filter: "grayscale(1) sepia(1) hue-rotate(64deg) saturate(2.6) brightness(1.05) contrast(1.12)",
            }}
          />
        </div>
        <p className="m-0 text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
          Acesso restrito a desktop
        </p>
        <p className="m-0 max-w-[32ch] text-[12px] leading-[1.7] text-text/55">
          Essa página foi pensada pra tela grande. Abre pelo computador pra ver tudo direito.
        </p>
      </div>

      {/* site completo — so em telas de desktop */}
      <div className="bg-grid relative hidden min-h-screen overflow-hidden px-[22px] font-mono-ui text-text md:block">
      <div className="animate-scan pointer-events-none absolute inset-0 h-[3px] bg-linear-to-b from-accent/7 to-transparent" />

      <div className="relative mx-auto max-w-[1180px]">
        {/* topbar */}
        <HeroReveal>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-accent/16 py-5">
            <span className="animate-pulse-dot h-1.75 w-1.75 rounded-full bg-accent" />
            <span className="font-semibold text-[11px] tracking-[0.2em] text-accent">
              SERVIDOR PRIVADO
            </span>
            <span className="animate-flicker-soft text-[11px] tracking-[0.14em] text-text/35">
              {"// PARADIS NODE"}
            </span>
            <span className="flex-1" />
            <TagPill>MINECRAFT 1.21.1</TagPill>
            <TagPill>FABRIC</TagPill>
          </div>
        </HeroReveal>

        {/* hero */}
        <div className="grid grid-cols-1 items-center gap-9 py-14 md:grid-cols-2">
          <HeroReveal delay={0.05}>
            <div>
              <span className="clip-corner-md animate-flicker-soft mb-5.5 inline-block border border-accent/34 bg-accent-deep/50 px-3 py-1.75 font-semibold text-[10px] tracking-[0.24em] text-accent">
                ODM GEAR // INITIATED
              </span>
              <h1 className="m-0 font-display text-[clamp(50px,9.5vw,104px)] leading-[0.9] tracking-[0.005em] text-ink uppercase">
                Deilton&apos;s
                <br />
                <span className="text-accent drop-shadow-[0_0_34px_rgba(127,214,138,0.35)]">
                  AoT
                </span>{" "}
                Modpack
              </h1>
              <p className="mt-6 max-w-[44ch] text-[14px] leading-[1.85] text-text/72">
                Pensado e construído por <Strong>Deilton</Strong> para o nosso servidor no
                Paradis. ODM Gear, titãs e a dimensão de Paradis — cada mod e cada config
                escolhidos pra galera jogar junto.
              </p>

              <div className="clip-corner-md mt-6.5 border border-accent/20 bg-panel/72 px-5 py-4.5">
                <div className="mb-2.5 text-[10px] font-semibold tracking-[0.22em] text-accent">
                  UM AGRADECIMENTO ESPECIAL
                </div>
                <p className="m-0 text-[13px] leading-[1.8] text-text/75">
                  Agradecemos ao <Strong2>Kevin</Strong2> e ao <Strong2>Lucas</Strong2> pelas
                  doações que ajudaram a tornar esse projeto possível.
                </p>
              </div>

              <div className="mt-6.5">
                <DownloadModal
                  unlocked={unlocked}
                  downloadUrl={DOWNLOAD_URL}
                  installerWindowsUrl={INSTALLER_WINDOWS_URL}
                  installerLinuxUrl={INSTALLER_LINUX_URL}
                />
              </div>

              <div className="mt-3.5 flex flex-wrap gap-2">
                <span className="border border-accent/16 px-3 py-2.25 text-[10px] font-semibold tracking-[0.16em] text-text/60">
                  FEITO POR <span className="text-accent">DEILTON</span>
                </span>
                <span className="border border-accent/16 px-3 py-2.25 text-[10px] font-semibold tracking-[0.16em] text-text/60">
                  APOIADO POR KEVIN &amp; LUCAS
                </span>
                <span className="border border-dashed border-accent/16 px-3 py-2.25 text-[10px] font-semibold tracking-[0.16em] text-text/35">
                  {"{ PARADIS UNITE }"}
                </span>
              </div>
            </div>
          </HeroReveal>

          <HeroReveal delay={0.15}>
            <EmblemCube />
          </HeroReveal>
        </div>

        {/* status badges */}
        <RevealSection className="flex flex-wrap gap-2 pb-6.5">
          <StatusBadge dot="animate-pulse-dot bg-accent">SERVER ONLINE</StatusBadge>
          <StatusBadge dot="bg-accent-mid">FABRIC 1.21.1</StatusBadge>
          <StatusBadge dot="bg-accent-dim">{TOTAL_MODS} MODS</StatusBadge>
          <StatusBadge dot="bg-accent-dim">PARADIS NODE</StatusBadge>
        </RevealSection>

        {/* endereco + download — protegidos por senha */}
        {unlocked ? (
          <DecryptReveal>
            <RevealStagger className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RevealItem
                className="clip-corner-lg border border-accent/22 p-5.5"
                style={{
                  background: "linear-gradient(160deg, rgba(21,26,22,.92), rgba(11,14,12,.92))",
                }}
              >
                <div className="mb-4 flex items-center justify-between gap-2.5">
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-accent">
                    ENDEREÇO DO SERVIDOR
                  </span>
                  <span className="animate-flicker-soft text-[9px] tracking-[0.16em] text-text/30">
                    {"// ACTIVE"}
                  </span>
                </div>
                <CopyAddress address={SERVER_ADDRESS} />
                <div className="mt-3.5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-text/50">
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  ONLINE 24/7
                </div>
              </RevealItem>

              <RevealItem
                className="clip-corner-lg flex flex-col gap-4 border border-accent/22 p-5.5"
                style={{
                  background: "linear-gradient(160deg, rgba(21,26,22,.92), rgba(11,14,12,.92))",
                }}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-accent">
                    DOWNLOAD DO MODPACK
                  </span>
                  <span className="animate-flicker-soft text-[9px] tracking-[0.16em] text-text/30">
                    {`// ${DOWNLOAD_SIZE}`}
                  </span>
                </div>
                <a
                  href={DOWNLOAD_URL}
                  className="clip-corner-btn block bg-linear-to-b from-accent to-accent-mid px-4 py-4.75 text-center text-[14px] font-semibold tracking-[0.14em] text-[#08120a] uppercase transition-[box-shadow,transform] duration-250 hover:-translate-y-px hover:shadow-[0_0_38px_rgba(127,214,138,0.42)]"
                >
                  ↓ Baixar o modpack (.zip)
                </a>
                <div className="flex flex-wrap gap-3.5 text-[10px] tracking-[0.16em] text-text/45">
                  <span>{DOWNLOAD_SIZE}</span>
                  <span>{TOTAL_MODS} MODS</span>
                  <span>FABRIC</span>
                  <span>MINECRAFT 1.21.1</span>
                </div>
              </RevealItem>
            </RevealStagger>
          </DecryptReveal>
        ) : (
          <RevealSection>
            <AccessGate />
          </RevealSection>
        )}

        {/* o que tem dentro */}
        <RevealSection className="mt-13 mb-4 flex items-baseline gap-3">
          <h2 className="m-0 font-display text-[clamp(24px,4vw,34px)] tracking-[0.03em] text-ink uppercase">
            O que tem dentro
          </h2>
          <span className="h-px flex-1 bg-linear-to-r from-accent/30 to-transparent" />
          <span className="animate-flicker-soft text-[9px] tracking-[0.2em] text-accent/55">
            MODPACK CONTENT // LOADED
          </span>
        </RevealSection>

        <RevealStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODS.map((mod) => (
            <RevealItem
              key={mod.name}
              className={`px-4.5 py-4 transition-colors duration-200 ${
                mod.featured
                  ? "border border-accent/40 bg-accent-deep/42 hover:bg-accent-deep/70"
                  : "border border-accent/16 bg-panel/70 hover:bg-accent-deep/50"
              }`}
            >
              <div className="mb-1.75 text-[14px] font-semibold text-ink">{mod.name}</div>
              <div
                className={`text-[10px] tracking-[0.14em] ${
                  mod.featured ? "text-accent" : "text-text/45"
                }`}
              >
                {mod.tag}
              </div>
            </RevealItem>
          ))}
          <RevealItem>
            <ModCodexModal categories={MOD_CATALOG} totalJars={TOTAL_MODS} />
          </RevealItem>
        </RevealStagger>

        {/* como instalar */}
        <RevealSection className="clip-corner-xl mt-13 border border-accent/20 bg-panel/55 px-6.5 py-7">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="m-0 font-display text-[clamp(26px,5vw,40px)] tracking-[0.03em] text-ink uppercase">
              Como instalar
            </h2>
            <span className="animate-flicker-soft text-[9px] tracking-[0.2em] text-accent/50">
              {`SETUP SEQUENCE // ${String(STEPS.length).padStart(2, "0")} STEPS`}
            </span>
          </div>
          <p className="mt-2.5 mb-6.5 text-[11px] tracking-[0.1em] text-text/42 uppercase">
            Na ordem. Se travar em algum passo, chama no grupo.
          </p>

          <RevealStagger className="grid gap-2.5">
            {STEPS.map((step) => (
              <RevealItem
                key={step.n}
                className="grid grid-cols-[auto_1fr] items-start gap-4.5 border border-accent/13 bg-bg/60 px-4.5 py-4 transition-colors duration-200 hover:border-accent/40"
              >
                <span className="border border-accent/25 px-3.5 pt-2.5 pb-2 font-display text-[30px] text-accent">
                  {step.n}
                </span>
                <div>
                  <div className="mb-1.75 text-[13px] font-semibold tracking-[0.14em] text-accent uppercase">
                    {step.title}
                  </div>
                  <div className="text-[13px] leading-[1.7] text-text/70">{step.body}</div>
                  {step.tips && (
                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {step.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[12px] leading-[1.65] text-text/50"
                        >
                          <span className="text-accent/60">›</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </RevealSection>

        {/* shaders inclusos */}
        <RevealSection className="mt-13 mb-4 flex items-baseline gap-3">
          <h2 className="m-0 font-display text-[clamp(24px,4vw,34px)] tracking-[0.03em] text-ink uppercase">
            Shaders inclusos
          </h2>
          <span className="h-px flex-1 bg-linear-to-r from-accent/30 to-transparent" />
          <span className="animate-flicker-soft text-[9px] tracking-[0.2em] text-accent/55">
            CLIENT-SIDE ONLY // JA VEM NO INSTALADOR
          </span>
        </RevealSection>
        <p className="mt-0 mb-4 max-w-[70ch] text-[12px] leading-[1.8] text-text/50">
          O instalador já baixa os 5 junto com o resto — não precisa baixar nada separado.
          Shader é escolha individual: o servidor nunca processa nada disso (ele nem tem tela
          pra renderizar), então cada um ativa o que a própria máquina aguenta, sem afetar os
          outros jogadores. Pra ativar: <Strong>Options</Strong> → <Strong>Video Settings</Strong>{" "}
          → <Strong>Shader Packs</Strong>, dentro do jogo.
        </p>

        <RevealStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHADERS.map((shader) => (
            <RevealItem
              key={shader.name}
              className="border border-accent/16 bg-panel/70 px-4.5 py-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-ink">{shader.name}</span>
                <span className="clip-corner-sm border border-accent/22 px-2 py-1 font-mono-ui text-[9px] font-semibold tracking-[0.1em] text-accent">
                  {shader.weight}
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* distant horizons — mesmo esquema dos shaders: vem no instalador, client-only */}
        <RevealSection className="clip-corner-md mt-4 flex flex-wrap items-center justify-between gap-3 border border-accent/16 bg-panel/70 px-4.5 py-4">
          <div>
            <div className="text-[14px] font-semibold text-ink">Distant Horizons</div>
            <div className="mt-1 text-[11px] leading-[1.6] text-text/50">
              Renderiza o terreno beeem além do alcance normal, tipo um LOD de horizonte — sem
              pesar no servidor (roda 100% no seu client). Ativa em{" "}
              <Strong>Options</Strong> → <Strong>Video Settings</Strong> →{" "}
              <Strong>Distant Horizons</Strong>.
            </div>
          </div>
          <span className="clip-corner-sm flex-none border border-accent/22 px-2 py-1 font-mono-ui text-[9px] font-semibold tracking-[0.1em] text-accent">
            EXTRA
          </span>
        </RevealSection>

        {/* quote + status */}
        <RevealSection className="my-14 grid grid-cols-1 items-center gap-6 border-t border-accent/16 py-8.5 md:grid-cols-2">
          <div>
            <p className="m-0 font-display text-[clamp(18px,3vw,26px)] leading-[1.35] tracking-[0.02em] text-ink uppercase">
              &ldquo;Dedicação, amizade e comunidade constroem mais que mundos. Constroem
              histórias.&rdquo;
            </p>
            <p className="mt-3.5 text-[11px] font-semibold tracking-[0.24em] text-accent">
              — DEILTON
            </p>
          </div>
          <div className="border border-accent/18 bg-panel/60 px-5 py-4.5 text-[10px] leading-[2] tracking-[0.16em] text-text/50">
            <div className="animate-flicker-soft mb-2 text-accent">ODM GEAR // STANDBY</div>
            GAS: OK
            <br />
            BLADES: SHARP
            <br />
            HOOKS: READY
            <br />
            BUILD: 1.21.1 / FABRIC
          </div>
        </RevealSection>

        <div className="flex flex-wrap justify-between gap-3.5 border-t border-accent/12 py-4.5 pb-8.5 text-[10px] leading-[1.8] tracking-[0.14em] text-text/38">
          <span>DEILTON&apos;S AOT MODPACK • MINECRAFT 1.21.1 • FABRIC • {TOTAL_MODS}+ MODS</span>
          <span>
            FEITO POR <span className="text-accent">DEILTON</span> • AGRADECIMENTOS A KEVIN E
            LUCAS
          </span>
        </div>
      </div>
      </div>
    </>
  );
}

function Strong2({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-accent">{children}</strong>;
}

function StatusBadge({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 border border-accent/18 bg-panel/60 px-3.25 py-2.25 text-[10px] font-semibold tracking-[0.16em] text-text/66">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}
