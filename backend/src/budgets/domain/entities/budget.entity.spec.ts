import { describe, expect, it } from 'vitest';
import { BRL, Money } from '@/shared/domain';
import { InvalidBudgetError } from '../errors';
import { BudgetCreatedEvent, BudgetUpdatedEvent } from '../events';
import { Budget } from './budget.entity';

const validProps = () => ({
  id: 'b-1',
  userId: 'u-1',
  name: 'Meu orçamento',
  color: '#4a8ee8',
  scopes: [{ categoryId: 'cat-1', subcategoryId: null }],
  periodStart: new Date(Date.UTC(2026, 4, 1)),
  planned: Money.of(50000, BRL),
});

describe('Budget entity', () => {
  it('creates a valid budget with default zero spent', () => {
    const b = Budget.create(validProps());
    expect(b.id).toBe('b-1');
    expect(b.name).toBe('Meu orçamento');
    expect(b.color).toBe('#4a8ee8');
    expect(b.scopes).toEqual([{ categoryId: 'cat-1', subcategoryId: null }]);
    expect(b.spent.toSnapshot().amount).toBe(0);
    expect(b.spent.toSnapshot().currency.code).toBe('BRL');
    expect(b.domainEvents.some((e) => e instanceof BudgetCreatedEvent)).toBe(true);
  });

  it('rejects empty userId', () => {
    expect(() => Budget.create({ ...validProps(), userId: '' })).toThrow(InvalidBudgetError);
  });

  it('rejects empty name', () => {
    expect(() => Budget.create({ ...validProps(), name: '  ' })).toThrow(InvalidBudgetError);
  });

  it('rejects empty color', () => {
    expect(() => Budget.create({ ...validProps(), color: '' })).toThrow(InvalidBudgetError);
  });

  it('rejects empty scopes', () => {
    expect(() => Budget.create({ ...validProps(), scopes: [] })).toThrow(InvalidBudgetError);
  });

  it('rejects duplicate scopes', () => {
    expect(() =>
      Budget.create({
        ...validProps(),
        scopes: [
          { categoryId: 'cat-1', subcategoryId: null },
          { categoryId: 'cat-1', subcategoryId: null },
        ],
      }),
    ).toThrow(InvalidBudgetError);
  });

  it('accepts multiple distinct scopes', () => {
    const b = Budget.create({
      ...validProps(),
      scopes: [
        { categoryId: 'cat-1', subcategoryId: 'sub-1' },
        { categoryId: 'cat-2', subcategoryId: 'sub-2' },
      ],
    });
    expect(b.scopes).toHaveLength(2);
  });

  it('rejects non-first-of-month periodStart', () => {
    expect(() =>
      Budget.create({ ...validProps(), periodStart: new Date(Date.UTC(2026, 4, 15)) }),
    ).toThrow(InvalidBudgetError);
  });

  it('rejects non-UTC midnight periodStart', () => {
    expect(() =>
      Budget.create({ ...validProps(), periodStart: new Date(Date.UTC(2026, 4, 1, 3)) }),
    ).toThrow(InvalidBudgetError);
  });

  it('rejects zero or negative planned amount', () => {
    expect(() => Budget.create({ ...validProps(), planned: Money.of(0, BRL) })).toThrow(
      InvalidBudgetError,
    );
  });

  it('emits BudgetUpdatedEvent on updateDetails and applies the new values', () => {
    const b = Budget.create(validProps());
    b.clearDomainEvents();
    b.updateDetails({
      name: 'Renomeado',
      color: '#e8614a',
      planned: Money.of(60000, BRL),
      scopes: [{ categoryId: 'cat-1', subcategoryId: 'sub-1' }],
    });
    expect(b.name).toBe('Renomeado');
    expect(b.color).toBe('#e8614a');
    expect(b.planned.toSnapshot().amount).toBe(60000);
    expect(b.scopes).toEqual([{ categoryId: 'cat-1', subcategoryId: 'sub-1' }]);
    expect(b.domainEvents.some((e) => e instanceof BudgetUpdatedEvent)).toBe(true);
  });

  it('replaceSpent does not emit event (avoids loop with handler)', () => {
    const b = Budget.create(validProps());
    b.clearDomainEvents();
    b.replaceSpent(Money.of(12345, BRL));
    expect(b.spent.toSnapshot().amount).toBe(12345);
    expect(b.domainEvents).toHaveLength(0);
  });

  it('rejects spent with different currency than planned', () => {
    const b = Budget.create(validProps());
    expect(() => b.replaceSpent(Money.of(100, { code: 'USD', base: 10, exponent: 2 }))).toThrow(
      InvalidBudgetError,
    );
  });

  it('rejects negative spent', () => {
    const b = Budget.create(validProps());
    expect(() => b.replaceSpent(Money.of(-1, BRL))).toThrow(InvalidBudgetError);
  });

  it('restore reconstructs without emitting events', () => {
    const now = new Date();
    const b = Budget.restore({
      id: 'b-2',
      userId: 'u-2',
      name: 'Restaurado',
      color: '#1fba7a',
      scopes: [{ categoryId: 'cat-2', subcategoryId: 'sub-2' }],
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      planned: Money.of(10000, BRL),
      spent: Money.of(2500, BRL),
      createdAt: now,
      updatedAt: now,
    });
    expect(b.id).toBe('b-2');
    expect(b.scopes).toEqual([{ categoryId: 'cat-2', subcategoryId: 'sub-2' }]);
    expect(b.domainEvents).toHaveLength(0);
  });
});
