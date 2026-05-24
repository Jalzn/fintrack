# Dashboard Redesign — De "diário de lançamentos" a "central de decisão"

## Contexto

O frontend hoje é competente e limpo (Geist, tokens semânticos, shadcn, dark mode), mas o
**dashboard é uma foto estática de um único mês, sem evolução nem contexto**. Os 3 números
(Saldo/Receitas/Despesas) não têm comparação ("R$ 5.939,70" não diz se é muito ou pouco), não há
gráfico temporal, não há insights, e os **orçamentos** (a info mais acionável — *estou estourando
algo?*) ficam escondidos em outra página. Cada página trata tempo de um jeito diferente.

Objetivo: o usuário responder em 5 segundos a *Estou bem este mês? Onde está o problema? Estou
melhorando?* — sem virar um app pesado.

## Decisões

- **Período global único** (`?period=YYYY-MM` na URL) consumido por Dashboard, Transações,
  Orçamentos e Mercado. Centraliza o que hoje está duplicado/divergente.
- **Todo número-chave ganha contexto**: delta vs período anterior (seta + % colorido) e, quando
  fizer sentido, sparkline/tendência.
- **Orçamentos e insights sobem para o dashboard**. Insights são **regras simples client-side**
  (sem IA, sem backend novo).
- **Reusar Recharts** (já é dep, usado em `features/groceries`) e o wrapper `components/ui/chart.tsx`.
- Filosofia: seguir `frontend/CLAUDE.md` (KISS / YAGNI / sem abstração prematura / shadcn-first).
  Imitar padrões já existentes no repo em vez de inventar.

## Libs (zero dependências novas)

- **Recharts** — já instalado; usado em `features/groceries/components/*Chart.tsx`.
- **shadcn `chart`** — já existe em `components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`,
  `ChartTooltipContent`).
- `@tanstack/react-query` (`useQueries` para a série temporal), `date-fns`, Dinero via `@/lib/money`.
- **Não adicionar:** nenhuma lib de chart/estado/datas nova. Nada de backend novo nesta iniciativa
  (tudo derivável dos endpoints atuais).

## Código reutilizável (paths confirmados)

- **Período:** `currentPeriod()`, `previousPeriod(period)` em
  `features/budgets/components/MonthSwitcher.tsx` (formato `YYYY-MM`, validado por
  `PERIOD_REGEX` em `features/budgets/pages/BudgetsPage.tsx`). `getMonthRange()` está **duplicado**
  em `features/dashboard/components/SummaryCards.tsx` e `CategoryBreakdown.tsx` → consolidar.
- **Saldo:** `useBalanceQuery({ startDate, endDate, currencyCode })`
  (`features/transactions/hooks/use-balance-query.ts`) → `GET /transactions/balance`, retorna
  `Balance { balance, income, expense }` (`@/types/api`). Chamar para período atual **e** anterior
  dá os deltas; chamar N meses dá a série.
- **Transações:** `useTransactionsQuery(filters)` + `TransactionListFilters`
  (`features/transactions/api/keys.ts`) — **já aceita `startDate`/`endDate`/`type`/`categoryId`
  opcionais** (filtro de data é só fiação de UI).
- **Orçamentos:** `useBudgetsQuery(period)` (`features/budgets/hooks/`), `Budget` tem
  `planned/spent/remaining/percentSpent` prontos.
- **Charts:** imitar `features/groceries/components/SpendByDepartmentChart.tsx` (barras) e
  `SpendOverTimeChart.tsx` (linha). Donut → `PieChart`/`Pie` do Recharts.
- **Dinheiro/cor:** `formatMoney`, `moneyToNumber` (`@/lib/money`); `colorFromHex`,
  `CATEGORY_COLORS` (`@/lib/category-colors`). `cn` (`@/lib/utils`).
- **Shell:** header em `src/components/AppShell.tsx`; nav em `src/components/AppSidebar.tsx`.
- **Regra de pasta (CLAUDE.md §3):** componente usado por +1 feature vive em `src/components/`;
  util global em `src/lib/`. **Proibido** import cruzado entre features.

## Steps

| # | Fase | Doc | Resumo |
|---|------|-----|--------|
| 1 | 0 | [01-foundations.md](01-foundations.md) | `lib/period.ts` + `usePeriod` global; header vira barra de contexto; `StatCard` com delta |
| 2 | 1 | [02-dashboard-story.md](02-dashboard-story.md) | Hero do saldo, gráfico de evolução 6m, bloco de orçamentos, faixa de insights, donut→Recharts |
| 3 | 2 | [03-transactions-insights.md](03-transactions-insights.md) | Resumo do conjunto filtrado + busca + intervalo de datas |
| 4 | 3 | [04-budgets-overview.md](04-budgets-overview.md) | Resumo agregado + drill-down do card → transações |
| 5 | 4 | [05-grocery-charts-audit.md](05-grocery-charts-audit.md) | Auditar gráficos do Mercado + empty states + alerta de preço |
| 6 | 5 | [06-branding-polish.md](06-branding-polish.md) | Hierarquia do número-herói, accent de marca, densidade, micro-interações |
| 7 | — | [07-verification.md](07-verification.md) | Gates end-to-end (check/build/test) + revisão visual |

## Princípios de execução

- **Incremental e isolado por step.** Cada step deve deixar o app funcional, `npm run check`/`build`/
  `test` verdes. Pode ser mergeado sozinho.
- **Sem abstração prematura.** Só criar `StatCard`/`lib/period.ts` porque já há ≥2 usos reais.
- **Dados primeiro, enfeite depois.** Fases 0–3 entregam valor; Fase 5 é polimento.

## Riscos & defaults

- **Série de 6 meses = N chamadas a `/transactions/balance`** (via `useQueries`). É KISS e usa
  número exato do backend. Se virar gargalo, vira **um** endpoint depois (YAGNI agora).
- **Deltas % com divisão por zero** (período anterior zerado) → tratar: mostrar "—" / "novo", não `∞`.
- **Insights podres com pouco dado** (mês recém-começado) → cada regra tem guarda mínima; some o chip
  em vez de mentir.
- **Barras "vazias" no Mercado/Resumo** vistas em screenshot headless são provavelmente artefato de
  animação/medição, não bug — Step 5 **audita** antes de mexer.
- **`exactOptionalPropertyTypes`/`noUncheckedIndexedAccess`** (tsconfig) — montar filtros e ler
  arrays com cuidado (padrão já visto em `TransactionsPage.tsx`).
