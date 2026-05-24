# Editar Nota do Mercado + Sync Bidirecional Nota ↔ Transação

## Contexto

Hoje a nota do mercado é **imutável** após a importação: a IA lê o cupom, cria a nota +
itens e gera automaticamente a transação de despesa (mesma data e valor). Só dá pra **ver**
ou **deletar** (`grocery-receipts.controller.ts`). Quando a IA erra (data, loja, total,
nome/departamento/quantidade/preço de um item), não há correção.

## Objetivo

1. Permitir **editar** uma nota já importada: cabeçalho (loja, data, total) **e** os itens
   (nome, departamento, quantidade, unidade, preço — incluindo adicionar/remover item).
2. **Sincronizar data e valor nos dois sentidos** entre a nota e a transação vinculada:
   - Editar a nota → atualiza a transação (chamada direta ao `UpdateTransactionUseCase`).
   - Editar a transação → atualiza a nota (via **event handler** ouvindo `transaction.updated`,
     igual ao `BudgetSpentRecalculatorHandler`; assim `transactions` **não** passa a depender
     de `grocery-receipts`).

## Decisões (KISS / YAGNI)

- **Total é campo editável independente** (cupom tem desconto/arredondamento que o somatório
  dos itens nem sempre bate). `lineTotal` de cada item = `quantity × unitPrice` (calculado no
  servidor). A UI mostra o somatório dos itens como **dica** ao lado do total, sem forçar.
- **Itens = substituição total da lista** no `update`. O `repository.save` já faz
  `delete + insert` dos itens (`drizzle-grocery-receipt.repository.ts:115-124`), então
  adicionar/editar/remover sai de graça. Itens existentes preservam o `id` se enviado.
- **Moeda** vem da própria nota (`receipt.total` currency), não do cliente.
- **Anti-loop do sync:** o handler só grava se data **ou** total realmente mudaram. No fluxo
  nota→transação, o handler dispara depois e encontra tudo já igual → no-op. A nota não emite
  eventos, então a cadeia termina.
- **Description da transação NÃO sincroniza** (usuário pode tê-la editado à mão). Só data + valor.

## Reuso confirmado

- `Money.of(minor, currency)`, `Money.fromSnapshot`, `currencyByCode`, `MoneySnapshot` — `@/shared/domain`.
- `repository.save` faz upsert da nota + replace dos itens (atômico via `db.transaction`).
- Event infra: `@nestjs/event-emitter` global; `TransactionUpdatedEvent` (`event.payload.{transactionId,userId,amount,date}`).
- `UpdateTransactionUseCase` (`@/transactions/application`, token `UPDATE_TRANSACTION_UC`,
  input `{ id, userId, amountMinorUnits?, date? }`). **TransactionsModule precisa exportar esse token.**
- Front: `AmountInput` (minor units), `DatePicker` (transactions), `formatMoney`, `departmentLabel`,
  padrões de mutation + invalidação de `use-import-receipt.ts`.

## Steps

| # | Doc | Resumo |
|---|-----|--------|
| 1 | [01-backend.md](01-backend.md) | Entity `update()`, `findByTransactionId`, `UpdateReceiptUseCase`, handler de sync, rota `PUT /:id`, wiring |
| 2 | [02-frontend.md](02-frontend.md) | `updateReceipt` + hook + `ReceiptEditDialog` (form com tabela de itens) + ação editar na lista |
| 3 | [03-verification.md](03-verification.md) | Testes (use-case + handler), typecheck/lint/build front e back |
