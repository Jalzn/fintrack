# Step 2 — Página de visão geral (`/mercado`)

**Goal:** a página responde de relance "estou gastando mais com mercado? pra onde vai? qual foi
minha última compra?". Reusa `StatCard`, `Sparkline`, `usePeriod` e os charts existentes.

Layout alvo de `MarketOverviewPage.tsx`:
```
[ Gasto no período (hero, Δ) ] [ Ticket médio ] [ Idas ao mercado ] [ Maior alta ⬆ ]
[ Feed de alertas .......................................... ]   ← Step 3
[ Evolução do gasto (área/barras, N meses) ] [ Para onde vai (departamento) ]
[ Por loja .............................. ] [ Seus preços — top movers → /precos ]
[ Últimas compras (top 5) ........................... ver todas → /mercado/notas ]
```

## 2.1 — Dados da página

- **Período atual:** `useGrocerySummaryQuery({ granularity:'month', ...periodToRange(period) })` →
  `spendByPeriod` (1 bucket = gasto do período), `byDepartment`, `byStore`, `topProducts*`.
- **Janela de evolução:** 2ª chamada `useGrocerySummaryQuery({ granularity:'month', startDate: início
  de lastNPeriods(period, 6)[0], endDate: fim do período })` → `spendByPeriod` com N buckets.
- **Nº de idas:** `useReceiptsQuery({ page:1, limit:5, ...periodToRange(period) })` → `total` (idas) e
  `data` (recibos recentes).
- **Maior alta + alertas:** `usePriceAnalysisQuery({ ...periodToRange(period) })` (compartilhado com
  o Step 3 e a `/precos`).

## 2.2 — KPIs (StatCard)

- `features/groceries/components/GroceryStats.tsx`: 4 cards.
  - **Gasto no período** — `emphasis="hero"`, `accent="expense"`, `delta` = bucket do período vs
    bucket anterior (de `spendByPeriod`, `goodDirection:'down'` → gastar menos é verde),
    `sparkline` = série da janela (2.1).
  - **Ticket médio** — `accent="neutral"`: gasto do período ÷ `total` de idas (Dinero; guarda
    `total>0`).
  - **Idas ao mercado** — número simples (não-monetário): card próprio ou `StatCard` com label/valor
    textual (se `StatCard` só aceitar `MoneySnapshot`, criar um `MiniStat` enxuto ou variante; manter
    KISS — provavelmente um card simples local).
  - **Maior alta** — produto que mais subiu (last vs min, mesma regra de `PriceAlertCard`):
    nome + `+X%`, `accent="expense"`. Clique → `/mercado/precos`.

## 2.3 — Evolução do gasto

- Reusar `SpendOverTimeChart` (já existe) com a série da janela multi-mês (2.1). Card "Evolução do
  gasto" com o toggle Semana/Mês (mover o `granularity` que hoje vive no `GrocerySummaryTab`).

## 2.4 — Breakdown depto/loja

- Reusar `SpendByDepartmentChart` e `SpendByStoreChart` como hoje (escopo do período). Manter os dois
  cards lado a lado (`grid md:grid-cols-2`).

## 2.5 — Recibos recentes

- `features/groceries/components/RecentReceipts.tsx`: top 5 de `useReceiptsQuery` (loja · data ·
  total + botões ver/excluir reusando `ReceiptDetailDialog`/`DeleteReceiptAlert`). CTA
  "ver todas" → `/mercado/notas`. Empty state se vazio.

## 2.6 — Atalho "Seus preços"

- Bloco compacto com 3–5 top movers (de `usePriceAnalysisQuery`), cada um nome + último preço +
  seta de tendência; CTA "ver índice completo" → `/mercado/precos`. (A lista completa é o Step 4.)

## Done

- `npm run check` + `build` + `test` verdes.
- `/mercado` mostra os 4 KPIs com Δ e sparkline, evolução multi-mês, breakdown depto/loja, recibos
  recentes e o atalho de preços — tudo coerente ao trocar o período no header. Zero dep/endpoint novo.
