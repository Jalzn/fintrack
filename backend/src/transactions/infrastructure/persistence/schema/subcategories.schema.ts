import { sql } from 'drizzle-orm';
import { index, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { categories } from './categories.schema';

export const subcategories = pgTable(
  'subcategories',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    categoryId: varchar('category_id', { length: 36 })
      .notNull()
      .references(() => categories.id),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (table) => [
    index('subcategories_user_id_idx').on(table.userId),
    index('subcategories_category_id_idx').on(table.categoryId),
    uniqueIndex('subcategories_user_id_category_id_lower_name_uq').on(
      table.userId,
      table.categoryId,
      sql`lower(${table.name})`,
    ),
  ],
);

export type SubcategoryRow = typeof subcategories.$inferSelect;
export type NewSubcategoryRow = typeof subcategories.$inferInsert;
