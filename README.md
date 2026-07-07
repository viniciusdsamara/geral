# RDO Diário

App pessoal de uso diário: **Relatório Diário de Obra (RDO)** + **registro de aprendizado** + tarefas do dia. Feito para ser aberto todo dia, sem poluição visual.

## Telas

- **Hoje** — três anéis de progresso do dia (RDO preenchido, aprendizado registrado, tarefas concluídas) e a lista de tarefas do dia.
- **RDO** — clima (manhã/tarde, praticável ou não), efetivo por função, serviços executados com % de avanço, equipamentos, ocorrências e fotos. Um RDO por obra por dia, com navegação pelo histórico. Salva automaticamente.
- **Aprendizado** — registro rápido de texto com assunto (você cria os assuntos conforme surgem) e uma roda de distribuição mostrando onde seu aprendizado se concentrou nos últimos 30 dias.
- **Evolução** — retrospectivas semanais escritas automaticamente por um agente (ver abaixo).

## Retrospectiva e resumo semanais automáticos

Toda sexta-feira às 10h (Brasília), uma Routine do Claude Code dispara uma sessão que analisa a semana (sexta a quinta) e escreve **duas peças**, sempre **incrementando, nunca reescrevendo**:

- **Evolução** — progressão do aprendizado, pontos críticos e sugestões → [`RETROSPECTIVA.md`](./RETROSPECTIVA.md) + linha `tipo='evolucao'` na tabela `retrospectivas`;
- **Resumo da obra** — compilado dos RDOs (serviços e avanços, efetivo, clima, ocorrências e relatos) → [`RESUMO-SEMANAL.md`](./RESUMO-SEMANAL.md) + linha `tipo='resumo'`.

A aba **Evolução** do app exibe as duas (o app só tem permissão de leitura nessa tabela).

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

## Controle de acesso

O app é fechado por aprovação. A conta `viniciusdsamara@gmail.com` nasce como **administrador aprovado** (via trigger no banco). Qualquer outra conta criada fica **pendente**: a pessoa consegue fazer login, mas vê apenas a tela "Aguardando aprovação" — e as policies de RLS (restritivas, em todas as tabelas e no Storage) bloqueiam qualquer leitura ou escrita de dados até o admin liberar. O painel **Administração** (menu ⋯ da tela Hoje, visível só para admin) lista as contas e permite aprovar/revogar.

## Primeiro acesso

1. Abra o app e crie sua conta (e-mail e senha).
2. Se o Supabase pedir confirmação por e-mail, clique no link recebido (ou desative *Confirm email* em Authentication → Sign In / Up no painel do Supabase para dispensar esse passo).
3. Cadastre o nome da sua obra ativa e pronto.

## Banco de dados

Tabelas (todas com Row Level Security por usuário): `obras`, `rdos`, `rdo_fotos`, `assuntos`, `aprendizados`, `tarefas` + bucket privado `rdo-fotos` no Storage. As migrações estão aplicadas no projeto Supabase `rdo-diario`.
