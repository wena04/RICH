# Product

Current product behavior for Rich记账 as of August 12, 2026.

## Product promise

Rich记账 is a private, single-user bookkeeping app for iPhone. It favors fast manual capture and a
clear two-level money hierarchy over account aggregation, advertising, or cloud services.

- **Amount-first:** amount, category path, account, optional note, confirm.
- **Calendar-first:** the home screen organizes real entries by day and month.
- **Local-first:** SQLite is the source of truth; no account, backend, sync, or analytics.
- **Honest first run:** no fake balances or transactions.
- **Progressive detail:** categories work alone, while subcategories add precision when useful.

The visual language uses mint `#3ECDA5`, near-black active controls, square/near-square content
cards, and rounded shapes only for controls, pills, sheets, and icons.

## First-run experience

On a fresh database, the app creates one `现金` account and an idempotent starter taxonomy. Expense
and income categories are explicitly typed as `expense`, `income`, or `both`. Student-ready child
categories cover common needs such as:

- 餐饮 → 买菜、校园餐饮、咖啡、外卖、聚餐
- 交通 → 公交地铁、打车、油费、停车
- 学习 → 学费、书籍、软件、文具
- 住房、娱乐、付费会员、医疗、旅行

No transaction history is generated. If a user intentionally deletes a starter category, it does
not reappear on every launch.

## Navigation

The bottom bar contains 首页, a center add action, and 预算/计划. The home header exposes 资产管理
and 我的; secondary routes cover categories, trends, data management, About, and Privacy.

## Core flows

### Home

- Navigate months and view total expense/income.
- See record days in a seven-column calendar and select one day to filter the ledger.
- Read category → subcategory paths in transaction rows.
- Use a guided empty-state action to record the first entry or an entry for the selected day.

### New transaction

- Choose 支出 or 收入; only compatible typed categories appear.
- Enter an amount with the custom decimal and `+/-` calculator keypad.
- Select a main category, optionally select or create a child category, choose an account and date,
  add a note, then confirm.
- The last-used account is reused when still available.

### Transaction detail and edit

- Detail shows amount, date, account, category path, note, and applicable budget status.
- The polished edit screen supports transaction type, amount (including signed balance
  adjustments), date, typed main category, child category, account, note, save, and delete.
- Editing category or month immediately changes the derived budget views; transactions do not store
  a duplicated budget link.

### Categories

- Filter categories by 支出, 收入, or 全部.
- Create and edit `expense`, `income`, or `both` categories with persisted custom icons.
- Expand a category to create, rename, or delete subcategories.
- Deletion is guarded when transaction or hierarchy references would be broken.

### Accounts and transfers

- Manage cash, bank, credit, stored-value, and investment accounts.
- Derive balances from transaction history, set a target asset amount, or adjust an account to a
  chosen balance.
- Transfer between different accounts with amount arithmetic, date, and optional note. Both sides
  commit atomically as matched negative/positive balance adjustments and do not change
  income/expense totals.

### Hierarchical budgets

- Set an optional total budget for a `YYYY-MM` period.
- Set parent expense-category envelopes and optionally allocate parts to child categories.
- Child allocations do not add a second time to the parent total. If child allocations exceed the
  entered parent, the effective parent rises to cover them.
- Summary screens derive actual spending from transactions and show used percentage,
  remaining/overrun, child progress, and the parent envelope's unallocated remainder.
- Progress is mint below 80%, amber from 80–100%, and coral above 100%.

### Trends and portability

- Trends display real monthly expense/income history, category distribution, and optional
  subcategory drill-down.
- Export CSV v1, CSV v2, or a lossless SQLite database backup.
- Import legacy CSV into a selected account or restore a complete database after confirmation.

## Validation and trust rules

- Expense/income amount must be positive; balance adjustments may be signed.
- Dates use `YYYY-MM-DD`; notes are limited to 100 characters.
- Expense and income require a compatible category and an account.
- Child categories must belong to the selected parent.
- Budget limits use non-negative integer cents; persisted category/child limits are positive.
- Financial data leaves the device only through an explicit user export.

Product comparisons and future prioritization live in
[Competitive Research 2026](COMPETITIVE_RESEARCH_2026.md). Release readiness is tracked in
[Apple Release 2026](APPLE_RELEASE_2026.md).
