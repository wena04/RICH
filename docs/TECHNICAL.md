# Technical Documentation

## Architecture

### Overview

Single-user, offline-first personal finance app for iPhone:

- **React Native + Expo** for UI and runtime
- **SQLite** for local storage
- **No backend**: No accounts, no sync, no analytics

### Why Local-first

- **Reliability**: Works without network
- **Performance**: SQLite queries are fast for MVP-scale data
- **Privacy**: No data leaves the device
- **Simplicity**: No multi-tenant infrastructure

### Data Flow

```
User Input → Validation → SQLite → Aggregation → Charts
```

1. User enters transaction via amount-first numpad
2. App validates required fields
3. Transaction saved to SQLite with normalized references
4. Charts query SQLite for aggregations
5. `balance_adjustment` excluded from expense/income charts

### Initialization

On app startup:

1. Open/create SQLite database
2. Run migrations (create tables if needed)
3. Ensure at least one default account exists
4. Seed demo data if database is empty (37 transactions)

## Data Model

### Conventions

- **Money**: Integer cents (`amount_cents`)
- **Dates**: ISO format `YYYY-MM-DD`
- **IDs**: UUID strings with prefixes (`acc_`, `cat_`, `sub_`, `txn_`)

### Tables

#### `accounts`

| Field      | Type    | Notes                                        |
| ---------- | ------- | -------------------------------------------- |
| id         | TEXT PK | UUID with `acc_` prefix                      |
| name       | TEXT    | Required, unique                             |
| type       | TEXT    | cash, bank, credit, stored_value, investment |
| created_at | TEXT    | ISO timestamp                                |
| updated_at | TEXT    | ISO timestamp                                |

#### `categories`

| Field      | Type    | Notes                   |
| ---------- | ------- | ----------------------- |
| id         | TEXT PK | UUID with `cat_` prefix |
| name       | TEXT    | Required, unique        |
| icon       | TEXT    | Optional icon id (migration v3) |
| created_at | TEXT    | ISO timestamp           |
| updated_at | TEXT    | ISO timestamp           |

#### `budgets` (migration v4)

| Field       | Type    | Notes                          |
| ----------- | ------- | ------------------------------ |
| id          | TEXT PK | UUID with `budget_` prefix     |
| period      | TEXT    | `YYYY-MM`, unique per month    |
| total_cents | INTEGER | Optional overall monthly cap   |
| created_at  | TEXT    | ISO timestamp                  |
| updated_at  | TEXT    | ISO timestamp                  |

#### `budget_categories` (migration v4)

| Field        | Type    | Notes                              |
| ------------ | ------- | ---------------------------------- |
| id           | TEXT PK | UUID with `bc_` prefix             |
| budget_id    | TEXT FK | References budgets (CASCADE)       |
| category_id  | TEXT FK | References categories                |
| limit_cents  | INTEGER | Monthly limit for this category    |
| created_at   | TEXT    | ISO timestamp                      |
| updated_at   | TEXT    | ISO timestamp                      |

Constraint: `(budget_id, category_id)` unique. Spent amounts are computed at query time from `transactions` — no `budget_id` on transactions.

#### `subcategories`

| Field       | Type    | Notes                           |
| ----------- | ------- | ------------------------------- |
| id          | TEXT PK | UUID with `sub_` prefix         |
| category_id | TEXT FK | Required, references categories |
| name        | TEXT    | Required                        |
| created_at  | TEXT    | ISO timestamp                   |
| updated_at  | TEXT    | ISO timestamp                   |

Constraint: `(category_id, name)` unique

#### `transactions`

| Field          | Type    | Notes                               |
| -------------- | ------- | ----------------------------------- |
| id             | TEXT PK | UUID with `txn_` prefix             |
| type           | TEXT    | expense, income, balance_adjustment |
| amount_cents   | INTEGER | Required                            |
| date           | TEXT    | YYYY-MM-DD                          |
| account_id     | TEXT FK | Required                            |
| category_id    | TEXT FK | Required for expense/income         |
| subcategory_id | TEXT FK | Optional                            |
| note           | TEXT    | Max 100 chars                       |
| created_at     | TEXT    | ISO timestamp                       |
| updated_at     | TEXT    | ISO timestamp                       |

Invariants:

- `balance_adjustment` must have NULL category/subcategory
- `subcategory_id` must reference a subcategory of `category_id`

## Export Formats

### CSV v1 (Legacy)

Compatible with original RICH app exports.

**Headers (Chinese):**

```
日期,收支类型,类别,金额,配注
```

**Format:**

- Date: `YYYY/MM/DD`
- Type: `支出` (expense) or `收入` (income)
- Amount: Decimal string (e.g., `12.34`)
- No account or subcategory columns

**Import rules:**

- User must select target account
- Missing categories are created automatically
- Subcategory set to null

### CSV v2 (Extended)

**Headers (English):**

```
date,type,amount,account,account_id,category,category_id,subcategory,subcategory_id,note
```

**Format:**

- Date: `YYYY-MM-DD`
- Type: `expense`, `income`, `balance_adjustment`
- Includes IDs for better round-trip

### Database Export

Full SQLite file export for:

- Complete backup
- Device migration
- No data loss from format conversion

## File Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx      # Custom tab bar (首页, FAB, 预算/计划)
│   ├── index.tsx        # Home (calendar + day filter)
│   └── charts.tsx       # Budget page
├── budget/
│   └── edit.tsx         # Budget editor (per-category limits)
├── trends.tsx           # Charts sub-view (pie, trends)
├── transaction/
│   ├── new.tsx          # Add transaction (numpad)
│   ├── [id].tsx         # Transaction detail
│   ├── edit/[id].tsx    # Transaction edit form
│   ├── transfer.tsx     # Account transfer
│   └── adjust.tsx       # Balance adjustment
├── categories/
│   └── add.tsx          # Icon picker for custom categories
├── accounts.tsx
├── categories.tsx
└── import-export.tsx

components/
├── CategoryIcon.tsx     # 111 SVG category icons
└── DatePickerModal.tsx  # Date picker for add screen

assets/icons/categories/ # Source SVG files (111)

src/
├── db/
│   ├── migrations.ts    # Schema (v1–v4)
│   ├── seed.ts          # Demo data (37 transactions)
│   └── repo/
│       ├── budgets.ts   # Budget CRUD + summary
│       └── ...
├── domain/
│   ├── types.ts
│   └── categories.ts  # DEFAULT_CATEGORIES constant
└── features/
    ├── charts/
    └── importExport/
```
