import { beforeEach, describe, expect, it } from 'vitest';
import {
  type ExtractedReceipt,
  GrocerySettingsNotConfiguredError,
  ReceiptExtractionFailedError,
} from '@/grocery-receipts/application';
import { GrocerySettings } from '@/grocery-receipts/domain';
import {
  FakeReceiptExtractor,
  InMemoryGroceryReceiptRepository,
  InMemoryGrocerySettingsRepository,
} from '@/grocery-receipts/infrastructure';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import { CreateTransactionUseCase } from '@/transactions/application';
import { Category, Subcategory, TransactionType } from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
  InMemoryTransactionRepository,
} from '@/transactions/infrastructure';
import { ImportReceiptFromImageUseCase } from './import-receipt-from-image.use-case';

const USER_ID = 'user-1';
const CATEGORY_ID = 'cat-1';

const makeExtracted = (overrides: Partial<ExtractedReceipt> = {}): ExtractedReceipt => ({
  storeName: 'Mercado X',
  purchaseDate: '2026-05-20',
  currencyCode: 'BRL',
  totalReais: 19.35,
  items: [
    {
      rawDescription: 'ARROZ TIO JOAO 5KG',
      normalizedName: 'arroz',
      quantity: 1,
      unit: 'un',
      unitPriceReais: 19.35,
      lineTotalReais: 19.35,
      brand: 'Tio João',
      code: '7896006711247',
      department: 'mercearia',
      size: '5kg',
    },
  ],
  ...overrides,
});

const validInput = () => ({ userId: USER_ID, imageBase64: 'abc', mimeType: 'image/jpeg' }) as const;

describe('ImportReceiptFromImageUseCase', () => {
  let groceryReceiptRepository: InMemoryGroceryReceiptRepository;
  let grocerySettingsRepository: InMemoryGrocerySettingsRepository;
  let transactionRepository: InMemoryTransactionRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let extractor: FakeReceiptExtractor;
  let useCase: ImportReceiptFromImageUseCase;

  const seedCategory = (): void => {
    const category = Category.create({
      id: CATEGORY_ID,
      userId: USER_ID,
      name: 'Alimentação',
      color: '#1fba7a',
      type: TransactionType.EXPENSE,
    });
    category.clearDomainEvents();
    categoryRepository.seed([category]);
  };

  const seedSettings = (subcategoryId: string | null = null): void => {
    grocerySettingsRepository.seed([
      GrocerySettings.create({ userId: USER_ID, categoryId: CATEGORY_ID, subcategoryId }),
    ]);
  };

  beforeEach(() => {
    groceryReceiptRepository = new InMemoryGroceryReceiptRepository();
    grocerySettingsRepository = new InMemoryGrocerySettingsRepository();
    transactionRepository = new InMemoryTransactionRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();
    extractor = new FakeReceiptExtractor();

    const createTransaction = new CreateTransactionUseCase({
      transactionRepository,
      categoryRepository,
      subcategoryRepository,
      idGenerator,
      eventDispatcher,
    });

    useCase = new ImportReceiptFromImageUseCase({
      groceryReceiptRepository,
      grocerySettingsRepository,
      receiptExtractor: extractor,
      createTransactionUseCase: createTransaction,
      idGenerator,
    });
  });

  it('creates a receipt and one EXPENSE transaction at the configured destination', async () => {
    seedCategory();
    seedSettings();
    extractor.setNext(makeExtracted());

    const dto = await useCase.execute(validInput());

    expect(dto.total.amount).toBe(1935);
    expect(dto.transactionId).not.toBeNull();
    expect(dto.items[0]?.brand).toBe('Tio João');
    expect(dto.items[0]?.code).toBe('7896006711247');
    expect(dto.items[0]?.department).toBe('mercearia');
    expect(dto.items[0]?.size).toBe('5kg');

    const { data } = await transactionRepository.findAll({ userId: USER_ID });
    expect(data).toHaveLength(1);
    expect(data[0]?.categoryId).toBe(CATEGORY_ID);
    expect(data[0]?.type).toBe(TransactionType.EXPENSE);
    expect(data[0]?.amount.toSnapshot().amount).toBe(1935);
  });

  it('uses the configured subcategory', async () => {
    seedCategory();
    const subcategory = Subcategory.create({
      id: 'sub-1',
      userId: USER_ID,
      categoryId: CATEGORY_ID,
      name: 'Supermercado',
    });
    subcategory.clearDomainEvents();
    subcategoryRepository.seed([subcategory]);
    seedSettings('sub-1');
    extractor.setNext(makeExtracted());

    await useCase.execute(validInput());

    const { data } = await transactionRepository.findAll({ userId: USER_ID });
    expect(data[0]?.subcategoryId).toBe('sub-1');
  });

  it('throws and does not call the extractor when settings are not configured', async () => {
    seedCategory();
    extractor.setNext(makeExtracted());

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      GrocerySettingsNotConfiguredError,
    );

    expect(extractor.lastInput).toBeNull();
    expect(groceryReceiptRepository.getStore().size).toBe(0);
    const { total } = await transactionRepository.findAll({ userId: USER_ID });
    expect(total).toBe(0);
  });

  it('throws and persists nothing when the total is unreadable', async () => {
    seedCategory();
    seedSettings();
    extractor.setNext(makeExtracted({ totalReais: null }));

    await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(
      ReceiptExtractionFailedError,
    );

    expect(groceryReceiptRepository.getStore().size).toBe(0);
    const { total } = await transactionRepository.findAll({ userId: USER_ID });
    expect(total).toBe(0);
  });

  it('converts decimal reais to integer minor units without float drift', async () => {
    seedCategory();
    seedSettings();
    extractor.setNext(
      makeExtracted({
        totalReais: 19.35,
        items: [
          {
            rawDescription: 'REFRIG 2L',
            normalizedName: 'refrigerante',
            quantity: 1,
            unit: 'un',
            unitPriceReais: 12.9,
            lineTotalReais: 12.9,
            brand: null,
            code: null,
            department: 'bebidas',
            size: '2L',
          },
        ],
      }),
    );

    const dto = await useCase.execute(validInput());

    expect(dto.total.amount).toBe(1935);
    expect(dto.items[0]?.unitPrice.amount).toBe(1290);
  });
});
