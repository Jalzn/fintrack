# Redesenho do Mercado — de "arquivo de notas" a "analista pessoal de compras"

## Contexto

O módulo Mercado (`features/groceries`) está organizado em torno das **estruturas de dados do
backend**, não das **perguntas do usuário**. Hoje são 3 tabs (`Recibos` / `Resumo` / `Preços`)
abrindo em **Recibos** — uma tabela de bookkeeping (loja/data/total). Problemas:

- **Abre na coisa menos interessante.** O valor (tendência de gasto, preços) fica 2 tabs adiante.
- **Config no caminho crítico.** `GrocerySettingsCard` ("Destino das transações") é setup de uma vez
  só, mas ocupa o topo toda visita.
- **Tabs picotam um raciocínio só.** `spendByPeriod`, departamento, loja, top-products,
  price-analysis e o alerta são tudo "insight", repartidos entre Resumo e Preços.
- **Tudo vira tabela.** `PriceAnalysisTable` é uma planilha de 6 colunas — sem sensação de
  "caro/barato", sem leitura de relance.
- **Sem números-manchete** (gasto no período, Δ vs anterior, ticket médio, nº de idas).
- **Insight pouco acionável** (`PriceAlertCard` mostra **1** alerta só, dentro da Resumo).
- **A parte mágica (foto → IA lê a nota → cria transação) está subvalorizada** — `ReceiptUploader`
  é uma caixa tracejada embaixo do settings.

Objetivo: o usuário responder de relance a *Estou gastando mais com mercado? Pra onde vai? Algo
ficou mais caro? Onde compro melhor?* — e capturar uma nota nova em 1 toque.

## Decisão de IA (escolhida com o usuário)

**Overview + sub-rotas** (não scroll único, não tabs):

```
/mercado          → visão geral (KPIs, evolução, breakdown, feed de alertas, atalhos)
/mercado/precos   → índice pessoal de preços (busca + todos os produtos)
/mercado/notas    → arquivo de recibos (tabela completa + paginação)
```

Um **layout** (`MarketLayout`) segura o cabeçalho do cluster: título, sub-nav (`NavLink`
[Visão geral | Preços | Notas]), CTA **Importar nota** e o **Destino** (settings) num `Sheet`.

## Princípios

- **Liderar com insight + ação; rebaixar bookkeeping.** Mercado parece um analista pessoal de
  compras, não um arquivo de notas.
- **Zero backend novo.** Tudo é derivável dos endpoints atuais (ver "Dados disponíveis"). Ticket
  médio/nº de idas exatos no `/summary` ficam como YAGNI futuro.
- **Zero dependência nova.** Recharts + shadcn `chart` + TanStack Query + `date-fns` + Dinero já
  cobrem. Seguir `frontend/CLAUDE.md` (KISS / YAGNI / shadcn-first / sem import cross-feature).
- **Reaproveitar as fundações do dashboard-redesign** (período global, `StatCard`, `lib/period`) em
  vez de reinventar.

## Dados disponíveis (sem backend novo) — `features/groceries/api/groceries.ts`

- **`/summary`** (`useGrocerySummaryQuery({ granularity, startDate?, endDate? })`):
  `spendByPeriod[]`, `byDepartment[]`, `byStore[]`, `topProductsBySpend[]`,
  `topProductsByFrequency[]`, `currencyCode`.
- **`/price-analysis`** (`usePriceAnalysisQuery({ startDate?, endDate? })`): por produto
  `normalizedName`, `count`, `last/min/max/avgUnitPrice`, e `occurrences[]`
  (`date`, `storeName`, `unitPrice`, `quantity`).
- **`/grocery-receipts`** paginado (`useReceiptsQuery({ page, limit, startDate?, endDate? })`):
  `data[]` + **`total`** (= nº de idas no período).
- **`/settings`** (`useGrocerySettingsQuery` / `useUpdateGrocerySettingsMutation`).

Derivações client-side (sem fetch novo):
- **Δ% gasto, ticket médio, nº de idas** ← `spendByPeriod` + `paginatedReceipts.total`.
- **Tendência + faixa min–máx + sparkline por produto** ← `priceAnalysisRow` + `occurrences`.
- **"Melhor loja pro item X" / "faz N semanas sem comprar Y"** ← `occurrences[].storeName/date`.

## Código reutilizável (paths confirmados)

