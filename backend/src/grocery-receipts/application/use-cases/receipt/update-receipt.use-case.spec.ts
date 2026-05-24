import { beforeEach, describe, expect, it } from 'vitest';
import {
  GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  GroceryReceiptNotFoundError,
  GroceryUnit,
} from '@/grocery-receipts/domain';
import { InMemoryGroceryReceiptRepository } from '@/grocery-receipts/infrastructure';
import { BRL, Money } from '@/shared/domain';
import { InMemoryDomainEventDispatcher, InMemoryIdGenerator } from '@/shared/infrastructure';
import { CreateTransactionUseCase, UpdateTransactionUseCase } from '@/transactions/application';
import { Category, TransactionType } from '@/transactions/domain';
import {
  InMemoryCategoryRepository,
  InMemorySubcategoryRepository,
  InMemoryTransactionRepository,
} from '@/transactions/infrastructure';
import { UpdateReceiptUseCase } from './update-receipt.use-case';

const USER_ID = 'user-1';
const CATEGORY_ID = 'cat-1';

describe('UpdateReceiptUseCase', () => {
  let groceryReceiptRepository: InMemoryGroceryReceiptRepository;
  let transactionRepository: InMemoryTransactionRepository;
  let categoryRepository: InMemoryCategoryRepository;
  let subcategoryRepository: InMemorySubcategoryRepository;
  let idGenerator: InMemoryIdGenerator;
  let eventDispatcher: InMemoryDomainEventDispatcher;
  let createTransaction: CreateTransactionUseCase;
  let useCase: UpdateReceiptUseCase;

  beforeEach(() => {
    groceryReceiptRepository = new InMemoryGroceryReceiptRepository();
    transactionRepository = new InMemoryTransactionRepository();
    categoryRepository = new InMemoryCategoryRepository();
    subcategoryRepository = new InMemorySubcategoryRepository();
    idGenerator = new InMemoryIdGenerator();
    eventDispatcher = new InMemoryDomainEventDispatcher();

    createTransaction = new CreateTransactionUseCase({
      transactionRepository,
      categoryRepository,
      subcategoryRepository,
      idGenerator,
      eventDispatcher,
    });
    const updateTransaction = new UpdateTransactionUseCase({
      transactionRepository,
      categoryRepository,
      subcategoryRepository,
      eventDispatcher,
    });

    useCase = new UpdateReceiptUseCase({
      groceryReceiptRepository,
      updateTransactionUseCase: updateTransaction,
      idGenerator,
    });
  });

  async function seedLinkedReceipt(): Promise<{ receiptId: string; transactionId: string }> {
    const category = Category.create({
      id: CATEGORY_ID,
      userId: USER_ID,
      name: 'Alimentação',
      color: '#1fba7a',
      type: TransactionType.EXPENSE,
    });
    category.clearDomainEvents();
    categoryRepository.seed([category]);

    const transaction = await createTransaction.execute({
      userId: USER_ID,
      amountMinorUnits: 1000,
      currencyCode: 'BRL',
      type: TransactionType.EXPENSE,
      categoryId: CATEGORY_ID,
      description: 'Mercado - Antigo',
      date: new Date('2026-05-20'),
    });

    const item = GroceryItem.create({
      id: 'item-1',
      receiptId: 'rec-1',
      rawDescription: 'ARROZ',
      normalizedName: 'arroz',
      quantity: 1,
      unit: GroceryUnit.UN,
      unitPrice: Money.of(1000, BRL),
      lineTotal: Money.of(1000, BRL),
      brand: null,
      code: null,
      department: GroceryDepartment.MERCEARIA,
      size: null,
    });
    const receipt = GroceryReceipt.create({
      id: 'rec-1',
      userId: USER_ID,
      storeName: 'Antigo',
      purchaseDate: new Date('2026-05-20'),
      total: Money.of(1000, BRL),
      items: [item],
    });
    receipt.linkTransaction(transaction.id);
    groceryReceiptRepository.seed([receipt]);

    return { receiptId: receipt.id, transactionId: transaction.id };
  }

  it('edits header + items and recomputes each line total from quantity × unit price', async () => {
    const { receiptId } = await seedLinkedReceipt();

    const dto = await useCase.execute({
      id: receiptId,
      userId: USER_ID,
      storeName: 'Novo Mercado',
      purchaseDate: new Date('2026-06-01'),
      totalMinorUnits: 4500,
      items: [
        {
          id: 'item-1',
          normalizedName: 'arroz branco',
          quantity: 2,
          unit: 'kg',
          unitPriceMinorUnits: 1000,
          department: 'mercearia',
        },
        {
          normalizedName: 'feijao',
          quantity: 1,
          unit: 'un',
          unitPriceMinorUnits: 2500,
          department: 'mercearia',
        },
      ],
    });

    expect(dto.storeName).toBe('Novo Mercado');
    expect(dto.total.amount).toBe(4500);
    expect(dto.items).toHaveLength(2);

    const arroz = dto.items.find((item) => item.id === 'item-1');
    expect(arroz?.normalizedName).toBe('arroz branco');
    expect(arroz?.quantity).toBe(2);
    expect(arroz?.lineTotal.amount).toBe(2000);

    const feijao = dto.items.find((item) => item.normalizedName === 'feijao');
    expect(feijao?.id).toBeTruthy();
    expect(feijao?.lineTotal.amount).toBe(2500);
  });

  it('syncs the linked transaction date and amount', async () => {
    const { receiptId, transactionId } = await seedLinkedReceipt();

    await useCase.execute({
      id: receiptId,
      userId: USER_ID,
      storeName: 'Antigo',
      purchaseDate: new Date('2026-06-01'),
      totalMinorUnits: 4500,
      items: [{ normalizedName: 'arroz', quantity: 1, unit: 'un', unitPriceMinorUnits: 4500 }],
    });

    const transaction = await transactionRepository.findById(transactionId, USER_ID);
    expect(transaction?.amount.toSnapshot().amount).toBe(4500);
    expect(transaction?.date.toISOString()).toBe(new Date('2026-06-01').toISOString());
  });

  it('replaces the item list: removed items disappear, new items get an id', async () => {
    const { receiptId } = await seedLinkedReceipt();

    const dto = await useCase.execute({
      id: receiptId,
      userId: USER_ID,
      storeName: 'Antigo',
      purchaseDate: new Date('2026-05-20'),
      totalMinorUnits: 500,
      items: [{ normalizedName: 'leite', quantity: 1, unit: 'un', unitPriceMinorUnits: 500 }],
    });

    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]?.id).not.toBe('item-1');
    expect(dto.items[0]?.normalizedName).toBe('leite');
  });

  it('throws when the receipt does not exist', async () => {
    await expect(
      useCase.execute({
        id: 'missing',
        userId: USER_ID,
        storeName: 'X',
        purchaseDate: new Date('2026-05-20'),
        totalMinorUnits: 100,
        items: [{ normalizedName: 'x', quantity: 1, unit: 'un', unitPriceMinorUnits: 100 }],
      }),
    ).rejects.toBeInstanceOf(GroceryReceiptNotFoundError);
  });
});
