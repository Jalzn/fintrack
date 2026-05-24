import type {
  IGroceryReceiptRepository,
  ItemPriceHistoryEntry,
  ReceiptTotalEntry,
} from '@/grocery-receipts/domain';
import { type CurrencyCode, currencyByCode, Money } from '@/shared/domain';
import type {
  DepartmentSpendDTO,
  GrocerySummaryDTO,
  PeriodSpendDTO,
  ProductSpendDTO,
  StoreSpendDTO,
} from '../../dtos';
import { type GetGrocerySummaryInput, GetGrocerySummaryInputSchema } from '../../schemas';

const TOP_PRODUCTS_LIMIT = 10;

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
}

export class GetGrocerySummaryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetGrocerySummaryInput): Promise<GrocerySummaryDTO> {
    const parsed = GetGrocerySummaryInputSchema.parse(input);
    const range = {
      userId: parsed.userId,
      ...(parsed.startDate !== undefined && { startDate: parsed.startDate }),
      ...(parsed.endDate !== undefined && { endDate: parsed.endDate }),
    };

    const [receiptTotals, itemHistory] = await Promise.all([
      this.deps.groceryReceiptRepository.findReceiptTotals(range),
      this.deps.groceryReceiptRepository.findItemPriceHistory(range),
    ]);

    const currencyCode = (receiptTotals[0]?.currencyCode ??
      itemHistory[0]?.currencyCode ??
      'BRL') as CurrencyCode;
    const currency = currencyByCode[currencyCode];
    const toMoney = (amount: number) => Money.of(amount, currency).toSnapshot();

    return {
      spendByPeriod: buildPeriodSpend(receiptTotals, parsed.granularity, toMoney),
      byStore: buildStoreSpend(receiptTotals, toMoney),
      byDepartment: buildDepartmentSpend(itemHistory, toMoney),
      topProductsBySpend: buildTopProducts(itemHistory, 'spend', toMoney),
      topProductsByFrequency: buildTopProducts(itemHistory, 'frequency', toMoney),
      currencyCode,
    };
  }
}

type ToMoney = (amount: number) => ReturnType<Money['toSnapshot']>;

function buildPeriodSpend(
  totals: ReceiptTotalEntry[],
  granularity: 'week' | 'month',
  toMoney: ToMoney,
): PeriodSpendDTO[] {
  const sums = new Map<string, number>();
  for (const entry of totals) {
    const key =
      granularity === 'week' ? isoWeekKey(entry.purchaseDate) : monthKey(entry.purchaseDate);
    sums.set(key, (sums.get(key) ?? 0) + entry.totalMinorUnits);
  }
  return [...sums.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, amount]) => ({ period, spend: toMoney(amount) }));
}

function buildStoreSpend(totals: ReceiptTotalEntry[], toMoney: ToMoney): StoreSpendDTO[] {
  const sums = new Map<string, number>();
  for (const entry of totals) {
    sums.set(entry.storeName, (sums.get(entry.storeName) ?? 0) + entry.totalMinorUnits);
  }
  return [...sums.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([storeName, amount]) => ({ storeName, spend: toMoney(amount) }));
}

function buildDepartmentSpend(
  items: ItemPriceHistoryEntry[],
  toMoney: ToMoney,
): DepartmentSpendDTO[] {
  const sums = new Map<string, number>();
  for (const item of items) {
    const department = item.department ?? 'outros';
    sums.set(department, (sums.get(department) ?? 0) + item.lineTotalMinorUnits);
  }
  return [...sums.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([department, amount]) => ({ department, spend: toMoney(amount) }));
}

function buildTopProducts(
  items: ItemPriceHistoryEntry[],
  sortBy: 'spend' | 'frequency',
  toMoney: ToMoney,
): ProductSpendDTO[] {
  const grouped = new Map<string, { spend: number; count: number }>();
  for (const item of items) {
    const current = grouped.get(item.normalizedName) ?? { spend: 0, count: 0 };
    current.spend += item.lineTotalMinorUnits;
    current.count += 1;
    grouped.set(item.normalizedName, current);
  }
  return [...grouped.entries()]
    .sort((a, b) => (sortBy === 'spend' ? b[1].spend - a[1].spend : b[1].count - a[1].count))
    .slice(0, TOP_PRODUCTS_LIMIT)
    .map(([normalizedName, { spend, count }]) => ({
      normalizedName,
      totalSpend: toMoney(spend),
      purchaseCount: count,
    }));
}

function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1 ... Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
