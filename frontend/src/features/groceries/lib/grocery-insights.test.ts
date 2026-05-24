import { describe, expect, it } from 'vitest';
import type { GrocerySummary, MoneySnapshot, PriceAnalysisRow } from '@/types/api';
import { biggestRiser, buildGroceryInsights } from './grocery-insights';

const brl = (amount: number): MoneySnapshot => ({
  amount,
  currency: { code: 'BRL', base: 10, exponent: 2 },
});

function product(
  overrides: Partial<PriceAnalysisRow> & { normalizedName: string },
): PriceAnalysisRow {
  return {
    count: 5,
    lastUnitPrice: brl(500),
    minUnitPrice: brl(500),
    maxUnitPrice: brl(500),
    avgUnitPrice: brl(500),
    occurrences: [],
    ...overrides,
  };
}

describe('biggestRiser', () => {
  it('returns the product with the largest rise above the threshold', () => {
    const riser = biggestRiser([
      product({
        normalizedName: 'leite',
        count: 3,
        minUnitPrice: brl(400),
        lastUnitPrice: brl(500),
      }), // +25%
      product({
        normalizedName: 'arroz',
        count: 3,
        minUnitPrice: brl(1000),
        lastUnitPrice: brl(1100),
      }), // +10%
    ]);
    expect(riser?.normalizedName).toBe('leite');
    expect(riser?.risePct).toBe(25);
  });

  it('ignores products below the occurrence or rise threshold', () => {
    expect(
      biggestRiser([
        product({
          normalizedName: 'sal',
          count: 1,
          minUnitPrice: brl(100),
          lastUnitPrice: brl(200),
        }), // too few
        product({
          normalizedName: 'feijao',
          count: 4,
          minUnitPrice: brl(100),
          lastUnitPrice: brl(105),
        }), // +5%
      ]),
    ).toBeNull();
  });
});

describe('buildGroceryInsights', () => {
  it('returns an empty list when there is no data', () => {
    expect(buildGroceryInsights({ priceAnalysis: undefined, summary: undefined })).toEqual([]);
  });

  it('emits a rise insight for a product that got more expensive', () => {
    const insights = buildGroceryInsights({
      priceAnalysis: {
        products: [
          product({
            normalizedName: 'leite',
            count: 3,
            minUnitPrice: brl(400),
            lastUnitPrice: brl(560),
          }),
        ],
      },
      summary: undefined,
    });
    const rise = insights.find((i) => i.kind === 'rise');
    expect(rise).toBeDefined();
    expect(rise?.tone).toBe('warning');
    expect(rise?.href).toBe('/mercado/precos');
    expect(rise?.title).toContain('40%');
  });

  it('emits a spend-up insight when spend rose ≥15% vs the previous bucket', () => {
    const summary: GrocerySummary = {
      spendByPeriod: [
        { period: '2026-04', spend: brl(100000) },
        { period: '2026-05', spend: brl(130000) }, // +30%
      ],
      byDepartment: [],
      byStore: [],
      topProductsBySpend: [],
      topProductsByFrequency: [],
      currencyCode: 'BRL',
    };
    const insights = buildGroceryInsights({ priceAnalysis: undefined, summary });
    expect(insights.some((i) => i.kind === 'spend-up')).toBe(true);
  });

  it('does not emit spend-up for a small change', () => {
    const summary: GrocerySummary = {
      spendByPeriod: [
        { period: '2026-04', spend: brl(100000) },
        { period: '2026-05', spend: brl(105000) }, // +5%
      ],
      byDepartment: [],
      byStore: [],
      topProductsBySpend: [],
      topProductsByFrequency: [],
      currencyCode: 'BRL',
    };
    expect(
      buildGroceryInsights({ priceAnalysis: undefined, summary }).some(
        (i) => i.kind === 'spend-up',
      ),
    ).toBe(false);
  });

  it('emits a restock reminder for a frequent product not bought in weeks', () => {
    const now = new Date('2026-05-23T12:00:00.000Z');
    const insights = buildGroceryInsights({
      priceAnalysis: {
        products: [
          product({
            normalizedName: 'café',
            count: 6,
            occurrences: [
              {
                date: '2026-04-01T12:00:00.000Z',
                storeName: 'Loja A',
                unitPrice: brl(1800),
                quantity: 1,
              },
            ],
          }),
        ],
      },
      summary: undefined,
      now,
    });
    const restock = insights.find((i) => i.kind === 'restock');
    expect(restock).toBeDefined();
    expect(restock?.title).toContain('café');
  });

  it('emits a best-store insight when an item is cheaper at one store', () => {
    const insights = buildGroceryInsights({
      priceAnalysis: {
        products: [
          product({
            normalizedName: 'banana',
            count: 4,
            occurrences: [
              {
                date: '2026-05-01T12:00:00.000Z',
                storeName: 'Caro',
                unitPrice: brl(800),
                quantity: 1,
              },
              {
                date: '2026-05-08T12:00:00.000Z',
                storeName: 'Barato',
                unitPrice: brl(400),
                quantity: 1,
              },
            ],
          }),
        ],
      },
      summary: undefined,
    });
    const store = insights.find((i) => i.kind === 'best-store');
    expect(store).toBeDefined();
    expect(store?.title).toContain('Barato');
  });
});
