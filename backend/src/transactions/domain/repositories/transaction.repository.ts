import type { Transaction } from '../entities/transaction.entity';
import type { TransactionType } from '../value-objects/transaction-type';

export interface FindTransactionFilters {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  subcategoryId?: string;
  currencyCode?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
}

export interface ITransactionRepository {
  findById(id: string, userId: string): Promise<Transaction | null>;
  findAll(filters: FindTransactionFilters): Promise<PaginatedTransactions>;
  findByCategory(categoryId: string): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
