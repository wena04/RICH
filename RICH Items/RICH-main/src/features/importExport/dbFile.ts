import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';

import { closeDb, getDb } from '@/src/db/db';
import { migrateDb } from '@/src/db/migrate';
import { ensureAtLeastOneAccount } from '@/src/db/repo/accounts';

function exportDir(): string {
  if (!FileSystem.cacheDirectory) {
    throw new Error('FileSystem.cacheDirectory is not available.');
  }
  return `${FileSystem.cacheDirectory}exports`;
}

function importDir(): string {
  if (!FileSystem.cacheDirectory) {
    throw new Error('FileSystem.cacheDirectory is not available.');
  }
  return `${FileSystem.cacheDirectory}imports`;
}

export async function exportDatabaseToFile(): Promise<string> {
  const src = await getDb();

  const dir = exportDir();
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `rich-db-export-${ts}.db`;

  // Create a destination database file in cache and backup into it.
  const dest = await SQLite.openDatabaseAsync(name, {}, dir);
  await SQLite.backupDatabaseAsync({ sourceDatabase: src, destDatabase: dest });
  await dest.closeAsync();

  // `databasePath` is the absolute path to the db file.
  return dest.databasePath;
}

export async function importDatabaseFromFileUri(uri: string): Promise<void> {
  const dir = importDir();
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  // Copy selected file into a known folder that expo-sqlite can open from.
  const importName = 'import.db';
  const importPath = `${dir}/${importName}`;
  await FileSystem.copyAsync({ from: uri, to: importPath });

  // Close current main DB connection so we can safely overwrite via backup.
  await closeDb();

  const imported = await SQLite.openDatabaseAsync(importName, {}, dir);
  const main = await SQLite.openDatabaseAsync('rich.db');
  await SQLite.backupDatabaseAsync({ sourceDatabase: imported, destDatabase: main });
  await imported.closeAsync();
  await main.closeAsync();

  // Re-open and ensure schema/seed.
  const reopened = await getDb();
  await migrateDb(reopened);
  await ensureAtLeastOneAccount(reopened);
}

