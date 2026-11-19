import type { AppDb } from '@/src/db/db';

import { addMonths, monthStartIso, nextMonth } from '@/src/utils/month';

export type MonthlyTotalsRow = {
  month: string; // YYYY-MM
  expenseCents: number;
  incomeCents: number;
};

export async function getMonthlyTotals(
  db: AppDb,
  opts: { monthsBack: number; endMonthInclusive: string }
): Promise<MonthlyTotalsRow[]> {
  const endMonth = opts.endMonthInclusive;
  // monthsBack includes endMonth itself
  const startMonth = addMonths(endMonth, -(Math.max(1, opts.monthsBack) - 1));

  const start = monthStartIso(startMonth);
  const endExclusive = monthStartIso(nextMonth(endMonth));

  const rows = await db.getAllAsync<{
    ym: string;
    expense_cents: number;
    income_cents: number;
  }>(
    `
    SELECT
      substr(t.date, 1, 7) AS ym,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount_cents ELSE 0 END) AS expense_cents,
      SUM(CASE WHEN t.type = 'income' THEN t.amount_cents ELSE 0 END) AS income_cents
    FROM transactions t
    WHERE
      t.type IN ('expense','income')
      AND t.date >= ?
      AND t.date < ?
    GROUP BY ym
    ORDER BY ym ASC
    `,
    [start, endExclusive]
  );

  // Fill missing months with zeros.
  const byMonth = new Map<string, { expense: number; income: number }>();
  for (const r of rows) {
    byMonth.set(r.ym, { expense: r.expense_cents ?? 0, income: r.income_cents ?? 0 });
  }

  const out: MonthlyTotalsRow[] = [];
  for (let i = 0; i < opts.monthsBack; i++) {
    const m = addMonths(startMonth, i);
    const v = byMonth.get(m) ?? { expense: 0, income: 0 };
    out.push({ month: m, expenseCents: v.expense, incomeCents: v.income });
  }
  return out;
}

