import { beforeEach, describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { Transaction, TransactionNotFoundError, TransactionType } from '@/transactions/domain';
import { InMemoryTransactionRepository } from '@/transactions/infrastructure';
import { GetTransactionByIdUseCase } from './get-transaction-by-id.use-case';

const USER_ID = 'user-1';

const makeTransaction = (id = 'txn-1') => {
  const t = Transaction.create({
    id,
    userId: USER_ID,
    amount: Money.of(2500, USD),
    type: TransactionType.INCOME,
    categoryId: 'cat-1',
    description: 'Salary',
    date: new Date('2024-01-01'),
  });
  t.clearDomainEvents();
  return t;
};

describe('GetTransactionByIdUseCase', () => {
  let transactionRepository: InMemoryTransactionRepository;
  let useCase: GetTransactionByIdUseCase;

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository();
    useCase = new GetTransactionByIdUseCase({ transactionRepository });
  });

  it('returns a DTO for an existing transaction', async () => {
    transactionRepository.seed([makeTransaction()]);
    const dto = await useCase.execute({ id: 'txn-1', userId: USER_ID });
    expect(dto.id).toBe('txn-1');
    expect(dto.amount.amount).toBe(2500);
    expect(dto.type).toBe(TransactionType.INCOME);
  });

  it('throws TransactionNotFoundError when not found', async () => {
    await expect(useCase.execute({ id: 'ghost', userId: USER_ID })).rejects.toThrow(
      TransactionNotFoundError,
    );
  });

  it('throws TransactionNotFoundError when userId does not match', async () => {
    transactionRepository.seed([makeTransaction()]);
    await expect(useCase.execute({ id: 'txn-1', userId: 'other-user' })).rejects.toThrow(
      TransactionNotFoundError,
    );
  });
});
