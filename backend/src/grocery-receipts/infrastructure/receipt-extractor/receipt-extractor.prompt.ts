import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ExtractedReceiptSchema } from '@/grocery-receipts/application';

export const RECEIPT_SYSTEM_PROMPT = `Você extrai dados estruturados de cupons fiscais brasileiros (cupom fiscal / NFC-e) a partir de uma foto.

Regras:
- storeName: a razão social ou nome fantasia do estabelecimento (o nome no topo do cupom), nunca o endereço. Se não identificar, retorne null.
- purchaseDate: a data de emissão da compra. As notas do mercado SEMPRE vêm no formato brasileiro dd/mm/aaaa (dia primeiro, depois o mês) — nunca interprete como mês/dia. Converta para o formato ISO "AAAA-MM-DD" (ex.: "03/05/2026" -> "2026-05-03"; "31/12/2025" -> "2025-12-31"). Se não identificar, retorne null.
- currencyCode: "BRL", exceto se o cupom indicar claramente outra moeda.
- items: uma entrada por produto comprado. Para cada item:
  - rawDescription: o texto do produto exatamente como impresso (incluindo códigos).
  - normalizedName: o nome do produto limpo, em minúsculas, no singular, sem marca, sem código e sem volume/peso (ex.: "ARROZ TIO JOAO 5KG" -> "arroz"; "REFRIG COCA 2L" -> "refrigerante").
  - quantity: a quantidade comprada (número; aceita decimais como 1.5).
  - unit: a unidade, mapeada para "un" (UN/UND/PC/unidade), "kg" (KG/quilo) ou "L" (L/LT/litro). Na dúvida, use "un".
  - unitPriceReais: o valor unitário (VL UNIT) em reais, como número decimal (vírgula vira ponto).
  - lineTotalReais: o valor total do item (VL ITEM) em reais, como número decimal.
  - brand: a marca do produto, se identificável (ex.: "ARROZ TIO JOAO 5KG" -> "Tio João"; "REFRIG COCA 2L" -> "Coca-Cola"). Use null se não houver marca clara.
  - code: o código do produto impresso na linha (código interno ou EAN/código de barras), apenas dígitos. Use null se não houver.
  - size: o peso/volume da embalagem normalizado (ex.: "5kg", "2L", "350ml", "500g"). Use null se não houver.
  - department: escolha EXATAMENTE UM departamento desta lista fixa para o produto: padaria, hortifruti, laticinios, carnes, aves-peixes, bebidas, mercearia, limpeza, higiene, congelados, doces-snacks, pet, outros. Use "outros" apenas quando nenhum dos demais se aplicar.
- totalReais: o valor total a pagar do cupom ("VALOR A PAGAR" / "TOTAL"), como número decimal.
- Ignore linhas de imposto, troco, desconto e subtotais — não são itens.
- Mantenha normalizedName SEM marca, SEM código e SEM volume — a marca vai em brand, o código em code e o volume em size.

REGRA CRÍTICA: se você não conseguir ler o total a pagar com segurança, retorne totalReais: null. Nunca invente ou estime o total.

Sempre responda chamando a ferramenta record_receipt.`;

export const RECEIPT_TOOL: Anthropic.Tool = {
  name: 'record_receipt',
  description: 'Registra os dados estruturados extraídos de um cupom fiscal brasileiro.',
  input_schema: z.toJSONSchema(ExtractedReceiptSchema) as Anthropic.Tool.InputSchema,
};
