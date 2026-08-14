import { cookies } from "next/headers";
import Image from "next/image";
import { CopyAddress } from "@/components/CopyAddress";
import { EmblemCube } from "@/components/EmblemCube";
import { AccessGate } from "@/components/AccessGate";
import { DecryptReveal } from "@/components/DecryptReveal";
import { DownloadModal } from "@/components/DownloadModal";
import { ModCodexModal } from "@/components/modcodex/ModCodexModal";
import { SecretMods } from "@/components/SecretMods";
import { HeroReveal, RevealSection, RevealStagger, RevealItem } from "@/components/Reveal";
import { getModCodex } from "@/lib/modcodex/queries";

const SERVER_ADDRESS = "minecraft.smartcal.com.br:25565";
const DOWNLOAD_URL = "https://minecraft.smartcal.com.br/rpg-anime-modpack.zip";
const TLAUNCHER_URL = "https://tlauncher.org";
const INSTALLER_LINUX_URL = "https://minecraft.smartcal.com.br/InstalarRPGAnime-linux";
const INSTALLER_WINDOWS_URL = "https://minecraft.smartcal.com.br/InstalarRPGAnime.exe";

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
  {
    name: "EclipseShader",
    weight: "PESADO",
  },
];

// 9 no total: 6 mostrados direto (os pilares RPG/anime do pack) + 3 "top
// secret" atras do cadeado (SecretMods) — mods reais que sao surpresas
// divertidas, nao carro-chefe.
const SECRET_MODS = [
  { name: "Roundabout", tag: "JOJO • ORA ORA ORA" },
  { name: "Mo' Creatures", tag: "BESTIÁRIO CLÁSSICO" },
  { name: "Craziness Awakened", tag: "ORESPAWN REAWAKENED" },
];

const MODS = [
  { name: "Epic Fight", tag: "COMBATE ESTILO ANIME" },
  { name: "L_Ender's Cataclysm", tag: "CHEFES • DIMENSÃO ENDGAME" },
  { name: "Vampirism", tag: "CAÇADOR OU VAMPIRO" },
  { name: "Twilight Forest", tag: "DIMENSÃO DE EXPLORAÇÃO" },
  { name: "Iron's Spells 'n Spellbooks", tag: "MAGIA" },
  { name: "Ice and Fire", tag: "DRAGÕES E MITOLOGIA" },
];

