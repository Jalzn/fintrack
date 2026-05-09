import type {
  Category,
  ICategoryRepository,
  Transaction,
  TransactionType,
} from '@/transactions/domain';

export class InMemoryCategoryRepository implements ICategoryRepository {
  private readonly store = new Map<string, Category>();
  private transactionStore: Map<string, Transaction> = new Map();

  async findById(id: string, userId: string): Promise<Category | null> {
    const c = this.store.get(id);
    return c && c.userId === userId ? c : null;
  }

  async findAll(userId: string): Promise<Category[]> {
    return [...this.store.values()].filter((c) => c.userId === userId);
  }

  async findByType(userId: string, type: TransactionType): Promise<Category[]> {
    return [...this.store.values()].filter((c) => c.userId === userId && c.type === type);
  }

  async save(category: Category): Promise<void> {
    this.store.set(category.id, category);
  }

  async delete(id: string, userId: string): Promise<void> {
    const c = this.store.get(id);
    if (c && c.userId === userId) this.store.delete(id);
  }

  async deleteIfUnused(id: string, userId: string): Promise<{ transactionCount: number }> {
    const transactionCount = [...this.transactionStore.values()].filter(
      (t) => t.categoryId === id,
    ).length;
    if (transactionCount > 0) return { transactionCount };
    const c = this.store.get(id);
    if (c && c.userId === userId) this.store.delete(id);
    return { transactionCount: 0 };
  }

  seed(categories: Category[]): void {
    for (const c of categories) {
      this.store.set(c.id, c);
    }
  }

  setTransactionStore(store: Map<string, Transaction>): void {
    this.transactionStore = store;
  }
}
