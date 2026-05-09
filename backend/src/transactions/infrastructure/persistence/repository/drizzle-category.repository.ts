import { Inject } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import type { Category, ICategoryRepository, TransactionType } from '@/transactions/domain';
import { categoryRowToDomain, categoryToRow } from '../mappers/category.persistence-mapper';
import { categories, transactions } from '../schema';

export class DrizzleCategoryRepository implements ICategoryRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async findById(id: string, userId: string): Promise<Category | null> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row ? categoryRowToDomain(row) : null;
  }

  async findAll(userId: string): Promise<Category[]> {
    const rows = await this.db.select().from(categories).where(eq(categories.userId, userId));
    return rows.map(categoryRowToDomain);
  }

  async findByType(userId: string, type: TransactionType): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.type, type)));
    return rows.map(categoryRowToDomain);
  }

  async save(category: Category): Promise<void> {
    const row = categoryToRow(category);
    await this.db
      .insert(categories)
      .values(row)
      .onConflictDoUpdate({ target: categories.id, set: row });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  }

  async deleteIfUnused(id: string, userId: string): Promise<{ transactionCount: number }> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ total: count() })
        .from(transactions)
        .where(eq(transactions.categoryId, id));
      const transactionCount = Number(row?.total ?? 0);
      if (transactionCount > 0) return { transactionCount };
      await tx.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
      return { transactionCount: 0 };
    });
  }
}
