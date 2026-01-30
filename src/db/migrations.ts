export type Migration = {
  version: number;
  statements: string[];
};

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      `
      PRAGMA foreign_keys = ON;
      `,
      `
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        CHECK (type IN ('cash','bank','credit','stored_value','investment'))
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT,
        updated_at TEXT
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS subcategories (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        UNIQUE (category_id, name)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        date TEXT NOT NULL,
        account_id TEXT NOT NULL,
        category_id TEXT,
        subcategory_id TEXT,
        note TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE RESTRICT,
        CHECK (type IN ('expense','income','balance_adjustment')),
        CHECK (note IS NULL OR length(note) <= 100),
        CHECK (
          (type IN ('expense','income') AND category_id IS NOT NULL)
          OR
          (type = 'balance_adjustment' AND category_id IS NULL AND subcategory_id IS NULL)
        )
      );
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_transactions_subcategory_scope_insert
      BEFORE INSERT ON transactions
      WHEN NEW.subcategory_id IS NOT NULL
      BEGIN
        SELECT CASE
          WHEN (
            SELECT category_id FROM subcategories WHERE id = NEW.subcategory_id
          ) != NEW.category_id
          THEN RAISE(ABORT, 'subcategory_not_in_category')
        END;
      END;
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_transactions_subcategory_scope_update
      BEFORE UPDATE OF subcategory_id, category_id ON transactions
      WHEN NEW.subcategory_id IS NOT NULL
      BEGIN
        SELECT CASE
          WHEN (
            SELECT category_id FROM subcategories WHERE id = NEW.subcategory_id
          ) != NEW.category_id
          THEN RAISE(ABORT, 'subcategory_not_in_category')
        END;
      END;
      `,
      `
      CREATE TABLE IF NOT EXISTS asset_goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount_cents INTEGER NOT NULL,
        account_id TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
      );
      `,
    ],
  },
];

