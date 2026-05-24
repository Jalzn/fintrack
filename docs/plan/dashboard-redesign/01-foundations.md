# Step 1 (Fase 0) — Fundações: período global, header de contexto, StatCard

**Goal:** infra reutilizável que destrava as fases seguintes. Sem mudança visual grande ainda.
Segue `frontend/CLAUDE.md`.

## 1.1 — `lib/period.ts` (consolidar tempo)

- Criar `src/lib/period.ts` com (mover/centralizar o que já existe):
  - `currentPeriod(): string` e `previousPeriod(p: string): string` — **mover** de
    `features/budgets/components/MonthSwitcher.tsx` (re-exportar de lá ou ajustar imports do budgets
    para `@/lib/period`; não duplicar).
  - `periodToRange(period): { startDate: string; endDate: string }` — substitui os dois
    `getMonthRange()` duplicados em `features/dashboard/components/{SummaryCards,CategoryBreakdown}.tsx`.
  - `nextPeriod(p)`, `lastNPeriods(period, n): string[]` (para a série de 6 meses), `formatPeriod(p)`
    (ex.: "Maio 2026", via `date-fns`/`Intl`), `isValidPeriod(p)` (regex `^\d{4}-(0[1-9]|1[0-2])$` —
    hoje em `BudgetsPage.tsx`).
- **Teste:** `period.test.ts` — round-trip current/next/previous, `lastNPeriods`, `periodToRange`
  (limites do mês), `isValidPeriod`.

## 1.2 — `usePeriod` (estado global na URL)

- `src/hooks/use-period.ts` — lê/escreve `?period=` via `useSearchParams` (React Router v7), default
  `currentPeriod()`, valida com `isValidPeriod`. Retorna `{ period, setPeriod, range }`.
- Refatorar para consumir o hook (mantendo comportamento):
  - `SummaryCards.tsx` e `CategoryBreakdown.tsx` (hoje hardcoded no mês atual) → usar `range` do hook.
  - `BudgetsPage.tsx` (hoje já usa `?period=`) → trocar pelo hook, remover lógica local.
- **Nota:** Mercado tem toggle semana/mês próprio; integrar só na Fase 4.

## 1.3 — Barra de contexto no header

- `src/components/PeriodSwitcher.tsx` (compartilhado): `‹ [Maio 2026] ›` + atalhos
  "Este mês"/"Mês passado" (Popover/DropdownMenu shadcn). Reaproveita a aparência do
  `MonthSwitcher` do budgets; este vira o canônico (budgets passa a usar ele).
- `src/components/AppShell.tsx` — o `<header>` hoje só repete "fintrack" + trigger. Trocar por:
  `SidebarTrigger` · `Separator` · `<PeriodSwitcher/>` (à esquerda) · à direita um slot de ações.
  Remover o texto "fintrack" redundante (já está no sidebar).
- Ação primária **"Nova transação"** no header (à direita), abrindo o `TransactionFormDialog`
  existente. Mover o estado de "creating" para um contexto leve OU manter o botão só nas páginas por
  ora e adicionar no header na Fase 2 — **decisão KISS:** começar mantendo o botão nas páginas;
  no header só quando houver disparador global. (Não criar contexto sem 2º uso.)

## 1.4 — `StatCard` reutilizável

- `src/components/StatCard.tsx` (compartilhado — usado por Dashboard agora e Orçamentos depois):
  props `{ label, value: MoneySnapshot, accent?: 'balance'|'income'|'expense', delta?, icon?,
  sparkline?: ReactNode, emphasis?: 'hero'|'default' }`.
  - `delta?: { current: number; previous: number }` → renderiza seta + `%` com cor
    (`text-income`/`text-expense`) e rótulo "vs mês anterior"; trata `previous === 0` ("—"/"novo").
  - Reaproveita o visual atual de `SummaryCards.tsx` (ícone em chip colorido, `tabular-nums`,
    `font-heading`); `emphasis: 'hero'` aumenta o valor e dá destaque.
- **Teste:** `StatCard.test.tsx` — renderiza valor formatado; delta positivo/negativo com classe
  certa; `previous === 0` sem `∞`.

## Done

- `npm run check` + `npm run build` + `npm test` (frontend) verdes.
- `?period=` muda Dashboard e Orçamentos de forma consistente; sem regressão visual.
- Zero dep nova; sem `getMonthRange` duplicado; budgets usando `@/lib/period`.
