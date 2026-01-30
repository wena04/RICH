import type { AppDb } from '../db';

export async function getMeta(db: AppDb, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [
    key,
  ]);
  return row?.value ?? null;
}

export async function setMeta(db: AppDb, key: string, value: string): Promise<void> {
  await db.runAsync(
    `
    INSERT INTO app_meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [key, value]
  );
}

