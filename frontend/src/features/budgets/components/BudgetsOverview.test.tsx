import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Budget } from '@/types/api';
import { BudgetsOverview } from './BudgetsOverview';

const brl = (amount: number) => ({
  amount,
  currency: { code: 'BRL', base: 10, exponent: 2 },
});

const makeBudget = (planned: number, spent: number, percentSpent: number, id: string): Budget => ({
  id,
  name: `Orçamento ${id}`,
  color: '#4a8ee8',
  scopes: [{ categoryId: 'c', subcategoryId: null }],
  periodStart: '2026-05-01',
  planned: brl(planned),
  spent: brl(spent),
  remaining: brl(planned - spent),
  percentSpent,
  createdAt: '2026-05-01',
  updatedAt: '2026-05-01',
});

describe('BudgetsOverview', () => {
  it('aggregates planned/spent and counts overspent budgets', () => {
    render(
      <BudgetsOverview
        budgets={[makeBudget(100000, 50000, 50, 'a'), makeBudget(50000, 70000, 140, 'b')]}
      />,
    );

    expect(screen.getByText(/1\.200,00/)).toBeTruthy(); // total spent
    expect(screen.getByText(/1\.500,00/)).toBeTruthy(); // total planned
    expect(screen.getByText(/80% do planejado/)).toBeTruthy();
    expect(screen.getByText(/1 estourado/)).toBeTruthy();
  });
});
