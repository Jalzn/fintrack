import { beforeEach, describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { InMemoryDomainEventDispatcher } from '@/shared/infrastructure';
import {
  Transaction,
  TransactionDeletedEvent,
  TransactionNotFoundError,
  TransactionType,
} from '@/transactions/domain';
import { InMemoryTransactionRepository } from '@/transactions/infrastructure';
import { DeleteTransactionUseCase } from './delete-transaction.use-case';

const USER_ID = 'user-1';

const makeTransaction = (id = 'txn-1') => {
  const t = Transaction.create({
    id,
    userId: USER_ID,
    amount: Money.of(1000, USD),
    type: TransactionType.EXPENSE,
    categoryId: 'cat-1',
    description: 'Test',
    date: new Date('2024-01-01'),
  });
  t.clearDomainEvents();
  return t;
};

describe('DeleteTransactionUseCase', () => {
  let transactionRepository: InMemoryTransactionRepository;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: DeleteTransactionUseCase;

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new DeleteTransactionUseCase({ transactionRepository, eventDispatcher });
  });

  it('deletes the transaction and dispatches TransactionDeletedEvent', async () => {
    transactionRepository.seed([makeTransaction()]);
    await useCase.execute({ id: 'txn-1', userId: USER_ID });
    expect(await transactionRepository.findById('txn-1', USER_ID)).toBeNull();
    const event = eventDispatcher.dispatched[0];
    expect(event).toBeInstanceOf(TransactionDeletedEvent);
    expect((event as TransactionDeletedEvent).payload).toMatchObject({
      transactionId: 'txn-1',
      userId: USER_ID,
      type: TransactionType.EXPENSE,
      categoryId: 'cat-1',
      subcategoryId: null,
    });
  });

  it('throws TransactionNotFoundError when transaction does not exist', async () => {
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
