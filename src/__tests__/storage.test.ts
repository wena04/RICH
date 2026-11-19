/**
 * Storage integration: the app's real migrations, bootstrap, and repositories against a real
 * SQLite engine (sql.js), including a simulated relaunch from the saved database file.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { migrateDb } from '../db/migrate';
import { migrations } from '../db/migrations';
import { ensureAtLeastOneAccount, listAccountsWithBalances } from '../db/repo/accounts';
import {
  createSubcategory,
  deleteCategory,
  getCategoryByName,
  listCategories,
  listSubcategories,
} from '../db/repo/categories';
import {
  assignTransactionToEnvelope,
  createEnvelope,
  createSavingsPlan,
  getBudgetTabSummary,
  setEnvelopeArchived,
} from '../db/repo/envelopes';
import { createTransaction, getTransaction, listTransactions, updateTransaction } from '../db/repo/transactions';
import { ensureStarterTaxonomy } from '../db/starter';
import { resolveCategoryIconName } from '../domain/categoryIcons';
import { exportCsvV1, importCsvV1 } from '../features/importExport/csvV1';
import { createTestDb, type TestDb } from './helpers/sqljsDb';

const LATEST = Math.max(...migrations.map((m) => m.version));

/** What `initDb` does at every launch. */
async function launch(db: TestDb) {
  await migrateDb(db);
  await ensureAtLeastOneAccount(db);
  await ensureStarterTaxonomy(db);
}

async function freshApp() {
  const db = await createTestDb();
  await launch(db);
  return db;
}

