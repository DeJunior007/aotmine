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
`npm run build` + Vercel. A home (`/`) é renderizada sob demanda (não estática) —
busca o conteúdo do ModCodex no Supabase a cada request.

## ModCodex (wiki do modpack)
O modal "ver todos os mods" (`components/modcodex/`) é uma wiki interativa: mods têm
visão geral, "comece aqui", itens, receitas, tutoriais passo-a-passo, dicas, problemas
comuns, mods relacionados e Origins — tudo conectado por links clicáveis (sintaxe
`[[tipo:slug|Rótulo]]` nos campos de texto, ver `components/modcodex/RichText.tsx`).

O conteúdo vive no Supabase já conectado ao projeto (schema em
`supabase/migrations/0001_modcodex.sql`), não é hardcoded. Tabelas: `mods`, `items`,
`recipes` + `recipe_ingredients`, `tutorials` + `tutorial_steps` + `tutorial_step_items`,
`tips`, `common_problems`, `mod_relationships`, `origins`. RLS habilitado em todas —
leitura pública (anon), sem escrita anônima.

**Para cadastrar conteúdo novo** (mod com profundidade, item, receita, tutorial, dica,
Origin), insira direto no SQL Editor do dashboard do Supabase seguindo o schema da
migration — nenhum componente precisa mudar. Um mod sem conteúdo profundo ainda
aparece normal na lista (só nome/resumo/`getting_started_steps`); ele "ganha
profundidade" assim que ganha linhas em `items`/`recipes`/`tutorials`/`origins`.

Busca de dados: `lib/modcodex/queries.ts` (`getModCodex()`, roda no Server Component
de `app/page.tsx`, várias queries simples montadas em árvore no lado do servidor —
volume de dados pequeno, sem necessidade de busca full-text no Postgres).

## Origem do design
Convertido a partir do projeto Claude Design "Danny's AoT Modpack Download"
(`Download Modpack v2.dc.html`), preservando a identidade visual original
(tema "Wings of Freedom" — verde monocromático, fonte Anton, paineis com cantos cortados)
e adicionando animações via Framer Motion.
