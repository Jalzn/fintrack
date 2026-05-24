# Step 3 — Use case de import + transação automática

**Goal:** orquestrar extração → recibo → categoria → transação. É o coração da feature.

## Arquivos

- `application/use-cases/receipt/money.util.ts`:
  ```ts
  export function reaisToMinorUnits(value: number, currency: Currency): number {
    return Math.round(Number((value * currency.base ** currency.exponent).toFixed(4)));
  } // 19.35 → 1935, 12.9 → 1290
  ```
- `application/schemas/grocery-receipt.schemas.ts` —
  `ImportReceiptInputSchema = z.object({ userId: z.string().min(1), imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg','image/png','image/webp']) })`.
- `application/dtos/grocery-receipt.dto.ts` — `GroceryReceiptDTO` (`id, storeName, purchaseDate,
  total:MoneySnapshot, transactionId, createdAt, items: GroceryItemDTO[]`), `GroceryItemDTO`.
- `application/mappers/grocery-receipt.mapper.ts` — `toGroceryReceiptDTO(receipt)`.
- `application/errors/grocery-receipt.application.errors.ts` — `ReceiptExtractionFailedError`
  (estende `ApplicationError`, `readonly code`).
- `application/use-cases/receipt/import-receipt-from-image.use-case.ts`. Deps:
  `{ groceryReceiptRepository, receiptExtractor, createTransactionUseCase, categoryRepository,
  idGenerator, eventDispatcher, logger? }`. Fluxo:
  1. `parse` input → `extract({ imageBase64, mimeType })`.
  2. **`totalReais == null` → `ReceiptExtractionFailedError`** (não persiste nada).
  3. converter `totalReais` + cada `unitPriceReais`/`lineTotalReais` para minor units; validar
     total > 0 inteiro (senão `ReceiptExtractionFailedError`).
  4. montar `GroceryItem[]` (`idGenerator.generate()` por item) + `GroceryReceipt.create({ id, userId,
     storeName: extracted.storeName ?? 'Mercado', purchaseDate: parse(extracted.purchaseDate) ?? new Date(),
     total, items })`.
  5. **resolve-or-create "Mercado":** `categoryRepository.findByType(userId, EXPENSE)` → achar nome
     `=== 'mercado'` (case-insensitive); se faltar, `Category.create({ id, userId, name:'Mercado',
     color:'#1fba7a', type: EXPENSE })` → `save` → `dispatch`/`clear`.
  6. `createTransactionUseCase.execute({ userId, amountMinorUnits: total.toSnapshot().amount,
     currencyCode: extracted.currencyCode, type: EXPENSE, categoryId: mercado.id,
     description: \`Mercado - ${storeName}\`, date: purchaseDate })`.
  7. `receipt.linkTransaction(tx.id)` → `groceryReceiptRepository.save(receipt)` → `toGroceryReceiptDTO`.

## Wiring
- `backend/src/transactions/infrastructure/transactions.module.ts` — adicionar `CREATE_TRANSACTION_UC`
  ao array `exports`.
- `backend/src/grocery-receipts/infrastructure/grocery-receipts.module.ts` — criar:
  `imports: [UsersModule, TransactionsModule]`; providers (factory verbosa estilo `transactions`):
  - `GROCERY_RECEIPT_REPOSITORY` ← `DRIZZLE_DB`.
  - `RECEIPT_EXTRACTOR` ← `ConfigService`, `PinoLogger` (`new ClaudeReceiptExtractor(new Anthropic({
    apiKey: config.get('ANTHROPIC_API_KEY') }), logger)`).
  - `IMPORT_RECEIPT_UC` ← `GROCERY_RECEIPT_REPOSITORY, RECEIPT_EXTRACTOR, CREATE_TRANSACTION_UC,
    CATEGORY_REPOSITORY, ID_GENERATOR, EVENT_DISPATCHER, PinoLogger`.
- `backend/src/app.module.ts` — adicionar `GroceryReceiptsModule` aos imports.

## Testes
`application/use-cases/receipt/import-receipt-from-image.use-case.spec.ts` (FakeReceiptExtractor +
in-memory repos + `CreateTransactionUseCase` real):
- happy path: cria recibo + N itens + 1 transação EXPENSE na categoria "Mercado"; `transactionId` setado.
- `totalReais: null` → `ReceiptExtractionFailedError`; repos vazios (nada persistido, nenhuma transação).
- resolve-or-create: (a) "Mercado" existente é reusada; (b) ausente → cria nova EXPENSE "Mercado".
- arredondamento: `19.35 → 1935`, `12.9 → 1290`.

## Done
- Import ponta-a-ponta no nível de use case; `npm run check` + `npm run build` + `npm test` verdes.
