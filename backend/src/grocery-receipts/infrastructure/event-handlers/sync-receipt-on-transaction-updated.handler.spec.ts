import type { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  GroceryUnit,
} from '@/grocery-receipts/domain';
import { InMemoryGroceryReceiptRepository } from '@/grocery-receipts/infrastructure';
import { BRL, Money } from '@/shared/domain';
import { TransactionType, TransactionUpdatedEvent } from '@/transactions/domain';
import { SyncReceiptOnTransactionUpdatedHandler } from './sync-receipt-on-transaction-updated.handler';

const USER_ID = 'user-1';
const fakeLogger = { error: vi.fn(), info: vi.fn() } as unknown as PinoLogger;

function makeReceipt(transactionId: string | null): GroceryReceipt {
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
    storeName: 'Mercado X',
    purchaseDate: new Date('2026-05-20'),
    total: Money.of(1000, BRL),
    items: [item],
  });
  if (transactionId) receipt.linkTransaction(transactionId);
  return receipt;
}

function makeEvent(overrides: { amount?: number; date?: Date } = {}): TransactionUpdatedEvent {
  return new TransactionUpdatedEvent({
    transactionId: 'tx-1',
    userId: USER_ID,
    amount: Money.of(overrides.amount ?? 2500, BRL).toSnapshot(),
    type: TransactionType.EXPENSE,
    categoryId: 'cat-1',
    subcategoryId: null,
    description: 'Mercado - X',
    date: overrides.date ?? new Date('2026-06-01'),
    previous: {
      amount: Money.of(1000, BRL).toSnapshot(),
      categoryId: 'cat-1',
      subcategoryId: null,
      date: new Date('2026-05-20'),
    },
  });
}

describe('SyncReceiptOnTransactionUpdatedHandler', () => {
  let repo: InMemoryGroceryReceiptRepository;
  let handler: SyncReceiptOnTransactionUpdatedHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new InMemoryGroceryReceiptRepository();
    handler = new SyncReceiptOnTransactionUpdatedHandler(repo, fakeLogger);
  });

  it('mirrors date and amount onto the linked receipt', async () => {
    repo.seed([makeReceipt('tx-1')]);

    await handler.onUpdated(makeEvent({ amount: 2500, date: new Date('2026-06-01') }));

    const updated = await repo.findById('rec-1', USER_ID);
    expect(updated?.total.toSnapshot().amount).toBe(2500);
    expect(updated?.purchaseDate.toISOString()).toBe(new Date('2026-06-01').toISOString());
  });

  it('no-ops when no receipt is linked to the transaction', async () => {
    repo.seed([makeReceipt(null)]);
    const saveSpy = vi.spyOn(repo, 'save');

    await handler.onUpdated(makeEvent());

    expect(saveSpy).not.toHaveBeenCalled();
    const untouched = await repo.findById('rec-1', USER_ID);
    expect(untouched?.total.toSnapshot().amount).toBe(1000);
  });

  it('no-ops when date and amount already match (breaks the sync echo)', async () => {
    repo.seed([makeReceipt('tx-1')]);
    const saveSpy = vi.spyOn(repo, 'save');

    await handler.onUpdated(makeEvent({ amount: 1000, date: new Date('2026-05-20') }));

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
