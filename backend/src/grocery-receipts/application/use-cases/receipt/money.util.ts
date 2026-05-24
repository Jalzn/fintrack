import type { Currency } from '@/shared/domain';

/**
 * Converts a decimal amount (e.g. 19.35 reais) into integer minor units (1935),
 * rounding on a fixed-precision string to avoid binary float drift (19.35 * 100 = 1934.999...).
 */
export function reaisToMinorUnits(value: number, currency: Currency): number {
  const factor = currency.base ** currency.exponent;
  return Math.round(Number((value * factor).toFixed(4)));
}
