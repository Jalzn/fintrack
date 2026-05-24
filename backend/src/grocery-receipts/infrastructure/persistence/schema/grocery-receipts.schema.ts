import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const groceryReceipts = pgTable(
  'grocery_receipts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    storeName: varchar('store_name', { length: 255 }).notNull(),
    purchaseDate: timestamp('purchase_date', { withTimezone: true }).notNull(),
    totalMinorUnits: varchar('total_minor_units', { length: 20 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    transactionId: varchar('transaction_id', { length: 36 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('grocery_receipts_user_id_idx').on(table.userId),
    index('grocery_receipts_user_id_purchase_date_idx').on(table.userId, table.purchaseDate),
  ],
);

export type GroceryReceiptRow = typeof groceryReceipts.$inferSelect;
export type NewGroceryReceiptRow = typeof groceryReceipts.$inferInsert;
