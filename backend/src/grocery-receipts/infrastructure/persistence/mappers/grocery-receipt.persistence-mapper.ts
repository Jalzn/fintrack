import {
  type GroceryDepartment,
  GroceryItem,
  GroceryReceipt,
  type GroceryUnit,
} from '@/grocery-receipts/domain';
import type { CurrencyCode } from '@/shared/domain';
import { currencyByCode, Money } from '@/shared/domain';
import type {
  GroceryItemRow,
  GroceryReceiptRow,
  NewGroceryItemRow,
  NewGroceryReceiptRow,
} from '../schema';

export function rowsToDomain(
  receiptRow: GroceryReceiptRow,
  itemRows: GroceryItemRow[],
): GroceryReceipt {
  const currency = currencyByCode[receiptRow.currencyCode as CurrencyCode];
  const total = Money.fromSnapshot({ amount: Number(receiptRow.totalMinorUnits), currency });

  const items = itemRows.map((row) => {
    const itemCurrency = currencyByCode[row.currencyCode as CurrencyCode];
    return GroceryItem.restore({
      id: row.id,
      receiptId: row.receiptId,
      rawDescription: row.rawDescription,
      normalizedName: row.normalizedName,
      quantity: Number(row.quantity),
      unit: row.unit as GroceryUnit,
      unitPrice: Money.fromSnapshot({
        amount: Number(row.unitPriceMinorUnits),
        currency: itemCurrency,
      }),
      lineTotal: Money.fromSnapshot({
        amount: Number(row.lineTotalMinorUnits),
        currency: itemCurrency,
      }),
      brand: row.brand,
      code: row.code,
      department: row.department as GroceryDepartment | null,
      size: row.size,
    });
  });

  return GroceryReceipt.restore({
    id: receiptRow.id,
    userId: receiptRow.userId,
    storeName: receiptRow.storeName,
    purchaseDate: receiptRow.purchaseDate,
    total,
    transactionId: receiptRow.transactionId,
    createdAt: receiptRow.createdAt,
    items,
  });
}

export function receiptToRow(receipt: GroceryReceipt): NewGroceryReceiptRow {
  const snapshot = receipt.total.toSnapshot();
  return {
    id: receipt.id,
    userId: receipt.userId,
    storeName: receipt.storeName,
    purchaseDate: receipt.purchaseDate,
    totalMinorUnits: String(snapshot.amount),
    currencyCode: snapshot.currency.code,
    transactionId: receipt.transactionId,
    createdAt: receipt.createdAt,
  };
}

export function itemToRow(item: GroceryItem): NewGroceryItemRow {
  const unitPrice = item.unitPrice.toSnapshot();
  const lineTotal = item.lineTotal.toSnapshot();
  return {
    id: item.id,
    receiptId: item.receiptId,
    rawDescription: item.rawDescription,
    normalizedName: item.normalizedName,
    quantity: String(item.quantity),
    unit: item.unit,
    unitPriceMinorUnits: String(unitPrice.amount),
    lineTotalMinorUnits: String(lineTotal.amount),
    currencyCode: unitPrice.currency.code,
    brand: item.brand,
    code: item.code,
    department: item.department,
    size: item.size,
  };
}
