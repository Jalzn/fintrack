# Step 7 — Verificação end-to-end

**Goal:** garantir que cada fase entrou sem regressão e que o conjunto cumpre o objetivo (entender
finanças e evolução de relance).

## Gates por step (obrigatórios antes de mergear)

- `npm run check` (Biome) — sem erros, sem `// biome-ignore` sem justificativa.
- `npm run build` (`tsc -b && vite build`) — TS strict passa.
- `npm test` (Vitest) — verde; cobertura mínima por feature nova: golden path + um caso de erro/edge.

## Verificação funcional

- **Período global:** trocar `?period=` reflete em Dashboard, Transações e Orçamentos de forma
  coerente; URL é compartilhável e reproduz o estado.
- **Deltas:** com seed, Saldo/Receitas/Despesas mostram variação vs mês anterior; despesa menor =
  verde; período anterior zerado não gera `∞`.
- **Evolução:** gráfico de 6 meses renderiza barras + linha; tooltip com `formatMoney`.
- **Insights:** ≥1 chip relevante com seed; somem quando faltam dados.
- **Drill-downs:** clique no donut, no bloco de orçamentos do dashboard e no `BudgetCard` leva às
  transações filtradas certas.
- **Transações:** resumo do recorte bate com os filtros; intervalo de datas funciona.
- **Mercado:** "Resumo" comunica; vazio mostra placeholder.

## Revisão visual (Playwright)

- Reusar o harness de screenshots (mock de API + JWT fake; interceptar **só** `localhost:3000/**`) —
  ver memória `frontend-screenshot-harness` / `/tmp/fintrack-shots.mjs`. Capturar Dashboard,
  Transações, Orçamentos e Mercado em **desktop claro/escuro + mobile**; comparar com o baseline
  pré-redesign em `/tmp/fintrack-shots/`.
- Conferir: nada cortado em mobile; contraste OK no dark; sem layout shift grosseiro.

## Acessibilidade (mínimo, CLAUDE.md §11)

- Inputs com `<Label htmlFor>`; botões só-ícone com `aria-label`; foco visível; navegação por teclado;
  diálogos shadcn com trap de foco intacto.

## Done

- Todos os gates verdes em cada step; checklist funcional e visual cumprido; baseline atualizado.
