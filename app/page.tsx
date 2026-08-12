import { cookies } from "next/headers";
import Image from "next/image";
import { CopyAddress } from "@/components/CopyAddress";
import { EmblemCube } from "@/components/EmblemCube";
import { AccessGate } from "@/components/AccessGate";
import { DecryptReveal } from "@/components/DecryptReveal";
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
        Não é o .zip dos mods — é um programinha (<Strong>InstalarDannysAoT</Strong>) que faz
        tudo sozinho: baixa o modpack mais atual, instala os mods e o config certos, configura o
        Fabric na versão certa e já deixa o servidor cadastrado.
      </>
    ),
    tips: [
      <>
        Linux:{" "}
        <a href={INSTALLER_LINUX_URL} target="_blank" rel="noopener noreferrer">
          baixar InstalarDannysAoT
        </a>
        .
      </>,
      INSTALLER_WINDOWS_URL ? (
        <>
          Windows:{" "}
          <a href={INSTALLER_WINDOWS_URL} target="_blank" rel="noopener noreferrer">
            baixar InstalarDannysAoT.exe
          </a>
          .
        </>
      ) : (
        "Windows: em breve — por enquanto peça pro Deilton rodar/gerar o instalador pra você."
      ),
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
            <span className="text-[11px] tracking-[0.14em] text-text/35">{"// PARADIS NODE"}</span>
            <span className="flex-1" />
            <TagPill>MINECRAFT 1.21.1</TagPill>
            <TagPill>FABRIC</TagPill>
          </div>
        </HeroReveal>

        {/* hero */}
        <div className="grid grid-cols-1 items-center gap-9 py-14 md:grid-cols-2">
          <HeroReveal delay={0.05}>
            <div>
              <span className="clip-corner-md mb-5.5 inline-block border border-accent/34 bg-accent-deep/50 px-3 py-1.75 font-semibold text-[10px] tracking-[0.24em] text-accent">
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
          <StatusBadge dot="bg-accent-dim">75 MODS</StatusBadge>
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
                  <span className="text-[9px] tracking-[0.16em] text-text/30">{"// ACTIVE"}</span>
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
                  <span className="text-[9px] tracking-[0.16em] text-text/30">{"// 168 MB"}</span>
                </div>
                <a
                  href={DOWNLOAD_URL}
                  className="clip-corner-btn block bg-linear-to-b from-accent to-accent-mid px-4 py-4.75 text-center text-[14px] font-semibold tracking-[0.14em] text-[#08120a] uppercase transition-[box-shadow,transform] duration-250 hover:-translate-y-px hover:shadow-[0_0_38px_rgba(127,214,138,0.42)]"
                >
                  ↓ Baixar o modpack (.zip)
                </a>
                <div className="flex flex-wrap gap-3.5 text-[10px] tracking-[0.16em] text-text/45">
                  <span>168 MB</span>
                  <span>75 MODS</span>
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
          <span className="text-[9px] tracking-[0.2em] text-accent/55">
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
          <RevealItem className="flex flex-col justify-center border border-dashed border-accent/24 px-4.5 py-4">
            <div className="mb-1.75 font-display text-[22px] text-accent">+70</div>
            <div className="text-[10px] tracking-[0.14em] text-text/45">OUTROS MODS</div>
          </RevealItem>
        </RevealStagger>

        {/* como instalar */}
        <RevealSection className="clip-corner-xl mt-13 border border-accent/20 bg-panel/55 px-6.5 py-7">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="m-0 font-display text-[clamp(26px,5vw,40px)] tracking-[0.03em] text-ink uppercase">
              Como instalar
            </h2>
            <span className="text-[9px] tracking-[0.2em] text-accent/50">
              SETUP SEQUENCE // 06 STEPS
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
          <span className="text-[9px] tracking-[0.2em] text-accent/55">
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
            <div className="mb-2 text-accent">ODM GEAR // STANDBY</div>
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
          <span>DEILTON&apos;S AOT MODPACK • MINECRAFT 1.21.1 • FABRIC • 75+ MODS</span>
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
