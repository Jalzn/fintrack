import type { Dinero, DineroCurrency } from 'dinero.js';
import {
  add,
  dinero,
  equal,
  greaterThan,
  lessThan,
  subtract,
  toDecimal,
  toSnapshot,
} from 'dinero.js';

export interface Currency {
  readonly code: string;
  readonly base: number;
  readonly exponent: number;
}

export interface MoneySnapshot {
  readonly amount: number;
  readonly currency: Currency;
}

export class Money {
  private readonly _value: Dinero<number>;

  private constructor(value: Dinero<number>) {
    this._value = value;
  }

  // amount is in minor units (e.g. 1000 = $10.00 for USD)
  static of(amount: number, currency: Currency): Money {
    return new Money(dinero({ amount, currency: currency as DineroCurrency<number> }));
  }

  static fromSnapshot(snapshot: MoneySnapshot): Money {
    return new Money(
      dinero({ amount: snapshot.amount, currency: snapshot.currency as DineroCurrency<number> }),
    );
  }

  add(other: Money): Money {
    return new Money(add(this._value, other._value));
  }

  subtract(other: Money): Money {
    return new Money(subtract(this._value, other._value));
  }

  isGreaterThan(other: Money): boolean {
    return greaterThan(this._value, other._value);
  }

  isLessThan(other: Money): boolean {
    return lessThan(this._value, other._value);
  }

  equals(other: Money): boolean {
    return equal(this._value, other._value);
  }

  toDecimal(): string {
    return toDecimal(this._value);
  }

  toSnapshot(): MoneySnapshot {
    const snap = toSnapshot(this._value);
    const rawBase = snap.currency.base;
    const base = Array.isArray(rawBase) ? (rawBase[0] ?? 10) : rawBase;
    return {
      amount: snap.amount,
      currency: { code: snap.currency.code, base, exponent: snap.currency.exponent },
    };
  }
}
