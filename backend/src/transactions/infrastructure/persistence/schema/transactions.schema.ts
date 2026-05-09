import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { categories } from './categories.schema';
import { subcategories } from './subcategories.schema';

export const transactions = pgTable(
  'transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    amountMinorUnits: varchar('amount_minor_units', { length: 20 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    type: varchar('type', { length: 16 }).notNull(),
    categoryId: varchar('category_id', { length: 36 })
      .notNull()
      .references(() => categories.id),
    subcategoryId: varchar('subcategory_id', { length: 36 }).references(() => subcategories.id),
    description: varchar('description', { length: 255 }).notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    linkedTransactionId: varchar('linked_transaction_id', { length: 36 }),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_date_idx').on(table.date),
    index('transactions_user_id_date_idx').on(table.userId, table.date),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_subcategory_id_idx').on(table.subcategoryId),
  ],
);

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
