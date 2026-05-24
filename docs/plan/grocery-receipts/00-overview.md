# Módulo Mercado — Leitura de Cupom Fiscal por IA + Histórico de Preços

## Contexto

O fintrack só permite lançar transações manualmente. Objetivo deste módulo: fotografar o cupom
fiscal do supermercado, deixar o **Claude (visão)** extrair itens e preços, guardar isso como
**histórico de mercado** (para análise de preço por item ao longo do tempo e entre lojas) e,
automaticamente, **criar uma transação** de despesa com o total da nota na categoria "Mercado".

## Decisões

- Leitura: foto → **Claude Sonnet 4.6** (`claude-sonnet-4-6`).
- Transação: **uma por nota** (EXPENSE, total) em "Mercado", criada automaticamente (sem prévia).
- Escopo: backend + frontend. Compressão de imagem no front: **`browser-image-compression`**.
- Filosofia: seguir `backend/CLAUDE.md` + `frontend/CLAUDE.md` (KISS / YAGNI / sem abstração
  prematura); imitar o módulo vizinho `transactions`.

## Libs (mínimo de dependências novas)

- **Backend — `@anthropic-ai/sdk`** (única dep nova de fato). Saída estruturada via **forced
  tool-use** estável: `messages.create({ tools, tool_choice:{type:'tool', name:'record_receipt'} })`.
- **Backend — Zod 4 `z.toJSONSchema()`** (já temos zod `^4.4.3`, zero dep nova): deriva o
  `input_schema` da tool do **mesmo** schema Zod que valida a resposta do modelo (DRY).
- **Frontend — `browser-image-compression`**: trata orientação EXIF, qualidade e web worker.
- **Não usar:** multer/`@fastify/multipart` (upload é JSON base64), sharp/jimp, chart lib, QR scanner.

## Código reutilizável (paths confirmados)

- `Money.of/.fromSnapshot/.toSnapshot/.add`, `currencyByCode`, `BRL`, `MoneySnapshot` — `@/shared/domain`.
- `BaseEntity` — `@/shared/domain` (recibo e item estendem; têm id, não emitem eventos).
- `parseInput(schema, data)` — `@/shared/infrastructure` (lança `BadRequestException`).
- `PaginatedResult<T>` — `@/shared/application`.
- `IIdGenerator`/`IDomainEventDispatcher` — `@/shared/application`; tokens `ID_GENERATOR`,
  `EVENT_DISPATCHER` (`@/shared/infrastructure/shared.tokens`), `DRIZZLE_DB`
  (`@/shared/infrastructure/database/drizzle.tokens`).
- Doubles: `InMemoryIdGenerator` (`setNext()/reset()`), `InMemoryDomainEventDispatcher`
  (`@/shared/infrastructure`); `InMemoryCategoryRepository`/`InMemoryTransactionRepository`
  (`seed()`) (`@/transactions/infrastructure`).
- `Category.create`, `ICategoryRepository.findByType/save`, `TransactionType` (`@/transactions/domain`);
  `CreateTransactionUseCase`/`DeleteTransactionUseCase` (`@/transactions/application`).
- `@CurrentUser()` (`@/shared/infrastructure/auth/current-user.decorator`), `JwtAuthGuard`
  (`@/shared/infrastructure/auth/jwt.guard`).
- Drizzle suporta `this.db.transaction(async (tx) => {...})` → salvar recibo + itens atômico.
  Upsert via `.onConflictDoUpdate`. Sem eager-load 1:N → `findById` faz 2 queries.

## Steps

| # | Doc | Resumo |
|---|-----|--------|
| 1 | [01-domain-persistence.md](01-domain-persistence.md) | Agregado + schema Drizzle + repositórios (sem IA) |
| 2 | [02-ai-extraction.md](02-ai-extraction.md) | Porta `IReceiptExtractor` + Claude + fake |
| 3 | [03-import-usecase.md](03-import-usecase.md) | Import use case + transação automática |
| 4 | [04-api-usecases-http.md](04-api-usecases-http.md) | List/Get/Delete/Análise + controller HTTP |
| 5 | [05-frontend.md](05-frontend.md) | Feature `groceries` (upload, lista, análise) |
| 6 | [06-verification.md](06-verification.md) | Verificação end-to-end + gates |

## Riscos & defaults

- **IA lê total errado** → exige total não-nulo, senão 422 e nada persistido.
- **Tamanho/custo da imagem** → `browser-image-compression` ≤1600px; `bodyLimit` 12MB; Sonnet 4.6.
- **Transação órfã** se save do recibo falhar após criar a transação → anotado, não construir agora.
- **Boot/testes sem key** → `ANTHROPIC_API_KEY` opcional + client lazy.
- **Reimportar a mesma nota** duplica a transação (sem detecção nesta versão; pode deletar o recibo).
