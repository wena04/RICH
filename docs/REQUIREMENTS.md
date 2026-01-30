# Requirements

Personal finance iOS app (MVP) inspired by "RICH 记账".

## Goals

- **Offline-first, single user**: All data stored locally on iPhone
- **Fast daily bookkeeping**: Amount-first entry flow with custom numpad
- **Flexible organization**: User-configurable categories and accounts
- **At-a-glance insights**: Category pie charts and monthly trends
- **Privacy by default**: No backend, no cloud sync, no analytics
- **Portability**: CSV and database file export/import

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Database**: SQLite (local-only)
- **Navigation**: Expo Router
- **UI**: Custom components matching RICH app design

## In-scope (MVP)

### Transactions

- Types: `expense`, `income`, `balance_adjustment`
- Amount-first entry with custom numpad
- Required: amount, date, category, account
- Optional: subcategory (max 1), note (max 100 chars)
- Default account: last-used

### Categories

- Two-level hierarchy: Category → Subcategory
- User-configurable (create/edit/delete)
- Icons for each category

### Accounts

- Types: cash, bank, credit, stored_value, investment
- Grouped display by type
- Balance adjustments for corrections

### Visualization

- Category expense pie chart
- Monthly expense/income trend line
- Subcategory drill-down

### Privacy & Portability

- Local SQLite storage only
- CSV export (v1 legacy format, v2 extended)
- Database file export/import

## Explicit Non-goals

- No backend or server APIs
- No cloud sync (iCloud/Dropbox)
- No analytics, ads, or tracking
- No multi-user or shared budgets
- No bank integrations
- No budgeting engine
- No ML categorization

## Acceptance Criteria

### Transactions

- [x] Add expense/income with required fields
- [x] Amount-first entry with custom numpad
- [x] Category icon grid selection
- [x] Last-used account as default
- [x] Edit and delete transactions
- [ ] Balance adjustment flow

### Categories

- [x] Create/edit/delete categories
- [x] Subcategories within categories
- [x] Expandable category list
- [x] Prevent deletion when in use

### Accounts

- [x] Create/edit/delete accounts
- [x] Grouped by type display
- [x] Account selection in transaction entry

### Visualization

- [x] Category pie chart
- [x] Monthly trends line chart
- [x] Subcategory drill-down

### Portability

- [x] CSV v1 export
- [x] CSV v2 export
- [x] Database file export/import
- [x] CSV import with account selection
