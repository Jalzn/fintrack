import { describe, expect, it } from 'vitest';
import { currentPeriod, previousPeriod } from '@/lib/period';
import { buildInsights } from './insights';

describe('buildInsights', () => {
  it('returns nothing without data', () => {
    expect(
      buildInsights({
        period: '2026-05',
        expenseTotal: 0,
        categoriesNow: [],
        categoriesPrev: [],
        budgets: [],
      }),
    ).toEqual([]);
  });

  it('flags a budget over its limit', () => {
    const result = buildInsights({
      period: '2026-05',
      expenseTotal: 1000,
      categoriesNow: [{ name: 'Restaurantes', value: 600 }],
      categoriesPrev: [],
      budgets: [{ name: 'Restaurantes', percentSpent: 121 }],
    });
    const budget = result.find((i) => i.id === 'critical-budget');
    expect(budget?.tone).toBe('warning');
    expect(budget?.text).toContain('estourou');
  });

  it('detects the biggest category variation vs previous month', () => {
    const result = buildInsights({
      period: '2026-05',
      expenseTotal: 1000,
      categoriesNow: [
        { name: 'Restaurantes', value: 400 },
        { name: 'Mercado', value: 600 },
      ],
      categoriesPrev: [
        { name: 'Restaurantes', value: 200 },
        { name: 'Mercado', value: 580 },
      ],
      budgets: [],
    });
    const variation = result.find((i) => i.id === 'variation');
    expect(variation?.text).toContain('Restaurantes');
    expect(variation?.text).toContain('subiu');
    expect(variation?.tone).toBe('warning');
  });

  it('projects spending pace only for the current in-progress month', () => {
    const now = new Date();
    now.setDate(10);
    const result = buildInsights({
      period: currentPeriod(),
      now,
      expenseTotal: 1000,
      categoriesNow: [{ name: 'Mercado', value: 1000 }],
      categoriesPrev: [],
      budgets: [],
    });
    expect(result.some((i) => i.id === 'pace')).toBe(true);

    const past = buildInsights({
      period: previousPeriod(currentPeriod()),
      expenseTotal: 1000,
      categoriesNow: [{ name: 'Mercado', value: 1000 }],
      categoriesPrev: [],
      budgets: [],
    });
    expect(past.some((i) => i.id === 'pace')).toBe(false);
  });

  it('reports the dominant category', () => {
    const result = buildInsights({
      period: '2026-05',
      expenseTotal: 1000,
      categoriesNow: [{ name: 'Moradia', value: 440 }],
      categoriesPrev: [],
      budgets: [],
    });
    const top = result.find((i) => i.id === 'top-category');
    expect(top?.text).toContain('Moradia');
    expect(top?.text).toContain('44%');
  });
});
