# Step 4 — Índice pessoal de preços (`/mercado/precos`)

**Goal:** transformar a planilha densa (`PriceAnalysisTable`) num **índice de preços** legível e
buscável — o diferencial do módulo ("quanto eu costumo pagar por leite? tá caro hoje?"). Reusa o
`ProductHistoryDialog` (já bom) e os dados de `usePriceAnalysisQuery`.

## 4.1 — `features/groceries/components/ProductPriceList.tsx`

- Substitui `PriceAnalysisTable`. Por produto (linha/card escaneável), em vez de 6 colunas numéricas:
  - **Nome** (`capitalize`) + nº de compras (`count`) discreto.
  - **Último preço** em destaque (`formatMoney(lastUnitPrice)`).
  - **Tendência**: seta ⬆/→/⬇ comparando `last` vs `avg` (ou vs penúltima ocorrência), colorida
    (`text-expense` subindo, `text-income` caindo, `text-muted-foreground` estável) + `+X%`.
  - **Mini sparkline** do histórico de `occurrences[].unitPrice` (reusar `@/components/Sparkline`).
  - **Faixa min–máx**: barrinha mostrando onde o `last` cai entre `min` e `max`
    (`bg-muted` + marcador), com `formatMoney(min)`/`formatMoney(max)` nas pontas.
  - Linha inteira clicável → `ProductHistoryDialog` (mesmo estado `selected` de hoje).

## 4.2 — Busca

- `Input` de busca ("buscar produto…", ícone lupa) filtrando por `normalizedName` (client-side,
  `includes` case-insensitive). É a resposta direta a "quanto pago por X?".
- Sem resultado → texto "Nenhum produto encontrado para '{termo}'".

## 4.3 — Ordenação / topo

- Default: ordenar por `count` desc (mais comprados primeiro) — o que o usuário mais quer rastrear.
  Opcional (YAGNI se virar ruído): toggle "mais comprados | maior alta | A–Z".

## 4.4 — Top products

- Manter `TopProductsChart` (por gasto / por frequência) abaixo ou ao lado da lista — já é um bom
  resumo visual. Reusar como está.

## 4.5 — Limpeza

- Remover `PriceAnalysisTable.tsx` após a `PricesPage` passar a usar `ProductPriceList`. Conferir que
  nada mais o importa.

## Done

- `npm run check` + `build` + `test` verdes.
- `/mercado/precos` mostra a lista buscável com tendência + faixa + sparkline; busca filtra;
  clique abre o histórico; `TopProductsChart` presente; `PriceAnalysisTable` removido. Zero dep nova.
