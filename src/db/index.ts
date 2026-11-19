import { getDb } from "./db";
import { migrateDb } from "./migrate";
import { ensureAtLeastOneAccount } from "./repo/accounts";
import { ensureStarterTaxonomy } from "./starter";

let initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      await migrateDb(db);
      await ensureAtLeastOneAccount(db);
      await ensureStarterTaxonomy(db);
    })().catch((error) => {
      // Forget the failed attempt so the startup screen's retry runs initialization again.
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
