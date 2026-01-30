import * as SQLite from 'expo-sqlite';

export type AppDb = SQLite.SQLiteDatabase;

let dbPromise: Promise<AppDb> | null = null;

export function getDb(): Promise<AppDb> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('rich.db');
  }
  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.closeAsync();
  dbPromise = null;
}