// contagem real e conferida: 66 jars em mods/ (servidor) + 10 jars em
// mods-client-only/ dentro do rpg-anime-modpack.zip = 76 no total.
// Independente das linhas do ModCodex (que pode agrupar itens de um mesmo
// mod). O catalogo em si (mods/itens/receitas/tutoriais) vem do Supabase —
// ver lib/modcodex/queries.ts.
const SERVER_MODS = 66;
const CLIENT_ONLY_MODS = 10;
const TOTAL_MODS = SERVER_MODS + CLIENT_ONLY_MODS;
const DOWNLOAD_SIZE = "476 MB";

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
        .zip dos mods — é um programinha (<Strong>InstalarRPGAnime</Strong>) que faz tudo
        sozinho: baixa o modpack mais atual, instala os mods e o config certos, configura o
        Forge na versão certa (1.20.1) e já deixa o servidor cadastrado.
      </>
    ),
    tips: [
      "A senha de acesso é a mesma pro modpack e pros instaladores — pede pro Deilton no grupo se não tiver.",
      'Se o antivírus reclamar do executável, é o mesmo alerta genérico de qualquer programa não-assinado — pode liberar.',
      "Já tinha o pack antigo (Danny's AoT / Fabric) instalado? Sem problema — o instalador detecta e migra sozinho, veja o aviso no topo da página.",
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
      "Ele mostra o progresso do download e cada etapa no terminal/console que abrir junto — é normal demorar um pouco na primeira vez (o modpack sozinho tem quase 500 MB).",
      'No final aparece "Tudo pronto!" — se aparecer algum "ERRO", tira print e manda no grupo.',
      "Rodar de novo no futuro (quando o modpack for atualizado) é seguro — ele substitui só o que mudou, sem bagunçar nada que você já tinha.",
    ],
  },
  {
    n: "04",
    title: "Entre no servidor",
    body: (
      <>
        Abra o TLauncher, selecione o perfil <Strong>&ldquo;RPG Anime Modpack&rdquo;</Strong> (o
        instalador já criou ele pra você) → <Strong>Play</Strong>. No jogo:{" "}
        <Strong>Multiplayer</Strong> → o servidor <Code className="text-accent">{SERVER_ADDRESS}</Code>{" "}
        já deve aparecer pronto na lista (como &ldquo;RPG Anime Modpack (beta)&rdquo;).
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
  const modCodexCatalog = await getModCodex();

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
            <TagPill>MINECRAFT 1.20.1</TagPill>
            <TagPill>FORGE</TagPill>
          </div>
        </HeroReveal>

        {/* aviso de troca de modpack — quem ja jogava antes precisa ver isso */}
        <RevealSection className="mt-5">
          <div
            className="clip-corner-lg border border-amber-400/45 px-5.5 py-5"
            style={{ background: "linear-gradient(160deg, rgba(63,49,10,.35), rgba(21,26,22,.7))" }}
          >
            <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
              <span className="animate-pulse-dot h-1.75 w-1.75 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold tracking-[0.2em] text-amber-300 uppercase">
                ⚠ Modpack trocado — leia antes de jogar
              </span>
            </div>
            <p className="m-0 mb-2 text-[13px] leading-[1.8] text-text/80">
              Já jogava no servidor antes? O modpack mudou <Strong>por completo</Strong>: saímos
              do <Strong>Fabric 1.21.1</Strong> pro <Strong>Forge 1.20.1 (build 47.4.10)</Strong>.
              É uma instalação <Strong>nova e incompatível</Strong> com a antiga — não dá pra só
              atualizar por cima. Baixe e rode o <Strong>instalador novo</Strong> (botão abaixo);
              ele detecta o pack antigo automaticamente e migra/faz backup dos arquivos dele
              sozinho, sem você precisar apagar nada na mão.
            </p>
            <p className="m-0 text-[12px] leading-[1.7] text-text/55">
              Os instaladores antigos (<Code>InstalarDannysAoT-linux</Code> /{" "}
              <Code>InstalarDannysAoT.exe</Code>) eram do modpack anterior (Fabric,
              Danny&apos;s AoT) e não recebem mais atualização — a partir de agora use só os
              botões desta página, que já apontam pro instalador novo (
              <Code>InstalarRPGAnime</Code>).
            </p>
          </div>
        </RevealSection>

        {/* hero */}
        <div className="grid grid-cols-1 items-center gap-9 py-14 md:grid-cols-2">
          <HeroReveal delay={0.05}>
            <div>
              <span className="clip-corner-md animate-flicker-soft mb-5.5 inline-block border border-accent/34 bg-accent-deep/50 px-3 py-1.75 font-semibold text-[10px] tracking-[0.24em] text-accent">
                EPIC FIGHT ENGINE // LOADED
              </span>
              <h1 className="m-0 font-display text-[clamp(42px,7.6vw,88px)] leading-[0.95] tracking-[0.005em] text-ink uppercase">
                Deilton&apos;s
                <br />
                <span className="text-accent drop-shadow-[0_0_34px_rgba(127,214,138,0.35)]">
                  RPG Anime
                </span>{" "}
                Modpack
              </h1>
              <p className="mt-6 max-w-[46ch] text-[14px] leading-[1.85] text-text/72">
                Pensado e construído por <Strong>Deilton</Strong> para o nosso servidor. Combate
                estilo anime com Epic Fight, chefes de fim de jogo com Cataclysm, classes de
                caçador ou vampiro com Vampirism, magia com Iron&apos;s Spells, dragões com Ice
                and Fire e uma dimensão inteira pra explorar com Twilight Forest — cada mod
                escolhido a dedo pra galera jogar junto.
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
                  downloadSizeLabel={DOWNLOAD_SIZE}
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
          <StatusBadge dot="bg-accent-mid">FORGE 1.20.1</StatusBadge>
          <StatusBadge dot="bg-accent-dim">{TOTAL_MODS} MODS</StatusBadge>
          <StatusBadge dot="bg-accent-dim">SHADERS OK (OCULUS)</StatusBadge>
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
                <DownloadModal
                  unlocked={unlocked}
                  downloadUrl={DOWNLOAD_URL}
                  installerWindowsUrl={INSTALLER_WINDOWS_URL}
                  installerLinuxUrl={INSTALLER_LINUX_URL}
                  downloadSizeLabel={DOWNLOAD_SIZE}
                  triggerLabel="↓ Baixar o modpack"
                  triggerClassName="clip-corner-btn block w-full cursor-pointer bg-linear-to-b from-accent to-accent-mid px-4 py-4.75 text-center text-[14px] font-semibold tracking-[0.14em] text-[#08120a] uppercase transition-[box-shadow,transform] duration-250 hover:-translate-y-px hover:shadow-[0_0_38px_rgba(127,214,138,0.42)]"
                />
                <div className="flex flex-wrap gap-3.5 text-[10px] tracking-[0.16em] text-text/45">
                  <span>{DOWNLOAD_SIZE}</span>
                  <span>
                    {TOTAL_MODS} MODS ({SERVER_MODS} servidor + {CLIENT_ONLY_MODS} client-only)
                  </span>
                  <span>FORGE</span>
                  <span>MINECRAFT 1.20.1</span>
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
          <SecretMods mods={SECRET_MODS} />
          {MODS.map((mod) => (
            <RevealItem
              key={mod.name}
              className="border border-accent/16 bg-panel/70 px-4.5 py-4 transition-colors duration-200 hover:bg-accent-deep/50"
            >
              <div className="mb-1.75 text-[14px] font-semibold text-ink">{mod.name}</div>
              <div className="text-[10px] tracking-[0.14em] text-text/45">{mod.tag}</div>
            </RevealItem>
          ))}
        </RevealStagger>

        <RevealSection className="mt-3.5">
          <ModCodexModal categories={modCodexCatalog} />
        </RevealSection>

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
          Agora funciona de verdade: com <Strong>Oculus + Embeddium</Strong> no lugar do
          renderizador antigo, testamos os 6 shaderpacks abaixo ao vivo (82 shaders carregados
          sem crash). O instalador já baixa todos junto com o resto — não precisa baixar nada
          separado. Shader é escolha individual: o servidor nunca processa nada disso (ele nem
          tem tela pra renderizar), então cada um ativa o que a própria máquina aguenta, sem
          afetar os outros jogadores. Pra ativar: <Strong>Options</Strong> →{" "}
          <Strong>Video Settings</Strong> → <Strong>Shader Packs</Strong>, dentro do jogo.
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

        {/* extras client-only — vem no instalador, mas nunca no servidor */}
        <p className="mt-4 mb-3 text-[11px] tracking-[0.1em] text-text/40 uppercase">
          Extras client-only ({CLIENT_ONLY_MODS} no total) — cada um ativa/desativa por conta
          própria, sem afetar mais ninguém.
        </p>
        <RevealStagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              name: "AmbientSounds",
              desc: "Sons ambiente por bioma — vento, grutas, criaturas ao longe. Configurável no próprio menu do mod.",
            },
            {
              name: "Chat Heads",
              desc: "Mostra a cabecinha de quem falou do lado da mensagem no chat.",
            },
            {
              name: "BetterF3",
              desc: "Reformula a tela de debug (F3) padrão do Minecraft numa versão mais legível e customizável.",
            },
            {
              name: "3D Skin Layers",
              desc: "Renderiza a segunda camada da sua skin (jaqueta, mangas, etc) em 3D de verdade, não achatada.",
            },
            {
              name: "Not Enough Animations",
              desc: "Adiciona/melhora animações em terceira pessoa (curvar pra pegar item, girar o corpo, etc).",
            },
            {
              name: "Entity Texture/Model Features",
              desc: "Dá suporte a texturas e modelos customizados de entidade no formato OptiFine (CEM/CIT) — usado pelos resource packs do pack.",
            },
          ].map((extra) => (
            <RevealItem
              key={extra.name}
              className="clip-corner-md flex items-start justify-between gap-3 border border-accent/16 bg-panel/70 px-4.5 py-4"
            >
              <div>
                <div className="text-[14px] font-semibold text-ink">{extra.name}</div>
                <div className="mt-1 text-[11px] leading-[1.6] text-text/50">{extra.desc}</div>
              </div>
              <span className="clip-corner-sm flex-none border border-accent/22 px-2 py-1 font-mono-ui text-[9px] font-semibold tracking-[0.1em] text-accent">
                EXTRA
              </span>
            </RevealItem>
          ))}
        </RevealStagger>

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
            <div className="animate-flicker-soft mb-2 text-accent">EPIC FIGHT // STANDBY</div>
            STAMINA: OK
            <br />
            GUARD: READY
            <br />
            DODGE: READY
            <br />
            BUILD: 1.20.1 / FORGE
          </div>
        </RevealSection>

        <div className="flex flex-wrap justify-between gap-3.5 border-t border-accent/12 py-4.5 pb-8.5 text-[10px] leading-[1.8] tracking-[0.14em] text-text/38">
          <span>DEILTON&apos;S RPG ANIME MODPACK • MINECRAFT 1.20.1 • FORGE • {TOTAL_MODS} MODS</span>
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
