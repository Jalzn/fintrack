export interface MoneySnapshot {
  amount: number;
  currency: {
    code: string;
    base: number;
    exponent: number;
  };
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthToken {
  accessToken: string;
  user: User;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export type CurrencyCode = 'BRL' | 'USD';

export interface Category {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: MoneySnapshot;
  type: TransactionType;
  categoryId: string;
  subcategoryId: string | null;
  description: string;
  date: string;
  createdAt: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Balance {
  balance: MoneySnapshot;
  income: MoneySnapshot;
  expense: MoneySnapshot;
  startDate: string;
  endDate: string;
}
