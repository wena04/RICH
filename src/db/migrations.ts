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
    ],
  },
  {
    version: 2,
    statements: [
      `DROP TABLE IF EXISTS asset_goals;`,
    ],
  },
  {
    version: 3,
    statements: [
      // Custom categories can store a chosen icon id (see components/CategoryIcon).
      `ALTER TABLE categories ADD COLUMN icon TEXT;`,
    ],
  },
  {
    version: 4,
    statements: [
      `
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        period TEXT NOT NULL UNIQUE,
        total_cents INTEGER,
        created_at TEXT,
        updated_at TEXT,
        CHECK (total_cents IS NULL OR total_cents >= 0)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS budget_categories (
        id TEXT PRIMARY KEY,
        budget_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        limit_cents INTEGER NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        CHECK (limit_cents > 0),
        UNIQUE (budget_id, category_id)
      );
      `,
      `CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_categories_category_id ON budget_categories(category_id);`,
    ],
  },
  {
    version: 5,
    statements: [
      `ALTER TABLE categories ADD COLUMN kind TEXT NOT NULL DEFAULT 'both' CHECK (kind IN ('expense','income','both'));`,
      `
      UPDATE categories
      SET kind = 'income'
      WHERE name IN ('工资','兼职','理财','奖金','报销','退款','收红包','其他收入');
      `,
      `
      UPDATE categories
      SET kind = 'expense'
      WHERE name IN (
        '餐饮','衣服','交通','网费话费','学习','日用','住房','医疗','发红包','汽车/加油',
        '娱乐','请客送礼','电器数码','运动','理发','付费会员','还钱','工作','购物','旅行',
        '人情/借钱','买菜'
      );
      `,
    ],
  },
  {
    version: 6,
    statements: [
      `
      CREATE TABLE IF NOT EXISTS budget_subcategories (
        id TEXT PRIMARY KEY,
        budget_id TEXT NOT NULL,
        subcategory_id TEXT NOT NULL,
        limit_cents INTEGER NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
        CHECK (limit_cents > 0),
        UNIQUE (budget_id, subcategory_id)
      );
      `,
      `CREATE INDEX IF NOT EXISTS idx_budget_subcategories_budget_id ON budget_subcategories(budget_id);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_subcategories_subcategory_id ON budget_subcategories(subcategory_id);`,
    ],
  },
  {
    version: 7,
    statements: [
      `UPDATE categories SET icon = 'briefcaseyen' WHERE name = '奖金' AND (icon IS NULL OR icon IN ('trophyyen', 'envmoney'));`,
      `UPDATE categories SET icon = 'ticketyen' WHERE name = '报销' AND (icon IS NULL OR icon = 'clipplus');`,
      `UPDATE categories SET icon = 'redpacket' WHERE name = '收红包' AND (icon IS NULL OR icon = 'envmoney');`,
      `UPDATE categories SET icon = 'piggy' WHERE name = '其他收入' AND (icon IS NULL OR icon = 'grid');`,
    ],
  },
];
