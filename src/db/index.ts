import { getDb } from "./db";
import { migrateDb } from "./migrate";
import { ensureAtLeastOneAccount } from "./repo/accounts";
import { seedDemoData } from "./seed";

let initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      await migrateDb(db);
      await seedDemoData(db);
      await ensureAtLeastOneAccount(db);
    })();
  }
  return initPromise;
}
