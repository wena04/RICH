import type { Account, AccountType } from '@/src/domain/types';
import { newId } from '@/src/utils/id';

import type { AppDb } from '../db';
import { getMeta, setMeta } from './meta';

const LAST_USED_ACCOUNT_KEY = 'last_used_account_id';

export async function listAccounts(db: AppDb): Promise<Account[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; type: AccountType }>(
    'SELECT id, name, type FROM accounts ORDER BY name ASC'
  );
  return rows.map((r) => ({ id: r.id, name: r.name, type: r.type }));
}

export type AccountWithBalance = Account & { balanceCents: number };

const BALANCE_CASE_SQL = `
  CASE t.type
    WHEN 'income' THEN t.amount_cents
    WHEN 'expense' THEN -t.amount_cents
    WHEN 'balance_adjustment' THEN t.amount_cents
    ELSE 0
  END
`;

export async function getAccountBalance(db: AppDb, accountId: string): Promise<number> {
  const row = await db.getFirstAsync<{ balance_cents: number | null }>(
    `SELECT COALESCE(SUM(${BALANCE_CASE_SQL}), 0) AS balance_cents
     FROM transactions t
     WHERE t.account_id = ?`,
    [accountId]
  );
  return row?.balance_cents ?? 0;
}

export async function listAccountsWithBalances(db: AppDb): Promise<AccountWithBalance[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    type: AccountType;
    balance_cents: number | null;
  }>(
    `SELECT a.id, a.name, a.type,
       COALESCE(SUM(${BALANCE_CASE_SQL}), 0) AS balance_cents
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     GROUP BY a.id, a.name, a.type
     ORDER BY a.name ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    balanceCents: r.balance_cents ?? 0,
  }));
}

export async function createAccount(
  db: AppDb,
  input: { name: string; type: AccountType }
): Promise<Account> {
  const now = new Date().toISOString();
  const id = newId('acc');
  await db.runAsync(
    `
    INSERT INTO accounts (id, name, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [id, input.name.trim(), input.type, now, now]
  );
  return { id, name: input.name.trim(), type: input.type };
}

export async function updateAccount(
  db: AppDb,
  input: { id: string; name: string; type: AccountType }
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `
    UPDATE accounts
    SET name = ?, type = ?, updated_at = ?
    WHERE id = ?
    `,
    [input.name.trim(), input.type, now, input.id]
  );
}

export async function canDeleteAccount(db: AppDb, id: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(1) AS cnt FROM transactions WHERE account_id = ?',
    [id]
  );
  return (row?.cnt ?? 0) === 0;
}

export async function deleteAccount(db: AppDb, id: string): Promise<void> {
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
}

export async function ensureAtLeastOneAccount(db: AppDb): Promise<Account> {
  const existing = await listAccounts(db);
  if (existing.length > 0) return existing[0];

  const created = await createAccount(db, { name: 'Cash', type: 'cash' });
  await setMeta(db, LAST_USED_ACCOUNT_KEY, created.id);
  return created;
}

export async function getLastUsedAccountId(db: AppDb): Promise<string | null> {
  return await getMeta(db, LAST_USED_ACCOUNT_KEY);
}

export async function setLastUsedAccountId(db: AppDb, accountId: string): Promise<void> {
  await setMeta(db, LAST_USED_ACCOUNT_KEY, accountId);
}

