import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import {
  Category,
  Subcategory,
  TransactionCreatedEvent,
  TransactionType,
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
import type { CreateTransactionInput } from '../../schemas';
import { CreateTransactionUseCase } from './create-transaction.use-case';

const USER_ID = 'user-1';

const makeCategory = (id = 'cat-1') => {
  const c = Category.create({
    id,
    userId: USER_ID,
    name: 'Food',
    color: '#AABBCC',
    type: TransactionType.EXPENSE,
  });
  c.clearDomainEvents();
  return c;
};

const makeSubcategory = (id: string, categoryId: string, name = 'Mercado') => {
  const s = Subcategory.create({ id, userId: USER_ID, categoryId, name });
  s.clearDomainEvents();
  return s;
};

const validInput = (): CreateTransactionInput => ({
  userId: USER_ID,
  amountMinorUnits: 5000,
  currencyCode: 'USD',
  type: TransactionType.EXPENSE,
  categoryId: 'cat-1',
  description: 'Groceries',
  date: new Date('2024-01-15'),
});

describe('CreateTransactionUseCase', () => {
  let transactionRepository: InMemoryTransactionRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: CreateTransactionUseCase;

  beforeEach(() => {
    transactionRepository = new InMemoryTransactionRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new CreateTransactionUseCase({
      transactionRepository,
      categoryRepository,
      subcategoryRepository,
      idGenerator,
      eventDispatcher,
    });
    categoryRepository.seed([makeCategory(), makeCategory('cat-2')]);
  });

  it('returns a DTO with the generated id and correct amount snapshot', async () => {
    const dto = await useCase.execute(validInput());
    expect(dto.id).toBe('id-1');
    expect(dto.amount.amount).toBe(5000);
    expect(dto.amount.currency.code).toBe('USD');
    expect(dto.categoryId).toBe('cat-1');
    expect(dto.subcategoryId).toBeNull();
  });

  it('persists the transaction', async () => {
    const dto = await useCase.execute(validInput());
    const stored = await transactionRepository.findById(dto.id, USER_ID);
    expect(stored).not.toBeNull();
  });

  it('dispatches TransactionCreatedEvent', async () => {
    await useCase.execute(validInput());
    expect(eventDispatcher.dispatched).toHaveLength(1);
    expect(eventDispatcher.dispatched[0]).toBeInstanceOf(TransactionCreatedEvent);
  });

  it('clears domain events from the aggregate after dispatch', async () => {
    const dto = await useCase.execute(validInput());
    const stored = await transactionRepository.findById(dto.id, USER_ID);
    expect(stored?.domainEvents).toHaveLength(0);
  });

  it('throws InvalidCategoryReferenceError when category does not exist', async () => {
    await expect(useCase.execute({ ...validInput(), categoryId: 'nonexistent' })).rejects.toThrow(
      InvalidCategoryReferenceError,
    );
  });

  it('rejects zero amount', async () => {
    await expect(useCase.execute({ ...validInput(), amountMinorUnits: 0 })).rejects.toThrow();
  });

  it('rejects negative amount', async () => {
    await expect(useCase.execute({ ...validInput(), amountMinorUnits: -100 })).rejects.toThrow();
  });

  it('persists subcategoryId when provided and matches the category', async () => {
    subcategoryRepository.seed([makeSubcategory('sub-1', 'cat-1')]);
    const dto = await useCase.execute({ ...validInput(), subcategoryId: 'sub-1' });
    expect(dto.subcategoryId).toBe('sub-1');
  });

  it('throws InvalidSubcategoryReferenceError when subcategory does not exist', async () => {
    await expect(
      useCase.execute({ ...validInput(), subcategoryId: 'nonexistent' }),
    ).rejects.toThrow(InvalidSubcategoryReferenceError);
  });

  it('throws SubcategoryCategoryMismatchError when subcategory belongs to other category', async () => {
    subcategoryRepository.seed([makeSubcategory('sub-1', 'cat-2')]);
    await expect(
      useCase.execute({ ...validInput(), categoryId: 'cat-1', subcategoryId: 'sub-1' }),
    ).rejects.toThrow(SubcategoryCategoryMismatchError);
  });

  it('accepts null subcategoryId as no association', async () => {
    const dto = await useCase.execute({ ...validInput(), subcategoryId: null });
    expect(dto.subcategoryId).toBeNull();
  });
});
