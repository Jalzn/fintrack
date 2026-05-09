import { describe, expect, it } from 'vitest';
import { BRL, USD } from './currencies';
import { Money } from './money';

describe('Money', () => {
  it('creates from minor units', () => {
    const money = Money.of(1000, USD);
    expect(money.toDecimal()).toBe('10.00');
  });

  it('restores from snapshot', () => {
    const original = Money.of(500, USD);
    const restored = Money.fromSnapshot(original.toSnapshot());
    expect(restored.equals(original)).toBe(true);
  });

  it('adds two amounts', () => {
    const a = Money.of(1000, USD);
    const b = Money.of(500, USD);
    expect(a.add(b).toDecimal()).toBe('15.00');
  });

  it('subtracts two amounts', () => {
    const a = Money.of(1000, USD);
    const b = Money.of(300, USD);
    expect(a.subtract(b).toDecimal()).toBe('7.00');
  });

  it('compares greater than', () => {
    expect(Money.of(200, USD).isGreaterThan(Money.of(100, USD))).toBe(true);
    expect(Money.of(100, USD).isGreaterThan(Money.of(200, USD))).toBe(false);
  });

  it('compares less than', () => {
    expect(Money.of(100, USD).isLessThan(Money.of(200, USD))).toBe(true);
    expect(Money.of(200, USD).isLessThan(Money.of(100, USD))).toBe(false);
  });

  it('checks equality', () => {
    expect(Money.of(1000, USD).equals(Money.of(1000, USD))).toBe(true);
    expect(Money.of(1000, USD).equals(Money.of(999, USD))).toBe(false);
  });

  it('works with BRL', () => {
    const price = Money.of(9990, BRL);
    expect(price.toDecimal()).toBe('99.90');
  });
});
