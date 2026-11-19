/**
 * Category → subcategory breakdowns, monthly totals, and record filters, on real SQLite (sql.js)
 * with the app's migrations and starter taxonomy.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { migrateDb } from '../db/migrate';
import { ensureAtLeastOneAccount, listAccountsWithBalances } from '../db/repo/accounts';
import { createSubcategory, getCategoryByName, listSubcategories } from '../db/repo/categories';
import { assignTransactionToEnvelope, createEnvelope } from '../db/repo/envelopes';
import { createTransaction, listTransactions } from '../db/repo/transactions';
import { ensureStarterTaxonomy } from '../db/starter';
import { getMonthlyTotals } from '../features/charts/aggregations';
import { buildBreakdown, getCategoryBreakdown, wholePercents } from '../features/charts/breakdown';
import { compactYuan, monthTick, monthTitle } from '../features/charts/labels';
import { createTestDb } from './helpers/sqljsDb';

async function seeded() {
  const db = await createTestDb();
  await migrateDb(db);
  await ensureAtLeastOneAccount(db);
  await ensureStarterTaxonomy(db);
  const [cash] = await listAccountsWithBalances(db);
  const food = await getCategoryByName(db, '餐饮');
  const transport = await getCategoryByName(db, '交通');
  const salary = await getCategoryByName(db, '工资');
  assert.ok(food && transport && salary);
  const subs = await listSubcategories(db, food.id);
  const coffee = subs.find((s) => s.name === '咖啡');
  const takeout = subs.find((s) => s.name === '外卖');
  assert.ok(coffee && takeout);

  let n = 0;
  const add = (
    type: 'expense' | 'income',
    amountCents: number,
    date: string,
    categoryId: string,
    subcategoryId: string | null = null,
  ) =>
    createTransaction(db, {
      id: `t${++n}`, type, amountCents, date, accountId: cash.id, categoryId, subcategoryId, note: null,
    });

  await add('expense', 1800, '2026-06-02', food.id, coffee.id);
  await add('expense', 1200, '2026-06-03', food.id, coffee.id);
  await add('expense', 4500, '2026-06-04', food.id, takeout.id);
  await add('expense', 1500, '2026-06-05', food.id); // filed under 餐饮 itself
  await add('expense', 3000, '2026-06-06', transport.id);
  await add('expense', 999, '2026-05-30', food.id, coffee.id); // previous month
  await add('income', 800000, '2026-06-01', salary.id);
  return { db, food, transport, coffee, takeout };
}

describe('category breakdown', () => {
  it('ranks categories and nests their subcategories for one month', async () => {
    const { db, food, coffee, takeout } = await seeded();
    const june = await getCategoryBreakdown(db, {
      type: 'expense', start: '2026-06-01', endExclusive: '2026-07-01',
    });
    assert.equal(june.totalCents, 12000);
    assert.equal(june.count, 5);
    assert.deepEqual(
      june.categories.map((c) => [c.name, c.totalCents, c.percent]),
      [['餐饮', 9000, 75], ['交通', 3000, 25]],
    );
    const [foodSlice] = june.categories;
    assert.equal(foodSlice.categoryId, food.id);
    assert.equal(foodSlice.icon, 'icon_canyin');
    assert.deepEqual(
      foodSlice.subcategories.map((s) => [s.subcategoryId, s.name, s.totalCents, s.count, s.percentOfCategory]),
      [
        [takeout.id, '外卖', 4500, 1, 50],
        [coffee.id, '咖啡', 3000, 2, 33],
        [null, null, 1500, 1, 17],
      ],
    );
    // The transport record has no subcategory: one 未细分 slice holding everything.
    assert.deepEqual(june.categories[1].subcategories.map((s) => s.subcategoryId), [null]);
  });

  it('separates income and all-time totals', async () => {
    const { db } = await seeded();
    const income = await getCategoryBreakdown(db, { type: 'income', start: '2026-06-01', endExclusive: '2026-07-01' });
    assert.deepEqual(income.categories.map((c) => [c.name, c.totalCents, c.percent]), [['工资', 800000, 100]]);
    const allTime = await getCategoryBreakdown(db, { type: 'expense' });
    assert.equal(allTime.totalCents, 12999);
  });

  it('limits a breakdown to the records assigned to a budget', async () => {
    const { db } = await seeded();
    const id = await createEnvelope(db, {
      kind: 'monthly', name: '吃饭', icon: '🍚', description: null, amountCents: 50000, startPeriod: '2026-06',
    });
    await assignTransactionToEnvelope(db, 't1', id);
    await assignTransactionToEnvelope(db, 't3', id);
    const budget = await getCategoryBreakdown(db, {
      type: 'expense', start: '2026-06-01', endExclusive: '2026-07-01', envelopeId: id,
    });
    assert.equal(budget.totalCents, 6300);
    assert.deepEqual(
      budget.categories[0].subcategories.map((s) => [s.name, s.totalCents, s.percentOfCategory]),
      [['外卖', 4500, 71], ['咖啡', 1800, 29]],
    );
    const records = await listTransactions(db, { envelopeId: id });
    assert.deepEqual(records.map((r) => r.id).sort(), ['t1', 't3']);
  });

  it('filters records by category and subcategory, including 未细分', async () => {
    const { db, food, coffee } = await seeded();
    const june = { type: 'expense' as const, start: '2026-06-01', endExclusive: '2026-07-01' };
    assert.deepEqual(
      (await listTransactions(db, { ...june, categoryId: food.id, subcategoryId: coffee.id })).map((r) => r.id),
      ['t2', 't1'],
    );
    assert.deepEqual(
      (await listTransactions(db, { ...june, categoryId: food.id, subcategoryId: null })).map((r) => r.id),
      ['t4'],
    );
    assert.equal((await listTransactions(db, { ...june, categoryId: food.id })).length, 4);
    assert.equal((await listTransactions(db)).length, 7);
  });

  it('uses a chosen subcategory icon', async () => {
    const { db, food } = await seeded();
    const { id: tea } = await createSubcategory(db, food.id, '奶茶', 'icon_yinliao');
    await createTransaction(db, {
      id: 'tea', type: 'expense', amountCents: 1600, date: '2026-06-07',
      accountId: (await listAccountsWithBalances(db))[0].id, categoryId: food.id, subcategoryId: tea, note: null,
    });
    const june = await getCategoryBreakdown(db, { type: 'expense', start: '2026-06-01', endExclusive: '2026-07-01' });
    const slice = june.categories[0].subcategories.find((s) => s.name === '奶茶');
    assert.equal(slice?.icon, 'icon_yinliao');
  });

  it('fills months without records with zeros', async () => {
    const { db } = await seeded();
    const months = await getMonthlyTotals(db, { monthsBack: 3, endMonthInclusive: '2026-07' });
    assert.deepEqual(months, [
      { month: '2026-05', expenseCents: 999, incomeCents: 0 },
      { month: '2026-06', expenseCents: 12000, incomeCents: 800000 },
      { month: '2026-07', expenseCents: 0, incomeCents: 0 },
    ]);
  });
});

describe('whole percents', () => {
  it('always adds up to 100', () => {
    assert.deepEqual(wholePercents([1, 1, 1]), [34, 33, 33]);
    assert.deepEqual(wholePercents([4500, 3000, 1500]), [50, 33, 17]);
    assert.deepEqual(wholePercents([1, 999]), [0, 100]);
    assert.deepEqual(wholePercents([0, 0]), [0, 0]);
    for (const values of [[7, 7, 7, 7, 7, 7, 7], [1, 2, 3, 4, 5, 6], [123456, 7, 89]]) {
      assert.equal(wholePercents(values).reduce((a, b) => a + b, 0), 100);
    }
  });

  it('ignores empty cells when building', () => {
    const result = buildBreakdown([
      {
        categoryId: 'a', categoryName: 'A', categoryIcon: null, subcategoryId: null,
        subcategoryName: null, subcategoryIcon: null, totalCents: 0, count: 0,
      },
    ]);
    assert.deepEqual(result, { totalCents: 0, count: 0, categories: [] });
  });
});

describe('chart labels', () => {
  it('formats bar labels compactly', () => {
    assert.equal(compactYuan(9550), '¥95.5');
    assert.equal(compactYuan(4500), '¥45');
    assert.equal(compactYuan(800000), '¥8000');
    assert.equal(compactYuan(1234500), '¥1.2万');
    assert.equal(compactYuan(10000000), '¥10万');
    assert.equal(monthTick('2026-06'), '6月');
    assert.equal(monthTitle('2026-11'), '2026年11月');
  });
});
