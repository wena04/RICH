# Data model (MVP)

This document defines the SQLite schema (logical model) and invariants for the MVP.

## Conventions

- **Money**:
  - Stored as **integer cents** (`amount_cents`) in the database.
  - CSV formats may use decimal strings; conversion happens at import/export boundaries.
- **Dates**:
  - Stored as ISO date strings in `YYYY-MM-DD` format.
  - Times/timezones are not required for MVP.
- **IDs**:
  - Use opaque IDs (e.g., UUID strings) or autoincrement integers. Implementation choice; invariants do not depend on the ID type.

## Tables

### `accounts`

Represents where money lives. Each transaction belongs to exactly one account.

Fields:

- `id` (PK)
- `name` (string, required, unique within user)
- `type` (string, required): one of `cash`, `bank`, `credit`, `stored_value`, `investment`
- `created_at` (optional)
- `updated_at` (optional)

Notes:

- “Type” is informational for the MVP (used for grouping/labels).

### `categories`

Top-level transaction classification.

Fields:

- `id` (PK)
- `name` (string, required, unique within user)
- `created_at` (optional)
- `updated_at` (optional)

### `subcategories`

Second-level classification scoped to a category.

Fields:

- `id` (PK)
- `category_id` (FK → `categories.id`, required)
- `name` (string, required)
- `created_at` (optional)
- `updated_at` (optional)

Invariants:

- A subcategory **must** belong to exactly one category.
- `(category_id, name)` should be unique to prevent duplicates within the same category.

### `transactions`

Core ledger of user-entered events.

Fields:

- `id` (PK)
- `type` (string, required): `expense` | `income` | `balance_adjustment`
- `amount_cents` (integer, required)
- `date` (string, required): `YYYY-MM-DD`
- `account_id` (FK → `accounts.id`, required)
- `category_id` (FK → `categories.id`, nullable)
- `subcategory_id` (FK → `subcategories.id`, nullable)
- `note` (string, nullable; max length 100 characters)
- `created_at` (optional)
- `updated_at` (optional)

Invariants:

- Each transaction belongs to exactly **one** account (`account_id` required).
- For `expense` and `income`:
  - `category_id` is **required**
  - `subcategory_id` is optional
- For `balance_adjustment`:
  - `category_id` is **NULL**
  - `subcategory_id` is **NULL**
- If `subcategory_id` is set, it must be scoped to `category_id`:
  - The referenced `subcategories.category_id` must equal `transactions.category_id`.
- `note` must be at most **100 characters** when present.

Derived behavior:

- Charts and trend reports treat `expense` and `income` as cashflow.
- `balance_adjustment` is excluded from cashflow charts and exists to correct state.

### `asset_goals`

Visualization-only targets for assets.

Fields:

- `id` (PK)
- `name` (string, required)
- `target_amount_cents` (integer, required)
- `account_id` (FK → `accounts.id`, nullable)
- `created_at` (optional)
- `updated_at` (optional)

Notes:

- Asset goals do not affect transactions, balances, or exports beyond visualization.

## Balance computation (conceptual)

The MVP maintains balances by aggregation, not by storing a mutable “current balance” field.

For an account and date range, balance can be derived from:

- Starting from 0 (or an imported baseline), then applying:
  - expenses (negative)
  - income (positive)
  - balance adjustments (positive/negative correction deltas)

Exact sign conventions (store signed vs store unsigned + type) are implementation details, but must preserve the invariants and chart exclusions described above.

