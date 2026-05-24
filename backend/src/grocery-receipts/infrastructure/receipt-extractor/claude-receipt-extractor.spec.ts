import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { ReceiptExtractionFailedError } from '@/grocery-receipts/application';
import { ClaudeReceiptExtractor } from './claude-receipt-extractor';

const makeClient = (response: unknown): Anthropic =>
  ({ messages: { create: vi.fn().mockResolvedValue(response) } }) as unknown as Anthropic;

const validResponse = {
  id: 'msg_1',
  usage: { cache_read_input_tokens: 0 },
  content: [
    {
      type: 'tool_use',
      id: 'tu_1',
      name: 'record_receipt',
      input: {
        storeName: 'Mercado X',
        purchaseDate: '2026-05-20',
        currencyCode: 'BRL',
        totalReais: 19.35,
        items: [
          {
            rawDescription: 'ARROZ TIO JOAO 5KG',
            normalizedName: 'arroz',
            quantity: 1,
            unit: 'un',
            unitPriceReais: 19.35,
            lineTotalReais: 19.35,
            brand: 'Tio João',
            code: '7896006711247',
            department: 'mercearia',
            size: '5kg',
          },
        ],
      },
    },
  ],
};

const input = { imageBase64: 'abc', mimeType: 'image/jpeg' } as const;

describe('ClaudeReceiptExtractor', () => {
  it('parses a valid tool_use block', async () => {
    const extractor = new ClaudeReceiptExtractor(makeClient(validResponse));
    const result = await extractor.extract(input);
    expect(result.totalReais).toBe(19.35);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.normalizedName).toBe('arroz');
    expect(result.items[0]?.department).toBe('mercearia');
    expect(result.items[0]?.brand).toBe('Tio João');
  });

  it('throws when an item is missing the required department', async () => {
    const client = makeClient({
      id: 'msg_4',
      usage: { cache_read_input_tokens: 0 },
      content: [
        {
          type: 'tool_use',
          id: 'tu_4',
          name: 'record_receipt',
          input: {
            storeName: 'X',
            purchaseDate: '2026-05-20',
            currencyCode: 'BRL',
            totalReais: 10,
            items: [
              {
                rawDescription: 'PAO',
                normalizedName: 'pao',
                quantity: 1,
                unit: 'un',
                unitPriceReais: 10,
                lineTotalReais: 10,
                brand: null,
                code: null,
                size: null,
                // department omitido de propósito
              },
            ],
          },
        },
      ],
    });
    const extractor = new ClaudeReceiptExtractor(client);
    await expect(extractor.extract(input)).rejects.toBeInstanceOf(ReceiptExtractionFailedError);
  });

  it('throws when there is no tool_use block', async () => {
    const client = makeClient({
      id: 'msg_2',
      usage: {},
      content: [{ type: 'text', text: 'desculpe' }],
    });
    const extractor = new ClaudeReceiptExtractor(client);
    await expect(extractor.extract(input)).rejects.toBeInstanceOf(ReceiptExtractionFailedError);
  });

  it('throws when the model output fails schema validation', async () => {
    const client = makeClient({
      id: 'msg_3',
      usage: { cache_read_input_tokens: 0 },
      content: [
        {
          type: 'tool_use',
          id: 'tu_3',
          name: 'record_receipt',
          input: {
            storeName: 'X',
            purchaseDate: null,
            currencyCode: 'BRL',
            totalReais: -5,
            items: [],
          },
        },
      ],
    });
    const extractor = new ClaudeReceiptExtractor(client);
    await expect(extractor.extract(input)).rejects.toBeInstanceOf(ReceiptExtractionFailedError);
  });

  it('propagates as ReceiptExtractionFailedError when the SDK call throws', async () => {
    const client = {
      messages: { create: vi.fn().mockRejectedValue(new Error('network')) },
    } as unknown as Anthropic;
    const extractor = new ClaudeReceiptExtractor(client);
    await expect(extractor.extract(input)).rejects.toBeInstanceOf(ReceiptExtractionFailedError);
  });
});
