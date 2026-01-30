import type { Transaction, TransactionType } from '@/src/domain/types';

import type { AppDb } from '../db';
import { setLastUsedAccountId } from './accounts';

export type TransactionListItem = {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: string; // YYYY-MM-DD
  account: { id: string; name: string };
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  note: string | null;
};

export async function listTransactions(db: AppDb): Promise<TransactionListItem[]> {
  const rows = await db.getAllAsync<{
    id: string;
    type: TransactionType;
    amount_cents: number;
    date: string;
    account_id: string;
    account_name: string;
    category_id: string | null;
    category_name: string | null;
    subcategory_id: string | null;
    subcategory_name: string | null;
    note: string | null;
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
      s.id AS subcategory_id,
      s.name AS subcategory_name,
      t.note
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN subcategories s ON s.id = t.subcategory_id
    ORDER BY t.date DESC, t.created_at DESC
    `
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amountCents: r.amount_cents,
    date: r.date,
    account: { id: r.account_id, name: r.account_name },
    category: r.category_id ? { id: r.category_id, name: r.category_name ?? '' } : null,
    subcategory: r.subcategory_id
      ? { id: r.subcategory_id, name: r.subcategory_name ?? '' }
      : null,
    note: r.note,
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
  }>('SELECT id, type, amount_cents, date, account_id, category_id, subcategory_id, note FROM transactions WHERE id = ?', [
    id,
  ]);

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
      now,
      input.id,
    ]
  );
  await setLastUsedAccountId(db, input.accountId);
}

export async function deleteTransaction(db: AppDb, id: string) {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

