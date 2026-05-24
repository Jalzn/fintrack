import type { Budget, IBudgetRepository } from '@/budgets/domain';

export class InMemoryBudgetRepository implements IBudgetRepository {
  private readonly store = new Map<string, Budget>();

  async findById(id: string, userId: string): Promise<Budget | null> {
    const b = this.store.get(id);
    return b && b.userId === userId ? b : null;
  }

  async findByUserAndPeriod(userId: string, periodStart: Date): Promise<Budget[]> {
    const target = periodStart.getTime();
    return [...this.store.values()].filter(
      (b) => b.userId === userId && b.periodStart.getTime() === target,
    );
  }

  async findAffectedByTransaction(args: {
    userId: string;
    categoryId: string;
    subcategoryId: string | null;
    periodStart: Date;
    currencyCode: string;
  }): Promise<Budget[]> {
    const target = args.periodStart.getTime();
    return [...this.store.values()].filter((b) => {
      if (b.userId !== args.userId) return false;
      if (b.periodStart.getTime() !== target) return false;
      if (b.currencyCode !== args.currencyCode) return false;
      return b.scopes.some((scope) => {
        if (scope.categoryId !== args.categoryId) return false;
        // Whole-category scope covers any subcategory; pair scope only its own.
        return scope.subcategoryId === null || scope.subcategoryId === args.subcategoryId;
      });
    });
  }

  async countByCategory(categoryId: string): Promise<number> {
    return [...this.store.values()].filter((b) => b.scopes.some((s) => s.categoryId === categoryId))
      .length;
  }

  async countBySubcategory(subcategoryId: string): Promise<number> {
    return [...this.store.values()].filter((b) =>
      b.scopes.some((s) => s.subcategoryId === subcategoryId),
    ).length;
  }

  async save(budget: Budget): Promise<void> {
    this.store.set(budget.id, budget);
  }

  async delete(id: string, userId: string): Promise<void> {
    const b = this.store.get(id);
    if (b && b.userId === userId) this.store.delete(id);
  }

  seed(budgets: Budget[]): void {
    for (const b of budgets) {
      this.store.set(b.id, b);
    }
  }
}
