# RDO Diário — guia para sessões do Claude

App pessoal do Vini (engenheiro civil): RDO de obra + diário de aprendizado.
PWA React 19 + Vite + Tailwind v4 + Supabase. Filosofia: **clean, mínimo de
ruído, sem gamificação** — barrar features que não ajudem a evolução dele.

## Comandos

- `npm run dev` — dev server
- `npm run build` — tsc --noEmit + vite build (obrigatório passar antes de push)
- Verificação visual: script Playwright com dados simulados (o ambiente remoto
  bloqueia `*.supabase.co`; use `page.route` para mockar o REST). Chromium em
  `/opt/pw-browsers/chromium` (passe `executablePath`).

## Fluxo de git

- Desenvolver na branch `claude/fervent-goldberg-pe101s`, commitar, push.
- **main é produção** (Vercel publica automático): merge da branch na main e
  push das duas ao final de cada entrega.

## Backend (Supabase, projeto rdo-diario, id nkyqobsuezkdgheasoxj)

- Tabelas: `obras`, `rdos` (1/obra/dia, jsonb efetivo/servicos), `rdo_fotos`
  (+ bucket privado `rdo-fotos`), `assuntos`, `aprendizados`, `tarefas`,
  `retrospectivas` (tipo: evolucao|resumo|fechamento, append-only, app só lê),
  `perfis` (aprovação de contas; trigger cria no signup).
- RLS em tudo por `user_id` + policies restritivas `apenas_aprovados`; o
  cliente também filtra por `user_id` (defesa em profundidade).
- Mudanças de schema via `mcp__Supabase__apply_migration`.
- Admin: viniciusdsamara@gmail.com (trigger `handle_new_user`).

## Automação

- Routine "Evolução + Resumo semanal" toda sexta 13:02 UTC (10:02 BRT), sessão
  nova: escreve Evolução (→ RETROSPECTIVA.md), Resumo da obra
  (→ RESUMO-SEMANAL.md) e Fechamento de obras arquivadas, sempre
  **acrescentando, nunca reescrevendo**, e insere em `retrospectivas`.
- Os dois .md são append-only: nunca editar seções existentes.

## Convenções do app

- Código e UI em português; tom direto, sem emojis na UI.
- Markdown das retrospectivas: só `###`, `-` e `**negrito**` (renderizador
  mínimo em `src/components/Markdown.tsx`).
- Tokens de cor em `src/index.css` (claro/escuro via CSS vars); paleta
  categórica s1–s8 para gráficos.
- Confiabilidade primeiro: rascunho local do RDO em localStorage, fotos
  comprimidas (`src/lib/imagem.ts`), erros de rede sempre visíveis com retry,
  nunca descartar texto digitado em falha.
