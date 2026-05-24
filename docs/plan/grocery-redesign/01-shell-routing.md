# Step 1 — Shell, sub-rotas e split de páginas

**Goal:** trocar as 3 tabs por **overview + sub-rotas** com um layout/cluster compartilhado, sem
perder nenhuma funcionalidade. Ao fim do step a navegação nova existe e cada página reusa os
componentes atuais (que serão enriquecidos nos steps seguintes). Segue `frontend/CLAUDE.md`.

## 1.1 — Promover `Sparkline` para compartilhado

- Mover `features/dashboard/components/Sparkline.tsx` → `src/components/Sparkline.tsx` (named export
  mantido). Atualizar o import no dashboard (`SummaryCards.tsx` / onde for usado).
- Motivo: passará a ser usado por dashboard **e** groceries → CLAUDE.md §3 (cross-feature proibido).
  Sem mudança de API.

## 1.2 — Período global no cluster Mercado

- `components/AppShell.tsx`: o `PeriodSwitcher` é gated por `PERIOD_AWARE_PATHS` (hoje `'/'`,
  `'/transacoes'`, `'/orcamentos'`). Trocar a checagem exata por **prefixo** para cobrir as
  sub-rotas: mostrar o switcher quando `pathname === '/'` ou `pathname.startsWith('/mercado'|
  '/transacoes'|'/orcamentos')`. (Manter o set para os exatos e adicionar um `startsWith('/mercado')`.)
- Resultado: as 3 páginas do Mercado herdam o período global via `usePeriod()` — sem switcher
  duplicado no layout.

## 1.3 — `MarketLayout` (cluster) + rotas

- Novo `features/groceries/components/MarketLayout.tsx` (componente de layout com `<Outlet/>`):
  - Cabeçalho: `<h1>Mercado</h1>` + descrição curta.
  - **Sub-nav** com `NavLink` (`react-router`): `Visão geral` (`/mercado`), `Preços`
    (`/mercado/precos`), `Notas` (`/mercado/notas`). Estilo de "segmented"/tabs reusando classes do
    repo; `aria-current` para o ativo. **Never** `<a href>` interno.
  - **CTA `Importar nota`** (move o `ReceiptUploader` para um botão no header → ao clicar abre o
    file picker; manter compressão/`useImportReceiptMutation`). Pós-importação abre
    `ReceiptDetailDialog` (estado no layout).
  - **Destino (settings) num `Sheet`** (`npx shadcn@latest add sheet` se ainda não existir): ícone
    ⚙ com `aria-label`. Conteúdo = `GrocerySettingsCard` realocado. Some do fluxo principal.
- `src/routes.tsx`: trocar a rota plana por aninhada:
  ```tsx
  { path: 'mercado', element: <MarketLayout />, children: [
      { index: true, element: <MarketOverviewPage /> },
      { path: 'precos', element: <PricesPage /> },
      { path: 'notas', element: <ReceiptsPage /> },
  ] }
  ```

## 1.4 — Split de `GroceriesPage` nas 3 páginas

- **`ReceiptsPage.tsx`** (`/mercado/notas`): a tabela atual — `ReceiptList` + paginação + estado
  `viewingId`/`deleting` + `ReceiptDetailDialog`/`DeleteReceiptAlert`. Usa
  `useReceiptsQuery({ page, limit, ...periodToRange(period) })` (passa a respeitar o período global).
- **`PricesPage.tsx`** (`/mercado/precos`): por ora renderiza o `PriceAnalysisTable` +
  `TopProductsChart` atuais (será substituído pelo `ProductPriceList` no Step 4).
- **`MarketOverviewPage.tsx`** (`/mercado`): por ora um esqueleto reusando `GrocerySummaryTab`
  (charts existentes) — vira a página rica no Step 2.
- Remover o `GroceriesPage.tsx` antigo e o uso de `Tabs` da página. `GrocerySummaryTab` pode ser
  desmontado nos steps seguintes; neste step pode continuar existindo como ponte.

## 1.5 — Empty / first-run

- `MarketLayout` (ou um wrapper): se `useGrocerySettingsQuery` → `settings == null`, renderizar um
  **onboarding** focado (passo 1: configurar destino no Sheet; passo 2: importar 1ª nota) em vez das
  páginas. CTA de importar fica desabilitado até configurar (mantém regra atual `disabled={!configured}`).
- Configurado mas sem nota no período → cada página mostra seu empty state (já existem textos).

## Done

- `npm run check` + `build` + `test` verdes.
- `/mercado`, `/mercado/precos`, `/mercado/notas` navegáveis pela sub-nav; período global aparece e
  filtra as páginas; importar nota funciona pelo CTA do header e abre o detalhe; settings acessível
  pelo Sheet; first-run aparece quando não configurado. Nenhuma funcionalidade perdida vs. as tabs.
