export type TransactionType = 'expense' | 'income' | 'balance_adjustment';

export type AccountType = 'cash' | 'bank' | 'credit' | 'stored_value' | 'investment';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
};

export type Category = {
  id: string;
  name: string;
  icon?: string | null;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: string; // YYYY-MM-DD
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  note: string | null;
};

export type Budget = {
  id: string;
  period: string; // YYYY-MM
  totalCents: number | null;
};

export type BudgetCategory = {
  id: string;
  budgetId: string;
  categoryId: string;
  limitCents: number;
};

export type BudgetCategoryStatus = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  limitCents: number;
  spentCents: number;
};

export type BudgetSummary = {
  budget: Budget;
  totalLimitCents: number;
  totalSpentCents: number;
  categories: BudgetCategoryStatus[];
};

