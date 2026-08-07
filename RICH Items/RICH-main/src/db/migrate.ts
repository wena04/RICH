import type { AppDb } from './db';
import { migrations } from './migrations';

type PragmaUserVersionRow = { user_version: number };

export async function migrateDb(db: AppDb) {
  // Defensive: keep FK constraints enabled for the session.
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const current = await getUserVersion(db);
  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);

  for (const m of pending) {
    await db.execAsync('BEGIN;');
    try {
      for (const stmt of m.statements) {
        await db.execAsync(stmt);
      }
      await db.execAsync(`PRAGMA user_version = ${m.version};`);
      await db.execAsync('COMMIT;');
    } catch (e) {
      await db.execAsync('ROLLBACK;');
      throw e;
    }
  }
}

async function getUserVersion(db: AppDb): Promise<number> {
  const row = (await db.getFirstAsync<PragmaUserVersionRow>('PRAGMA user_version;')) ?? null;
  return row?.user_version ?? 0;
}

