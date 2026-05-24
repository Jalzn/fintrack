import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Budget } from '@/budgets/domain';
import { DrizzleBudgetRepository } from '@/budgets/infrastructure/persistence/repository/drizzle-budget.repository';
import { budgets } from '@/budgets/infrastructure/persistence/schema';
import { BRL, Money } from '@/shared/domain';
import { CryptoIdGenerator } from '@/shared/infrastructure/id/crypto-id.generator';
import { Category, Subcategory, TransactionType } from '@/transactions/domain';
import { DrizzleCategoryRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-category.repository';
import { DrizzleSubcategoryRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-subcategory.repository';
import { categories, subcategories } from '@/transactions/infrastructure/persistence/schema';

const idGen = new CryptoIdGenerator();
const USER_ID = 'test-user-budget';

function makeBudget(overrides: {
  categoryId: string;
  subcategoryId?: string | null;
  periodStart?: Date;
  planned?: Money;
}): Budget {
  return Budget.create({
    id: idGen.generate(),
    userId: USER_ID,
    categoryId: overrides.categoryId,
    subcategoryId: overrides.subcategoryId ?? null,
    periodStart: overrides.periodStart ?? new Date(Date.UTC(2026, 4, 1)),
    planned: overrides.planned ?? Money.of(50000, BRL),
  });
}

describe('DrizzleBudgetRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let client: ReturnType<typeof postgres>;
  let repo: DrizzleBudgetRepository;
  let categoryRepo: DrizzleCategoryRepository;
  let subcategoryRepo: DrizzleSubcategoryRepository;
  let categoryId: string;
  let subcategoryId: string;

  beforeAll(() => {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL not set by global-setup');
    client = postgres(url, { max: 5 });
    db = drizzle(client);
    repo = new DrizzleBudgetRepository(db);
    categoryRepo = new DrizzleCategoryRepository(db);
    subcategoryRepo = new DrizzleSubcategoryRepository(db);
  });

  beforeEach(async () => {
    categoryId = idGen.generate();
    subcategoryId = idGen.generate();
    await categoryRepo.save(
      Category.create({
        id: categoryId,
        userId: USER_ID,
        name: 'Mercado',
        color: '#00AAFF',
        type: TransactionType.EXPENSE,
      }),
    );
    await subcategoryRepo.save(
      Subcategory.create({
        id: subcategoryId,
        userId: USER_ID,
        categoryId,
        name: 'Carnes',
      }),
    );
  });

  afterEach(async () => {
    await db.delete(budgets);
    await db.delete(subcategories);
    await db.delete(categories);
  });

  it('saves and retrieves a budget by id', async () => {
    const b = makeBudget({ categoryId });
    await repo.save(b);

    const found = await repo.findById(b.id, USER_ID);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(b.id);
    expect(found?.categoryId).toBe(categoryId);
    expect(found?.subcategoryId).toBeNull();
    expect(found?.periodStart.toISOString()).toBe(new Date(Date.UTC(2026, 4, 1)).toISOString());
    expect(found?.planned.toSnapshot().amount).toBe(50000);
    expect(found?.spent.toSnapshot().amount).toBe(0);
  });

  it('returns null when userId does not match', async () => {
    const b = makeBudget({ categoryId });
    await repo.save(b);
    expect(await repo.findById(b.id, 'wrong-user')).toBeNull();
  });

  it('save is idempotent (upsert) and persists spent', async () => {
    const b = makeBudget({ categoryId });
    await repo.save(b);
    b.replaceSpent(Money.of(12300, BRL));
    await repo.save(b);

    const found = await repo.findById(b.id, USER_ID);
    expect(found?.spent.toSnapshot().amount).toBe(12300);
  });

  it('findByUserAndPeriod returns only that month', async () => {
    await repo.save(makeBudget({ categoryId, periodStart: new Date(Date.UTC(2026, 4, 1)) }));
    await repo.save(makeBudget({ categoryId, periodStart: new Date(Date.UTC(2026, 5, 1)) }));
    const may = await repo.findByUserAndPeriod(USER_ID, new Date(Date.UTC(2026, 4, 1)));
    expect(may).toHaveLength(1);
  });

  it('findAffectedByTransaction matches umbrella + subcategory budget when both exist', async () => {
    const catBudget = makeBudget({ categoryId, subcategoryId: null });
    const subBudget = makeBudget({ categoryId, subcategoryId });
    await repo.save(catBudget);
    await repo.save(subBudget);

    const affected = await repo.findAffectedByTransaction({
      userId: USER_ID,
      categoryId,
      subcategoryId,
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      currencyCode: 'BRL',
    });
    const ids = affected.map((b) => b.id).sort();
    expect(ids).toEqual([catBudget.id, subBudget.id].sort());
  });

  it('findAffectedByTransaction with subcategoryId=null returns only category-level budget', async () => {
    const catBudget = makeBudget({ categoryId, subcategoryId: null });
    const subBudget = makeBudget({ categoryId, subcategoryId });
    await repo.save(catBudget);
    await repo.save(subBudget);

    const affected = await repo.findAffectedByTransaction({
      userId: USER_ID,
      categoryId,
      subcategoryId: null,
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      currencyCode: 'BRL',
    });
    expect(affected.map((b) => b.id)).toEqual([catBudget.id]);
  });

  it('findAffectedByTransaction filters by currency', async () => {
    await repo.save(makeBudget({ categoryId, planned: Money.of(50000, BRL) }));
    const affected = await repo.findAffectedByTransaction({
      userId: USER_ID,
      categoryId,
      subcategoryId: null,
      periodStart: new Date(Date.UTC(2026, 4, 1)),
      currencyCode: 'USD',
    });
    expect(affected).toHaveLength(0);
  });

  it('partial unique index forbids duplicate category-level budget for same period', async () => {
    await repo.save(makeBudget({ categoryId, subcategoryId: null }));
    await expect(repo.save(makeBudget({ categoryId, subcategoryId: null }))).rejects.toThrow();
  });

  it('partial unique index forbids duplicate subcategory-level budget for same period', async () => {
    await repo.save(makeBudget({ categoryId, subcategoryId }));
    await expect(repo.save(makeBudget({ categoryId, subcategoryId }))).rejects.toThrow();
  });

  it('allows category-level and subcategory-level budgets coexisting', async () => {
    await repo.save(makeBudget({ categoryId, subcategoryId: null }));
    await repo.save(makeBudget({ categoryId, subcategoryId }));
    const all = await repo.findByUserAndPeriod(USER_ID, new Date(Date.UTC(2026, 4, 1)));
    expect(all).toHaveLength(2);
  });

  it('countByCategory and countBySubcategory return correct counts', async () => {
    await repo.save(makeBudget({ categoryId, subcategoryId: null }));
    await repo.save(makeBudget({ categoryId, subcategoryId }));
    expect(await repo.countByCategory(categoryId)).toBe(2);
    expect(await repo.countBySubcategory(subcategoryId)).toBe(1);
  });

  it('deletes a budget', async () => {
    const b = makeBudget({ categoryId });
    await repo.save(b);
    await repo.delete(b.id, USER_ID);
    expect(await repo.findById(b.id, USER_ID)).toBeNull();
  });
});
