import { beforeEach, describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { Transaction, TransactionType } from '@/transactions/domain';
import { InMemoryTransactionRepository } from '@/transactions/infrastructure';
import { ListTransactionsUseCase } from './list-transactions.use-case';

const USER_ID = 'user-1';

const makeTransaction = (id: string, type: TransactionType, categoryId: string, date: Date) => {
  const t = Transaction.create({
    id,
    userId: USER_ID,
    amount: Money.of(1000, USD),
    type,
    categoryId,
    description: 'Test',
    date,
  });
  t.clearDomainEvents();
  return t;
};

describe('ListTransactionsUseCase', () => {
  let transactionRepository: InMemoryTransactionRepository;
  let useCase: ListTransactionsUseCase;

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository();
    useCase = new ListTransactionsUseCase({ transactionRepository });
    transactionRepository.seed([
      makeTransaction('txn-1', TransactionType.EXPENSE, 'cat-1', new Date('2024-01-10')),
      makeTransaction('txn-2', TransactionType.INCOME, 'cat-2', new Date('2024-02-10')),
      makeTransaction('txn-3', TransactionType.EXPENSE, 'cat-1', new Date('2024-03-10')),
    ]);
  });

  it('lists all transactions for user', async () => {
    const result = await useCase.execute({ userId: USER_ID });
    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('filters by type', async () => {
    const result = await useCase.execute({ userId: USER_ID, type: TransactionType.EXPENSE });
    expect(result.data).toHaveLength(2);
  });

  it('filters by categoryId', async () => {
    const result = await useCase.execute({ userId: USER_ID, categoryId: 'cat-2' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.id).toBe('txn-2');
  });

  it('filters by date range', async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-28'),
    });
    expect(result.data).toHaveLength(2);
  });

  it('returns only transactions belonging to the requesting user', async () => {
    const result = await useCase.execute({ userId: 'other-user' });
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('rejects invalid date range', async () => {
    await expect(
      useCase.execute({
        userId: USER_ID,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-01-01'),
      }),
    ).rejects.toThrow();
  });

  it('returns pagination metadata', async () => {
    const result = await useCase.execute({ userId: USER_ID, page: 1, limit: 2 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
  });
});
