import type { Budget } from '../entities/budget.entity';

export interface IBudgetRepository {
  findById(id: string, userId: string): Promise<Budget | null>;
  findByUserAndPeriod(userId: string, periodStart: Date): Promise<Budget[]>;
  /**
   * Returns all budgets potentially affected by a transaction in the given category/subcategory at a given period.
   *
   * The "umbrella" rule: a transaction in (category, subcategory) affects:
   *   - the budget for the category itself (subcategoryId IS NULL), if any
   *   - the budget for the specific subcategory, if any
   *
   * Filtered by currencyCode so multi-currency budgets stay isolated.
   */
  findAffectedByTransaction(args: {
    userId: string;
    categoryId: string;
    subcategoryId: string | null;
    periodStart: Date;
    currencyCode: string;
  }): Promise<Budget[]>;
  countByCategory(categoryId: string): Promise<number>;
  countBySubcategory(subcategoryId: string): Promise<number>;
  save(budget: Budget): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
