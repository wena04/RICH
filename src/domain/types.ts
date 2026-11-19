export type TransactionType = 'expense' | 'income' | 'balance_adjustment';

export type AccountType = 'cash' | 'bank' | 'credit' | 'stored_value' | 'investment';

export type CategoryKind = 'expense' | 'income' | 'both';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
};

export type Category = {
  id: string;
  name: string;
  icon?: string | null;
  kind: CategoryKind;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  icon?: string | null; // original icon id; null falls back to a name-derived icon
};

/**
 * Original Rich budget model: a budget is a named envelope that expenses are
 * explicitly assigned to (所属预算/计划), not a limit derived from categories.
 * - monthly (月度预算): the amount resets every month; amount changes take effect
 *   from a given month so past months keep the amount that applied then.
 * - special (专项预算): one total amount for a one-off purpose, spent across all time.
 */
export type BudgetEnvelopeKind = 'monthly' | 'special';

export type BudgetEnvelope = {
  id: string;
  kind: BudgetEnvelopeKind;
  name: string;
  icon: string; // emoji
  description: string | null;
  startPeriod: string; // YYYY-MM
  firstPeriodAmountCents: number | null; // monthly only: override for the first month
  isArchived: boolean;
  sortIndex: number;
};

export type BudgetAmountEntry = {
  effectivePeriod: string; // YYYY-MM
  amountCents: number;
};

export type BudgetEnvelopeSummary = {
  envelope: BudgetEnvelope;
  amountCents: number;
  frozenCents: number; // set aside this month by savings plans drawing on this budget
  availableCents: number; // amount - frozen (may be negative if the amount was lowered)
  spentCents: number;
  remainingCents: number; // available - spent (negative = overspent)
};

/**
 * Savings plan (计划): freezes a fixed amount from a monthly budget every month
 * until the target is reached, e.g. 冻结预算「品质生活」¥500/月 toward ¥5000 = 10 deposits.
 */
export type SavingsPlanStatus = 'active' | 'completed' | 'cancelled';

export type SavingsPlan = {
  id: string;
  name: string;
  icon: string; // emoji
  description: string | null;
  sourceEnvelopeId: string;
  targetCents: number;
  monthlyCents: number;
  startPeriod: string; // YYYY-MM, first frozen month
  status: SavingsPlanStatus;
  endedPeriod: string | null; // exclusive: first month no longer frozen after completion/cancel
  isArchived: boolean;
  sortIndex: number;
};

export type SavingsPlanProgress = {
  totalDeposits: number;
  completedDeposits: number; // fully elapsed frozen months
  savedCents: number;
  isFullyFunded: boolean;
};

export type SavingsPlanSummary = {
  plan: SavingsPlan;
  sourceEnvelopeName: string;
  progress: SavingsPlanProgress;
  currentFreezeCents: number;
};

export type BudgetTabSummary = {
  period: string;
  balanceCents: number; // 结余: this month's income minus expenses
  plansSavedCents: number; // 计划清单 total
  envelopes: BudgetEnvelopeSummary[];
  plans: SavingsPlanSummary[];
  archivedCount: number; // archived budgets + plans
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
  /** 所属预算 (expenses only). Read-only here; set via assignTransactionToEnvelope. */
  budgetEnvelopeId?: string | null;
};
