import type { GroceryReceipt } from '../entities';

export interface FindReceiptFilters {
  userId: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedReceipts {
  data: GroceryReceipt[];
  total: number;
}

export interface FindItemPriceHistoryFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ItemPriceHistoryEntry {
  normalizedName: string;
  unitPriceMinorUnits: number;
  lineTotalMinorUnits: number;
  quantity: number;
  department: string | null;
  currencyCode: string;
  storeName: string;
  purchaseDate: Date;
}

export interface ReceiptTotalEntry {
  totalMinorUnits: number;
  currencyCode: string;
  storeName: string;
  purchaseDate: Date;
}

export interface IGroceryReceiptRepository {
  findById(id: string, userId: string): Promise<GroceryReceipt | null>;
  findAll(filters: FindReceiptFilters): Promise<PaginatedReceipts>;
  findItemPriceHistory(filters: FindItemPriceHistoryFilters): Promise<ItemPriceHistoryEntry[]>;
  findReceiptTotals(filters: FindItemPriceHistoryFilters): Promise<ReceiptTotalEntry[]>;
  save(receipt: GroceryReceipt): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
