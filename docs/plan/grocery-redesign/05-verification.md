# Step 5 — Verificação end-to-end

**Goal:** garantir que cada step entrou sem regressão e que o módulo cumpre o objetivo (capturar uma
nota em 1 toque; entender gasto/preços de relance).

## Gates por step (obrigatórios antes de mergear)

- `npm run check` (Biome) — sem erros, sem `// biome-ignore` sem justificativa.
- `npm run build` (`tsc -b && vite build`) — TS strict passa.
- `npm test` (Vitest) — verde; cobertura mínima: `grocery-insights.test.ts` (cada regra) + os testes
  já existentes (`ReceiptUploader`, `GrocerySummaryTab` — atualizar/remover conforme o split).

## Verificação funcional

- **Navegação:** sub-nav alterna `/mercado` ↔ `/precos` ↔ `/notas`; `aria-current` no ativo; URLs
  diretas funcionam (deep-link). Período global no header aparece em todo o cluster.
- **Período:** trocar `?period=` reflete KPIs, breakdown, alertas e recibos da overview; `/notas`
  filtra pela mesma janela.
- **KPIs:** gasto com Δ vs período anterior (gastar menos = verde); ticket médio = gasto÷idas;
  período anterior zerado não gera `∞`/`NaN`.
- **Importar nota:** CTA do header lê a foto, cria a transação e abre o detalhe; erros 422/409
  mostram o toast certo (regressão do fluxo atual).
- **Settings (Sheet):** salvar destino funciona; first-run (settings nulo) mostra onboarding e
  bloqueia importar até configurar.
- **Alertas:** ≥1 insight acionável com seed; somem quando falta dado; `href` navega certo.
- **Índice de preços:** busca filtra; tendência/faixa/sparkline corretas; clique abre o histórico.
- **Empty states:** sem nota no período → placeholders, sem tela quebrada.

## Revisão visual (Playwright)

- Reusar o harness de screenshots (mock de API + JWT fake; interceptar **só** `localhost:3000/**`,
  nunca `**/api/**`) — ver memória `frontend-screenshot-harness`. Capturar `/mercado`,
  `/mercado/precos`, `/mercado/notas` e o first-run em **desktop claro/escuro + mobile**.
- Conferir: nada cortado em mobile; sub-nav usável no toque; contraste OK no dark; sparklines/barras
  de faixa renderizam; sem layout shift grosseiro.

## Acessibilidade (mínimo, CLAUDE.md §11)

- `<Label htmlFor>` na busca e nos campos do Sheet; botões só-ícone (importar, ⚙, ver/excluir) com
  `aria-label`; foco visível; `NavLink` navegável por teclado; diálogos/Sheet shadcn com trap de
  foco intacto.

## Done

- Todos os gates verdes em cada step; checklist funcional e visual cumprido; sem dep/endpoint novo
  introduzido em nenhum step.
