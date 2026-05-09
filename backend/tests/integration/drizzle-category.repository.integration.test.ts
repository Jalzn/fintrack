import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CryptoIdGenerator } from '@/shared/infrastructure/id/crypto-id.generator';
import { Category, TransactionType } from '@/transactions/domain';
import { DrizzleCategoryRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-category.repository';
import { categories } from '@/transactions/infrastructure/persistence/schema';

const idGen = new CryptoIdGenerator();
const USER_ID = 'test-user-1';

function makeCategory(overrides?: Partial<{ name: string; type: TransactionType }>) {
  return Category.create({
    id: idGen.generate(),
    userId: USER_ID,
    name: overrides?.name ?? 'Food',
    color: '#FF5733',
    type: overrides?.type ?? TransactionType.EXPENSE,
  });
}

describe('DrizzleCategoryRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let client: ReturnType<typeof postgres>;
  let repo: DrizzleCategoryRepository;

  beforeAll(() => {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL not set by global-setup');
    client = postgres(url, { max: 5 });
    db = drizzle(client);
    repo = new DrizzleCategoryRepository(db);
  });

  afterEach(async () => {
    await db.delete(categories);
  });

  it('saves and retrieves a category by id', async () => {
    const cat = makeCategory();
    await repo.save(cat);

    const found = await repo.findById(cat.id, USER_ID);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(cat.id);
    expect(found?.name).toBe(cat.name);
    expect(found?.color).toBe(cat.color);
    expect(found?.type).toBe(cat.type);
  });

  it('returns null for unknown id', async () => {
    const result = await repo.findById('non-existent-id', USER_ID);
    expect(result).toBeNull();
  });

  it('returns null when userId does not match', async () => {
    const cat = makeCategory();
    await repo.save(cat);
    const result = await repo.findById(cat.id, 'wrong-user');
    expect(result).toBeNull();
  });

  it('findAll returns categories for user only', async () => {
    const c1 = makeCategory({ name: 'Food', type: TransactionType.EXPENSE });
    const c2 = makeCategory({ name: 'Salary', type: TransactionType.INCOME });
    const other = Category.create({
      id: idGen.generate(),
      userId: 'other-user',
      name: 'Other',
      color: '#123456',
      type: TransactionType.EXPENSE,
    });
    await repo.save(c1);
    await repo.save(c2);
    await repo.save(other);

    const all = await repo.findAll(USER_ID);
    expect(all).toHaveLength(2);
  });

  it('findByType filters by type within user scope', async () => {
    const expense = makeCategory({ type: TransactionType.EXPENSE });
    const income = makeCategory({ type: TransactionType.INCOME });
    await repo.save(expense);
    await repo.save(income);

    const expenses = await repo.findByType(USER_ID, TransactionType.EXPENSE);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]?.type).toBe(TransactionType.EXPENSE);
  });

  it('save is idempotent (upsert)', async () => {
    const cat = makeCategory({ name: 'Original' });
    await repo.save(cat);
    await repo.save(cat);
    const all = await repo.findAll(USER_ID);
    expect(all).toHaveLength(1);
  });

  it('deletes a category', async () => {
    const cat = makeCategory();
    await repo.save(cat);
    await repo.delete(cat.id, USER_ID);

    const found = await repo.findById(cat.id, USER_ID);
    expect(found).toBeNull();
  });

  it('does not delete category belonging to another user', async () => {
    const cat = makeCategory();
    await repo.save(cat);
    await repo.delete(cat.id, 'wrong-user');

    const found = await repo.findById(cat.id, USER_ID);
    expect(found).not.toBeNull();
  });
});
