import type {
  Budget,
  BudgetCategory,
  BudgetCategoryStatus,
  BudgetSummary,
  BudgetSubcategoryStatus,
} from '@/src/domain/types';
import {
  getExpenseCategoryTotalsForMonth,
  getExpenseSubcategoryTotalsForMonth,
} from '@/src/features/charts/aggregations';
import { unallocatedCategoryLimitCents } from '@/src/features/budgets/allocation';
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

export type BudgetSubcategory = {
  id: string;
  budgetId: string;
  categoryId: string;
  subcategoryId: string;
  limitCents: number;
};

export async function listBudgetSubcategories(
  db: AppDb,
  budgetId: string,
): Promise<BudgetSubcategory[]> {
  const rows = await db.getAllAsync<{
    id: string;
    budget_id: string;
    category_id: string;
    subcategory_id: string;
    limit_cents: number;
  }>(
    `SELECT bs.id, bs.budget_id, s.category_id, bs.subcategory_id, bs.limit_cents
     FROM budget_subcategories bs
     JOIN subcategories s ON s.id = bs.subcategory_id
     WHERE bs.budget_id = ?`,
    [budgetId],
  );
  return rows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    limitCents: row.limit_cents,
  }));
}

export async function upsertBudgetSubcategory(
  db: AppDb,
  budgetId: string,
  subcategoryId: string,
  limitCents: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `
    INSERT INTO budget_subcategories (
      id, budget_id, subcategory_id, limit_cents, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(budget_id, subcategory_id) DO UPDATE SET
      limit_cents = excluded.limit_cents,
      updated_at = excluded.updated_at
    `,
    [newId('bsc'), budgetId, subcategoryId, limitCents, now, now],
  );
}

export async function deleteBudgetSubcategory(
  db: AppDb,
  budgetId: string,
  subcategoryId: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM budget_subcategories WHERE budget_id = ? AND subcategory_id = ?',
    [budgetId, subcategoryId],
  );
}

export async function deleteBudgetSubcategoriesForCategory(
  db: AppDb,
  budgetId: string,
  categoryId: string,
): Promise<void> {
  await db.runAsync(
    `DELETE FROM budget_subcategories
     WHERE budget_id = ?
       AND subcategory_id IN (SELECT id FROM subcategories WHERE category_id = ?)`,
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

  if (limits.length === 0 && budget.totalCents == null) return null;

  const spent = await getExpenseCategoryTotalsForMonth(db, period);
  const spentMap = new Map(spent.map((s) => [s.categoryId, s.totalCents]));

  const childLimits = await db.getAllAsync<{
    subcategory_id: string;
    subcategory_name: string;
    category_id: string;
    limit_cents: number;
  }>(
    `
    SELECT
      bs.subcategory_id,
      s.name AS subcategory_name,
      s.category_id,
      bs.limit_cents
    FROM budget_subcategories bs
    JOIN subcategories s ON s.id = bs.subcategory_id
    WHERE bs.budget_id = ?
    `,
    [budget.id],
  );

  const childSpentByCategory = new Map<
    string,
    Map<string, number>
  >();
  await Promise.all(
    limits.map(async (limit) => {
      const rows = await getExpenseSubcategoryTotalsForMonth(db, period, limit.category_id);
      childSpentByCategory.set(
        limit.category_id,
        new Map(
          rows
            .filter((row) => row.subcategoryId)
            .map((row) => [row.subcategoryId as string, row.totalCents]),
        ),
      );
    }),
  );

  const categories: BudgetCategoryStatus[] = limits.map((limit) => {
    const children: BudgetSubcategoryStatus[] = childLimits
      .filter((child) => child.category_id === limit.category_id)
      .map((child) => ({
        subcategoryId: child.subcategory_id,
        subcategoryName: child.subcategory_name,
        limitCents: child.limit_cents,
        spentCents:
          childSpentByCategory.get(limit.category_id)?.get(child.subcategory_id) ?? 0,
      }));
    return {
      categoryId: limit.category_id,
      categoryName: limit.category_name,
      categoryIcon: limit.category_icon,
      limitCents: limit.limit_cents,
      spentCents: spentMap.get(limit.category_id) ?? 0,
      subcategories: children,
      unallocatedLimitCents: unallocatedCategoryLimitCents(
        limit.limit_cents,
        children.map((child) => child.limitCents),
      ),
    };
  });

  const totalLimitCents =
    budget.totalCents ?? categories.reduce((acc, c) => acc + c.limitCents, 0);
  // A total budget covers every expense, including categories without their own limit.
  const totalSpentCents = spent.reduce((acc, category) => acc + category.totalCents, 0);

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
