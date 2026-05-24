# Step 2 — Extração por IA (porta + Claude + fake)

**Goal:** transformar imagem em dados estruturados, atrás de uma porta testável (fronteira de I/O).

## Arquivos

### Schema (fonte única — DRY)
- `application/schemas/extracted-receipt.schema.ts`:
  ```ts
  export const ExtractedItemSchema = z.object({
    rawDescription: z.string(),
    normalizedName: z.string(),
    quantity: z.number().positive(),
    unit: z.enum(['un', 'kg', 'L']),
    unitPriceReais: z.number().nonnegative(),
    lineTotalReais: z.number().nonnegative(),
  });
  export const ExtractedReceiptSchema = z.object({
    storeName: z.string().nullable(),
    purchaseDate: z.string().nullable(),        // ISO 'YYYY-MM-DD'
    currencyCode: z.enum(['BRL', 'USD']),
    totalReais: z.number().positive().nullable(), // null = não conseguiu ler
    items: z.array(ExtractedItemSchema),
  });
  export type ExtractedReceipt = z.infer<typeof ExtractedReceiptSchema>;
  ```

### Porta
- `application/ports/receipt-extractor.port.ts`:
  ```ts
  export interface IReceiptExtractor {
    extract(input: { imageBase64: string; mimeType: 'image/jpeg'|'image/png'|'image/webp' })
      : Promise<ExtractedReceipt>;
  }
  ```

### Implementação Claude
- `infrastructure/receipt-extractor/receipt-extractor.prompt.ts`:
  - `RECEIPT_SYSTEM_PROMPT` (pt-BR): papel = extrair cupom fiscal/NFC-e brasileiro; loja = razão
    social/nome fantasia (não endereço); data `dd/mm/aaaa` → ISO; decimais com vírgula → ponto;
    mapear unidade (UN/UND/PC→un, KG→kg, L/LT→L; default un); `normalizedName` limpo, minúsculo,
    sem código/marca (ex.: "ARROZ TIO JOAO 5KG" → "arroz"); ignorar linhas de imposto/desconto.
    **Regra crítica:** se não ler o total com segurança, `totalReais: null` (nunca chutar).
  - `RECEIPT_TOOL = { name: 'record_receipt', description, input_schema: z.toJSONSchema(ExtractedReceiptSchema) }`.
- `infrastructure/receipt-extractor/claude-receipt-extractor.ts`:
  ```ts
  const res = await this.client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 4096,
    system: [{ type: 'text', text: RECEIPT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: [RECEIPT_TOOL],
    tool_choice: { type: 'tool', name: 'record_receipt' },
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
      { type: 'text', text: 'Extraia os dados deste cupom fiscal usando record_receipt.' },
    ]}],
  });
  const toolUse = res.content.find((b) => b.type === 'tool_use');
  if (!toolUse) throw new ReceiptExtractionFailedError('sem tool_use');
  return ExtractedReceiptSchema.parse(toolUse.input);   // Fail Fast em saída não-confiável
  ```
  - Capturar erros do SDK (rate limit/401/timeout) → `ReceiptExtractionFailedError` (logar `request id`).
  - Construir com a skill **claude-api** (caching, tratamento de erros, modelo correto).
- `infrastructure/receipt-extractor/in-memory-receipt-extractor.ts` — `FakeReceiptExtractor`
  com retorno configurável (`setNext(receipt)`), incluindo caso `totalReais: null`.
- `infrastructure/receipt-extractor/index.ts`.

### Config / deps
- `core/env.schema.ts` — `ANTHROPIC_API_KEY: z.string().optional()`; `.env.example` add a chave.
  Key lida na factory do provider; faltando, `extract()` lança erro claro (boot/testes não quebram).
- `backend/package.json` — add `@anthropic-ai/sdk`; `npm install`.
- `infrastructure/tokens.ts` — add `RECEIPT_EXTRACTOR = Symbol('IReceiptExtractor')`.

## Testes
- `infrastructure/receipt-extractor/claude-receipt-extractor.spec.ts` (mock do client `Anthropic`):
  - retorna bloco `tool_use` válido → `extract` devolve objeto parseado.
  - sem `tool_use` → lança `ReceiptExtractionFailedError`.
  - `input` inválido (ex.: total negativo) → `ExtractedReceiptSchema.parse` lança.

## Done
- Extractor testado isolado (sem chamar API real); `npm run check` + `npm run build` verdes.
