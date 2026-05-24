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

export interface BudgetScope {
  categoryId: string;
  subcategoryId: string | null;
}

export interface Budget {
  id: string;
  name: string;
  color: string;
  scopes: BudgetScope[];
  periodStart: string;
  planned: MoneySnapshot;
  spent: MoneySnapshot;
  remaining: MoneySnapshot;
  percentSpent: number;
  createdAt: string;
  updatedAt: string;
}

export type GroceryUnit = 'un' | 'kg' | 'L';

export type GroceryDepartment =
  | 'padaria'
  | 'hortifruti'
  | 'laticinios'
  | 'carnes'
  | 'aves-peixes'
  | 'bebidas'
  | 'mercearia'
  | 'limpeza'
  | 'higiene'
  | 'congelados'
  | 'doces-snacks'
  | 'pet'
  | 'outros';

export interface GroceryItem {
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

export interface GroceryReceipt {
  id: string;
  storeName: string;
  purchaseDate: string;
  total: MoneySnapshot;
  transactionId: string | null;
  createdAt: string;
  items: GroceryItem[];
}

export interface PaginatedReceipts {
  data: GroceryReceipt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PriceOccurrence {
  date: string;
  storeName: string;
  unitPrice: MoneySnapshot;
  quantity: number;
}

export interface PriceAnalysisRow {
  normalizedName: string;
  count: number;
  lastUnitPrice: MoneySnapshot;
  minUnitPrice: MoneySnapshot;
  maxUnitPrice: MoneySnapshot;
  avgUnitPrice: MoneySnapshot;
  occurrences: PriceOccurrence[];
}

export interface PriceAnalysis {
  products: PriceAnalysisRow[];
}

export interface GrocerySettings {
  categoryId: string;
  subcategoryId: string | null;
}

export interface PeriodSpend {
  period: string;
  spend: MoneySnapshot;
}

export interface DepartmentSpend {
  department: string;
  spend: MoneySnapshot;
}

export interface StoreSpend {
  storeName: string;
  spend: MoneySnapshot;
}

export interface ProductSpend {
  normalizedName: string;
  totalSpend: MoneySnapshot;
  purchaseCount: number;
}

export interface GrocerySummary {
  spendByPeriod: PeriodSpend[];
  byDepartment: DepartmentSpend[];
  byStore: StoreSpend[];
  topProductsBySpend: ProductSpend[];
  topProductsByFrequency: ProductSpend[];
  currencyCode: string;
}
