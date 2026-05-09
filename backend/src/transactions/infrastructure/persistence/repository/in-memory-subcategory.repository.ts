import { SubcategoryNameAlreadyExistsError } from '@/transactions/application';
import type { ISubcategoryRepository, Subcategory, Transaction } from '@/transactions/domain';

export class InMemorySubcategoryRepository implements ISubcategoryRepository {
  private readonly store = new Map<string, Subcategory>();
  private transactionStore: Map<string, Transaction> = new Map();

  async findById(id: string, userId: string): Promise<Subcategory | null> {
    const s = this.store.get(id);
    return s && s.userId === userId ? s : null;
  }

  async findAllByUser(userId: string): Promise<Subcategory[]> {
    return [...this.store.values()].filter((s) => s.userId === userId);
  }

  async findAllByCategory(categoryId: string, userId: string): Promise<Subcategory[]> {
    return [...this.store.values()].filter(
      (s) => s.userId === userId && s.categoryId === categoryId,
    );
  }

  async countByCategory(categoryId: string, userId: string): Promise<number> {
    return [...this.store.values()].filter(
      (s) => s.userId === userId && s.categoryId === categoryId,
    ).length;
  }

  async save(subcategory: Subcategory): Promise<void> {
    const duplicate = [...this.store.values()].find(
      (s) =>
        s.id !== subcategory.id &&
        s.userId === subcategory.userId &&
        s.categoryId === subcategory.categoryId &&
        s.name.toLowerCase() === subcategory.name.toLowerCase(),
    );
    if (duplicate) throw new SubcategoryNameAlreadyExistsError(subcategory.name);
    this.store.set(subcategory.id, subcategory);
  }

  async delete(id: string, userId: string): Promise<void> {
    const s = this.store.get(id);
    if (s && s.userId === userId) this.store.delete(id);
  }

  async deleteIfUnused(id: string, userId: string): Promise<{ transactionCount: number }> {
    const transactionCount = [...this.transactionStore.values()].filter(
      (t) => t.subcategoryId === id,
    ).length;
    if (transactionCount > 0) return { transactionCount };
    const s = this.store.get(id);
    if (s && s.userId === userId) this.store.delete(id);
    return { transactionCount: 0 };
  }

  seed(subcategories: Subcategory[]): void {
    for (const s of subcategories) {
      this.store.set(s.id, s);
    }
  }

  setTransactionStore(store: Map<string, Transaction>): void {
    this.transactionStore = store;
  }
}
