import { describe, expect, it } from 'vitest';
import {
  GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  GroceryUnit,
  InvalidGroceryReceiptError,
} from '@/grocery-receipts/domain';
import { BRL, Money } from '@/shared/domain';

const USER_ID = 'user-1';

const makeItem = (overrides: Partial<Parameters<typeof GroceryItem.create>[0]> = {}): GroceryItem =>
  GroceryItem.create({
    id: 'item-1',
    receiptId: 'receipt-1',
    rawDescription: 'LEITE INTEGRAL 1L',
    normalizedName: 'leite integral',
    quantity: 2,
    unit: GroceryUnit.UN,
    unitPrice: Money.of(459, BRL),
    lineTotal: Money.of(918, BRL),
    ...overrides,
  });

const makeReceiptProps = (): Parameters<typeof GroceryReceipt.create>[0] => ({
  id: 'receipt-1',
  userId: USER_ID,
  storeName: 'Supermercado Teste',
  purchaseDate: new Date('2026-05-20'),
  total: Money.of(918, BRL),
  items: [makeItem()],
});

describe('GroceryReceipt', () => {
  it('creates with transactionId null and a createdAt', () => {
    const receipt = GroceryReceipt.create(makeReceiptProps());
    expect(receipt.transactionId).toBeNull();
    expect(receipt.createdAt).toBeInstanceOf(Date);
    expect(receipt.items).toHaveLength(1);
  });

  it('rejects empty storeName', () => {
    expect(() => GroceryReceipt.create({ ...makeReceiptProps(), storeName: '  ' })).toThrow(
      InvalidGroceryReceiptError,
    );
  });

  it('rejects a non-positive total', () => {
    expect(() => GroceryReceipt.create({ ...makeReceiptProps(), total: Money.of(0, BRL) })).toThrow(
      InvalidGroceryReceiptError,
    );
  });

  it('links a transaction once and rejects re-link', () => {
    const receipt = GroceryReceipt.create(makeReceiptProps());
    receipt.linkTransaction('tx-1');
    expect(receipt.transactionId).toBe('tx-1');
    expect(() => receipt.linkTransaction('tx-2')).toThrow(InvalidGroceryReceiptError);
  });

  it('restores items without emitting events', () => {
    const receipt = GroceryReceipt.restore({
      ...makeReceiptProps(),
      transactionId: 'tx-1',
      createdAt: new Date('2026-05-20'),
    });
    expect(receipt.transactionId).toBe('tx-1');
    expect(receipt.items[0]?.normalizedName).toBe('leite integral');
  });
});

describe('GroceryItem', () => {
  it('rejects zero quantity', () => {
    expect(() => makeItem({ quantity: 0 })).toThrow(InvalidGroceryReceiptError);
  });

  it('rejects an empty normalizedName', () => {
    expect(() => makeItem({ normalizedName: '' })).toThrow(InvalidGroceryReceiptError);
  });

  it('accepts a valid department and exposes enrichment fields', () => {
    const item = makeItem({
      brand: 'Italac',
      code: '7898080640018',
      department: GroceryDepartment.LATICINIOS,
      size: '1L',
    });
    expect(item.department).toBe(GroceryDepartment.LATICINIOS);
    expect(item.brand).toBe('Italac');
    expect(item.code).toBe('7898080640018');
    expect(item.size).toBe('1L');
  });

  it('defaults enrichment fields to null when omitted', () => {
    const item = makeItem();
    expect(item.brand).toBeNull();
    expect(item.code).toBeNull();
    expect(item.department).toBeNull();
    expect(item.size).toBeNull();
  });

  it('rejects an invalid department', () => {
    expect(() => makeItem({ department: 'inexistente' as GroceryDepartment })).toThrow(
      InvalidGroceryReceiptError,
    );
  });
});
