# Step 1 — Backend

## 1. Domain: `GroceryReceipt.update()`

`domain/entities/grocery-receipt.entity.ts`
- Tornar `_storeName`, `_purchaseDate`, `_total`, `_items` mutáveis (remover `readonly`).
- Adicionar:
  ```ts
  export interface UpdateGroceryReceiptProps {
    storeName?: string;
    purchaseDate?: Date;
    total?: Money;
    items?: GroceryItem[];
  }

  update(props: UpdateGroceryReceiptProps): void {
    const next = {
      id: this.id, userId: this._userId,
      storeName: props.storeName ?? this._storeName,
      purchaseDate: props.purchaseDate ?? this._purchaseDate,
      total: props.total ?? this._total,
      items: props.items ?? this._items,
    };
    GroceryReceipt.validate(next);
    this._storeName = next.storeName;
    this._purchaseDate = next.purchaseDate;
    this._total = next.total;
    this._items = [...next.items];
  }
  ```

## 2. Domain: repo `findByTransactionId`

`domain/repositories/grocery-receipt.repository.ts` — adicionar à interface:
```ts
findByTransactionId(transactionId: string, userId: string): Promise<GroceryReceipt | null>;
```
- **Drizzle** (`drizzle-grocery-receipt.repository.ts`): select por `transactionId` + `userId`,
  depois carregar itens (igual `findById`).
- **In-memory** (`in-memory-grocery-receipt.repository.ts`): varrer `store` por `transactionId` + `userId`.

## 3. Application: schema `UpdateReceiptInputSchema`

`application/schemas/grocery-receipt.schemas.ts` (reusar `GROCERY_DEPARTMENT_SLUGS` do
`extracted-receipt.schema.ts`):
```ts
const UpdateReceiptItemSchema = z.object({
  id: z.string().min(1).optional(),
  normalizedName: z.string().trim().min(1).max(255),
  rawDescription: z.string().trim().min(1).max(500).optional(),
  quantity: z.number().positive(),
  unit: z.enum(['un', 'kg', 'L']),
  unitPriceMinorUnits: z.number().int().nonnegative(),
  brand: z.string().trim().max(120).nullish(),
  code: z.string().trim().max(32).nullish(),
  department: z.enum(GROCERY_DEPARTMENT_SLUGS).nullish(),
  size: z.string().trim().max(32).nullish(),
});
export const UpdateReceiptInputSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  storeName: z.string().trim().min(1).max(255),
  purchaseDate: z.coerce.date(),
  totalMinorUnits: z.number().int().positive(),
  items: z.array(UpdateReceiptItemSchema).min(1),
});
export type UpdateReceiptInput = z.infer<typeof UpdateReceiptInputSchema>;
```

## 4. Application: `UpdateReceiptUseCase`

`application/use-cases/receipt/update-receipt.use-case.ts`
- Deps: `{ groceryReceiptRepository, updateTransactionUseCase, idGenerator, logger? }`.
- Fluxo: `findById` (→ `ReceiptNotFoundError` se null) → derivar `currency` de `receipt.total` →
  montar `GroceryItem.create` por item (`id ?? idGenerator.generate()`,
  `rawDescription ?? normalizedName`, `lineTotal = Money.of(round(quantity*unitPriceMinor), currency)`)
  → `receipt.update({...})` → `save` → se `transactionId` ≠ null:
  `updateTransactionUseCase.execute({ id, userId, amountMinorUnits: total, date: purchaseDate })`
  → `toGroceryReceiptDTO`.
- Exportar em `use-cases/index.ts` (ou `use-cases/receipt/index.ts`). Conferir erro existente
  para "não encontrada" (`GetReceiptByIdUseCase`).

## 5. Infra: handler de sync (transação → nota)

`infrastructure/event-handlers/sync-receipt-on-transaction-updated.handler.ts`
```ts
@Injectable()
export class SyncReceiptOnTransactionUpdatedHandler {
  constructor(@Inject(GROCERY_RECEIPT_REPOSITORY) repo, @Inject(PinoLogger) logger) {}
  @OnEvent('transaction.updated')
  async onUpdated(event: TransactionUpdatedEvent): Promise<void> {
    const { transactionId, userId, amount, date } = event.payload;
    const receipt = await repo.findByTransactionId(transactionId, userId);
    if (!receipt) return;
    const sameTotal = receipt.total.toSnapshot().amount === amount.amount;
    const sameDate = receipt.purchaseDate.getTime() === date.getTime();
    if (sameTotal && sameDate) return; // já sincronizado → no-op (corta o eco)
    try {
      receipt.update({
        total: Money.of(amount.amount, receipt.total.toSnapshot().currency),
        purchaseDate: date,
      });
      await repo.save(receipt);
    } catch (err) { logger.error({ err, transactionId }, 'Failed to sync receipt'); }
  }
}
```

## 6. HTTP: rota `PUT /:id`

`infrastructure/http/grocery-receipts.controller.ts` — injetar `UPDATE_RECEIPT_UC`, adicionar
**antes** do `@Delete(':id')` (após `@Get(':id')`); `@Put('settings')` já vem antes → sem conflito:
```ts
@Put(':id')
async update(@Param('id') id: string, @Body() body: unknown, @CurrentUser() userId: string) {
  return this.updateReceipt.execute(parseInput(UpdateReceiptInputSchema, { ...(body as object), id, userId }));
}
```

## 7. Wiring

- `infrastructure/tokens.ts`: `export const UPDATE_RECEIPT_UC = Symbol('UpdateReceiptUseCase');`
- `transactions.module.ts`: adicionar `UPDATE_TRANSACTION_UC` aos `exports`.
- `grocery-receipts.module.ts`:
  - provider `UPDATE_RECEIPT_UC` (inject `GROCERY_RECEIPT_REPOSITORY`, `UPDATE_TRANSACTION_UC`,
    `ID_GENERATOR`, `PinoLogger`).
  - registrar `SyncReceiptOnTransactionUpdatedHandler` nos `providers` (EventEmitter já é global).
