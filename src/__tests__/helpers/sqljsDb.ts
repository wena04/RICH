/**
 * Test-only stand-in for expo-sqlite's async database, backed by sql.js (SQLite compiled to
 * WebAssembly). It runs the app's real migrations and repositories in Node, and `reopen()` writes
 * the database to bytes and loads it into a fresh connection, like an app relaunch reading the file.
 */
import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js';

import type { AppDb } from '../../db/db';

let engine: Promise<SqlJsStatic> | null = null;
const loadEngine = () => (engine ??= initSqlJs());

type Params = SqlValue[] | Record<string, SqlValue>;

function normalize(params: unknown[]): Params {
  if (params.length === 1 && Array.isArray(params[0])) return params[0] as SqlValue[];
  if (params.length === 1 && params[0] && typeof params[0] === 'object') return params[0] as Record<string, SqlValue>;
  return params as SqlValue[];
}

export type TestDb = AppDb & { reopen(): Promise<TestDb>; raw: Database };

export async function createTestDb(bytes?: Uint8Array): Promise<TestDb> {
  const SQL = await loadEngine();
  const raw = bytes ? new SQL.Database(bytes) : new SQL.Database();
  const all = <T>(sql: string, params: unknown[]): T[] => {
    const stmt = raw.prepare(sql);
    try {
      stmt.bind(normalize(params));
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  };
  const db = {
    raw,
    async execAsync(sql: string) {
      raw.exec(sql);
    },
    async runAsync(sql: string, ...params: unknown[]) {
      raw.run(sql, normalize(params));
      const changes = raw.getRowsModified();
      const lastInsertRowId = Number(raw.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0);
      return { changes, lastInsertRowId };
    },
    async getAllAsync<T>(sql: string, ...params: unknown[]) {
      return all<T>(sql, params);
    },
    async getFirstAsync<T>(sql: string, ...params: unknown[]) {
      return all<T>(sql, params)[0] ?? null;
    },
    async withTransactionAsync(task: () => Promise<void>) {
      raw.exec('BEGIN;');
      try {
        await task();
        raw.exec('COMMIT;');
      } catch (error) {
        raw.exec('ROLLBACK;');
        throw error;
      }
    },
    async closeAsync() {
      raw.close();
    },
    async reopen() {
      const data = raw.export();
      raw.close();
      return createTestDb(data);
    },
  };
  return db as unknown as TestDb;
}
