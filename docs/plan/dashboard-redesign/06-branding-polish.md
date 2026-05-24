# Step 6 (Fase 5) — Polimento visual e de marca

**Goal:** sair do "shadcn default" genérico para algo com hierarquia e personalidade, sem reescrever
nada. Tudo via tokens (`frontend/CLAUDE.md` §6 — sem hex no JSX, sem `style` inline estático).

## 6.1 — Hierarquia do número-herói

- Padronizar a escala tipográfica dos valores: hero (saldo) bem maior, secundários médios, listas
  menores. Garantir `tabular-nums` em todo dinheiro. Revisar `font-heading` nos títulos de seção.

## 6.2 — Accent de marca consistente

- Hoje o gradiente `from-brand-green to-balance` aparece só no logo/avatar. Aplicar o accent de marca
  com parcimônia em pontos de destaque (ex.: borda/realce do card-herói, estado ativo do nav). Sem
  poluir; manter a base neutra.
- Revisar `--radius` e densidade: no desktop o conteúdo "flutua" (muito respiro, `max-w-6xl`
  centralizado). Avaliar largura/ء espaçamento para aproveitar telas largas sem ficar denso demais.

## 6.3 — Micro-interações

- Hovers/transitions consistentes em cards clicáveis (drill-downs das fases 2–4), foco visível
  (`ring-ring`), skeletons coerentes (já existem em vários lugares — uniformizar).
- Animações de entrada sutis nos charts (já vêm do Recharts; não exagerar).

## 6.4 — Dark mode

- Revisar contraste dos charts e dos accents no `.dark` (tokens `--chart-*` e finance colors já
  existem em `index.css`). Conferir cards-herói e badges estourados no escuro.

## 6.5 — Detalhes

- Header: confirmar que a barra de contexto (período + ação) ficou limpa em mobile (colapsar atalhos).
- Revisar empty states de todas as páginas para um tom consistente.

## Done

- `npm run check` + `build` + `test` verdes.
- Revisão visual lado a lado (claro/escuro, desktop/mobile) aprovada; nenhum hex hardcoded novo;
  só tokens. Sem regressão de acessibilidade.
