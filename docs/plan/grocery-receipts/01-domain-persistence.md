# Step 1 — Domínio + Persistência (fundação, sem IA)

**Goal:** modelar o agregado e gravá-lo no Postgres, isolado e testável, antes de tocar em IA/HTTP.

## Arquivos (em `backend/src/grocery-receipts/`, espelhando `transactions`)

### Domain
- `domain/value-objects/grocery-unit.ts` — `enum GroceryUnit { UN='un', KG='kg', L='L' }` +
  `groceryUnitSchema = z.nativeEnum(GroceryUnit)`.
- `domain/entities/grocery-item.entity.ts` — estende `BaseEntity`. Campos: `id, receiptId,
  rawDescription, normalizedName, quantity:number, unit:GroceryUnit, unitPrice:Money, lineTotal:Money`.
  `static create/restore`, `private static validate` (quantity > 0, preços ≥ 0, nomes não vazios).
- `domain/entities/grocery-receipt.entity.ts` — estende `BaseEntity`. Campos: `id, userId, storeName,
  purchaseDate:Date, total:Money, transactionId:string|null, items:GroceryItem[], createdAt`.
  `static create` (define `createdAt`, `transactionId=null`), `linkTransaction(id)` (seta uma vez, com
  guarda), `static restore`, `private static validate` (storeName 1-255, total > 0, itens válidos).
  Getter `items` retorna cópia.
- `domain/errors/grocery-receipt.errors.ts` — `InvalidGroceryReceiptError`,
  `GroceryReceiptNotFoundError` (cada um com `readonly code`).
- `domain/repositories/grocery-receipt.repository.ts` — `IGroceryReceiptRepository`:
  `findById(id, userId): Promise<GroceryReceipt | null>` (com itens), `save(receipt): Promise<void>`,
  `delete(id, userId): Promise<void>`. (list/price-history entram no Step 4.) + `FindReceiptFilters`.
- barrels `index.ts` por pasta + `domain/index.ts`.

### Infra (persistência)
- `infrastructure/persistence/schema/grocery-receipts.schema.ts`:
  ```
  grocery_receipts: id varchar36 pk, user_id varchar36, store_name varchar255,
  purchase_date timestamptz, total_minor_units varchar20, currency_code varchar3,
  transaction_id varchar36 (nullable, SEM .references — integridade na app layer),
  created_at timestamptz default now
  índices: user_id, (user_id, purchase_date)
  ```
- `infrastructure/persistence/schema/grocery-items.schema.ts`:
  ```
  grocery_items: id varchar36 pk,
  receipt_id varchar36 references grocery_receipts.id { onDelete:'cascade' },
  raw_description varchar500, normalized_name varchar255, quantity varchar20,
  unit varchar8, unit_price_minor_units varchar20, line_total_minor_units varchar20,
  currency_code varchar3
  índices: receipt_id, normalized_name
  ```
- `infrastructure/persistence/schema/index.ts` — reexporta ambos.
- `infrastructure/persistence/mappers/grocery-receipt.persistence-mapper.ts` — `receiptToRow`,
  `itemToRow`, `rowsToDomain(receiptRow, itemRows)` (valores monetários: `String(snapshot.amount)` /
  `Money.fromSnapshot({ amount: Number(row...), currency: currencyByCode[code] })`).
- `infrastructure/persistence/repository/drizzle-grocery-receipt.repository.ts`:
  - `save`: `this.db.transaction(async (tx) => { upsert recibo (onConflictDoUpdate); delete itens do
    recibo; insert itens (se houver) })`.
  - `findById`: query recibo (id+userId) → se existe, query itens por `receipt_id` → `rowsToDomain`.
  - `delete`: `db.delete(grocery_receipts).where(id+userId)` (cascade limpa itens no banco).
- `infrastructure/persistence/repository/in-memory-grocery-receipt.repository.ts` — Map por id, `seed()`.
- `infrastructure/persistence/repository/index.ts`.
- `infrastructure/tokens.ts` — `export const GROCERY_RECEIPT_REPOSITORY = Symbol('IGroceryReceiptRepository')`.

### Config
- `backend/drizzle.config.ts` — adicionar
  `'./src/grocery-receipts/infrastructure/persistence/schema/index.ts'` ao array `schema`.

## Migração
`npm run db:generate` → revisar o SQL gerado (2 tabelas + índices + FK cascade) → `npm run db:migrate`.
Nunca editar a migração à mão.

## Testes
- `domain/entities/grocery-receipt.entity.spec.ts`:
  - `create` define `createdAt` e `transactionId=null`.
  - `validate` rejeita storeName vazio, total ≤ 0, item inválido.
  - `linkTransaction` seta uma vez e impede re-link.
  - `restore` reidrata recibo + itens sem erro.

## Done
- Migração aplicada no banco local.
- Entidades + in-memory repo compilam; `npm run check` + `npm run build` verdes; entity spec verde.
