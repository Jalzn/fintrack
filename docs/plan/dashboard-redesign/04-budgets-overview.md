# Step 4 (Fase 3) — Orçamentos: visão agregada + drill-down

**Goal:** ver a saúde geral do orçamento do mês de relance e pular do card para as transações que o
compõem. Segue `frontend/CLAUDE.md`.

## 4.1 — Resumo agregado no topo

- `features/budgets/components/BudgetsOverview.tsx`: a partir de `useBudgetsQuery(period)`, somar
  `planned`, `spent`, `remaining` (via Dinero/`@/lib/money` — **nunca** somar `number` puro) e mostrar:
  - Total planejado × total gasto, **uma barra de progresso geral** (verde→âmbar→vermelho conforme %),
    quanto sobra, e contagem de orçamentos estourados.
  - Reusar `StatCard`/o visual das barras do `BudgetCard` existente. Colocar acima do grid de cards
    em `BudgetsPage.tsx`.

## 4.2 — Drill-down do card

- `BudgetCard.tsx`: tornar o card clicável → `navigate('/transacoes?categoryId=<id>&type=EXPENSE'
  + range do período)`. Como o card já tem menu de Editar/Excluir, garantir que o clique de
  navegação não conflite com os botões de ação (parar propagação nos botões; a área principal navega).
- Acessibilidade: a área navegável é um `Link`/role apropriado com label claro (CLAUDE.md §11).

## 4.3 — Período coerente

- `BudgetsPage.tsx` já passou a usar `usePeriod` na Fase 0; confirmar que o `PeriodSwitcher` do header
  substitui (ou alinha com) o `MonthSwitcher` local para não haver dois controles de mês na mesma tela.
  **Decisão:** manter um único controle de período (o do header); remover o `MonthSwitcher` duplicado
  da página se ficar redundante.

## Done

- `npm run check` + `build` + `test` verdes.
- Topo de Orçamentos mostra total planejado/gasto/sobra + barra geral; clicar num card abre as
  transações daquele orçamento no período. Sem dois seletores de mês concorrentes.
- **Teste:** `BudgetsOverview.test.tsx` (agregação de planejado/gasto com ≥2 orçamentos, incluindo um
  estourado).
