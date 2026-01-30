# Product (MVP UX)

This document describes the MVP user experience for a single-user, offline-first iPhone app inspired by “RICH 记账”.

## Principles

- **Amount-first**: The fastest path to recording is: amount → classify → choose account → add optional note → save.
- **Local-first**: All data lives in local SQLite. No accounts, no backend, no sync, no analytics.
- **Private by default**: The app should not transmit any finance data off-device.
- **Configurable organization**: Categories/subcategories are user-configurable, and accounts are user-configurable.

## Screens & flows

### 1) Home / Overview

Purpose: quick access to current month status and primary actions.

- Primary actions:
  - **Add transaction**
  - Navigate to **Charts**
  - Navigate to **Accounts**
  - Navigate to **Categories**
  - Navigate to **Import/Export**
- Summary content (MVP):
  - Current month totals: expense and income
  - Quick filters (optional): month selector

### 2) Transactions list

Purpose: review and manage recorded transactions.

- Default sort: **date descending**, newest first.
- Each row displays:
  - Amount (signed or colored by type)
  - Category (and subcategory if present)
  - Account
  - Date
  - Optional note indicator if note is present
- Row tap opens **Transaction detail / edit**.
- Delete is available from detail/edit (with confirmation).

### 3) Add Transaction (amount-first entry)

Purpose: create a transaction quickly and correctly.

The form flow must follow this order:

1. **Amount** (required)
2. **Type** (required): `expense` / `income` / `balance_adjustment`
3. **Date** (required)
4. **Category** (required for `expense` and `income`)
5. **Subcategory** (optional; only shown after category selection; scoped to chosen category; max 1)
6. **Account** (required; default is last-used account)
7. **Note** (optional; max 100 characters)
8. **Save**

Behavior by type:

- **Expense**
  - Category required
  - Subcategory optional
  - Amount stored as a positive value in UI (implementation may store signed); charts treat it as expense
- **Income**
  - Category required
  - Subcategory optional
  - Charts treat it as income
- **Balance adjustment**
  - Used for **state corrections** to an account balance
  - **Category and subcategory are not applicable** and must be hidden/disabled
  - Amount represents an adjustment amount (delta) and should be clearly labeled as correction

Validation:

- Amount must be provided and valid.
- Date must be provided.
- Account must be provided.
- Category must be provided for expense/income.
- Note length is capped at **100 characters**.

### 4) Transaction detail / edit

Purpose: view and modify an existing transaction.

- Displays all fields relevant to the transaction type.
- Edit supports:
  - Changing amount, date, category, subcategory, account, note
  - Changing type (subject to rules; if switching to/from `balance_adjustment`, category fields are cleared and hidden)
- Delete supports:
  - Confirm deletion before removing

### 5) Categories management

Purpose: configure category taxonomy.

- List of categories (user-configurable)
- For each category:
  - View/edit category name
  - Manage subcategories within that category
  - Delete category (see data impact note below)

Subcategories:

- Subcategory creation is **within** a category.
- Subcategory is always scoped to exactly one category.

Data impact note (MVP):

- If deleting a category/subcategory that is referenced by existing transactions, the app must define a safe behavior (e.g., prevent deletion or require reassignment). The MVP should prefer **preventing deletion when in use** to avoid data loss.

### 6) Accounts management

Purpose: manage where money lives.

- Accounts list with:
  - Name
  - Type (cash/bank/credit/stored value/investment)
  - Current balance (derived; see architecture/data model)
- Create/edit/delete account
- Default account behavior:
  - The app remembers the last-used account for quick entry.

Balance adjustments:

- Creating a `balance_adjustment` transaction should be accessible from accounts (optional) or from Add Transaction type selection.
- The UI should clearly communicate that it’s a **correction**, not income/expense.

### 7) Assets & goals (visualization-only)

Purpose: allow the user to set target values for visualization.

- User can create an asset goal with:
  - Name/label
  - Target amount
  - Optional account association (implementation choice), but it remains visualization-only
- Asset goals do not:
  - Create transactions
  - Affect balances automatically
  - Trigger notifications

### 8) Charts

Purpose: understand spending and income trends.

#### Category pie chart

- Default scope: selected month (current month by default).
- Expense categories are aggregated for the pie.
- Drill-down:
  - Tap a category slice to show its **subcategories breakdown** (subcategory drill-down).
  - If no subcategories exist or were used, show “No subcategory data”.

#### Monthly expense/income trends

- Displays month-by-month totals for expense and income.
- `balance_adjustment` is excluded from expense/income totals.

#### Subcategory drill-down behavior

- Drill-down is always within a selected category.
- Subcategory rows include total amount and (optionally) percentage of category total.

### 9) Import / Export (backup & migration)

Purpose: user-controlled portability.

- Export options:
  - CSV **v1** (compatible)
  - Optional CSV **v2** (extended)
  - Export database file
- Import options:
  - Import CSV (v1 required; v2 optional)
  - Import database file

UX warnings:

- Exported files may contain sensitive data; the app should warn the user to store them securely.
- Import should validate format and reject malformed rows safely.