async function userVersion(db: TestDb) {
  return (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;'))?.user_version;
}

describe('storage', () => {
  it('migrates a new install to the latest schema with one account and the starter taxonomy', async () => {
    const db = await freshApp();
    assert.equal(await userVersion(db), LATEST);
    const fk = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
    assert.equal(fk?.foreign_keys, 1);

    const accounts = await listAccountsWithBalances(db);
    assert.deepEqual(accounts.map((a) => [a.name, a.type, a.balanceCents]), [['现金', 'cash', 0]]);

    const categories = await listCategories(db);
    assert.ok(categories.length >= 30, `only ${categories.length} categories`);
    const food = categories.find((c) => c.name === '餐饮');
    assert.ok(food);
    assert.equal(resolveCategoryIconName(food.icon, food.name), 'icon_canyin');
    const subs = await listSubcategories(db, food.id);
    // Starter subcategories keep their designed order even when created in the same millisecond.
    assert.deepEqual(subs.map((s) => s.name), ['买菜', '校园餐饮', '咖啡', '外卖', '聚餐']);
    // No demo money.
    assert.equal((await listTransactions(db)).length, 0);
  });

  it('keeps data across a relaunch and never re-creates a category the person deleted', async () => {
    let db = await freshApp();
    const [cash] = await listAccountsWithBalances(db);
    const food = await getCategoryByName(db, '餐饮');
    assert.ok(food);
    await createTransaction(db, {
      id: 'tx-1', type: 'expense', amountCents: 2550, date: '2026-06-20',
      accountId: cash.id, categoryId: food.id, subcategoryId: null, note: '午饭',
    });
    const haircut = await getCategoryByName(db, '理发');
    assert.ok(haircut);
    await deleteCategory(db, haircut.id);

    db = await db.reopen();
    await launch(db);

    const tx = await getTransaction(db, 'tx-1');
    assert.equal(tx?.amountCents, 2550);
    assert.equal(tx?.note, '午饭');
    assert.equal(await getCategoryByName(db, '理发'), null);
    assert.equal((await listAccountsWithBalances(db))[0].balanceCents, -2550);
    assert.equal((await listAccountsWithBalances(db)).length, 1);
  });

  it('stores a chosen subcategory icon and resolves it ahead of the name', async () => {
    const db = await freshApp();
    const food = await getCategoryByName(db, '餐饮');
    assert.ok(food);
    await createSubcategory(db, food.id, '奶茶', 'icon_yinliao');
    const milkTea = (await listSubcategories(db, food.id)).find((s) => s.name === '奶茶');
    assert.equal(milkTea?.icon, 'icon_yinliao');
    assert.equal(resolveCategoryIconName(milkTea?.icon, milkTea?.name), 'icon_yinliao');
  });

  it('enforces the schema invariants in SQLite itself', async () => {
    const db = await freshApp();
    const [cash] = await listAccountsWithBalances(db);
    const food = await getCategoryByName(db, '餐饮');
    assert.ok(food);
    // Notes are capped at 100 characters.
    await assert.rejects(
      createTransaction(db, {
        id: 'too-long', type: 'expense', amountCents: 100, date: '2026-06-20',
        accountId: cash.id, categoryId: food.id, subcategoryId: null, note: 'x'.repeat(101),
      }),
    );
    // A category in use can't be deleted (ON DELETE RESTRICT).
    await createTransaction(db, {
      id: 'tx-r', type: 'expense', amountCents: 100, date: '2026-06-20',
      accountId: cash.id, categoryId: food.id, subcategoryId: null, note: null,
    });
    await assert.rejects(deleteCategory(db, food.id));
  });

  it('keeps budgets, assignments, and plans consistent', async () => {
    const db = await freshApp();
    const [cash] = await listAccountsWithBalances(db);
    const food = await getCategoryByName(db, '餐饮');
    const salary = await getCategoryByName(db, '工资');
    assert.ok(food && salary);

    const budgetId = await createEnvelope(db, {
      kind: 'monthly', name: '日常开销', icon: '🍚', description: null, amountCents: 100000, startPeriod: '2026-06',
    });
    await createTransaction(db, {
      id: 'e1', type: 'expense', amountCents: 3000, date: '2026-06-10',
      accountId: cash.id, categoryId: food.id, subcategoryId: null, note: null,
    });
    await createTransaction(db, {
      id: 'i1', type: 'income', amountCents: 500000, date: '2026-06-05',
      accountId: cash.id, categoryId: salary.id, subcategoryId: null, note: null,
    });
    await assignTransactionToEnvelope(db, 'e1', budgetId);
    await createSavingsPlan(db, {
      name: '旅行', icon: '✈️', description: null, sourceEnvelopeId: budgetId,
      targetCents: 120000, monthlyCents: 20000, startPeriod: '2026-06',
    });

    const summary = await getBudgetTabSummary(db, '2026-06');
    assert.equal(summary.balanceCents, 500000 - 3000);
    const [envelope] = summary.envelopes;
    assert.equal(envelope.spentCents, 3000);
    assert.equal(envelope.frozenCents, 20000);
    assert.equal(summary.plans.length, 1);

    // Income can't keep a budget: switching the type clears the assignment.
    const tx = await getTransaction(db, 'e1');
    assert.ok(tx);
    await updateTransaction(db, { ...tx, type: 'income', categoryId: salary.id });
    assert.equal((await getTransaction(db, 'e1'))?.budgetEnvelopeId ?? null, null);

    // A budget an active plan draws on can't be archived.
    await assert.rejects(setEnvelopeArchived(db, budgetId, true), /budget_has_active_plans/);
  });

  it('upgrades an older database without losing records', async () => {
    const db = await createTestDb();
    // Build the schema as an earlier release left it (v7) and add records the way that release
    // wrote them (legacy semantic icon ids, no subcategory icons).
    await db.execAsync('PRAGMA foreign_keys = ON;');
    for (const migration of migrations.filter((m) => m.version <= 7)) {
      for (const statement of migration.statements) await db.execAsync(statement);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    }
    await db.runAsync("INSERT INTO accounts (id, name, type) VALUES ('acc', '现金', 'cash')");
    await db.runAsync("INSERT INTO categories (id, name, icon, kind) VALUES ('cat', '餐饮', 'food', 'expense')");
    await db.runAsync("INSERT INTO subcategories (id, category_id, name) VALUES ('sub', 'cat', '咖啡')");
    await db.runAsync(
      `INSERT INTO transactions (id, type, amount_cents, date, account_id, category_id, subcategory_id, note)
       VALUES ('old', 'expense', 999, '2026-05-01', 'acc', 'cat', 'sub', 'before upgrade')`,
    );

    const upgraded = await db.reopen();
    await launch(upgraded);
    assert.equal(await userVersion(upgraded), LATEST);
    const tx = await getTransaction(upgraded, 'old');
    assert.equal(tx?.note, 'before upgrade');
    assert.equal(tx?.budgetEnvelopeId ?? null, null);
    // Legacy icon ids still draw the original artwork; the old subcategory gains an empty icon column.
    const food = await getCategoryByName(upgraded, '餐饮');
    assert.equal(resolveCategoryIconName(food?.icon, food?.name), 'icon_canyin');
    const [coffee] = await listSubcategories(upgraded, 'cat');
    assert.equal(coffee.icon ?? null, null);
    assert.equal(resolveCategoryIconName(coffee.icon, coffee.name), 'icon_kafei');
  });

  it('round-trips records through the CSV export and import', async () => {
    const source = await freshApp();
    const [cash] = await listAccountsWithBalances(source);
    const food = await getCategoryByName(source, '餐饮');
    assert.ok(food);
    await createTransaction(source, {
      id: 'c1', type: 'expense', amountCents: 1234, date: '2026-06-01',
      accountId: cash.id, categoryId: food.id, subcategoryId: null, note: '早餐',
    });
    const csv = await exportCsvV1(source);

    const target = await freshApp();
    const [targetCash] = await listAccountsWithBalances(target);
    const result = await importCsvV1(target, csv, { targetAccountId: targetCash.id });
    assert.equal(result.importedCount, 1);
    const [imported] = await listTransactions(target);
    assert.equal(imported.amountCents, 1234);
    assert.equal(imported.date, '2026-06-01');
    assert.equal(imported.category?.name, '餐饮');
  });
});
