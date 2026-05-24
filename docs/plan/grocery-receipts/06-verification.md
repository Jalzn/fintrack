# Step 6 — Verificação end-to-end + polish

**Goal:** validar o fluxo completo num ambiente real e fechar os gates de qualidade.

## Setup
1. `cd backend && npm install` (puxa `@anthropic-ai/sdk`).
2. `backend/.env`: setar `ANTHROPIC_API_KEY` e `DATABASE_URL` (subir Postgres com
   `docker compose up -d` se necessário). Conferir `.env.example` atualizado.
3. `npm run db:generate` (revisar SQL: 2 tabelas + índices + FK cascade) → `npm run db:migrate`
   → `npm run db:seed` (cria a categoria "Mercado" do usuário demo).

## Rodar
4. Backend: `npm run dev`. Frontend: `cd frontend && npm install && npm run dev`.

## Teste manual
5. Logar como usuário demo, abrir **Mercado**:
   - Enviar foto de um cupom fiscal real → recibo aparece com itens; uma transação EXPENSE em
     "Mercado" aparece em **Transações**; o gasto do orçamento "Mercado" aumenta (recálculo via
     evento `transaction.created`).
   - Apagar o recibo → a transação some e o orçamento reverte.
   - Aba **Preços** → produto com 2+ compras mostra último/mín/máx/média e as ocorrências.
6. Negativo: enviar foto borrada/sem cupom → 422 + mensagem pt-BR; **nenhuma** transação/recibo criados.

## Gates automáticos
7. Backend: `npm run check` (Biome) + `npm run build` (`tsc --noEmit`) + `npm test` (vitest).
8. Frontend: `npm run check` + `npm run build` + `npm test`.

## Done
- Fluxo manual feliz e negativo OK; todos os gates verdes nos dois projetos.

## Estado atual (implementação concluída)
- **Gates automáticos:** backend `check`/`build`/`test` (154 testes) e frontend `check`/`build`/`test`
  (2 testes) todos verdes. Smoke de DI do `AppModule` OK (grafo de injeção válido).
- **Migração** `0005_messy_arclight.sql` gerada e revisada; **ainda não aplicada**.
- **Pendências de ambiente (com o usuário):**
  1. **Conflito de porta no Postgres:** a porta 5432 do host está ocupada pelo container
     `lojas-tem-db-1` (outro projeto). O `db:migrate` falha por autenticação contra o banco errado.
     Resolver subindo o Postgres do fintrack (`docker compose up -d` após liberar a 5432) **ou**
     mapeando o fintrack em outra porta (ex. 5433) e ajustando `DATABASE_URL`. Depois: `npm run db:migrate`.
  2. **`ANTHROPIC_API_KEY`** precisa ser definida no `backend/.env` para a leitura por IA funcionar.
  3. Teste manual com uma foto real de cupom (feliz + negativo) após o ambiente estar de pé.
