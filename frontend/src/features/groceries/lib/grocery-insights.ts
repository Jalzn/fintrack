import { formatMoney, moneyToNumber } from '@/lib/money';
import type { GrocerySummary, MoneySnapshot, PriceAnalysis, PriceAnalysisRow } from '@/types/api';

export const MIN_OCCURRENCES = 2;
export const MIN_RISE_PCT = 10;
export const DROP_MIN_PCT = 10;
export const SPEND_RISE_PCT = 15;
export const RESTOCK_MIN_COUNT = 4;
export const RESTOCK_MIN_WEEKS = 3;

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface PriceRiser {
  normalizedName: string;
  risePct: number;
  last: MoneySnapshot;
  min: MoneySnapshot;
}

/** Product whose last price rose the most vs its cheapest record. */
export function biggestRiser(products: PriceAnalysisRow[]): PriceRiser | null {
  let top: PriceRiser | null = null;
  for (const p of products) {
    const min = moneyToNumber(p.minUnitPrice);
    const last = moneyToNumber(p.lastUnitPrice);
    if (p.count < MIN_OCCURRENCES || min <= 0) continue;
    const risePct = Math.round(((last - min) / min) * 100);
    if (risePct < MIN_RISE_PCT) continue;
    if (!top || risePct > top.risePct) {
      top = {
        normalizedName: p.normalizedName,
        risePct,
        last: p.lastUnitPrice,
        min: p.minUnitPrice,
      };
    }
  }
  return top;
}

interface PriceDrop {
  normalizedName: string;
  fallPct: number;
  last: MoneySnapshot;
  max: MoneySnapshot;
}

/** Product whose last price dropped the most vs its most expensive record. */
function biggestDrop(products: PriceAnalysisRow[]): PriceDrop | null {
  let top: PriceDrop | null = null;
  for (const p of products) {
    const max = moneyToNumber(p.maxUnitPrice);
    const last = moneyToNumber(p.lastUnitPrice);
    const avg = moneyToNumber(p.avgUnitPrice);
    if (p.count < MIN_OCCURRENCES || max <= 0 || last >= avg) continue;
    const fallPct = Math.round(((max - last) / max) * 100);
    if (fallPct < DROP_MIN_PCT) continue;
    if (!top || fallPct > top.fallPct) {
      top = {
        normalizedName: p.normalizedName,
        fallPct,
        last: p.lastUnitPrice,
        max: p.maxUnitPrice,
      };
    }
  }
  return top;
}

interface Restock {
  name: string;
  weeks: number;
}

function pickRestock(products: PriceAnalysisRow[], now: Date): Restock | null {
  let top: Restock | null = null;
  for (const p of products) {
    if (p.count < RESTOCK_MIN_COUNT || p.occurrences.length === 0) continue;
    const latest = p.occurrences.reduce((max, o) => (o.date > max ? o.date : max), '');
    if (latest === '') continue;
    const weeks = Math.floor((now.getTime() - new Date(latest).getTime()) / MS_PER_WEEK);
    if (weeks < RESTOCK_MIN_WEEKS) continue;
    if (!top || weeks > top.weeks) top = { name: p.normalizedName, weeks };
  }
  return top;
}

interface BestStore {
  name: string;
  store: string;
  price: MoneySnapshot;
}

function pickBestStore(products: PriceAnalysisRow[]): BestStore | null {
  for (const p of [...products].sort((a, b) => b.count - a.count)) {
    if (p.count < MIN_OCCURRENCES || p.occurrences.length === 0) continue;

    const byStore = new Map<
      string,
      { sum: number; n: number; currency: MoneySnapshot['currency'] }
    >();
    for (const o of p.occurrences) {
      const entry = byStore.get(o.storeName) ?? { sum: 0, n: 0, currency: o.unitPrice.currency };
      entry.sum += o.unitPrice.amount;
      entry.n += 1;
      byStore.set(o.storeName, entry);
    }
    if (byStore.size < 2) continue;

    let best: BestStore | null = null;
    let bestAvg = Number.POSITIVE_INFINITY;
    for (const [store, { sum, n, currency }] of byStore) {
      const avg = sum / n;
      if (avg < bestAvg) {
        bestAvg = avg;
        best = { name: p.normalizedName, store, price: { amount: Math.round(avg), currency } };
      }
    }
    if (best) return best;
  }
  return null;
}

export type InsightTone = 'positive' | 'warning' | 'neutral';
export type InsightKind = 'rise' | 'drop' | 'spend-up' | 'best-store' | 'restock';

export interface GroceryInsight {
  id: string;
  kind: InsightKind;
  tone: InsightTone;
  title: string;
  detail: string;
  href?: string;
}

interface BuildInsightsInput {
  priceAnalysis: PriceAnalysis | undefined;
  summary: GrocerySummary | undefined;
  now?: Date;
}

/** Pure, client-side grocery insights. Each rule self-guards and is dropped when data is thin. */
export function buildGroceryInsights({
  priceAnalysis,
  summary,
  now,
}: BuildInsightsInput): GroceryInsight[] {
  const at = now ?? new Date();
  const products = priceAnalysis?.products ?? [];
  const insights: GroceryInsight[] = [];

  const riser = biggestRiser(products);
  if (riser) {
    insights.push({
      id: `rise-${riser.normalizedName}`,
      kind: 'rise',
      tone: 'warning',
      title: `${capitalize(riser.normalizedName)} está ${riser.risePct}% mais caro`,
      detail: `De ${formatMoney(riser.min)} (menor preço) para ${formatMoney(riser.last)} na última compra.`,
      href: '/mercado/precos',
    });
  }

  const spend = summary?.spendByPeriod ?? [];
  const last = spend[spend.length - 1];
  const prev = spend[spend.length - 2];
  if (last && prev) {
    const lastN = moneyToNumber(last.spend);
    const prevN = moneyToNumber(prev.spend);
    if (prevN > 0) {
      const deltaPct = Math.round(((lastN - prevN) / prevN) * 100);
      if (deltaPct >= SPEND_RISE_PCT) {
        insights.push({
          id: 'spend-up',
          kind: 'spend-up',
          tone: 'warning',
          title: `Gasto ${deltaPct}% acima do período anterior`,
          detail: `De ${formatMoney(prev.spend)} para ${formatMoney(last.spend)}.`,
        });
      }
    }
  }

  const restock = pickRestock(products, at);
  if (restock) {
    insights.push({
      id: `restock-${restock.name}`,
      kind: 'restock',
      tone: 'neutral',
      title: `Faz ${restock.weeks} semanas sem comprar ${restock.name}`,
      detail: 'Você costuma comprar com frequência — hora de repor?',
    });
  }

  const best = pickBestStore(products);
  if (best) {
    insights.push({
      id: `store-${best.name}`,
      kind: 'best-store',
      tone: 'neutral',
      title: `${capitalize(best.name)} sai mais barato no ${best.store}`,
      detail: `Preço médio de ${formatMoney(best.price)} nessa loja.`,
      href: '/mercado/precos',
    });
  }

  const drop = biggestDrop(products);
  if (drop) {
    insights.push({
      id: `drop-${drop.normalizedName}`,
      kind: 'drop',
      tone: 'positive',
      title: `${capitalize(drop.normalizedName)} está ${drop.fallPct}% mais barato`,
      detail: `De ${formatMoney(drop.max)} para ${formatMoney(drop.last)} — bom momento para estocar.`,
      href: '/mercado/precos',
    });
  }

  return insights.slice(0, 4);
}
