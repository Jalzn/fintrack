import { date, index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { categories } from '@/transactions/infrastructure/persistence/schema/categories.schema';
import { subcategories } from '@/transactions/infrastructure/persistence/schema/subcategories.schema';

export const budgets = pgTable(
  'budgets',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    color: varchar('color', { length: 20 }).notNull(),
    periodStart: date('period_start').notNull(),
    currencyCode: varchar('currency_code', { length: 3 }).notNull(),
    plannedMinorUnits: varchar('planned_minor_units', { length: 20 }).notNull(),
    spentMinorUnits: varchar('spent_minor_units', { length: 20 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('budgets_user_period_idx').on(table.userId, table.periodStart)],
);

export const budgetScopes = pgTable(
  'budget_scopes',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    budgetId: varchar('budget_id', { length: 36 })
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade' }),
    categoryId: varchar('category_id', { length: 36 })
      .notNull()
      .references(() => categories.id),
    subcategoryId: varchar('subcategory_id', { length: 36 }).references(() => subcategories.id),
  },
  (table) => [
    index('budget_scopes_budget_id_idx').on(table.budgetId),
    index('budget_scopes_category_id_idx').on(table.categoryId),
    index('budget_scopes_subcategory_id_idx').on(table.subcategoryId),
  ],
);

export type BudgetRow = typeof budgets.$inferSelect;
export type NewBudgetRow = typeof budgets.$inferInsert;
export type BudgetScopeRow = typeof budgetScopes.$inferSelect;
export type NewBudgetScopeRow = typeof budgetScopes.$inferInsert;
