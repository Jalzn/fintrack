import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  GroceryReceiptNotFoundError,
  GroceryUnit,
} from '@/grocery-receipts/domain';
import { InMemoryGroceryReceiptRepository } from '@/grocery-receipts/infrastructure';
import { BRL, Money } from '@/shared/domain';
import type { DeleteTransactionUseCase } from '@/transactions/application';
import { TransactionNotFoundError } from '@/transactions/domain';
import { AnalyzePricesUseCase } from './analyze-prices.use-case';
import { DeleteReceiptUseCase } from './delete-receipt.use-case';
import { GetGrocerySummaryUseCase } from './get-grocery-summary.use-case';
import { GetReceiptByIdUseCase } from './get-receipt-by-id.use-case';
import { ListReceiptsUseCase } from './list-receipts.use-case';

const USER_ID = 'user-1';

interface ItemSeed {
  name: string;
  unitPrice: number;
  quantity?: number;
  department?: GroceryDepartment;
}

const makeReceipt = (params: {
  id: string;
  storeName: string;
  purchaseDate: Date;
  transactionId?: string;
  items: ItemSeed[];
}): GroceryReceipt => {
  const items = params.items.map((item, index) => {
    const quantity = item.quantity ?? 1;
    return GroceryItem.create({
      id: `${params.id}-item-${index}`,
      receiptId: params.id,
      rawDescription: item.name.toUpperCase(),
      normalizedName: item.name,
      quantity,
      unit: GroceryUnit.UN,
      unitPrice: Money.of(item.unitPrice, BRL),
      lineTotal: Money.of(item.unitPrice * quantity, BRL),
      department: item.department ?? null,
    });
  });
  const total = params.items.reduce((sum, item) => sum + item.unitPrice * (item.quantity ?? 1), 0);
  const receipt = GroceryReceipt.restore({
    id: params.id,
    userId: USER_ID,
    storeName: params.storeName,
    purchaseDate: params.purchaseDate,
    total: Money.of(total, BRL),
    transactionId: params.transactionId ?? null,
    createdAt: params.purchaseDate,
    items,
  });
  return receipt;
};

describe('ListReceiptsUseCase', () => {
  let repository: InMemoryGroceryReceiptRepository;
  let useCase: ListReceiptsUseCase;

  beforeEach(() => {
    repository = new InMemoryGroceryReceiptRepository();
    useCase = new ListReceiptsUseCase({ groceryReceiptRepository: repository });
    repository.seed([
      makeReceipt({
        id: 'r1',
        storeName: 'A',
        purchaseDate: new Date('2026-05-01'),
        items: [{ name: 'arroz', unitPrice: 1000 }],
      }),
      makeReceipt({
        id: 'r2',
        storeName: 'B',
        purchaseDate: new Date('2026-05-10'),
        items: [{ name: 'feijao', unitPrice: 800 }],
      }),
    ]);
  });

  it('returns a paginated result newest first', async () => {
    const result = await useCase.execute({ userId: USER_ID, page: 1, limit: 20 });
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.data[0]?.id).toBe('r2');
  });
});

describe('GetReceiptByIdUseCase', () => {
  let repository: InMemoryGroceryReceiptRepository;
  let useCase: GetReceiptByIdUseCase;

  beforeEach(() => {
    repository = new InMemoryGroceryReceiptRepository();
    useCase = new GetReceiptByIdUseCase({ groceryReceiptRepository: repository });
    repository.seed([
      makeReceipt({
        id: 'r1',
        storeName: 'A',
        purchaseDate: new Date('2026-05-01'),
        items: [{ name: 'arroz', unitPrice: 1000 }],
      }),
    ]);
  });

  it('returns the receipt with items', async () => {
    const dto = await useCase.execute({ id: 'r1', userId: USER_ID });
    expect(dto.items).toHaveLength(1);
    expect(dto.items[0]?.normalizedName).toBe('arroz');
  });

  it('throws when the receipt does not exist', async () => {
    await expect(useCase.execute({ id: 'missing', userId: USER_ID })).rejects.toBeInstanceOf(
      GroceryReceiptNotFoundError,
    );
  });
});

describe('DeleteReceiptUseCase', () => {
  let repository: InMemoryGroceryReceiptRepository;
  let deleteTransaction: { execute: ReturnType<typeof vi.fn> };
  let useCase: DeleteReceiptUseCase;

  beforeEach(() => {
    repository = new InMemoryGroceryReceiptRepository();
    deleteTransaction = { execute: vi.fn().mockResolvedValue(undefined) };
    useCase = new DeleteReceiptUseCase({
      groceryReceiptRepository: repository,
      deleteTransactionUseCase: deleteTransaction as unknown as DeleteTransactionUseCase,
    });
  });

  it('deletes the receipt and its linked transaction', async () => {
    repository.seed([
      makeReceipt({
        id: 'r1',
        storeName: 'A',
        purchaseDate: new Date('2026-05-01'),
        transactionId: 'tx-1',
        items: [{ name: 'arroz', unitPrice: 1000 }],
      }),
    ]);

    await useCase.execute({ id: 'r1', userId: USER_ID });

    expect(deleteTransaction.execute).toHaveBeenCalledWith({ id: 'tx-1', userId: USER_ID });
    expect(repository.getStore().size).toBe(0);
  });

  it('tolerates an already-removed transaction', async () => {
    deleteTransaction.execute.mockRejectedValueOnce(new TransactionNotFoundError('tx-1'));
    repository.seed([
      makeReceipt({
        id: 'r1',
        storeName: 'A',
        purchaseDate: new Date('2026-05-01'),
        transactionId: 'tx-1',
        items: [{ name: 'arroz', unitPrice: 1000 }],
      }),
    ]);

    await useCase.execute({ id: 'r1', userId: USER_ID });
    expect(repository.getStore().size).toBe(0);
  });

  it('throws when the receipt does not exist', async () => {
    await expect(useCase.execute({ id: 'missing', userId: USER_ID })).rejects.toBeInstanceOf(
      GroceryReceiptNotFoundError,
    );
  });
});

