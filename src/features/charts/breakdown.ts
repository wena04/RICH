import type { AppDb } from '@/src/db/db';

/** Where to draw a breakdown from. Dates are local `YYYY-MM-DD`; omit both for all time. */
export type BreakdownFilter = {
  type: 'expense' | 'income';
  start?: string;
  endExclusive?: string;
  /** Only records assigned to this budget (所属预算). */
  envelopeId?: string;
};

export type SubcategorySlice = {
  /** `null` collects the records filed under the category itself (未细分). */
  subcategoryId: string | null;
  name: string | null;
  icon: string | null;
  totalCents: number;
  count: number;
  /** Whole-number share of the parent category; the shares of one category add up to 100. */
  percentOfCategory: number;
};

export type CategorySlice = {
  categoryId: string;
  name: string;
  icon: string | null;
  totalCents: number;
  count: number;
  /** Whole-number share of the breakdown total; the shares add up to 100. */
  percent: number;
  subcategories: SubcategorySlice[];
};

export type Breakdown = {
  totalCents: number;
  count: number;
  categories: CategorySlice[];
};

/** One aggregated (category, subcategory) cell, as the SQL below returns it. */
export type BreakdownRow = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  subcategoryIcon: string | null;
  totalCents: number;
  count: number;
};

/**
 * Whole-number percentages that add up to exactly 100 (largest-remainder rounding), so a ranked
 * list never reads 33% + 33% + 33%.
 */
export function wholePercents(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return values.map(() => 0);
  const exact = values.map((value) => (Math.max(0, value) / total) * 100);
  const floors = exact.map(Math.floor);
  let remaining = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    floors[index] += 1;
    remaining -= 1;
  }
  return floors;
}

function byTotalThenName<T extends { totalCents: number; name: string | null }>(a: T, b: T) {
  if (b.totalCents !== a.totalCents) return b.totalCents - a.totalCents;
  // 未细分 (no name) sorts after named subcategories with the same total.
  if (a.name === null) return 1;
  if (b.name === null) return -1;
  return a.name.localeCompare(b.name, 'zh-Hans-CN');
}

/** Groups aggregated rows into ranked categories, each with its ranked subcategories. */
export function buildBreakdown(rows: readonly BreakdownRow[]): Breakdown {
  const categories = new Map<string, Omit<CategorySlice, 'percent'>>();
  for (const row of rows) {
    if (row.totalCents <= 0) continue;
    let category = categories.get(row.categoryId);
    if (!category) {
      category = {
        categoryId: row.categoryId,
        name: row.categoryName,
        icon: row.categoryIcon,
        totalCents: 0,
        count: 0,
        subcategories: [],
      };
      categories.set(row.categoryId, category);
    }
    category.totalCents += row.totalCents;
    category.count += row.count;
    const existing = category.subcategories.find((s) => s.subcategoryId === row.subcategoryId);
    if (existing) {
      existing.totalCents += row.totalCents;
      existing.count += row.count;
    } else {
      category.subcategories.push({
        subcategoryId: row.subcategoryId,
        name: row.subcategoryId ? row.subcategoryName : null,
        icon: row.subcategoryId ? row.subcategoryIcon : null,
        totalCents: row.totalCents,
        count: row.count,
        percentOfCategory: 0,
      });
    }
  }

  const ranked = [...categories.values()].sort(byTotalThenName);
  const percents = wholePercents(ranked.map((c) => c.totalCents));
  return {
    totalCents: ranked.reduce((sum, c) => sum + c.totalCents, 0),
    count: ranked.reduce((sum, c) => sum + c.count, 0),
    categories: ranked.map((category, index) => {
      const subcategories = [...category.subcategories].sort(byTotalThenName);
      const subPercents = wholePercents(subcategories.map((s) => s.totalCents));
      return {
        ...category,
        percent: percents[index],
        subcategories: subcategories.map((s, i) => ({ ...s, percentOfCategory: subPercents[i] })),
      };
    }),
  };
}

/** Spending (or income) by category and subcategory, derived from the records themselves. */
export async function getCategoryBreakdown(db: AppDb, filter: BreakdownFilter): Promise<Breakdown> {
  const clauses = ['t.type = ?'];
  const params: string[] = [filter.type];
  if (filter.start) {
    clauses.push('t.date >= ?');
    params.push(filter.start);
  }
  if (filter.endExclusive) {
    clauses.push('t.date < ?');
    params.push(filter.endExclusive);
  }
  if (filter.envelopeId) {
    clauses.push('t.budget_envelope_id = ?');
    params.push(filter.envelopeId);
  }
  const rows = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_icon: string | null;
    subcategory_id: string | null;
    subcategory_name: string | null;
    subcategory_icon: string | null;
    total_cents: number;
    count: number;
  }>(
    `SELECT
       c.id AS category_id, c.name AS category_name, c.icon AS category_icon,
       s.id AS subcategory_id, s.name AS subcategory_name, s.icon AS subcategory_icon,
       SUM(t.amount_cents) AS total_cents, COUNT(*) AS count
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     LEFT JOIN subcategories s ON s.id = t.subcategory_id
     WHERE ${clauses.join(' AND ')}
     GROUP BY c.id, s.id`,
    params,
  );
  return buildBreakdown(
    rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryIcon: r.category_icon,
      subcategoryId: r.subcategory_id,
      subcategoryName: r.subcategory_name,
      subcategoryIcon: r.subcategory_icon,
      totalCents: r.total_cents ?? 0,
      count: r.count ?? 0,
    })),
  );
}
