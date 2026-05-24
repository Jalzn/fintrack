import { beforeEach, describe, expect, it } from 'vitest';
import { Money, USD } from '@/shared/domain';
import { InMemoryDomainEventDispatcher } from '@/shared/infrastructure';
import {
  Category,
  Subcategory,
  Transaction,
  TransactionNotFoundError,
  TransactionType,
  TransactionUpdatedEvent,
} from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
  InMemoryTransactionRepository,
} from '@/transactions/infrastructure';
import {
  InvalidCategoryReferenceError,
  InvalidSubcategoryReferenceError,
  SubcategoryCategoryMismatchError,
} from '../../errors';
import { UpdateTransactionUseCase } from './update-transaction.use-case';

const USER_ID = 'user-1';

const makeCategory = (id: string) => {
  const c = Category.create({
    id,
    userId: USER_ID,
    name: id,
    color: '#AABBCC',
    type: TransactionType.EXPENSE,
  });
  c.clearDomainEvents();
  return c;
};

const makeSubcategory = (id: string, categoryId: string, name = id) => {
  const s = Subcategory.create({ id, userId: USER_ID, categoryId, name });
  s.clearDomainEvents();
  return s;
};

const makeTransaction = (
  id = 'txn-1',
  categoryId = 'cat-1',
  subcategoryId: string | null = null,
) => {
  const t = Transaction.create({
    id,
    userId: USER_ID,
    amount: Money.of(1000, USD),
    type: TransactionType.EXPENSE,
    categoryId,
    subcategoryId,
    description: 'Test',
    date: new Date('2024-01-01'),
  });
  t.clearDomainEvents();
  return t;
};

describe('UpdateTransactionUseCase', () => {
  let transactionRepository: InMemoryTransactionRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: UpdateTransactionUseCase;

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new UpdateTransactionUseCase({
      transactionRepository,
      categoryRepository,
      subcategoryRepository,
      eventDispatcher,
    });
    categoryRepository.seed([makeCategory('cat-1'), makeCategory('cat-2')]);
  });

  it('throws TransactionNotFoundError when transaction does not exist', async () => {
    await expect(
      useCase.execute({ id: 'nonexistent', userId: USER_ID, description: 'x' }),
    ).rejects.toThrow(TransactionNotFoundError);
  });

  it('updates description and date', async () => {
    transactionRepository.seed([makeTransaction()]);
    const dto = await useCase.execute({
      id: 'txn-1',
      userId: USER_ID,
      description: 'Updated',
      date: new Date('2024-02-02'),
    });
    expect(dto.description).toBe('Updated');
    expect(dto.date).toEqual(new Date('2024-02-02'));
  });

  it('throws InvalidCategoryReferenceError when new categoryId does not exist', async () => {
    transactionRepository.seed([makeTransaction()]);
    await expect(
      useCase.execute({ id: 'txn-1', userId: USER_ID, categoryId: 'nonexistent' }),
    ).rejects.toThrow(InvalidCategoryReferenceError);
  });

  it('clears subcategoryId when null is sent', async () => {
    subcategoryRepository.seed([makeSubcategory('sub-1', 'cat-1')]);
    transactionRepository.seed([makeTransaction('txn-1', 'cat-1', 'sub-1')]);
    const dto = await useCase.execute({ id: 'txn-1', userId: USER_ID, subcategoryId: null });
    expect(dto.subcategoryId).toBeNull();
  });

  it('throws InvalidSubcategoryReferenceError when subcategoryId does not exist', async () => {
    transactionRepository.seed([makeTransaction()]);
    await expect(
      useCase.execute({ id: 'txn-1', userId: USER_ID, subcategoryId: 'nonexistent' }),
    ).rejects.toThrow(InvalidSubcategoryReferenceError);
  });

  it('throws SubcategoryCategoryMismatchError when subcategory belongs to other category', async () => {
    subcategoryRepository.seed([makeSubcategory('sub-2', 'cat-2')]);
    transactionRepository.seed([makeTransaction('txn-1', 'cat-1')]);
    await expect(
      useCase.execute({ id: 'txn-1', userId: USER_ID, subcategoryId: 'sub-2' }),
    ).rejects.toThrow(SubcategoryCategoryMismatchError);
  });

  it('throws SubcategoryCategoryMismatchError when changing category without clearing subcategory', async () => {
    subcategoryRepository.seed([makeSubcategory('sub-1', 'cat-1')]);
    transactionRepository.seed([makeTransaction('txn-1', 'cat-1', 'sub-1')]);
    await expect(
      useCase.execute({ id: 'txn-1', userId: USER_ID, categoryId: 'cat-2' }),
    ).rejects.toThrow(SubcategoryCategoryMismatchError);
  });

  it('allows changing both categoryId and subcategoryId together when matched', async () => {
    subcategoryRepository.seed([
      makeSubcategory('sub-1', 'cat-1'),
      makeSubcategory('sub-2', 'cat-2'),
    ]);
    transactionRepository.seed([makeTransaction('txn-1', 'cat-1', 'sub-1')]);

    const dto = await useCase.execute({
      id: 'txn-1',
      userId: USER_ID,
      categoryId: 'cat-2',
      subcategoryId: 'sub-2',
    });
    expect(dto.categoryId).toBe('cat-2');
    expect(dto.subcategoryId).toBe('sub-2');
  });

  it('emits TransactionUpdatedEvent carrying previous snapshot', async () => {
    subcategoryRepository.seed([
      makeSubcategory('sub-1', 'cat-1'),
      makeSubcategory('sub-2', 'cat-2'),
    ]);
    transactionRepository.seed([makeTransaction('txn-1', 'cat-1', 'sub-1')]);

    await useCase.execute({
      id: 'txn-1',
      userId: USER_ID,
      categoryId: 'cat-2',
      subcategoryId: 'sub-2',
      date: new Date('2024-03-03'),
    });

    const event = eventDispatcher.dispatched.find((e) => e instanceof TransactionUpdatedEvent) as
      | TransactionUpdatedEvent
      | undefined;
    expect(event).toBeDefined();
    expect(event?.payload.categoryId).toBe('cat-2');
    expect(event?.payload.subcategoryId).toBe('sub-2');
    expect(event?.payload.previous.categoryId).toBe('cat-1');
    expect(event?.payload.previous.subcategoryId).toBe('sub-1');
    expect(event?.payload.previous.date).toEqual(new Date('2024-01-01'));
  });
});
