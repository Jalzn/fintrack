# Step 4 — Demais use cases + Controller HTTP

**Goal:** expor a API REST e completar list/detail/delete/análise.

## Repositório (ampliar interface + drizzle + in-memory)
- `findAll(filters): Promise<PaginatedReceipts>` — paginado, **sem** itens
  (`FindReceiptFilters { userId, page?, limit?, startDate?, endDate? }`).
- `findItemPriceHistory(userId, filters): Promise<ItemPriceRow[]>` — join `grocery_items` ×
  `grocery_receipts`, retorna `{ normalizedName, unitPriceMinorUnits, currencyCode, purchaseDate,
  storeName }` ordenado por nome/data (usa índice `normalized_name`).
- `delete(id, userId)` (já criado no Step 1; confirmar cascade).

## Use cases (`application/use-cases/receipt/`)
- `list-receipts.use-case.ts` — `{ userId, page=1, limit=20, startDate?, endDate? }` →
  `PaginatedResult<GroceryReceiptDTO>` (`totalPages = Math.ceil(total/limit)`).
- `get-receipt-by-id.use-case.ts` — `{ id, userId }` → DTO com itens; null → `GroceryReceiptNotFoundError`.
- `delete-receipt.use-case.ts` — deps `{ groceryReceiptRepository, deleteTransactionUseCase, logger? }`.
  `findById`; se `transactionId`, `deleteTransactionUseCase.execute({ id: transactionId, userId })`
  (tolera `TransactionNotFoundError`, loga); depois `repo.delete(id, userId)`.
- `analyze-prices.use-case.ts` — `{ userId, startDate?, endDate? }`. Agrupa por `normalizedName`:
  `{ normalizedName, count, lastUnitPrice, minUnitPrice, maxUnitPrice, avgUnitPrice(arredondado),
  occurrences: [{ date, storeName, unitPrice }] }` → `PriceAnalysisDTO`.

## DTOs / schemas
- `application/dtos/price-analysis.dto.ts` — `PriceAnalysisDTO`, `PriceAnalysisRowDTO`, `PriceOccurrenceDTO`.
- `application/schemas/grocery-receipt.schemas.ts` — add `ListReceiptsInputSchema`,
  `GetReceiptByIdInputSchema`, `DeleteReceiptInputSchema`, `AnalyzePricesInputSchema`.

## HTTP
- `infrastructure/http/grocery-receipts.controller.ts` (`@UseGuards(JwtAuthGuard)`,
  `@Controller('grocery-receipts')`), injeta os UC tokens:
  - `POST /` → `import` (`@Body() { imageBase64, mimeType }`, `@CurrentUser() userId`).
  - `GET /price-analysis` → `prices` (**antes** de `/:id`).
  - `GET /` → `list`.
  - `GET /:id` → `findOne` (com itens).
  - `DELETE /:id` `@HttpCode(204)` → `remove`.
  - cada handler: `parseInput(Schema, { ...(body|query|params), userId })`.
- `backend/src/main.ts` — `new FastifyAdapter({ bodyLimit: 12 * 1024 * 1024 })` (cabe imagem base64).
- `backend/src/shared/infrastructure/http/domain-exception.filter.ts` — branches:
  `GroceryReceiptNotFoundError` → 404; `ReceiptExtractionFailedError` → 422 (`UNPROCESSABLE_ENTITY`).
- `transactions.module.ts` — adicionar `DELETE_TRANSACTION_UC` ao `exports`.
- `grocery-receipts.module.ts` — wire `LIST_RECEIPTS_UC`, `GET_RECEIPT_BY_ID_UC`, `DELETE_RECEIPT_UC`
  (inject `DELETE_TRANSACTION_UC`), `ANALYZE_PRICES_UC`; registrar o controller.

## Testes
- `list-receipts.use-case.spec.ts` (paginação/filtros), `get-receipt-by-id.use-case.spec.ts`
  (com itens; 404), `delete-receipt.use-case.spec.ts` (cascade + chama delete da transação),
  `analyze-prices.use-case.spec.ts` (count/min/max/avg/last em 2 recibos de lojas/datas distintas).

## Done
- API completa; `npm run check` + `npm run build` + `npm test` verdes.
