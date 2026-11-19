import Papa from 'papaparse';

import type { AppDb } from '@/src/db/db';
import type { TransactionType } from '@/src/domain/types';
import { centsToCurrencyString } from '@/src/utils/money';

export const CSV_V2_HEADERS = [
  'date',
  'type',
  'amount',
  'account',
  'account_id',
  'category',
  'category_id',
  'subcategory',
  'subcategory_id',
  'note',
  // Appended after the original ten columns so readers that use the header names keep working.
  'budget',
  'budget_id',
  'transfer_group_id',
] as const;

export type CsvV2Row = {
  date: string;
  type: TransactionType;
  amount: string;
  account: string;
  account_id: string;
  category: string;
  category_id: string;
  subcategory: string;
  subcategory_id: string;
  note: string;
  budget: string;
  budget_id: string;
  transfer_group_id: string;
};

export async function exportCsvV2(db: AppDb): Promise<string> {
  const rows = await db.getAllAsync<{
    date: string;
    type: TransactionType;
    amount_cents: number;
    account_id: string;
    account_name: string;
    category_id: string | null;
    category_name: string | null;
    subcategory_id: string | null;
    subcategory_name: string | null;
    note: string | null;
    budget_id: string | null;
    budget_name: string | null;
    transfer_group_id: string | null;
  }>(
    `
    SELECT
      t.date AS date,
      t.type AS type,
      t.amount_cents AS amount_cents,
      a.id AS account_id,
      a.name AS account_name,
      c.id AS category_id,
      c.name AS category_name,
      s.id AS subcategory_id,
      s.name AS subcategory_name,
      t.note AS note,
      b.id AS budget_id,
      b.name AS budget_name,
      t.transfer_group_id AS transfer_group_id
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN subcategories s ON s.id = t.subcategory_id
    LEFT JOIN budget_envelopes b ON b.id = t.budget_envelope_id
    ORDER BY t.date ASC, t.created_at ASC
    `
  );

  const out: CsvV2Row[] = rows.map((r) => {
    const amountCents =
      r.type === 'balance_adjustment' ? r.amount_cents : Math.abs(r.amount_cents);

    return {
      date: r.date,
      type: r.type,
      amount: centsToCurrencyString(amountCents),
      account: r.account_name,
      account_id: r.account_id,
      category: r.category_name ?? '',
      category_id: r.category_id ?? '',
      subcategory: r.subcategory_name ?? '',
      subcategory_id: r.subcategory_id ?? '',
      note: r.note ?? '',
      budget: r.budget_name ?? '',
      budget_id: r.budget_id ?? '',
      transfer_group_id: r.transfer_group_id ?? '',
    };
  });

  return Papa.unparse(out, { columns: [...CSV_V2_HEADERS] });
}

