# Step 5 — Frontend (feature `groceries`)

**Goal:** tela para enviar foto, ver recibos e analisar preços. Segue `frontend/CLAUDE.md`.

## Dep
- `frontend/package.json` — add `browser-image-compression`; `npm install`.

## Tipos
- `src/types/api.ts` — `GroceryUnit = 'un'|'kg'|'L'`, `GroceryItem`, `GroceryReceipt`
  (`transactionId: string|null`, `items?: GroceryItem[]`), `PaginatedReceipts`, `PriceAnalysis`
  (`MoneySnapshot` reutilizado).

## API + keys
- `features/groceries/api/groceries.ts` (tudo via `apiFetch` + schema zod, mesma convenção de path de
  `features/transactions/api/transactions.ts`):
  - `importReceipt({ imageBase64, mimeType })` → `POST /grocery-receipts` (body JSON).
  - `listReceipts(filters)`, `getReceiptById(id)`, `deleteReceipt(id)`, `getPriceAnalysis(params)`.
  - schemas: `groceryReceiptSchema`, `paginatedReceiptsSchema`, `priceAnalysisSchema`.
- `features/groceries/api/keys.ts` — `groceryKeys` (`all/lists/list/details/detail/priceAnalysis`).

## Hooks
- `use-receipts-query.ts`, `use-receipt-query.ts`, `use-price-analysis-query.ts`,
  `use-import-receipt.ts`, `use-delete-receipt.ts`.
- `useImportReceiptMutation` e `useDeleteReceiptMutation` no `onSuccess` invalidam **3 superfícies**
  (import cria transação): `groceryKeys.all`, `['transactions']`, e
  `predicate: (q) => q.queryKey[0] === 'budgets'` (igual `useCreateTransactionMutation`).

## Componentes (shadcn já instalados)
- `ReceiptUploader.tsx`:
  - `<input type="file" accept="image/*" capture="environment">` (botão dispara input escondido).
  - `imageCompression(file, { maxWidthOrHeight: 1600, useWebWorker: true, fileType: 'image/jpeg' })`
    → ler como base64 e remover prefixo `data:...;base64,` → `{ imageBase64, mimeType: 'image/jpeg' }`.
  - `importReceiptMutation.mutate(...)`; desabilita no `isPending`; sucesso → toast + abre
    `ReceiptDetailDialog`; erro 422 → "Não consegui ler o total do cupom. Tente uma foto mais nítida."
- `ReceiptList.tsx` (tabela: loja, data, total, nº itens, ações), `ReceiptDetailDialog.tsx` (itens),
  `PriceAnalysisTable.tsx` (por produto: count/último/min/max/média + ocorrências),
  `DeleteReceiptAlert.tsx`. Dinheiro via `formatMoney` (`@/lib/money`); datas via `date-fns`.

## Página + navegação
- `features/groceries/pages/GroceriesPage.tsx` — `Tabs`: "Recibos" (uploader + lista) | "Preços" (análise).
- `src/routes.tsx` — add `{ path: 'mercado', element: <GroceriesPage /> }` sob `AppShell`.
- `src/components/AppSidebar.tsx` — add `{ label: 'Mercado', to: '/mercado', icon: ShoppingCart }`.

## Testes
- `ReceiptUploader.test.tsx` — golden path (selecionar arquivo → mutation chamada → toast de sucesso) +
  caso de erro 422. Mock no nível de `fetch` (não mockar `apiFetch`).

## Done
- `npm run check` + `npm run build` + `npm test` (frontend) verdes; UI navegável.
