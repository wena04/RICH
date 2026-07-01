import type {
  Budget,
  BudgetCategory,
  BudgetCategoryStatus,
  BudgetSummary,
} from '@/src/domain/types';
import { getExpenseCategoryTotalsForMonth } from '@/src/features/charts/aggregations';
import { newId } from '@/src/utils/id';

import type { AppDb } from '../db';

export async function getBudgetForPeriod(db: AppDb, period: string): Promise<Budget | null> {
  const row = await db.getFirstAsync<{
    id: string;
    period: string;
    total_cents: number | null;
  }>('SELECT id, period, total_cents FROM budgets WHERE period = ?', [period]);
  if (!row) return null;
  return { id: row.id, period: row.period, totalCents: row.total_cents };
}

export async function ensureBudgetForPeriod(db: AppDb, period: string): Promise<Budget> {
  const existing = await getBudgetForPeriod(db, period);
  if (existing) return existing;
  const now = new Date().toISOString();
  const id = newId('budget');
  await db.runAsync(
    'INSERT INTO budgets (id, period, total_cents, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)',
    [id, period, now, now],
  );
  return { id, period, totalCents: null };
}

export async function setBudgetTotal(
  db: AppDb,
  budgetId: string,
  totalCents: number | null,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE budgets SET total_cents = ?, updated_at = ? WHERE id = ?', [
    totalCents,
    now,
    budgetId,
  ]);
}

export async function listBudgetCategories(db: AppDb, budgetId: string): Promise<BudgetCategory[]> {
  const rows = await db.getAllAsync<{
    id: string;
    budget_id: string;
    category_id: string;
    limit_cents: number;
  }>(
    'SELECT id, budget_id, category_id, limit_cents FROM budget_categories WHERE budget_id = ?',
    [budgetId],
  );
  return rows.map((r) => ({
    id: r.id,
    budgetId: r.budget_id,
    categoryId: r.category_id,
    limitCents: r.limit_cents,
  }));
}

export async function upsertBudgetCategory(
  db: AppDb,
  budgetId: string,
  categoryId: string,
  limitCents: number,
): Promise<void> {
  const now = new Date().toISOString();
  const id = newId('bc');
  await db.runAsync(
    `
    INSERT INTO budget_categories (id, budget_id, category_id, limit_cents, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(budget_id, category_id) DO UPDATE SET
      limit_cents = excluded.limit_cents,
      updated_at = excluded.updated_at
    `,
    [id, budgetId, categoryId, limitCents, now, now],
  );
}

export async function deleteBudgetCategory(
  db: AppDb,
  budgetId: string,
  categoryId: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM budget_categories WHERE budget_id = ? AND category_id = ?',
    [budgetId, categoryId],
  );
}

export async function getBudgetSummary(db: AppDb, period: string): Promise<BudgetSummary | null> {
  const budget = await getBudgetForPeriod(db, period);
  if (!budget) return null;

  const limits = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_icon: string | null;
    limit_cents: number;
  }>(
    `
    SELECT bc.category_id, c.name AS category_name, c.icon AS category_icon, bc.limit_cents
    FROM budget_categories bc
    JOIN categories c ON c.id = bc.category_id
    WHERE bc.budget_id = ?
  `,
    [budget.id],
  );

  if (limits.length === 0) return null;

  const spent = await getExpenseCategoryTotalsForMonth(db, period);
  const spentMap = new Map(spent.map((s) => [s.categoryId, s.totalCents]));

  const categories: BudgetCategoryStatus[] = limits.map((l) => ({
    categoryId: l.category_id,
    categoryName: l.category_name,
    categoryIcon: l.category_icon,
    limitCents: l.limit_cents,
    spentCents: spentMap.get(l.category_id) ?? 0,
  }));

  const totalLimitCents =
    budget.totalCents ?? categories.reduce((acc, c) => acc + c.limitCents, 0);
  const totalSpentCents = categories.reduce((acc, c) => acc + c.spentCents, 0);

  return { budget, totalLimitCents, totalSpentCents, categories };
}

export async function getCategoryBudgetStatus(
  db: AppDb,
  period: string,
  categoryId: string,
): Promise<{ limitCents: number; spentCents: number } | null> {
  const summary = await getBudgetSummary(db, period);
  if (!summary) return null;
  const cat = summary.categories.find((c) => c.categoryId === categoryId);
  if (!cat) return null;
  return { limitCents: cat.limitCents, spentCents: cat.spentCents };
}
