import type { Subcategory } from '../entities/subcategory.entity';

export interface ISubcategoryRepository {
  findById(id: string, userId: string): Promise<Subcategory | null>;
  findAllByUser(userId: string): Promise<Subcategory[]>;
  findAllByCategory(categoryId: string, userId: string): Promise<Subcategory[]>;
  countByCategory(categoryId: string, userId: string): Promise<number>;
  save(subcategory: Subcategory): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  /** Deletes atomically only if no transactions reference the subcategory. Returns count of blocking transactions. */
  deleteIfUnused(id: string, userId: string): Promise<{ transactionCount: number }>;
}
