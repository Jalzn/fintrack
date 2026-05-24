import type { GroceryDepartment, GroceryUnit } from '@/grocery-receipts/domain';
import type { MoneySnapshot } from '@/shared/domain';

export interface GroceryItemDTO {
  id: string;
  rawDescription: string;
  normalizedName: string;
  quantity: number;
  unit: GroceryUnit;
  unitPrice: MoneySnapshot;
  lineTotal: MoneySnapshot;
  brand: string | null;
  code: string | null;
  department: GroceryDepartment | null;
  size: string | null;
}

export interface GroceryReceiptDTO {
  id: string;
  storeName: string;
  purchaseDate: Date;
  total: MoneySnapshot;
  transactionId: string | null;
  createdAt: Date;
  items: GroceryItemDTO[];
}
