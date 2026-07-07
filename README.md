# RDO Diário

App pessoal de uso diário: **Relatório Diário de Obra (RDO)** + **registro de aprendizado** + tarefas do dia. Feito para ser aberto todo dia, sem poluição visual.

## Telas

- **Hoje** — três anéis de progresso do dia (RDO preenchido, aprendizado registrado, tarefas concluídas) e a lista de tarefas do dia.
- **RDO** — clima (manhã/tarde, praticável ou não), efetivo por função, serviços executados com % de avanço, equipamentos, ocorrências e fotos. Um RDO por obra por dia, com navegação pelo histórico. Salva automaticamente.
- **Aprendizado** — registro rápido de texto com assunto (você cria os assuntos conforme surgem) e uma roda de distribuição mostrando onde seu aprendizado se concentrou nos últimos 30 dias.

## Stack

- [Vite](https://vite.dev) + React + TypeScript + Tailwind CSS v4
- PWA (instalável no celular e no PC, via `vite-plugin-pwa`)
- [Supabase](https://supabase.com) — projeto `rdo-diario` (auth, Postgres com RLS e Storage para fotos)

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar

Qualquer host estático serve (o backend é o Supabase). O caminho mais simples: importar este repositório na [Vercel](https://vercel.com/new) ou [Netlify](https://app.netlify.com/start) — build `npm run build`, pasta de saída `dist`. Depois é só abrir a URL no celular e "Adicionar à tela inicial".

## Primeiro acesso

1. Abra o app e crie sua conta (e-mail e senha).
2. Se o Supabase pedir confirmação por e-mail, clique no link recebido (ou desative *Confirm email* em Authentication → Sign In / Up no painel do Supabase para dispensar esse passo).
3. Cadastre o nome da sua obra ativa e pronto.

## Banco de dados

Tabelas (todas com Row Level Security por usuário): `obras`, `rdos`, `rdo_fotos`, `assuntos`, `aprendizados`, `tarefas` + bucket privado `rdo-fotos` no Storage. As migrações estão aplicadas no projeto Supabase `rdo-diario`.
