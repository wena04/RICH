import type { Transaction, TransactionType } from '@/src/domain/types';

import type { AppDb } from '../db';
import { newId } from '@/src/utils/id';

import { setLastUsedAccountId } from './accounts';

export type TransactionListItem = {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: string; // YYYY-MM-DD
  account: { id: string; name: string };
  category: { id: string; name: string; icon: string | null } | null;
  subcategory: { id: string; name: string } | null;
  note: string | null;
  /** Set on both sides of an account transfer. */
  transferGroupId: string | null;
};

/** Narrows `listTransactions`. Dates are local `YYYY-MM-DD`; `endExclusive` is the day after the range. */
export type TransactionFilter = {
  type?: 'expense' | 'income';
  start?: string;
  endExclusive?: string;
  categoryId?: string;
  /** A subcategory id, or `null` for records filed under the category itself. */
  subcategoryId?: string | null;
  envelopeId?: string;
};

function filterClause(filter: TransactionFilter): { where: string; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filter.type) {
    clauses.push('t.type = ?');
    params.push(filter.type);
  }
  if (filter.start) {
    clauses.push('t.date >= ?');
    params.push(filter.start);
  }
  if (filter.endExclusive) {
    clauses.push('t.date < ?');
    params.push(filter.endExclusive);
  }
  if (filter.categoryId) {
    clauses.push('t.category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter.subcategoryId === null) {
    clauses.push('t.subcategory_id IS NULL');
  } else if (filter.subcategoryId) {
    clauses.push('t.subcategory_id = ?');
    params.push(filter.subcategoryId);
  }
  if (filter.envelopeId) {
    clauses.push('t.budget_envelope_id = ?');
    params.push(filter.envelopeId);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export async function listTransactions(
  db: AppDb,
  filter: TransactionFilter = {},
): Promise<TransactionListItem[]> {
  const { where, params } = filterClause(filter);
  const rows = await db.getAllAsync<{
    id: string;
    type: TransactionType;
    amount_cents: number;
    date: string;
    account_id: string;
    account_name: string;
    category_id: string | null;
    category_name: string | null;
    category_icon: string | null;
    subcategory_id: string | null;
    subcategory_name: string | null;
    note: string | null;
    transfer_group_id: string | null;
  }>(
    `
    SELECT
      t.id,
      t.type,
      t.amount_cents,
      t.date,
      a.id AS account_id,
      a.name AS account_name,
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      s.id AS subcategory_id,
      s.name AS subcategory_name,
      t.note,
      t.transfer_group_id
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN subcategories s ON s.id = t.subcategory_id
    ${where}
    ORDER BY t.date DESC, t.created_at DESC
    `,
    params,
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amountCents: r.amount_cents,
    date: r.date,
    account: { id: r.account_id, name: r.account_name },
    category: r.category_id
      ? { id: r.category_id, name: r.category_name ?? '', icon: r.category_icon }
      : null,
    subcategory: r.subcategory_id
      ? { id: r.subcategory_id, name: r.subcategory_name ?? '' }
      : null,
    note: r.note,
    transferGroupId: r.transfer_group_id,
  }));
}

export async function getTransaction(db: AppDb, id: string): Promise<Transaction | null> {
  const row = await db.getFirstAsync<{
    id: string;
    type: TransactionType;
    amount_cents: number;
    date: string;
    account_id: string;
    category_id: string | null;
    subcategory_id: string | null;
    note: string | null;
    budget_envelope_id: string | null;
    transfer_group_id: string | null;
  }>(
    `SELECT id, type, amount_cents, date, account_id, category_id, subcategory_id, note, budget_envelope_id,
            transfer_group_id
     FROM transactions WHERE id = ?`,
    [id],
  );

  if (!row) return null;

  return {
    id: row.id,
    type: row.type,
    amountCents: row.amount_cents,
    date: row.date,
    accountId: row.account_id,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    note: row.note,
    budgetEnvelopeId: row.budget_envelope_id,
    transferGroupId: row.transfer_group_id,
  };
}

