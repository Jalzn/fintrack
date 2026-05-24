import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './StatCard';

const brl = (amount: number) => ({
  amount,
  currency: { code: 'BRL', base: 10, exponent: 2 },
});

describe('StatCard', () => {
  it('renders the formatted money value', () => {
    render(<StatCard label="Saldo" value={brl(436030)} />);
    expect(screen.getByText('Saldo')).toBeTruthy();
    expect(screen.getByText(/4\.360,30/)).toBeTruthy();
  });

  it('shows a positive delta as income-colored when growth is good', () => {
    render(
      <StatCard label="Receitas" value={brl(10000)} delta={{ current: 110, previous: 100 }} />,
    );
    const badge = screen.getByText('10%');
    expect(badge.className).toContain('text-income');
  });

  it('treats a decrease as good when goodDirection is down (expenses)', () => {
    render(
      <StatCard
        label="Despesas"
        value={brl(5000)}
        delta={{ current: 80, previous: 100, goodDirection: 'down' }}
      />,
    );
    const badge = screen.getByText('20%');
    expect(badge.className).toContain('text-income');
  });

  it('does not divide by zero when there is no previous base', () => {
    render(<StatCard label="Saldo" value={brl(1000)} delta={{ current: 50, previous: 0 }} />);
    expect(screen.getByText(/sem base no mês anterior/i)).toBeTruthy();
  });
});