describe('AnalyzePricesUseCase', () => {
  let repository: InMemoryGroceryReceiptRepository;
  let useCase: AnalyzePricesUseCase;

  beforeEach(() => {
    repository = new InMemoryGroceryReceiptRepository();
    useCase = new AnalyzePricesUseCase({ groceryReceiptRepository: repository });
    repository.seed([
      makeReceipt({
        id: 'r1',
        storeName: 'Loja A',
        purchaseDate: new Date('2026-05-01'),
        items: [{ name: 'arroz', unitPrice: 1000 }],
      }),
      makeReceipt({
        id: 'r2',
        storeName: 'Loja B',
        purchaseDate: new Date('2026-05-10'),
        items: [{ name: 'arroz', unitPrice: 1200 }],
      }),
    ]);
  });

  it('aggregates min/max/avg/last price per product', async () => {
    const result = await useCase.execute({ userId: USER_ID });
    expect(result.products).toHaveLength(1);
    const arroz = result.products[0];
    expect(arroz?.normalizedName).toBe('arroz');
    expect(arroz?.count).toBe(2);
    expect(arroz?.minUnitPrice.amount).toBe(1000);
    expect(arroz?.maxUnitPrice.amount).toBe(1200);
    expect(arroz?.avgUnitPrice.amount).toBe(1100);
    expect(arroz?.lastUnitPrice.amount).toBe(1200);
    expect(arroz?.occurrences).toHaveLength(2);
    expect(arroz?.occurrences[0]?.quantity).toBe(1);
  });
});

describe('GetGrocerySummaryUseCase', () => {
  let repository: InMemoryGroceryReceiptRepository;
  let useCase: GetGrocerySummaryUseCase;

  beforeEach(() => {
    repository = new InMemoryGroceryReceiptRepository();
    useCase = new GetGrocerySummaryUseCase({ groceryReceiptRepository: repository });
    repository.seed([
      makeReceipt({
        id: 'r1',
        storeName: 'Loja A',
        purchaseDate: new Date('2026-04-05T12:00:00Z'),
        items: [
          { name: 'arroz', unitPrice: 1000, department: GroceryDepartment.MERCEARIA },
          { name: 'pao', unitPrice: 500, quantity: 2, department: GroceryDepartment.PADARIA },
        ],
      }),
      makeReceipt({
        id: 'r2',
        storeName: 'Loja B',
        purchaseDate: new Date('2026-05-10T12:00:00Z'),
        items: [
          { name: 'arroz', unitPrice: 1200, department: GroceryDepartment.MERCEARIA },
          { name: 'leite', unitPrice: 600 }, // sem departamento -> 'outros'
        ],
      }),
    ]);
  });

  it('buckets spend by month', async () => {
    const result = await useCase.execute({ userId: USER_ID, granularity: 'month' });
    expect(result.currencyCode).toBe('BRL');
    expect(result.spendByPeriod).toEqual([
      { period: '2026-04', spend: expect.objectContaining({ amount: 2000 }) },
      { period: '2026-05', spend: expect.objectContaining({ amount: 1800 }) },
    ]);
  });

  it('buckets spend by ISO week', async () => {
    const result = await useCase.execute({ userId: USER_ID, granularity: 'week' });
    expect(result.spendByPeriod).toHaveLength(2);
    expect(result.spendByPeriod[0]?.period).toMatch(/^2026-W\d{2}$/);
  });

  it('sums spend by store, sorted desc', async () => {
    const result = await useCase.execute({ userId: USER_ID });
    expect(result.byStore).toEqual([
      { storeName: 'Loja A', spend: expect.objectContaining({ amount: 2000 }) },
      { storeName: 'Loja B', spend: expect.objectContaining({ amount: 1800 }) },
    ]);
  });

  it('sums spend by department and maps null to "outros"', async () => {
    const result = await useCase.execute({ userId: USER_ID });
    const byDept = Object.fromEntries(
      result.byDepartment.map((row) => [row.department, row.spend.amount]),
    );
    expect(byDept['mercearia']).toBe(2200);
    expect(byDept['padaria']).toBe(1000);
    expect(byDept['outros']).toBe(600);
  });

  it('ranks products by spend and by frequency', async () => {
    const result = await useCase.execute({ userId: USER_ID });
    expect(result.topProductsBySpend[0]?.normalizedName).toBe('arroz');
    expect(result.topProductsBySpend[0]?.totalSpend.amount).toBe(2200);
    expect(result.topProductsBySpend[0]?.purchaseCount).toBe(2);

    const arrozFreq = result.topProductsByFrequency.find((p) => p.normalizedName === 'arroz');
    expect(arrozFreq?.purchaseCount).toBe(2);
  });
});
