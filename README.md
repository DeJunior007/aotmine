# Deilton's AoT Modpack — Download

Página de download do modpack do servidor Danny's AoT, migrada do design original
(Claude Design, `.dc.html`) para Next.js + Tailwind CSS v4 + Framer Motion.

## Stack
- Next.js 16 (App Router)
- Tailwind CSS v4 (tema via `@theme` em `app/globals.css`, sem `tailwind.config.js`)
- Framer Motion (entrada/scroll reveal, cubo 3D flutuante com parallax de mouse, botão de copiar)

## Rodando local
```bash
npm install
npm run dev
```

## Deploy
Estático — `npm run build` gera um app pronto pra Vercel (sem necessidade de servidor Node).

## Origem do design
Convertido a partir do projeto Claude Design "Danny's AoT Modpack Download"
(`Download Modpack v2.dc.html`), preservando a identidade visual original
(tema "Wings of Freedom" — verde monocromático, fonte Anton, paineis com cantos cortados)
e adicionando animações via Framer Motion.
