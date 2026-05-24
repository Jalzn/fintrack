# Step 3 — Feed de alertas acionáveis

**Goal:** trocar o alerta único (`PriceAlertCard`) por um **feed** de insights úteis e acionáveis,
derivados client-side dos dados que já temos. Espelha a abordagem de
`features/dashboard/lib/insights.ts` (regras puras + testes).

## 3.1 — `features/groceries/lib/grocery-insights.ts` (função pura)

```ts
buildGroceryInsights({ priceAnalysis, summary, period, now }) => GroceryInsight[]
```
Sem IA, sem fetch novo. Cada regra com guarda mínima; não emite se faltar dado. Tipos de insight
(ordenados por relevância, limitar a ~3–4 no feed):

- **Maior alta de preço** — produto com maior `(last-min)/min` (reusar limiares de `PriceAlertCard`:
  `MIN_OCCURRENCES = 2`, `MIN_RISE_PCT = 10`). Tom: alerta. Ação → `/mercado/precos`.
- **Maior queda de preço** — simétrico (last bem abaixo do avg/max) → "bom momento pra estocar". Tom:
  positivo.
- **Melhor loja pra um item frequente** — para um top-product, agrupar `occurrences` por
  `storeName`, achar o menor preço médio; só emitir se houver ≥2 lojas e diferença relevante. Tom:
  neutro/dica. ("Arroz sai mais barato no {loja}: {preço}").
- **Faz N semanas sem comprar X** — para um produto frequente (`count` alto), `now - max(date das
  occurrences)`; emitir se ≥ ~3 semanas. Tom: lembrete/restock.
- **Gasto acima do mês anterior** — de `summary.spendByPeriod` (últimos 2 buckets), se Δ ≥ ~15%.
  Tom: alerta.

`GroceryInsight = { id, tone: 'positive'|'warning'|'neutral', icon, title, detail, href? }`.

## 3.2 — `features/groceries/components/GroceryInsightStrip.tsx`

- Renderiza os insights como cards/linhas (ícone à esquerda no quadradinho `rounded-lg`, título +
  detalhe), reusando o visual do `PriceAlertCard` atual (tons via tokens: `expense/10`+`text-expense`
  para warning, `income/10`+`text-income` para positive, `muted` para neutral).
- `href` opcional → `Link`/`navigate`. Some o card sem dado; se a lista inteira ficar vazia, não
  renderiza nada (não ocupa espaço com "nenhum alerta").
- Usado na `MarketOverviewPage` (Step 2, slot do feed).

## 3.3 — Remover o alerta único

- Apagar `PriceAlertCard.tsx` e seu uso no antigo `GrocerySummaryTab` (a lógica migra para a regra
  "maior alta" de `grocery-insights.ts`). Conferir que nada mais importa o componente.

## 3.4 — Testes

- `grocery-insights.test.ts`: cada regra com um caso que dispara e um que NÃO dispara (guarda). Caso
  "sem dados" → `[]`. Testar comportamento (entradas → insights), não estrutura interna.

## Done

- `npm run check` + `build` + `test` verdes (inclui `grocery-insights.test.ts`).
- A overview mostra um feed com ≥1 alerta acionável nos dados de seed; sem dados, o feed somem
  silenciosamente; `PriceAlertCard` removido. Zero dep/endpoint novo.
