import { Inject } from '@nestjs/common';
import type { SQL } from 'drizzle-orm';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import type {
  FindTransactionFilters,
  ITransactionRepository,
  PaginatedTransactions,
  Transaction,
} from '@/transactions/domain';
import {
  transactionRowToDomain,
  transactionToRow,
} from '../mappers/transaction.persistence-mapper';
import { transactions } from '../schema';

export class DrizzleTransactionRepository implements ITransactionRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  private buildConditions(filters: FindTransactionFilters): SQL[] {
    const conditions: SQL[] = [eq(transactions.userId, filters.userId)];
    if (filters.type !== undefined) conditions.push(eq(transactions.type, filters.type));
    if (filters.categoryId !== undefined)
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    if (filters.subcategoryId !== undefined)
      conditions.push(eq(transactions.subcategoryId, filters.subcategoryId));
    if (filters.currencyCode !== undefined)
      conditions.push(eq(transactions.currencyCode, filters.currencyCode));
    if (filters.startDate !== undefined) conditions.push(gte(transactions.date, filters.startDate));
    if (filters.endDate !== undefined) conditions.push(lte(transactions.date, filters.endDate));
    return conditions;
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row ? transactionRowToDomain(row) : null;
  }

  async findAll(filters: FindTransactionFilters): Promise<PaginatedTransactions> {
    const where = and(...this.buildConditions(filters));
    const paginated = filters.page !== undefined || filters.limit !== undefined;

    const baseQuery = this.db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.date), desc(transactions.id))
      .$dynamic();

    const dataQuery = paginated
      ? (() => {
          const page = filters.page ?? 1;
          const limit = filters.limit ?? 20;
          return baseQuery.limit(limit).offset((page - 1) * limit);
        })()
      : baseQuery;

    const [rows, [countRow]] = await Promise.all([
      dataQuery,
      this.db.select({ total: count() }).from(transactions).where(where),
    ]);

    return {
      data: rows.map(transactionRowToDomain),
      total: Number(countRow?.total ?? 0),
    };
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));
    return rows.map(transactionRowToDomain);
  }

  async save(transaction: Transaction): Promise<void> {
    const row = transactionToRow(transaction);
    await this.db
      .insert(transactions)
      .values(row)
      .onConflictDoUpdate({ target: transactions.id, set: row });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  }
}