- **Período:** `usePeriod()` (`@/hooks/use-period`, URL `?period=YYYY-MM`); `periodToRange`,
  `lastNPeriods`, `previousPeriod`, `shiftPeriod`, `formatPeriodShort` (`@/lib/period`).
- **Period switcher global:** em `components/AppShell.tsx`, gated por `PERIOD_AWARE_PATHS`
  (hoje **não** inclui `/mercado`) → estender no Step 1.
- **`StatCard`** (`@/components/StatCard`): `delta` (`{current, previous, goodDirection}`),
  `emphasis`, `accent`, `icon`, `sparkline`, `isLoading`.
- **`Sparkline`** vive em `features/dashboard/components/Sparkline.tsx` → **promover** para
  `@/components/Sparkline.tsx` (passa a ter ≥2 features usando; CLAUDE.md §3 proíbe cross-feature).
- **Componentes do Mercado a manter como estão:** `ReceiptDetailDialog`, `DeleteReceiptAlert`,
  `ProductHistoryDialog`, `SpendByDepartmentChart`, `SpendByStoreChart`, `SpendOverTimeChart`,
  `TopProductsChart`, `department-labels.ts`.
- **Dinheiro:** `formatMoney`, `moneyToNumber` (`@/lib/money`). **`cn`** (`@/lib/utils`).
- **Charts:** `components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`).

## Steps

| # | Doc | Resumo |
|---|-----|--------|
| 1 | [01-shell-routing.md](01-shell-routing.md) | `MarketLayout` + sub-rotas; settings vira `Sheet`; CTA importar + período no cluster; quebra `GroceriesPage` em 3 páginas; empty/first-run; promove `Sparkline` |
| 2 | [02-overview-page.md](02-overview-page.md) | KPIs (gasto+Δ, ticket médio, idas, maior alta), evolução de gasto, breakdown depto/loja, recibos recentes |
| 3 | [03-insights-feed.md](03-insights-feed.md) | `lib/grocery-insights.ts` (regras puras) + `GroceryInsightStrip`; substitui o alerta único; testes |
| 4 | [04-price-index.md](04-price-index.md) | `/precos`: `ProductPriceList` com busca + tendência + faixa min–máx + sparkline; reusa `ProductHistoryDialog`; mantém `TopProductsChart` |
| 5 | [05-verification.md](05-verification.md) | Gates end-to-end (check/build/test) + revisão visual + a11y + empty states |

## Princípios de execução

- **Incremental e isolado.** Cada step deixa o app funcional e `npm run check`/`build`/`test`
  verdes; pode ser mergeado sozinho. O Step 1 já entrega navegação nova sem perder funcionalidade
  (as 3 páginas reusam os componentes atuais antes de serem enriquecidas).
- **Sem abstração prematura.** Só promover `Sparkline` / criar `grocery-insights.ts` porque há uso
  real concreto.
- **Dados primeiro, enfeite depois.** Steps 1–3 entregam o grosso do valor; Step 4 é o índice de
  preços; Step 5 é polimento/verificação.

## Riscos & defaults

- **Semântica do período vs. evolução.** KPIs/breakdowns/alertas são escopo do **período
  selecionado** (`periodToRange(period)`); a **evolução** precisa de janela multi-mês → 2ª chamada a
  `/summary` com range `lastNPeriods(period, N)` + `granularity:'month'`. Duas queries cacheadas, KISS.
- **Δ% com base zero** (período anterior sem compra) → `StatCard` já trata ("sem base no mês
  anterior"); não inventar `∞`.
- **Insights pobres com pouco dado** (1ª nota, mês recém-começado) → cada regra tem guarda mínima
  (`MIN_OCCURRENCES` etc.); o card some em vez de mentir.
- **First-run.** `settings == null` → onboarding (configurar destino + 1ª foto), não despejar
  dashboard vazio. Configurado mas sem nota → CTA "tire a primeira foto".
- **Estado dos diálogos entre páginas.** `ReceiptDetailDialog`/`DeleteReceiptAlert` são acionados em
  mais de uma página → cada página dona do seu estado (`viewingId`/`deleting`); o `MarketLayout`
  cuida só do diálogo aberto pós-importação. Sem context novo (KISS).
- **`exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`** (tsconfig) — montar params e ler
  arrays/`occurrences` com cuidado (omitir chaves opcionais, tratar `undefined`).
