/**
 * Account transfers as one linked pair (migration v11), on real SQLite (sql.js).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { migrateDb } from '../db/migrate';
import { migrations } from '../db/migrations';
import { createAccount, ensureAtLeastOneAccount, listAccountsWithBalances } from '../db/repo/accounts';
import {
  createTransfer,
  deleteTransfer,
  getTransaction,
  getTransfer,
  listTransactions,
  updateTransaction,
  updateTransfer,
} from '../db/repo/transactions';
import { ensureStarterTaxonomy } from '../db/starter';
import { getMonthlyTotals } from '../features/charts/aggregations';
import { exportCsvV2 } from '../features/importExport/csvV2';
import { assignTransactionToEnvelope, createEnvelope } from '../db/repo/envelopes';
import { createTransaction } from '../db/repo/transactions';
import { createTestDb, type TestDb } from './helpers/sqljsDb';

async function app() {
  const db = await createTestDb();
  await migrateDb(db);
  await ensureAtLeastOneAccount(db);
  await ensureStarterTaxonomy(db);
  const [cash] = await listAccountsWithBalances(db);
  const bank = await createAccount(db, { name: '招商银行', type: 'bank' });
  return { db, cash: cash.id, bank: bank.id };
}

async function balances(db: TestDb) {
  return Object.fromEntries((await listAccountsWithBalances(db)).map((a) => [a.name, a.balanceCents]));
}

describe('transfers', () => {
  it('writes, reads, edits, and deletes both sides together', async () => {
    const { db, cash, bank } = await app();
    const groupId = await createTransfer(db, {
      fromAccountId: cash, toAccountId: bank, amountCents: 10000, date: '2026-06-20', note: '转账 现金 → 招商银行',
    });
    assert.deepEqual(await balances(db), { 现金: -10000, 招商银行: 10000 });
    const rows = await listTransactions(db);
    assert.equal(rows.length, 2);
    assert.ok(rows.every((r) => r.transferGroupId === groupId && r.type === 'balance_adjustment'));
    assert.deepEqual(await getTransfer(db, groupId), {
      groupId, fromAccountId: cash, toAccountId: bank, amountCents: 10000, date: '2026-06-20', note: '转账 现金 → 招商银行',
    });

    // Reverse it, change the amount, date, and note: both rows follow.
    await updateTransfer(db, groupId, {
      fromAccountId: bank, toAccountId: cash, amountCents: 2550, date: '2026-06-21', note: '还钱',
    });
    assert.deepEqual(await balances(db), { 现金: 2550, 招商银行: -2550 });
    const edited = await getTransfer(db, groupId);
    assert.equal(edited?.fromAccountId, bank);
    assert.equal(edited?.date, '2026-06-21');
    assert.deepEqual((await listTransactions(db)).map((r) => r.note), ['还钱', '还钱']);

    await deleteTransfer(db, groupId);
    assert.equal((await listTransactions(db)).length, 0);
    assert.deepEqual(await balances(db), { 现金: 0, 招商银行: 0 });
    assert.equal(await getTransfer(db, groupId), null);
  });

  it('never counts as income or expense', async () => {
    const { db, cash, bank } = await app();
    await createTransfer(db, { fromAccountId: cash, toAccountId: bank, amountCents: 5000, date: '2026-06-20', note: null });
    assert.deepEqual(await getMonthlyTotals(db, { monthsBack: 1, endMonthInclusive: '2026-06' }), [
      { month: '2026-06', expenseCents: 0, incomeCents: 0 },
    ]);
  });

  it('rejects a transfer to the same account or of nothing', async () => {
    const { db, cash, bank } = await app();
    await assert.rejects(
      createTransfer(db, { fromAccountId: cash, toAccountId: cash, amountCents: 100, date: '2026-06-20', note: null }),
      /transfer_same_account/,
    );
    await assert.rejects(
      createTransfer(db, { fromAccountId: cash, toAccountId: bank, amountCents: 0, date: '2026-06-20', note: null }),
      /transfer_amount_invalid/,
    );
    assert.equal((await listTransactions(db)).length, 0);
  });

  it('keeps a transfer side from becoming an expense', async () => {
    const { db, cash, bank } = await app();
    const groupId = await createTransfer(db, {
      fromAccountId: cash, toAccountId: bank, amountCents: 100, date: '2026-06-20', note: null,
    });
    const [side] = await listTransactions(db, {});
    assert.equal(side.transferGroupId, groupId);
    const tx = await getTransaction(db, side.id);
    assert.ok(tx);
    const food = await db.getFirstAsync<{ id: string }>("SELECT id FROM categories WHERE name = '餐饮'");
    await assert.rejects(
      updateTransaction(db, { ...tx, type: 'expense', amountCents: 100, categoryId: food!.id }),
      /transfer_must_be_balance_adjustment/,
    );
  });

  it('links earlier unlinked transfers only when the pair is unambiguous', async () => {
    const db = await createTestDb();
    await db.execAsync('PRAGMA foreign_keys = ON;');
    for (const migration of migrations.filter((m) => m.version <= 10)) {
      for (const statement of migration.statements) await db.execAsync(statement);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    }
    await db.execAsync(`
      INSERT INTO accounts (id, name, type) VALUES ('a', '现金', 'cash'), ('b', '银行卡', 'bank'), ('c', '支付宝', 'stored_value');
      INSERT INTO transactions (id, type, amount_cents, date, account_id, note, created_at) VALUES
        -- A transfer written by an earlier build: two rows a millisecond apart.
        ('t1-out', 'balance_adjustment', -5000, '2026-06-01', 'a', '转账 现金 → 银行卡', '2026-06-01T09:00:00.100Z'),
        ('t1-in',  'balance_adjustment',  5000, '2026-06-01', 'b', '转账 现金 → 银行卡', '2026-06-01T09:00:00.101Z'),
        -- Two identical transfers in the same second: can't tell which rows belong together.
        ('t2-out', 'balance_adjustment', -100, '2026-06-02', 'a', '转账 现金 → 支付宝', '2026-06-02T09:00:00.000Z'),
        ('t2-in',  'balance_adjustment',  100, '2026-06-02', 'c', '转账 现金 → 支付宝', '2026-06-02T09:00:00.001Z'),
        ('t3-out', 'balance_adjustment', -100, '2026-06-02', 'a', '转账 现金 → 支付宝', '2026-06-02T09:00:00.500Z'),
        ('t3-in',  'balance_adjustment',  100, '2026-06-02', 'c', '转账 现金 → 支付宝', '2026-06-02T09:00:00.501Z'),
        -- Opposite adjustments a minute apart are separate corrections, not a transfer.
        ('adj-1',  'balance_adjustment', -700, '2026-06-03', 'a', NULL, '2026-06-03T09:00:00.000Z'),
        ('adj-2',  'balance_adjustment',  700, '2026-06-03', 'b', NULL, '2026-06-03T09:01:00.000Z'),
        -- No creation time: left alone.
        ('old-out', 'balance_adjustment', -900, '2026-06-04', 'a', NULL, NULL),
        ('old-in',  'balance_adjustment',  900, '2026-06-04', 'b', NULL, NULL);
    `);
    await migrateDb(db);

    const group = async (id: string) => (await getTransaction(db, id))?.transferGroupId ?? null;
    assert.equal(await group('t1-out'), 'xfer_t1-out');
    assert.equal(await group('t1-in'), 'xfer_t1-out');
    assert.deepEqual(await getTransfer(db, 'xfer_t1-out'), {
      groupId: 'xfer_t1-out', fromAccountId: 'a', toAccountId: 'b', amountCents: 5000, date: '2026-06-01', note: '转账 现金 → 银行卡',
    });
    for (const id of ['t2-out', 't2-in', 't3-out', 't3-in', 'adj-1', 'adj-2', 'old-out', 'old-in']) {
      assert.equal(await group(id), null, id);
    }
    // Balances are untouched by the upgrade.
    assert.deepEqual(await balances(db), { 现金: -5000 - 200 - 700 - 900, 银行卡: 5000 + 700 + 900, 支付宝: 200 });
  });

  it('exports budget assignments and transfer links in CSV v2', async () => {
    const { db, cash, bank } = await app();
    const groupId = await createTransfer(db, {
      fromAccountId: cash, toAccountId: bank, amountCents: 100, date: '2026-06-02', note: null,
    });
    const food = await db.getFirstAsync<{ id: string }>("SELECT id FROM categories WHERE name = '餐饮'");
    await createTransaction(db, {
      id: 'lunch', type: 'expense', amountCents: 2500, date: '2026-06-03',
      accountId: cash, categoryId: food!.id, subcategoryId: null, note: '午饭',
    });
    const budgetId = await createEnvelope(db, {
      kind: 'monthly', name: '吃饭', icon: '🍚', description: null, amountCents: 50000, startPeriod: '2026-06',
    });
    await assignTransactionToEnvelope(db, 'lunch', budgetId);
    const lines = (await exportCsvV2(db)).trim().split(/\r?\n/);
    assert.equal(
      lines[0],
      'date,type,amount,account,account_id,category,category_id,subcategory,subcategory_id,note,budget,budget_id,transfer_group_id',
    );
    assert.equal(lines.length, 4);
    assert.ok(lines.slice(1, 3).every((line) => line.endsWith(`,,,${groupId}`)), lines.join('\n'));
    assert.ok(lines[3].endsWith(`,午饭,吃饭,${budgetId},`), lines[3]);
  });
});
