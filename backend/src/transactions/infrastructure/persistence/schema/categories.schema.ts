import { index, pgTable, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }).notNull(),
    type: varchar('type', { length: 16 }).notNull(),
  },
  (table) => [
    index('categories_user_id_idx').on(table.userId),
    index('categories_type_idx').on(table.type),
  ],
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
