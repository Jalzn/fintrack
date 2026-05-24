import { pgTable, varchar } from 'drizzle-orm/pg-core';

export const grocerySettings = pgTable('grocery_settings', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  categoryId: varchar('category_id', { length: 36 }).notNull(),
  subcategoryId: varchar('subcategory_id', { length: 36 }),
});

export type GrocerySettingsRow = typeof grocerySettings.$inferSelect;
export type NewGrocerySettingsRow = typeof grocerySettings.$inferInsert;
