import { add, type Dinero, dinero, subtract, toDecimal, toSnapshot } from 'dinero.js';
import type { MoneySnapshot } from '@/types/api';

/** Converts a money snapshot (minor units) into a plain decimal number for charts. */
export function moneyToNumber(snapshot: MoneySnapshot): number {
  return snapshot.amount / snapshot.currency.base ** snapshot.currency.exponent;
}

function toDineroMoney(snapshot: MoneySnapshot): Dinero<number> {
  return dinero({
    amount: snapshot.amount,
    currency: {
      code: snapshot.currency.code,
      base: snapshot.currency.base,
      exponent: snapshot.currency.exponent,
    },
  });
}

function fromDinero(value: Dinero<number>, currency: MoneySnapshot['currency']): MoneySnapshot {
  const snap = toSnapshot(value);
  return { amount: snap.amount, currency };
}

/** Sums money snapshots that share `currency`. Empty input yields zero. */
export function sumMoney(
  snapshots: MoneySnapshot[],
  currency: MoneySnapshot['currency'],
): MoneySnapshot {
  if (snapshots.length === 0) return { amount: 0, currency };
  const total = snapshots.map(toDineroMoney).reduce((acc, d) => add(acc, d));
  return fromDinero(total, currency);
}

export function subtractMoney(a: MoneySnapshot, b: MoneySnapshot): MoneySnapshot {
  return fromDinero(subtract(toDineroMoney(a), toDineroMoney(b)), a.currency);
}

export function formatMoney(snapshot: MoneySnapshot, locale = 'pt-BR'): string {
  const d = dinero({
    amount: snapshot.amount,
    currency: {
      code: snapshot.currency.code,
      base: snapshot.currency.base,
      exponent: snapshot.currency.exponent,
    },
  });

  return toDecimal(d, ({ value, currency }) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
    }).format(Number(value)),
  );
}
