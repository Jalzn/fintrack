import { dinero, toDecimal } from 'dinero.js';
import type { MoneySnapshot } from '@/types/api';

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
