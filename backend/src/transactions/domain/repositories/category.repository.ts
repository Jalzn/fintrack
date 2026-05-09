import type { Category } from '../entities/category.entity';
import type { TransactionType } from '../value-objects/transaction-type';

export interface ICategoryRepository {
  findById(id: string, userId: string): Promise<Category | null>;
  findAll(userId: string): Promise<Category[]>;
  findByType(userId: string, type: TransactionType): Promise<Category[]>;
  save(category: Category): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  /** Deletes atomically only if no transactions reference the category. Returns count of blocking transactions. */
  deleteIfUnused(id: string, userId: string): Promise<{ transactionCount: number }>;
}
