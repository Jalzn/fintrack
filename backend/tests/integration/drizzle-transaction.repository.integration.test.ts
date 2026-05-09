import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { currencyByCode, Money } from '@/shared/domain';
import { CryptoIdGenerator } from '@/shared/infrastructure/id/crypto-id.generator';
import { Category, Transaction, TransactionType } from '@/transactions/domain';
import { DrizzleCategoryRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-category.repository';
import { DrizzleTransactionRepository } from '@/transactions/infrastructure/persistence/repository/drizzle-transaction.repository';
import { transactions } from '@/transactions/infrastructure/persistence/schema';

const idGen = new CryptoIdGenerator();
const USD = currencyByCode['USD'];
const USER_ID = 'test-user-1';

function makeCategory(type = TransactionType.EXPENSE): Category {
  return Category.create({
    id: idGen.generate(),
    userId: USER_ID,
    name: 'Groceries',
    color: '#AABBCC',
    type,
  });
}

function makeTransaction(
  categoryId: string,
  overrides?: Partial<{ type: TransactionType; date: Date }>,
): Transaction {
  return Transaction.create({
    id: idGen.generate(),
    userId: USER_ID,
    amount: Money.of(1000, USD),
    type: overrides?.type ?? TransactionType.EXPENSE,
    categoryId,
    description: 'Test transaction',
    date: overrides?.date ?? new Date('2024-06-15'),
  });
}

describe('DrizzleTransactionRepository', () => {
  let db: ReturnType<typeof drizzle>;
  let client: ReturnType<typeof postgres>;
  let txRepo: DrizzleTransactionRepository;
  let catRepo: DrizzleCategoryRepository;
  let seededCategoryId: string;

  beforeAll(async () => {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL not set by global-setup');
    client = postgres(url, { max: 5 });
    db = drizzle(client);
    txRepo = new DrizzleTransactionRepository(db);
    catRepo = new DrizzleCategoryRepository(db);

    const cat = makeCategory();
    await catRepo.save(cat);
    seededCategoryId = cat.id;
  });

  afterEach(async () => {
    await db.delete(transactions);
  });

  it('saves and retrieves a transaction by id', async () => {
    const tx = makeTransaction(seededCategoryId);
    await txRepo.save(tx);

    const found = await txRepo.findById(tx.id, USER_ID);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(tx.id);
    expect(found?.categoryId).toBe(seededCategoryId);
    expect(found?.type).toBe(TransactionType.EXPENSE);
    expect(found?.amount.toSnapshot().amount).toBe(1000);
  });

  it('returns null for unknown id', async () => {
    expect(await txRepo.findById('no-such-id', USER_ID)).toBeNull();
  });

  it('returns null when userId does not match', async () => {
    const tx = makeTransaction(seededCategoryId);
    await txRepo.save(tx);
    expect(await txRepo.findById(tx.id, 'wrong-user')).toBeNull();
  });

  it('findAll returns transactions for user only', async () => {
    await txRepo.save(makeTransaction(seededCategoryId));
    await txRepo.save(makeTransaction(seededCategoryId));

    const result = await txRepo.findAll({ userId: USER_ID });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('findAll filters by type', async () => {
    const incomeCat = makeCategory(TransactionType.INCOME);
    await catRepo.save(incomeCat);

    await txRepo.save(makeTransaction(seededCategoryId, { type: TransactionType.EXPENSE }));
    await txRepo.save(makeTransaction(incomeCat.id, { type: TransactionType.INCOME }));

    const result = await txRepo.findAll({ userId: USER_ID, type: TransactionType.EXPENSE });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.type).toBe(TransactionType.EXPENSE);
  });

  it('findAll filters by date range', async () => {
    await txRepo.save(makeTransaction(seededCategoryId, { date: new Date('2024-01-01') }));
    await txRepo.save(makeTransaction(seededCategoryId, { date: new Date('2024-06-15') }));
    await txRepo.save(makeTransaction(seededCategoryId, { date: new Date('2024-12-31') }));

    const result = await txRepo.findAll({
      userId: USER_ID,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-01'),
    });
    expect(result.data).toHaveLength(1);
  });

  it('findAll returns pagination metadata', async () => {
    await txRepo.save(makeTransaction(seededCategoryId));
    await txRepo.save(makeTransaction(seededCategoryId));
    await txRepo.save(makeTransaction(seededCategoryId));

    const result = await txRepo.findAll({ userId: USER_ID, page: 1, limit: 2 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('findByCategory returns correct transactions', async () => {
    const otherCat = makeCategory();
    await catRepo.save(otherCat);

    await txRepo.save(makeTransaction(seededCategoryId));
    await txRepo.save(makeTransaction(otherCat.id));

    const results = await txRepo.findByCategory(seededCategoryId);
    expect(results).toHaveLength(1);
    expect(results[0]?.categoryId).toBe(seededCategoryId);
  });

  it('save is idempotent (upsert)', async () => {
    const tx = makeTransaction(seededCategoryId);
    await txRepo.save(tx);
    await txRepo.save(tx);

    const result = await txRepo.findAll({ userId: USER_ID });
    expect(result.data).toHaveLength(1);
  });

  it('deletes a transaction', async () => {
    const tx = makeTransaction(seededCategoryId);
    await txRepo.save(tx);
    await txRepo.delete(tx.id, USER_ID);

    expect(await txRepo.findById(tx.id, USER_ID)).toBeNull();
  });

  it('does not delete transaction belonging to another user', async () => {
    const tx = makeTransaction(seededCategoryId);
    await txRepo.save(tx);
    await txRepo.delete(tx.id, 'wrong-user');

    expect(await txRepo.findById(tx.id, USER_ID)).not.toBeNull();
  });

  it('findByCategory returns empty array when no transactions exist', async () => {
    const emptyCat = makeCategory();
    await catRepo.save(emptyCat);

    const results = await txRepo.findByCategory(emptyCat.id);
    expect(results).toHaveLength(0);
  });
});
