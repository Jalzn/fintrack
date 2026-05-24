# Step 3 — Verificação

## Testes (backend)

- `update-receipt.use-case.spec.ts` (espelhar specs de use-case existentes com
  `InMemoryGroceryReceiptRepository` + double de `UpdateTransactionUseCase`):
  - edita cabeçalho + itens → nota persistida com novos valores; `lineTotal = qty × unitPrice`.
  - com `transactionId` → chama `updateTransactionUseCase` com `amountMinorUnits` + `date` certos.
  - `id` inexistente → erro de "não encontrada".
  - item novo (sem `id`) ganha id; item removido some.
- `sync-receipt-on-transaction-updated.handler.spec.ts`:
  - evento com transação ligada a uma nota → nota tem data/total atualizados.
  - evento sem nota vinculada → no-op.
  - data/total já iguais → no-op (sem `save`).

## Checks

- Backend: `npm run lint && npm run typecheck && npm test` (ou equivalente do `backend/package.json`).
- Frontend: `npm run lint && npm run build` (ou `typecheck`) em `frontend/`.
- Conferir scripts reais nos `package.json` antes de rodar.

## Manual (smoke)

1. Importar uma nota → abrir **Editar** → mudar data, loja, total e um item → salvar.
2. Conferir na lista de transações que data/valor da transação mudaram junto.
3. Editar a transação (data/valor) na tela de transações → reabrir a nota → reflete a mudança.
