# Step 2 — Frontend

## 1. API (`features/groceries/api/groceries.ts`)

```ts
export interface UpdateReceiptItemPayload {
  id?: string;
  normalizedName: string;
  quantity: number;
  unit: GroceryUnit;            // 'un' | 'kg' | 'L'
  unitPriceMinorUnits: number;
  brand?: string | null;
  code?: string | null;
  department?: string | null;
  size?: string | null;
}
export interface UpdateReceiptPayload {
  storeName: string;
  purchaseDate: string;         // ISO
  totalMinorUnits: number;
  items: UpdateReceiptItemPayload[];
}
export function updateReceipt(id: string, body: UpdateReceiptPayload): Promise<GroceryReceipt> {
  return apiFetch<GroceryReceipt>(`/grocery-receipts/${id}`, {
    method: 'PUT', body, schema: groceryReceiptSchema,
  });
}
```

## 2. Hook (`features/groceries/hooks/use-update-receipt.ts`)

Espelhar `use-import-receipt.ts`: `useMutation` → `updateReceipt(id, payload)`; `onSuccess`
invalida `groceryKeys.all`, `['transactions']` e budgets (predicate `q.queryKey[0] === 'budgets'`).

## 3. `ReceiptEditDialog` (`features/groceries/components/ReceiptEditDialog.tsx`)

- Props `{ receiptId: string | null, onOpenChange }`. Carrega via `useReceiptQuery(receiptId)`.
- Estado local (useState) inicializado da query (a lista **não** traz itens — `findAll` retorna
  `items: []`; por isso buscar por id, igual `ReceiptDetailDialog`). Campos:
  - **Loja**: `Input`.
  - **Data**: `DatePicker` (`@/features/transactions/components/DatePicker`).
  - **Total**: `AmountInput` (minor units) + texto-dica com somatório dos `lineTotal` dos itens.
  - **Itens** (tabela editável, 1 linha por item):
    `normalizedName` (Input) · `department` (Select, opções de `departmentLabel`/slugs) ·
    `quantity` (Input number) · `unit` (Select un/kg/L) · `unitPrice` (AmountInput) ·
    `lineTotal` (calculado, read-only) · botão remover (Trash2).
  - Botão **"Adicionar item"** (linha vazia, sem `id`).
- Submit → `useUpdateReceiptMutation`: payload com `purchaseDate: date.toISOString()`,
  `totalMinorUnits`, itens mapeados. Toast "Nota atualizada", fecha. Erros como em
  `TransactionFormDialog` (ApiError → `toast.error`).
- Validação leve antes de enviar: loja não vazia, total > 0, ≥1 item, cada item com nome,
  quantity > 0, unitPrice ≥ 0.

## 4. Lista + página

- `components/ReceiptList.tsx`: adicionar ação **Editar** (ícone `Pencil`) na coluna de ações,
  chamando `onEdit(receipt)` (nova prop).
- `pages/ReceiptsPage.tsx`: estado `editingId`, passar `onEdit={(r) => setEditingId(r.id)}` para a
  lista, renderizar `<ReceiptEditDialog receiptId={editingId} onOpenChange={...} />`.

## Notas

- `DatePicker` vive em `features/transactions/components`. Reuso direto (componente de UI). Se
  preferir desacoplar depois, mover para `@/components`. Por ora, import cross-feature.
- Departamentos: usar `departmentLabel` (`components/department-labels.ts`) p/ rótulos; precisamos
  da lista de slugs — conferir se já é exportada lá; senão, declarar a lista no dialog.
