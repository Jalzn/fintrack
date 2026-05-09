# Fintrack Frontend — Style Guide

Regras firmes (must/never) para qualquer código novo em `frontend/`. Este documento sobrepõe defaults — siga ao pé da letra.

## 1. Stack & ground rules

- Vite 8 + React 19, TypeScript 6 strict.
- UI: Tailwind v4, shadcn/ui (style `base-nova`, baseColor `neutral`), Geist Variable, lucide-react.
- Estado servidor: TanStack Query v5. Forms: React Hook Form + Zod v4. Roteamento: React Router v7 (data mode).
- Dinheiro: Dinero.js v2 (snapshot vindo do backend).
- Lint/format: Biome. Testes: Vitest + Testing Library + jsdom.
- **Idioma da UI:** pt-BR. Strings visíveis ao usuário em português; código (identificadores, comentários quando existirem) em inglês.
- **Path alias único:** `@/*` → `src/*`. Não usar caminhos relativos profundos (`../../`).

## 2. TypeScript (o `tsconfig` força — não burlar)

- `verbatimModuleSyntax`: tipos sempre via `import type { ... }`.
- `noUncheckedIndexedAccess`: `array[i]` e lookups dinâmicos são possivelmente `undefined`. Tratar.
- `noPropertyAccessFromIndexSignature`: `import.meta.env['VITE_X']`, não `.VITE_X`.
- `exactOptionalPropertyTypes`: `prop?: T` não aceita `undefined` explícito; preferir omitir a chave.
- **Never:** `as any`, `// @ts-ignore`, `!` (non-null assertion). Biome avisa; tratamos como erro.
- Tipos de entidade vinda da API: `src/types/api.ts`, derivados/validados via Zod.

## 3. Estrutura de pastas

```
src/
  components/        # componentes compartilhados entre features
    ui/              # SHADCN — não editar manualmente, só via `npx shadcn@latest add`
  features/<nome>/   # uma pasta por feature
    api/             # chamadas HTTP (apiFetch + schemas Zod) + keys
    hooks/           # useXxxQuery, useXxxMutation, hooks de UI da feature
    schemas/         # schemas Zod (form e/ou API)
    components/      # componentes específicos da feature
    pages/           # componentes de rota
  lib/               # utilitários globais (api-client, money, theme, utils, query-client)
  types/             # tipos compartilhados (api.ts)
  routes.tsx         # roteador
```

- **Never:** criar componente específico de uma feature em `src/components/`. Se passar a ser usado por mais de uma feature, sobe.
- **Never:** import cruzado entre features (`features/a` importando de `features/b`). Compartilhamento vai por `lib/` ou `components/`.

## 4. Naming & arquivos

- Componentes (`.tsx`): `PascalCase.tsx` → `TransactionForm.tsx`.
- Não-componentes (`.ts`): `kebab-case.ts` → `api-client.ts`, `use-transactions.ts`.
- Hooks: nome `useXxx`, named export. Arquivo em `kebab-case.ts` dentro de `hooks/`.
- Componentes: **named export sempre** (`export function Foo() {}`). Sem `export default` — única exceção legítima é `App.tsx` (convenção Vite).
- shadcn em `components/ui/` mantém o naming gerado (`button.tsx`).

## 5. Imports

- Ordem (Biome organiza automaticamente — não brigar): externos → `@/...` → relativos.
- Quotes: single em TS, double em JSX (já no Biome).
- `import type` para tudo que é usado só como tipo.

## 6. Componentes & estilo visual

