import { index, pgTable, varchar } from 'drizzle-orm/pg-core';
import { groceryReceipts } from './grocery-receipts.schema';

export const groceryItems = pgTable(
  'grocery_items',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    receiptId: varchar('receipt_id', { length: 36 })
      .notNull()
      .references(() => groceryReceipts.id, { onDelete: 'cascade' }),
    rawDescription: varchar('raw_description', { length: 500 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    quantity: varchar('quantity', { length: 20 }).notNull(),
    unit: varchar('unit', { length: 8 }).notNull(),
    unitPriceMinorUnits: varchar('unit_price_minor_units', { length: 20 }).notNull(),
    lineTotalMinorUnits: varchar('line_total_minor_units', { length: 20 }).notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    brand: varchar('brand', { length: 120 }),
    code: varchar('code', { length: 32 }),
    department: varchar('department', { length: 24 }),
    size: varchar('size', { length: 32 }),
  },
  (table) => [
    index('grocery_items_receipt_id_idx').on(table.receiptId),
    index('grocery_items_normalized_name_idx').on(table.normalizedName),
    index('grocery_items_department_idx').on(table.department),
  ],
);

export type GroceryItemRow = typeof groceryItems.$inferSelect;
export type NewGroceryItemRow = typeof groceryItems.$inferInsert;
