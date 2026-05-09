import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import { CategoryCreatedEvent, TransactionType } from '@/transactions/domain';
import { InMemoryCategoryRepository } from '@/transactions/infrastructure';
import type { CreateCategoryInput } from '../../schemas';
import { CreateCategoryUseCase } from './create-category.use-case';

const USER_ID = 'user-1';

const validInput = (): CreateCategoryInput => ({
  userId: USER_ID,
  name: 'Food',
  color: '#FF5733',
  type: TransactionType.EXPENSE,
});

describe('CreateCategoryUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let useCase: CreateCategoryUseCase;

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    useCase = new CreateCategoryUseCase({ categoryRepository, idGenerator, eventDispatcher });
  });

  it('returns a DTO with the generated id', async () => {
    const dto = await useCase.execute(validInput());
    expect(dto.id).toBe('id-1');
    expect(dto.name).toBe('Food');
    expect(dto.color).toBe('#FF5733');
    expect(dto.type).toBe(TransactionType.EXPENSE);
  });

  it('persists the category', async () => {
    const dto = await useCase.execute(validInput());
    const stored = await categoryRepository.findById(dto.id, USER_ID);
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe('Food');
  });

  it('dispatches CategoryCreatedEvent', async () => {
    await useCase.execute(validInput());
    expect(eventDispatcher.dispatched).toHaveLength(1);
    expect(eventDispatcher.dispatched[0]).toBeInstanceOf(CategoryCreatedEvent);
  });

  it('clears domain events from the aggregate after dispatch', async () => {
    const dto = await useCase.execute(validInput());
    const stored = await categoryRepository.findById(dto.id, USER_ID);
    expect(stored?.domainEvents).toHaveLength(0);
  });

  it('rejects invalid hex color', async () => {
    await expect(useCase.execute({ ...validInput(), color: 'red' })).rejects.toThrow();
  });

  it('rejects whitespace-only name', async () => {
    await expect(useCase.execute({ ...validInput(), name: '   ' })).rejects.toThrow();
  });
});