- **Sempre tentar shadcn antes de criar do zero.** Adicionar com `npx shadcn@latest add <component>` — vai para `src/components/ui/`. Não editar esses arquivos manualmente; se precisar customizar, criar wrapper em `src/components/`.
- Composição via classes Tailwind + `cn()` de `@/lib/utils`. **Never** usar `style={{}}` inline a não ser que o valor seja dinâmico e impossível de expressar em classe.
- **Never** hardcodar cor hex no JSX. Usar tokens semânticos:
  - Surfaces: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-accent`, `bg-secondary`.
  - Texto: `text-foreground`, `text-muted-foreground`, `text-destructive`.
  - Bordas/foco: `border-border`, `ring-ring`, `bg-input`.
- Cores financeiras (definidas em `index.css`): `text-income` (verde), `text-expense` (vermelho), `text-balance` (azul).
- Paleta de marca para badges/chips de categorias: `bg-brand-{blue,red,gold,green,purple,pink,cyan,orange,lime}`.
- Charts: usar `--chart-1..5` via `bg-chart-1` etc.
- Ícones: `lucide-react`, tamanho default `size-4` (16px). Em botão `size="icon"`, **sempre** `aria-label`.
- Radius: usar a escala (`rounded-md`, `rounded-lg`, `rounded-xl`, ...). Nunca valor literal.
- Tipografia: Geist Variable (já injetada). `font-sans` é o default; `font-heading` para títulos.
- Dark mode: classe `.dark` no `<html>`, controlada por `useTheme()` de `@/lib/theme`. **Never** ler `localStorage` direto para tema; usar o hook.

## 7. Data fetching (TanStack Query + apiFetch)

- **Toda chamada HTTP passa por `apiFetch` em `@/lib/api-client`.** Nunca `fetch` solto no código de feature.
- Toda resposta JSON deve ser validada com schema Zod via `apiFetch(path, { schema })`. Erros de parse são bugs de contrato — propagar, não esconder.
- Query keys: array tipado, primeiro elemento é a feature.
  - Ex: `['transactions', 'list', filters]`, `['categories', id]`.
  - Centralizar fábricas em `features/<x>/api/keys.ts` quando houver mais de uma key por feature.
- Naming: `useXxxQuery` para `useQuery`, `useXxxMutation` para `useMutation`.
- Mutations invalidam keys via `queryClient.invalidateQueries({ queryKey: [...] })` no `onSuccess`.
- Defaults globais (`query-client.ts`): `staleTime: 30s`, `retry: 1` em queries / `0` em mutations. **Não** sobrescrever caso a caso sem razão concreta documentada.
- Token: ler/gravar/limpar **só** via `tokenStorage` de `@/lib/api-client`. 401 já dispara o evento `fintrack:logout`; o listener vive na camada de auth e faz o redirect.

## 8. Forms (React Hook Form + Zod)

- Todo form usa `useForm` com `zodResolver` e schema definido em `features/<x>/schemas/*.ts`.
- Tipo do form: `z.infer<typeof schema>`.
- **Never** validar manualmente no `onSubmit` — toda regra de validação vai no schema Zod.
- Estrutura de campo: shadcn `Label` (com `htmlFor`) + `Input/Select/...` + texto de erro `text-destructive text-sm` abaixo.
- Estados:
  - `formState.isSubmitting` (ou `mutation.isPending`) desabilita o submit.
  - Mostrar loader em mutations longas (`isPending`).
- Mensagens de erro em pt-BR.

## 9. Money

- **Never** somar/comparar/formatar dinheiro com `number` puro. Sempre via `formatMoney` (`@/lib/money`) ou Dinero.js direto.
- Tipo da API: `MoneySnapshot` em `@/types/api` (`{ amount, currency: { code, base, exponent } }`).
- Formatação default em `pt-BR`.

## 10. Roteamento (React Router v7, data mode)

- Rotas declaradas em `src/routes.tsx` via `createBrowserRouter`. Páginas vivem em `features/<x>/pages/`.
- Loaders/actions são opcionais. Para CRUD simples, TanStack Query já basta. Se um loader for adicionado, ele também passa por `apiFetch`.
- Links: `<Link to="...">` de `react-router`. **Never** `<a href>` para navegação interna.

## 11. Acessibilidade (mínimo obrigatório)

- Todo input tem `<Label htmlFor>` associado.
- Botão só com ícone tem `aria-label`.
- Diálogos shadcn já trazem trap de foco + ESC; não desabilitar.
- Contraste: confiar nos tokens (`foreground` sobre `background`, `muted-foreground` sobre `muted`, `destructive` para erros). Não inventar combinações de hex.
- Navegação por teclado: nunca capturar `Tab`. `Enter` submete forms.

## 12. Testes (Vitest + Testing Library)

- Arquivo ao lado do código: `Foo.tsx` → `Foo.test.tsx`. Hooks: `use-foo.ts` → `use-foo.test.ts`.
- Globals do Vitest estão habilitados (`describe/it/expect` sem import).
- Testar **comportamento**, não estrutura: `getByRole`, `getByLabelText`, `findByText`. **Never** `getByTestId` exceto como último recurso.
- Mockar HTTP no nível de `fetch` (MSW quando entrar). Não mockar `apiFetch` direto — perde a validação Zod do caminho real.
- Cobertura mínima por feature: golden path do form + um caso de erro de API.

## 13. Lint, format, build

- `npm run check` (Biome) deve passar antes de considerar uma task pronta.
- `npm run build` (tsc + vite) deve passar — TS strict não negocia.
- `npm test` deve passar.
- **Never** suprimir regra de Biome com `// biome-ignore` sem motivo escrito na mesma linha.

## 14. O que NÃO fazer (armadilhas comuns)

- Não introduzir nova lib de UI / estado / forms / router sem discutir — o stack atual cobre o caso comum.
- Não criar abstração antes de existirem ~3 usos. Duplicação leve > abstração prematura.
- Não deixar `console.log` em código mergeado.
- Não commitar segredos. Envs locais vão em `.env.local` (Vite ignora por padrão); chaves precisam de prefixo `VITE_` para chegar ao client e devem ser **públicas por design**.