export async function createTransaction(db: AppDb, input: Omit<Transaction, 'id'> & { id: string }) {
  const now = new Date().toISOString();
  await db.runAsync(
    `
    INSERT INTO transactions (
      id, type, amount_cents, date, account_id, category_id, subcategory_id, note, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.id,
      input.type,
      input.amountCents,
      input.date,
      input.accountId,
      input.categoryId,
      input.subcategoryId,
      input.note,
      now,
      now,
    ]
  );

  await setLastUsedAccountId(db, input.accountId);
}

export async function updateTransaction(db: AppDb, input: Transaction) {
  const now = new Date().toISOString();
  await db.runAsync(
    `
    UPDATE transactions
    SET
      type = ?,
      amount_cents = ?,
      date = ?,
      account_id = ?,
      category_id = ?,
      subcategory_id = ?,
      note = ?,
      -- Only expenses can belong to a budget; switching type drops the assignment.
      budget_envelope_id = CASE WHEN ? = 'expense' THEN budget_envelope_id ELSE NULL END,
      updated_at = ?
    WHERE id = ?
    `,
    [
      input.type,
      input.amountCents,
      input.date,
      input.accountId,
      input.categoryId,
      input.subcategoryId,
      input.note,
      input.type,
      now,
      input.id,
    ]
  );
  await setLastUsedAccountId(db, input.accountId);
}

export async function deleteTransaction(db: AppDb, id: string) {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Account transfers: two balance adjustments sharing a transfer_group_id
// ---------------------------------------------------------------------------

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  /** Positive amount moved. */
  amountCents: number;
  date: string;
  note: string | null;
};

export type Transfer = TransferInput & { groupId: string };

function checkTransfer(input: TransferInput) {
  if (input.fromAccountId === input.toAccountId) throw new Error('transfer_same_account');
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('transfer_amount_invalid');
  }
}

/** Writes both sides in one SQLite transaction and returns the transfer's group id. */
export async function createTransfer(db: AppDb, input: TransferInput, ids?: { groupId: string; outId: string; inId: string }) {
  checkTransfer(input);
  const groupId = ids?.groupId ?? newId('xfer');
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const insert = `
      INSERT INTO transactions (
        id, type, amount_cents, date, account_id, category_id, subcategory_id, note,
        transfer_group_id, created_at, updated_at
      )
      VALUES (?, 'balance_adjustment', ?, ?, ?, NULL, NULL, ?, ?, ?, ?)`;
    await db.runAsync(insert, [
      ids?.outId ?? newId('txn'), -input.amountCents, input.date, input.fromAccountId, input.note, groupId, now, now,
    ]);
    await db.runAsync(insert, [
      ids?.inId ?? newId('txn'), input.amountCents, input.date, input.toAccountId, input.note, groupId, now, now,
    ]);
    await setLastUsedAccountId(db, input.toAccountId);
  });
  return groupId;
}

/** Both sides of a transfer, or `null` if it no longer has exactly one outgoing and one incoming row. */
export async function getTransfer(db: AppDb, groupId: string): Promise<Transfer | null> {
  const rows = await db.getAllAsync<{
    amount_cents: number;
    date: string;
    account_id: string;
    note: string | null;
  }>(
    `SELECT amount_cents, date, account_id, note FROM transactions
     WHERE transfer_group_id = ? ORDER BY amount_cents ASC`,
    [groupId],
  );
  if (rows.length !== 2) return null;
  const [out, into] = rows;
  if (out.amount_cents >= 0 || into.amount_cents !== -out.amount_cents) return null;
  return {
    groupId,
    fromAccountId: out.account_id,
    toAccountId: into.account_id,
    amountCents: into.amount_cents,
    date: into.date,
    note: into.note,
  };
}

/** Rewrites both sides together: accounts, amount, date, and note. */
export async function updateTransfer(db: AppDb, groupId: string, input: TransferInput) {
  checkTransfer(input);
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const set = 'SET amount_cents = ?, date = ?, account_id = ?, note = ?, updated_at = ?';
    const out = await db.runAsync(
      `UPDATE transactions ${set} WHERE transfer_group_id = ? AND amount_cents < 0`,
      [-input.amountCents, input.date, input.fromAccountId, input.note, now, groupId],
    );
    const into = await db.runAsync(
      `UPDATE transactions ${set} WHERE transfer_group_id = ? AND amount_cents > 0`,
      [input.amountCents, input.date, input.toAccountId, input.note, now, groupId],
    );
    if (out.changes !== 1 || into.changes !== 1) throw new Error('transfer_not_found');
  });
}

/** Deletes both sides of a transfer. */
export async function deleteTransfer(db: AppDb, groupId: string) {
  await db.runAsync('DELETE FROM transactions WHERE transfer_group_id = ?', [groupId]);
}

/** `YYYY-MM` months that have at least one expense or income record, oldest first. */
export async function listRecordMonths(db: AppDb): Promise<string[]> {
  const rows = await db.getAllAsync<{ ym: string }>(
    `SELECT DISTINCT substr(date, 1, 7) AS ym FROM transactions
     WHERE type IN ('expense', 'income') ORDER BY ym ASC`,
  );
  return rows.map((r) => r.ym);
}
