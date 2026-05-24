# Step 7 — Destino configurável (GrocerySettings)

**Goal:** a categoria/subcategoria onde a transação da nota é lançada deve ser **escolhida pelo
usuário** nas opções do módulo Mercado, não fixa em "Mercado".

## Decisões
- O usuário **seleciona entre categorias/subcategorias já existentes** (cria em Categorias, escolhe aqui).
- **Sem fallback automático:** se não houver destino configurado, o import falha pedindo para configurar.
- A **compra continua sendo entidade do domínio Mercado** (`GroceryReceipt`/`GroceryItem`); só o
  **total** vira uma transação, agora no destino configurado.

## Backend
- **Domínio:** `GrocerySettings` (id = userId; `categoryId`, `subcategoryId: string | null`),
  `IGrocerySettingsRepository` (`findByUserId`, `save`), erro `InvalidGrocerySettingsError`.
- **Persistência:** tabela `grocery_settings` (user_id PK, category_id, subcategory_id nullable);
  mapper + repo Drizzle (upsert por user_id) + in-memory. Migração `0006_hot_typhoid_mary.sql`.
- **Aplicação:** `GetGrocerySettingsUseCase`, `UpdateGrocerySettingsUseCase` (valida categoria existe +
  subcategoria pertence à categoria, reusando os erros `InvalidCategoryReferenceError` /
  `InvalidSubcategoryReferenceError` / `SubcategoryCategoryMismatchError` de transações),
  `GrocerySettingsNotConfiguredError` (→ 409).
- **Import use case:** lê settings **antes** de chamar o Claude; se ausente → `GrocerySettingsNotConfiguredError`
  (sem gastar chamada de IA). Usa `settings.categoryId`/`settings.subcategoryId` na transação.
  (Removido o resolve-or-create "Mercado".)
- **HTTP:** `GET /grocery-receipts/settings` → `{ settings: GrocerySettingsDTO | null }` (objeto
  envelopado para evitar body `null` no Fastify); `PUT /grocery-receipts/settings`. Filtro: 409.

## Frontend
- `types/api.ts` `GrocerySettings`; `api/groceries.ts` `getGrocerySettings`/`updateGrocerySettings`;
  `groceryKeys.settings()`; hooks `useGrocerySettingsQuery`/`useUpdateGrocerySettingsMutation`.
- `GrocerySettingsCard` (reusa `CategoryCombobox` filtrando EXPENSE + `SubcategoryCombobox`),
  renderizado na aba Recibos. O `ReceiptUploader` fica **desabilitado enquanto não configurado** e
  trata 409 com mensagem clara.

## Testes
- Backend: `grocery-settings.use-case.spec.ts` (get null/configurado; update valida cat/subcat).
  `import-receipt-from-image.use-case.spec.ts` atualizado: usa settings; "sem settings → erro e não chama
  o extractor"; usa subcategoria configurada.
- Frontend: `ReceiptUploader.test.tsx` mantém golden + 422.

## Done
- Backend `check`/`build`/`test` (30 testes do módulo) verdes + smoke de DI OK.
- Frontend `check`/`build`/`test` verdes.
- Migração `0006` gerada (aplicar junto com a `0005` quando o banco estiver de pé).
