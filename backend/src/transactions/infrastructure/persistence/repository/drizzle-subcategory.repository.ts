import { Inject } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import { SubcategoryNameAlreadyExistsError } from '@/transactions/application';
import type { ISubcategoryRepository, Subcategory } from '@/transactions/domain';
import {
  subcategoryRowToDomain,
  subcategoryToRow,
} from '../mappers/subcategory.persistence-mapper';
import { subcategories, transactions } from '../schema';

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

export class DrizzleSubcategoryRepository implements ISubcategoryRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async findById(id: string, userId: string): Promise<Subcategory | null> {
    const rows = await this.db
      .select()
      .from(subcategories)
      .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row ? subcategoryRowToDomain(row) : null;
  }

  async findAllByUser(userId: string): Promise<Subcategory[]> {
    const rows = await this.db.select().from(subcategories).where(eq(subcategories.userId, userId));
    return rows.map(subcategoryRowToDomain);
  }

  async findAllByCategory(categoryId: string, userId: string): Promise<Subcategory[]> {
    const rows = await this.db
      .select()
      .from(subcategories)
      .where(and(eq(subcategories.userId, userId), eq(subcategories.categoryId, categoryId)));
    return rows.map(subcategoryRowToDomain);
  }

  async countByCategory(categoryId: string, userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(subcategories)
      .where(and(eq(subcategories.userId, userId), eq(subcategories.categoryId, categoryId)));
    return Number(row?.total ?? 0);
  }

  async save(subcategory: Subcategory): Promise<void> {
    const row = subcategoryToRow(subcategory);
    try {
      await this.db
        .insert(subcategories)
        .values(row)
        .onConflictDoUpdate({ target: subcategories.id, set: row });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new SubcategoryNameAlreadyExistsError(subcategory.name);
      }
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(subcategories)
      .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)));
  }

  async deleteIfUnused(id: string, userId: string): Promise<{ transactionCount: number }> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ total: count() })
        .from(transactions)
        .where(eq(transactions.subcategoryId, id));
      const transactionCount = Number(row?.total ?? 0);
      if (transactionCount > 0) return { transactionCount };
      await tx
        .delete(subcategories)
        .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId)));
      return { transactionCount: 0 };
    });
  }
}
