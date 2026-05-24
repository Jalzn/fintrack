# Step 2 (Fase 1) — Dashboard que conta uma história

**Goal:** o dashboard responde "estou bem? onde está o problema? estou melhorando?". Maior impacto
percebido. Reusa `StatCard`, `usePeriod`, Recharts. Segue `frontend/CLAUDE.md`.

Layout alvo de `DashboardPage.tsx`:
```
Greeting (sem a data redundante — período já está no header)
[ Saldo (hero, delta, sparkline) ]  [ Receitas (delta) ]  [ Despesas (delta) ]
Insights: [chip] [chip] [chip]
[ Evolução 6m (barras + linha) .......... ]  [ Por categoria (donut) ]
[ Orçamentos do mês (top 4) ............................................. ]
[ Transações recentes ................................................... ]
```

## 2.1 — Deltas nos cards (hero + secundários)

- `SummaryCards.tsx` → reescrever sobre `StatCard`. Buscar **dois** períodos:
  `useBalanceQuery(range)` (atual) e `useBalanceQuery(periodToRange(previousPeriod(period)))`.
- Saldo = `StatCard emphasis="hero"` com `delta` (saldo atual vs anterior) e `sparkline` (2.2).
  Receitas/Despesas = cards secundários com seus deltas. Layout `grid lg:grid-cols-[1.6fr_1fr_1fr]`.
- **Semântica do delta:** para despesa, queda é "bom" → o componente recebe `goodDirection:'down'`
  para colorir corretamente (menos despesa = verde).

## 2.2 — Série de evolução (6 meses)

- `features/dashboard/hooks/use-monthly-trend.ts`: `useQueries` com `lastNPeriods(period, 6)`
  chamando `getBalance` por mês → `[{ period, income, expense, balance }]`. (Cacheável; KISS.)
- `features/dashboard/components/TrendChart.tsx`: `ChartContainer` + `ComposedChart` (Recharts):
  `Bar` receitas (`var(--chart-1)`) + `Bar` despesas (`var(--chart-2)`) + `Line` saldo. Imitar
  `features/groceries/components/SpendOverTimeChart.tsx`. Eixo X = `formatPeriod` curto ("mai");
  Y compacto (`Intl.NumberFormat compact`); `ChartTooltipContent` com `formatMoney`.
- Sparkline do hero: mini `LineChart` (sem eixos) reusando os mesmos dados (saldo).

## 2.3 — Donut de categorias → Recharts

- `CategoryBreakdown.tsx`: trocar o `conic-gradient` por `PieChart`/`Pie` (donut) do Recharts dentro
  de `ChartContainer`. Manter a lógica de agregação atual (já correta). Cor por categoria via
  `colorFromHex(cat.color)`. Adicionar `ChartTooltip` (categoria, valor, %) e **clique na fatia/linha
  → `navigate('/transacoes?type=EXPENSE&categoryId=...')`** (drill-down). Total no centro do donut.
- Manter a lista lateral (já boa); item clicável leva ao mesmo filtro.

## 2.4 — Bloco "Orçamentos do mês"

- `features/dashboard/components/BudgetSnapshot.tsx`: `useBudgetsQuery(period)`, ordenar por
  `percentSpent` desc, mostrar top 4 (barra + %, estourados em `text-expense`/badge "Estourado"
  reusando o padrão do `BudgetCard`). CTA "Ver todos" → `/orcamentos?period=`. Empty state com CTA
  para criar.

## 2.5 — Faixa de Insights (client-side, regras simples)

- `features/dashboard/lib/insights.ts`: função pura `buildInsights({ balance, prevBalance, byCategory,
  budgets, period }) => Insight[]` (sem IA, sem fetch novo). Regras (cada uma com guarda mínima):
  - **Maior categoria** do mês ("Moradia concentra 44% das despesas").
  - **Maior variação** vs mês anterior por categoria ("Restaurantes +32% vs abril").
  - **Orçamento mais crítico** (`percentSpent` máx, ≥80%) ("Lazer já em 110% ⚠").
  - **Ritmo de gasto** (despesa/dias-decorridos × dias-do-mês vs média) — só se mês em andamento.
- `features/dashboard/components/InsightStrip.tsx`: chips/cards (ícone + texto + tom: neutro/alerta).
  Some chips sem dado suficiente. **Teste:** `insights.test.ts` cobrindo cada regra + caso sem dados.

## 2.6 — Greeting

- `GreetingHeader.tsx`: remover a data (agora redundante com o período no header); manter saudação.

## Done

- `npm run check` + `build` + `test` verdes.
- Dashboard mostra deltas, evolução 6m, donut interativo, orçamentos e ≥1 insight com os dados de seed.
- Trocar o `?period=` atualiza tudo coerentemente. Zero dep nova.
