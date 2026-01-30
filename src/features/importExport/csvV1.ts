import Papa from 'papaparse';

import type { AppDb } from '@/src/db/db';
import { ensureCategory } from '@/src/db/repo/categories';
import { createTransaction } from '@/src/db/repo/transactions';
import type { TransactionType } from '@/src/domain/types';
import { isoDateToLegacy, legacyDateToIso } from '@/src/utils/date';
import { newId } from '@/src/utils/id';
import { centsToCurrencyString, parseCurrencyToCents } from '@/src/utils/money';

export const CSV_V1_HEADERS = ['日期', '收支类型', '类别', '金额', '配注'] as const;
export type CsvV1Header = (typeof CSV_V1_HEADERS)[number];

export type CsvV1Row = {
  日期: string;
  收支类型: '支出' | '收入';
  类别: string;
  金额: string;
  配注?: string;
};

export async function exportCsvV1(db: AppDb): Promise<string> {
  const rows = await db.getAllAsync<{
    date: string;
    type: TransactionType;
    amount_cents: number;
    category_name: string;
    note: string | null;
  }>(
    `
    SELECT
      t.date AS date,
      t.type AS type,
      t.amount_cents AS amount_cents,
      c.name AS category_name,
      t.note AS note
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.type IN ('expense','income')
    ORDER BY t.date ASC, t.created_at ASC
    `
  );

  const out: CsvV1Row[] = rows.map((r) => {
    const legacyDate = isoDateToLegacy(r.date) ?? r.date;
    const type = r.type === 'expense' ? '支出' : '收入';
    return {
      日期: legacyDate,
      收支类型: type,
      类别: r.category_name,
      金额: centsToCurrencyString(r.amount_cents),
      配注: r.note ?? '',
    };
  });

  return Papa.unparse(out, { columns: [...CSV_V1_HEADERS] });
}

export async function importCsvV1(
  db: AppDb,
  csvText: string,
  opts: { targetAccountId: string }
): Promise<{ importedCount: number }> {
  const parsed = Papa.parse<CsvV1Row>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (parsed.errors.length) {
    throw new Error(`CSV parse error: ${parsed.errors[0]?.message ?? 'unknown error'}`);
  }

  // Basic header validation (ensure required columns exist)
  const fields = (parsed.meta.fields ?? []).map((f: string) => f.trim());
  for (const h of CSV_V1_HEADERS) {
    if (!fields.includes(h)) {
      throw new Error(`CSV v1 missing required column: ${h}`);
    }
  }

  const categoryCache = new Map<string, string>();
  let importedCount = 0;

  // Import in a transaction.
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];

      const dateLegacy = String((row as any)['日期'] ?? '').trim();
      const typeRaw = String((row as any)['收支类型'] ?? '').trim();
      const categoryName = String((row as any)['类别'] ?? '').trim();
      const amountRaw = String((row as any)['金额'] ?? '').trim();
      const noteRaw = String((row as any)['配注'] ?? '').trim();

      const iso = legacyDateToIso(dateLegacy);
      if (!iso) throw new Error(`Row ${i + 2}: invalid 日期 (expected YYYY/MM/DD).`);

      const cents = parseCurrencyToCents(amountRaw);
      if (cents === null) throw new Error(`Row ${i + 2}: invalid 金额.`);

      let type: TransactionType;
      if (typeRaw === '支出') type = 'expense';
      else if (typeRaw === '收入') type = 'income';
      else throw new Error(`Row ${i + 2}: invalid 收支类型 (expected 支出/收入).`);

      if (!categoryName) throw new Error(`Row ${i + 2}: 类别 is required.`);

      if (noteRaw.length > 100) throw new Error(`Row ${i + 2}: 配注 exceeds 100 characters.`);

      let categoryId = categoryCache.get(categoryName);
      if (!categoryId) {
        const category = await ensureCategory(db, categoryName);
        categoryId = category.id;
        categoryCache.set(categoryName, categoryId);
      }

      await createTransaction(db, {
        id: newId('txn'),
        type,
        amountCents: Math.abs(cents),
        date: iso,
        accountId: opts.targetAccountId,
        categoryId,
        subcategoryId: null,
        note: noteRaw ? noteRaw : null,
      });

      importedCount += 1;
    }
  });

  return { importedCount };
}

