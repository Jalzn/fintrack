import type { Currency } from './money';

export const USD: Currency = { code: 'USD', base: 10, exponent: 2 };
export const BRL: Currency = { code: 'BRL', base: 10, exponent: 2 };

export type CurrencyCode = 'USD' | 'BRL';
export const currencyByCode: Record<CurrencyCode, Currency> = { USD, BRL };
