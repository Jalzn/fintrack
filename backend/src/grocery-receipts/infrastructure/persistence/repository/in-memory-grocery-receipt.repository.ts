import type {
  FindItemPriceHistoryFilters,
  FindReceiptFilters,
  GroceryReceipt,
  IGroceryReceiptRepository,
  ItemPriceHistoryEntry,
  PaginatedReceipts,
  ReceiptTotalEntry,
} from '@/grocery-receipts/domain';

export class InMemoryGroceryReceiptRepository implements IGroceryReceiptRepository {
  private readonly store = new Map<string, GroceryReceipt>();

  async findById(id: string, userId: string): Promise<GroceryReceipt | null> {
    const receipt = this.store.get(id);
    return receipt && receipt.userId === userId ? receipt : null;
  }

  async findByTransactionId(transactionId: string, userId: string): Promise<GroceryReceipt | null> {
    return (
      [...this.store.values()].find(
        (receipt) => receipt.transactionId === transactionId && receipt.userId === userId,
      ) ?? null
    );
  }

  async findAll(filters: FindReceiptFilters): Promise<PaginatedReceipts> {
    const results = this.filterByUserAndDate(filters).sort(
      (a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime(),
    );
    const total = results.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;
    return { data: results.slice(offset, offset + limit), total };
  }

  async findItemPriceHistory(
    filters: FindItemPriceHistoryFilters,
  ): Promise<ItemPriceHistoryEntry[]> {
    const entries = this.filterByUserAndDate(filters).flatMap((receipt) =>
      receipt.items.map((item) => ({
        normalizedName: item.normalizedName,
        unitPriceMinorUnits: item.unitPrice.toSnapshot().amount,
        lineTotalMinorUnits: item.lineTotal.toSnapshot().amount,
        quantity: item.quantity,
        department: item.department,
        currencyCode: item.unitPrice.toSnapshot().currency.code,
        storeName: receipt.storeName,
        purchaseDate: receipt.purchaseDate,
      })),
    );
    return entries.sort(
      (a, b) =>
        a.normalizedName.localeCompare(b.normalizedName) ||
        a.purchaseDate.getTime() - b.purchaseDate.getTime(),
    );
  }

  async findReceiptTotals(filters: FindItemPriceHistoryFilters): Promise<ReceiptTotalEntry[]> {
    return this.filterByUserAndDate(filters)
      .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime())
      .map((receipt) => ({
        totalMinorUnits: receipt.total.toSnapshot().amount,
        currencyCode: receipt.total.toSnapshot().currency.code,
        storeName: receipt.storeName,
        purchaseDate: receipt.purchaseDate,
      }));
  }

  async save(receipt: GroceryReceipt): Promise<void> {
    this.store.set(receipt.id, receipt);
  }

  async delete(id: string, userId: string): Promise<void> {
    const receipt = this.store.get(id);
    if (receipt && receipt.userId === userId) this.store.delete(id);
  }

  seed(receipts: GroceryReceipt[]): void {
    for (const receipt of receipts) {
      this.store.set(receipt.id, receipt);
    }
  }

  getStore(): Map<string, GroceryReceipt> {
    return this.store;
  }

  private filterByUserAndDate(filters: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): GroceryReceipt[] {
    let results = [...this.store.values()].filter((receipt) => receipt.userId === filters.userId);
    if (filters.startDate !== undefined) {
      const start = filters.startDate;
      results = results.filter((receipt) => receipt.purchaseDate >= start);
    }
    if (filters.endDate !== undefined) {
      const end = filters.endDate;
      results = results.filter((receipt) => receipt.purchaseDate <= end);
    }
    return results;
  }
}
