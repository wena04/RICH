# Requirements (MVP)

This repository contains documentation and scaffolding for a personal finance iOS app (MVP) inspired by “RICH 记账”.

## Goals

- **Offline-first, single user**: The app is designed for personal use on one iPhone, with all data stored locally.
- **Fast daily bookkeeping**: Amount-first entry flow to minimize friction when recording transactions.
- **Flexible organization**: User-configurable categories, optional subcategories, and multiple accounts.
- **Useful at-a-glance insights**: Core charts for category distribution and monthly trends, including subcategory drill-down.
- **Privacy by default**: No backend, no cloud sync, no analytics. Data stays on-device unless the user explicitly exports it.
- **Portability**: CSV import/export for backups and phone migration, plus database file export/import.

## In-scope (MVP)

### Transactions

- **Transaction types**: `expense`, `income`, `balance_adjustment`
- **Amount-first entry**: Amount is entered before category/account selection.
- **Required fields**: `amount`, `date`, `category`, `account`
- **Optional fields**:
  - `subcategory` (max 1; scoped to category)
  - `note` (max 100 characters)
- **Account association**: Each transaction belongs to exactly one account.
- **Default account**: The last-used account is preselected for new transactions.

### Categories

- **Two-level hierarchy**: Category → Subcategory (subcategory scoped to its category)
- **Subcategory optional**: A transaction may omit subcategory.
- **User-configurable**: Users can create/rename/delete categories and subcategories.

### Accounts & Assets

- **Multiple accounts**: cash, bank, credit, stored value, investment (type is informational).
- **Balance adjustments**: Used for state corrections; not treated as normal income/expense.
- **Asset goals**: Visualization-only targets (no automated tracking or syncing).

### Visualization

- **Category pie chart**
- **Monthly expense/income trends**
- **Subcategory drill-down** from category views

### Privacy & Portability

- **Local SQLite storage only**
- **CSV export**:
  - **v1**: compatible with existing data
  - **v2** (optional): extended export
- **Database file export/import** for migration and backup

## Explicit non-goals (MVP)

- **No backend** (no server APIs, no accounts, no remote storage)
- **No cloud sync** (iCloud/Dropbox/etc.)
- **No analytics, ads, or tracking**
- **No multi-user / shared budgets**
- **No bank integrations** (no automatic transaction fetching)
- **No budgeting engine** (envelopes, forecasts, alerts)
- **No ML categorization**

## Acceptance criteria (“done” means)

### Transactions

- A user can add an `expense` or `income` with required fields and optional `subcategory` and `note`.
- Note length is enforced at **≤ 100 characters**.
- The add flow is **amount-first** and follows the specified field order.
- The default account for new transactions is the **last-used account**.
- A user can edit and delete transactions.
- `balance_adjustment` is supported as a **state correction** and is not included as income/expense in charts.

### Categories & subcategories

- A user can create, edit, and delete categories.
- A user can create, edit, and delete subcategories **within** a category.
- A subcategory cannot exist without a parent category.

### Accounts & assets

- A user can create multiple accounts and assign each transaction to exactly one account.
- `balance_adjustment` always targets exactly one account.
- Asset goals can be created and visualized, with no effect on transaction math.

### Visualization

- Category pie chart reflects expenses (and/or income, as specified in product behavior) and supports drill-down to subcategory.
- Monthly trend chart displays expense and income trends by month.

### Portability

- A user can export CSV in **v1** format.
- A user can optionally export CSV in **v2** format.
- A user can import CSV (at minimum from the sample format defined in docs).
- A user can export and import the SQLite database file.

