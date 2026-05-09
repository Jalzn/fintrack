import type {
  FindTransactionFilters,
  ITransactionRepository,
  PaginatedTransactions,
  Transaction,
} from '@/transactions/domain';

export class InMemoryTransactionRepository implements ITransactionRepository {
  private readonly store = new Map<string, Transaction>();

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const t = this.store.get(id);
    return t && t.userId === userId ? t : null;
  }

  async findAll(filters: FindTransactionFilters): Promise<PaginatedTransactions> {
    let results = [...this.store.values()].filter((t) => t.userId === filters.userId);

    if (filters.type !== undefined) results = results.filter((t) => t.type === filters.type);
    if (filters.categoryId !== undefined)
      results = results.filter((t) => t.categoryId === filters.categoryId);
    if (filters.subcategoryId !== undefined)
      results = results.filter((t) => t.subcategoryId === filters.subcategoryId);
    if (filters.currencyCode !== undefined) {
      const code = filters.currencyCode;
      results = results.filter((t) => t.amount.toSnapshot().currency.code === code);
    }
    if (filters.startDate !== undefined) {
      const start = filters.startDate;
      results = results.filter((t) => t.date >= start);
    }
    if (filters.endDate !== undefined) {
      const end = filters.endDate;
      results = results.filter((t) => t.date <= end);
    }

    const total = results.length;
    if (filters.page === undefined && filters.limit === undefined) {
      return { data: results, total };
    }
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;
    return { data: results.slice(offset, offset + limit), total };
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    return [...this.store.values()].filter((t) => t.categoryId === categoryId);
  }

  async save(transaction: Transaction): Promise<void> {
    this.store.set(transaction.id, transaction);
  }

  async delete(id: string, userId: string): Promise<void> {
    const t = this.store.get(id);
    if (t && t.userId === userId) this.store.delete(id);
  }

  seed(transactions: Transaction[]): void {
    for (const t of transactions) {
      this.store.set(t.id, t);
    }
  }

  getStore(): Map<string, Transaction> {
    return this.store;
  }
}
