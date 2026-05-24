# Step 5 (Fase 4) — Mercado: auditar gráficos + empty states + alerta de preço

**Goal:** garantir que a aba "Resumo" realmente comunica (nas capturas headless as barras saíram
vazias) e adicionar um insight de preço. Segue `frontend/CLAUDE.md`.

## 5.1 — Auditar os gráficos (antes de mexer)

- Abrir `/mercado` → "Resumo" no navegador real e verificar se barras/linha aparecem em
  `SpendByDepartmentChart.tsx`, `SpendByStoreChart.tsx`, `SpendOverTimeChart.tsx`,
  `TopProductsChart.tsx`. O código parece correto (`fill="var(--color-value)"` via `ChartContainer`);
  as barras vazias vistas em screenshot são provavelmente **artefato de animação/medição headless**.
- **Se for bug real:** causas prováveis a checar — `ChartContainer`/`ResponsiveContainer` com altura
  0 em algum container flex; `var(--color-value)` não resolvendo (config do `ChartConfig`);
  `isAnimationActive` deixando barras em 0. Corrigir minimamente.
- **Se for só artefato:** não mexer no render; seguir para empty states e 5.3.

## 5.2 — Empty states decentes

- Quando `summary`/`priceAnalysis` vierem vazios (usuário sem recibos), cada card de gráfico mostra
  um placeholder claro ("Importe sua primeira nota para ver a análise") em vez de eixos vazios.
  Padrão reusável: o mesmo "border-dashed + texto muted" já usado em `CategoryBreakdown.tsx`.

## 5.3 — Alerta de preço

- `features/groceries/components/PriceAlertCard.tsx`: a partir de `priceAnalysis.products`, destacar
  o produto com **maior alta** (`lastUnitPrice` vs `minUnitPrice`/`avgUnitPrice`) — "Café subiu 38%
  desde a menor compra". Colocar no topo da aba "Resumo". Regra simples, sem backend novo.
- Reusar `formatMoney`; só mostra se houver ≥1 produto com histórico suficiente.

## 5.4 — Integração de período (opcional)

- Avaliar alinhar o toggle semana/mês do Mercado ao período global. **Só** se não complicar; o Mercado
  tem granularidade própria (preços ao longo do tempo). Default: deixar como está (YAGNI).

## Done

- `npm run check` + `build` + `test` verdes.
- "Resumo" comunica com dados; vazio mostra placeholder, não eixos órfãos; alerta de preço aparece
  com histórico. Conclusão da auditoria (bug vs artefato) anotada no PR.
