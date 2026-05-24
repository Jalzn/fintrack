import { Inject } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type {
  FindItemPriceHistoryFilters,
  FindReceiptFilters,
  GroceryReceipt,
  IGroceryReceiptRepository,
  ItemPriceHistoryEntry,
  PaginatedReceipts,
  ReceiptTotalEntry,
} from '@/grocery-receipts/domain';
import { DRIZZLE_DB } from '@/shared/infrastructure/database/drizzle.tokens';
import {
  itemToRow,
  receiptToRow,
  rowsToDomain,
} from '../mappers/grocery-receipt.persistence-mapper';
import { groceryItems, groceryReceipts } from '../schema';

export class DrizzleGroceryReceiptRepository implements IGroceryReceiptRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: PostgresJsDatabase) {}

  async findById(id: string, userId: string): Promise<GroceryReceipt | null> {
    const receiptRows = await this.db
      .select()
      .from(groceryReceipts)
      .where(and(eq(groceryReceipts.id, id), eq(groceryReceipts.userId, userId)))
      .limit(1);
    const receiptRow = receiptRows[0];
    if (!receiptRow) return null;

    const itemRows = await this.db
      .select()
      .from(groceryItems)
      .where(eq(groceryItems.receiptId, id));

    return rowsToDomain(receiptRow, itemRows);
  }

  async findAll(filters: FindReceiptFilters): Promise<PaginatedReceipts> {
    const where = and(...this.buildReceiptConditions(filters));
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(groceryReceipts)
        .where(where)
        .orderBy(desc(groceryReceipts.purchaseDate), desc(groceryReceipts.id))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ total: count() }).from(groceryReceipts).where(where),
    ]);

    return { data: rows.map((row) => rowsToDomain(row, [])), total: Number(countRow?.total ?? 0) };
  }

  async findItemPriceHistory(
    filters: FindItemPriceHistoryFilters,
  ): Promise<ItemPriceHistoryEntry[]> {
    const rows = await this.db
      .select({
        normalizedName: groceryItems.normalizedName,
        unitPriceMinorUnits: groceryItems.unitPriceMinorUnits,
        lineTotalMinorUnits: groceryItems.lineTotalMinorUnits,
        quantity: groceryItems.quantity,
        department: groceryItems.department,
        currencyCode: groceryItems.currencyCode,
        storeName: groceryReceipts.storeName,
        purchaseDate: groceryReceipts.purchaseDate,
      })
      .from(groceryItems)
      .innerJoin(groceryReceipts, eq(groceryItems.receiptId, groceryReceipts.id))
      .where(and(...this.buildReceiptConditions(filters)))
      .orderBy(asc(groceryItems.normalizedName), asc(groceryReceipts.purchaseDate));

    return rows.map((row) => ({
      normalizedName: row.normalizedName,
      unitPriceMinorUnits: Number(row.unitPriceMinorUnits),
      lineTotalMinorUnits: Number(row.lineTotalMinorUnits),
      quantity: Number(row.quantity),
      department: row.department ?? null,
      currencyCode: row.currencyCode,
      storeName: row.storeName,
      purchaseDate: row.purchaseDate,
    }));
  }

  async findReceiptTotals(filters: FindItemPriceHistoryFilters): Promise<ReceiptTotalEntry[]> {
    const rows = await this.db
      .select({
        totalMinorUnits: groceryReceipts.totalMinorUnits,
        currencyCode: groceryReceipts.currencyCode,
        storeName: groceryReceipts.storeName,
        purchaseDate: groceryReceipts.purchaseDate,
      })
      .from(groceryReceipts)
      .where(and(...this.buildReceiptConditions(filters)))
      .orderBy(asc(groceryReceipts.purchaseDate));

    return rows.map((row) => ({
      totalMinorUnits: Number(row.totalMinorUnits),
      currencyCode: row.currencyCode,
      storeName: row.storeName,
      purchaseDate: row.purchaseDate,
    }));
  }

  async save(receipt: GroceryReceipt): Promise<void> {
    const receiptRow = receiptToRow(receipt);
    const itemRows = receipt.items.map(itemToRow);

    await this.db.transaction(async (tx) => {
      await tx
        .insert(groceryReceipts)
        .values(receiptRow)
        .onConflictDoUpdate({ target: groceryReceipts.id, set: receiptRow });
      await tx.delete(groceryItems).where(eq(groceryItems.receiptId, receipt.id));
      if (itemRows.length > 0) {
        await tx.insert(groceryItems).values(itemRows);
      }
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .delete(groceryReceipts)
      .where(and(eq(groceryReceipts.id, id), eq(groceryReceipts.userId, userId)));
  }

  private buildReceiptConditions(filters: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
  }): SQL[] {
    const conditions: SQL[] = [eq(groceryReceipts.userId, filters.userId)];
    if (filters.startDate !== undefined) {
      conditions.push(gte(groceryReceipts.purchaseDate, filters.startDate));
    }
    if (filters.endDate !== undefined) {
      conditions.push(lte(groceryReceipts.purchaseDate, filters.endDate));
    }
    return conditions;
  }
}
