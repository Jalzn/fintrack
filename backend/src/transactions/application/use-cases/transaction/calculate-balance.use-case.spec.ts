import { beforeEach, describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { BalanceCalculationService, Transaction, TransactionType } from '@/transactions/domain';
import { InMemoryTransactionRepository } from '@/transactions/infrastructure';
import { CalculateBalanceUseCase } from './calculate-balance.use-case';

const USER_ID = 'user-1';

const makeTransaction = (
  id: string,
  type: TransactionType,
  amountMinorUnits: number,
  date: Date,
) => {
  const t = Transaction.create({
    id,
    userId: USER_ID,
    amount: Money.of(amountMinorUnits, USD),
    type,
    categoryId: 'cat-1',
    description: 'Test',
    date,
  });
  t.clearDomainEvents();
  return t;
};

describe('CalculateBalanceUseCase', () => {
  let transactionRepository: InMemoryTransactionRepository;
  let useCase: CalculateBalanceUseCase;

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository();
    useCase = new CalculateBalanceUseCase({
      transactionRepository,
      balanceService: new BalanceCalculationService(),
    });
  });

  it('returns balance as income minus expenses', async () => {
    transactionRepository.seed([
      makeTransaction('txn-1', TransactionType.INCOME, 10000, new Date('2024-01-05')),
      makeTransaction('txn-2', TransactionType.EXPENSE, 3000, new Date('2024-01-10')),
    ]);

    const dto = await useCase.execute({
      userId: USER_ID,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      currencyCode: 'USD',
    });

    expect(dto.balance.amount).toBe(7000);
    expect(dto.balance.currency.code).toBe('USD');
    expect(dto.income.amount).toBe(10000);
    expect(dto.expense.amount).toBe(3000);
  });

  it('returns zero balance for empty date range', async () => {
    const dto = await useCase.execute({
      userId: USER_ID,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      currencyCode: 'USD',
    });
    expect(dto.balance.amount).toBe(0);
    expect(dto.income.amount).toBe(0);
    expect(dto.expense.amount).toBe(0);
  });

  it('excludes transactions outside the date range', async () => {
    transactionRepository.seed([
      makeTransaction('txn-1', TransactionType.INCOME, 10000, new Date('2023-12-31')),
      makeTransaction('txn-2', TransactionType.INCOME, 5000, new Date('2024-01-05')),
    ]);

    const dto = await useCase.execute({
      userId: USER_ID,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      currencyCode: 'USD',
    });

    expect(dto.balance.amount).toBe(5000);
  });

  it('rejects invalid date range', async () => {
    await expect(
      useCase.execute({
        userId: USER_ID,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-01-01'),
        currencyCode: 'USD',
      }),
    ).rejects.toThrow();
  });
});
