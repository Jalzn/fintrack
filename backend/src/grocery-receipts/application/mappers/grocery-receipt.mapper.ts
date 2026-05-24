import type { GroceryItem, GroceryReceipt } from '@/grocery-receipts/domain';
import type { GroceryItemDTO, GroceryReceiptDTO } from '../dtos';

export function toGroceryItemDTO(item: GroceryItem): GroceryItemDTO {
  return {
    id: item.id,
    rawDescription: item.rawDescription,
    normalizedName: item.normalizedName,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice.toSnapshot(),
    lineTotal: item.lineTotal.toSnapshot(),
    brand: item.brand,
    code: item.code,
    department: item.department,
    size: item.size,
  };
}

export function toGroceryReceiptDTO(receipt: GroceryReceipt): GroceryReceiptDTO {
  return {
    id: receipt.id,
    storeName: receipt.storeName,
    purchaseDate: receipt.purchaseDate,
    total: receipt.total.toSnapshot(),
    transactionId: receipt.transactionId,
    createdAt: receipt.createdAt,
    items: receipt.items.map(toGroceryItemDTO),
  };
}
