import { beforeEach, describe, expect, it } from 'vitest';
import { GrocerySettings } from '@/grocery-receipts/domain';
import { InMemoryGrocerySettingsRepository } from '@/grocery-receipts/infrastructure';
import {
  InvalidCategoryReferenceError,
  InvalidSubcategoryReferenceError,
  SubcategoryCategoryMismatchError,
} from '@/transactions/application';
import { Category, Subcategory, TransactionType } from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
} from '@/transactions/infrastructure';
import { GetGrocerySettingsUseCase } from './get-grocery-settings.use-case';
import { UpdateGrocerySettingsUseCase } from './update-grocery-settings.use-case';

const USER_ID = 'user-1';

describe('GetGrocerySettingsUseCase', () => {
  let repository: InMemoryGrocerySettingsRepository;
  let useCase: GetGrocerySettingsUseCase;

  beforeEach(() => {
    repository = new InMemoryGrocerySettingsRepository();
    useCase = new GetGrocerySettingsUseCase({ grocerySettingsRepository: repository });
  });

  it('returns null when not configured', async () => {
    expect(await useCase.execute({ userId: USER_ID })).toBeNull();
  });

  it('returns the configured destination', async () => {
    repository.seed([
      GrocerySettings.create({ userId: USER_ID, categoryId: 'cat-1', subcategoryId: 'sub-1' }),
    ]);
    expect(await useCase.execute({ userId: USER_ID })).toEqual({
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
    });
  });
});

describe('UpdateGrocerySettingsUseCase', () => {
  let settingsRepository: InMemoryGrocerySettingsRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let useCase: UpdateGrocerySettingsUseCase;

  const seedCategory = (id = 'cat-1'): void => {
    const category = Category.create({
      id,
      userId: USER_ID,
      name: 'Alimentação',
      color: '#1fba7a',
      type: TransactionType.EXPENSE,
    });
    category.clearDomainEvents();
    categoryRepository.seed([category]);
  };

  const seedSubcategory = (id: string, categoryId: string): void => {
    const subcategory = Subcategory.create({
      id,
      userId: USER_ID,
      categoryId,
      name: 'Supermercado',
    });
    subcategory.clearDomainEvents();
    subcategoryRepository.seed([subcategory]);
  };

  beforeEach(() => {
    settingsRepository = new InMemoryGrocerySettingsRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    useCase = new UpdateGrocerySettingsUseCase({
      grocerySettingsRepository: settingsRepository,
      categoryRepository,
      subcategoryRepository,
    });
  });

  it('saves a category-only destination', async () => {
    seedCategory();
    const dto = await useCase.execute({ userId: USER_ID, categoryId: 'cat-1' });
    expect(dto).toEqual({ categoryId: 'cat-1', subcategoryId: null });
    expect(await settingsRepository.findByUserId(USER_ID)).not.toBeNull();
  });

  it('saves a category + subcategory destination', async () => {
    seedCategory();
    seedSubcategory('sub-1', 'cat-1');
    const dto = await useCase.execute({
      userId: USER_ID,
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
    });
    expect(dto.subcategoryId).toBe('sub-1');
  });

  it('throws when the category does not exist', async () => {
    await expect(useCase.execute({ userId: USER_ID, categoryId: 'nope' })).rejects.toBeInstanceOf(
      InvalidCategoryReferenceError,
    );
  });

  it('throws when the subcategory does not exist', async () => {
    seedCategory();
    await expect(
      useCase.execute({ userId: USER_ID, categoryId: 'cat-1', subcategoryId: 'nope' }),
    ).rejects.toBeInstanceOf(InvalidSubcategoryReferenceError);
  });

  it('throws when the subcategory belongs to another category', async () => {
    seedCategory();
    seedCategory('cat-2');
    seedSubcategory('sub-2', 'cat-2');
    await expect(
      useCase.execute({ userId: USER_ID, categoryId: 'cat-1', subcategoryId: 'sub-2' }),
    ).rejects.toBeInstanceOf(SubcategoryCategoryMismatchError);
  });
});
