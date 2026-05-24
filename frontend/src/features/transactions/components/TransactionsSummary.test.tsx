import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionsSummary } from './TransactionsSummary';

const brl = (amount: number) => ({
  amount,
  currency: { code: 'BRL', base: 10, exponent: 2 },
});

const payload = {
  data: [
    {
      id: '1',
      amount: brl(100000),
      type: 'INCOME',
      categoryId: 'c1',
      subcategoryId: null,
      description: 'Salário',
      date: '2026-05-05',
      createdAt: '2026-05-05',
    },
    {
      id: '2',
      amount: brl(30000),
      type: 'EXPENSE',
      categoryId: 'c2',
      subcategoryId: null,
      description: 'Mercado',
      date: '2026-05-06',
      createdAt: '2026-05-06',
    },
  ],
  total: 2,
  page: 1,
  limit: 100,
  totalPages: 1,
};

const okJson = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => body,
});

function renderSummary() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TransactionsSummary filters={{ startDate: '2026-05-01', endDate: '2026-05-31' }} />
    </QueryClientProvider>,
  );
}

describe('TransactionsSummary', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sums income, expense and balance of the filtered set', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okJson(payload)),
    );
    renderSummary();

    expect(await screen.findByText(/1\.000,00/)).toBeTruthy(); // income
    expect(screen.getByText(/300,00/)).toBeTruthy(); // expense
    expect(screen.getByText(/700,00/)).toBeTruthy(); // balance
    expect(screen.getByText(/2 transações no período/)).toBeTruthy();
  });
});
