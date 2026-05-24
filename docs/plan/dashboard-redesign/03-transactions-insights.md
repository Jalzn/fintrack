# Step 3 (Fase 2) — Transações mais úteis

**Goal:** ao filtrar, o usuário vê o **total** do recorte e consegue achar lançamentos. Aproveita que
`TransactionListFilters` já suporta `startDate`/`endDate`. Segue `frontend/CLAUDE.md`.

## 3.1 — Resumo do conjunto filtrado

- `features/transactions/components/TransactionsSummary.tsx`: dado o filtro atual, mostrar
  **total de receitas, total de despesas, saldo e contagem** do recorte.
  - Implementação KISS: chamar `useBalanceQuery(periodToRange(period))` quando houver período, ou
    reusar `getBalance` com `startDate/endDate/type/categoryId` do filtro. **Verificar** se
    `/transactions/balance` aceita `categoryId`; se não, somar client-side a partir da página atual
    **não serve** (paginado) → preferir o endpoint de balance com os mesmos filtros, ou somar via uma
    query `limit` alto só para o cálculo. Decidir no início do step e anotar.
- Renderizar acima da `TransactionTable` como uma faixa de 3 números (reusa `StatCard` compacto).

## 3.2 — Busca por descrição

- `TransactionFilters.tsx`: adicionar `Input` de busca (ícone `Search`, `lucide-react`), debounce
  ~300ms, grava em `?q=`. Passar `q` para `TransactionListFilters` (campo novo opcional).
- **Backend:** confirmar se `GET /transactions` aceita busca textual. Se **não** aceitar, manter o
  campo desabilitado/oculto e abrir item separado (não inventar filtro client-side sobre página
  paginada). Anotar a decisão; não criar endpoint aqui (fora do escopo frontend).

## 3.3 — Intervalo de datas

- `TransactionFilters.tsx`: integrar com o período global — botão que abre `react-day-picker`
  (já é dep) em modo range, escrevendo `startDate`/`endDate` na URL; default = `range` do período.
  `TransactionsPage.tsx` já monta `filters` a partir da URL; só estender o `useMemo` para incluir
  as datas (cuidando de `exactOptionalPropertyTypes`: omitir chave quando vazio, como já é feito).

## 3.4 — (Opcional, YAGNI) agrupar por dia

- Só se houver pedido real. Subtotais por dia na tabela. **Não construir agora.**

## Done

- `npm run check` + `build` + `test` verdes.
- Filtrar por categoria/tipo/data mostra o total correspondente; URL compartilhável reproduz o estado.
- Busca só entregue se o backend suportar; caso contrário, documentada como follow-up.
- **Teste:** `TransactionsSummary.test.tsx` (totais para um filtro) + atualização de URL nos filtros.
