import type { IGroceryReceiptRepository, ItemPriceHistoryEntry } from '@/grocery-receipts/domain';
import { type CurrencyCode, currencyByCode, Money } from '@/shared/domain';
import type { PriceAnalysisDTO, PriceAnalysisRowDTO } from '../../dtos';
import { type AnalyzePricesInput, AnalyzePricesInputSchema } from '../../schemas';

interface Deps {
  groceryReceiptRepository: IGroceryReceiptRepository;
}

export class AnalyzePricesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: AnalyzePricesInput): Promise<PriceAnalysisDTO> {
    const parsed = AnalyzePricesInputSchema.parse(input);

    const entries = await this.deps.groceryReceiptRepository.findItemPriceHistory({
      userId: parsed.userId,
      ...(parsed.startDate !== undefined && { startDate: parsed.startDate }),
      ...(parsed.endDate !== undefined && { endDate: parsed.endDate }),
    });

    const grouped = new Map<string, ItemPriceHistoryEntry[]>();
    for (const entry of entries) {
      const list = grouped.get(entry.normalizedName) ?? [];
      list.push(entry);
      grouped.set(entry.normalizedName, list);
    }

    const products: PriceAnalysisRowDTO[] = [];
    for (const [normalizedName, list] of grouped) {
      const sorted = [...list].sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());
      const prices = sorted.map((entry) => entry.unitPriceMinorUnits);
      const currency = currencyByCode[(sorted[0]?.currencyCode ?? 'BRL') as CurrencyCode];
      const last = sorted[sorted.length - 1];
      const avg = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);

      products.push({
        normalizedName,
        count: sorted.length,
        lastUnitPrice: Money.of(last?.unitPriceMinorUnits ?? 0, currency).toSnapshot(),
        minUnitPrice: Money.of(Math.min(...prices), currency).toSnapshot(),
        maxUnitPrice: Money.of(Math.max(...prices), currency).toSnapshot(),
        avgUnitPrice: Money.of(avg, currency).toSnapshot(),
        occurrences: sorted.map((entry) => ({
          date: entry.purchaseDate,
          storeName: entry.storeName,
          unitPrice: Money.of(entry.unitPriceMinorUnits, currency).toSnapshot(),
          quantity: entry.quantity,
        })),
      });
    }

    products.sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
    return { products };
  }
}
