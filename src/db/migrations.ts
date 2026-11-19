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
  {
    // Original Rich budget/plan model (see docs/TECHNICAL.md "Budget envelopes and savings plans").
    // The v4/v6 category-limit tables are left in place until the budget UI stops using them.
    version: 8,
    statements: [
      `
      CREATE TABLE IF NOT EXISTS budget_envelopes (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT,
        start_period TEXT NOT NULL,
        first_period_amount_cents INTEGER,
        is_archived INTEGER NOT NULL DEFAULT 0,
        sort_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        CHECK (kind IN ('monthly','special')),
        CHECK (length(trim(name)) > 0),
        CHECK (description IS NULL OR length(description) <= 100),
        CHECK (start_period GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
        CHECK (
          first_period_amount_cents IS NULL
          OR (kind = 'monthly' AND first_period_amount_cents >= 0)
        ),
        CHECK (is_archived IN (0,1))
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS budget_envelope_amounts (
        id TEXT PRIMARY KEY,
        envelope_id TEXT NOT NULL,
        effective_period TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (envelope_id) REFERENCES budget_envelopes(id) ON DELETE CASCADE,
        CHECK (amount_cents >= 0),
        CHECK (effective_period GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
        UNIQUE (envelope_id, effective_period)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS savings_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT,
        source_envelope_id TEXT NOT NULL,
        target_cents INTEGER NOT NULL,
        monthly_cents INTEGER NOT NULL,
        start_period TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        ended_period TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        sort_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (source_envelope_id) REFERENCES budget_envelopes(id) ON DELETE RESTRICT,
        CHECK (length(trim(name)) > 0),
        CHECK (description IS NULL OR length(description) <= 100),
        CHECK (target_cents > 0),
        CHECK (monthly_cents > 0 AND monthly_cents <= target_cents),
        CHECK (start_period GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
        CHECK (status IN ('active','completed','cancelled')),
        CHECK (
          (status = 'active' AND ended_period IS NULL)
          OR (status != 'active' AND ended_period IS NOT NULL)
        ),
        CHECK (is_archived IN (0,1))
      );
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_savings_plans_monthly_source_insert
      BEFORE INSERT ON savings_plans
      BEGIN
        SELECT CASE
          WHEN (SELECT kind FROM budget_envelopes WHERE id = NEW.source_envelope_id) != 'monthly'
          THEN RAISE(ABORT, 'plan_source_must_be_monthly_budget')
        END;
      END;
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_savings_plans_monthly_source_update
      BEFORE UPDATE OF source_envelope_id ON savings_plans
      BEGIN
        SELECT CASE
          WHEN (SELECT kind FROM budget_envelopes WHERE id = NEW.source_envelope_id) != 'monthly'
          THEN RAISE(ABORT, 'plan_source_must_be_monthly_budget')
        END;
      END;
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_budget_envelopes_kind_locked
      BEFORE UPDATE OF kind ON budget_envelopes
      WHEN NEW.kind != OLD.kind
      BEGIN
        SELECT RAISE(ABORT, 'budget_kind_is_immutable');
      END;
      `,
      `
      ALTER TABLE transactions
      ADD COLUMN budget_envelope_id TEXT REFERENCES budget_envelopes(id) ON DELETE SET NULL;
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_transactions_budget_expense_insert
      BEFORE INSERT ON transactions
      WHEN NEW.budget_envelope_id IS NOT NULL AND NEW.type != 'expense'
      BEGIN
        SELECT RAISE(ABORT, 'budget_assignment_requires_expense');
      END;
      `,
      `
      CREATE TRIGGER IF NOT EXISTS trg_transactions_budget_expense_update
      BEFORE UPDATE OF type, budget_envelope_id ON transactions
      WHEN NEW.budget_envelope_id IS NOT NULL AND NEW.type != 'expense'
      BEGIN
        SELECT RAISE(ABORT, 'budget_assignment_requires_expense');
      END;
      `,
      `CREATE INDEX IF NOT EXISTS idx_transactions_budget_envelope_id ON transactions(budget_envelope_id);`,
      `CREATE INDEX IF NOT EXISTS idx_budget_envelope_amounts_envelope ON budget_envelope_amounts(envelope_id, effective_period);`,
      `CREATE INDEX IF NOT EXISTS idx_savings_plans_source ON savings_plans(source_envelope_id);`,
    ],
  },
];
