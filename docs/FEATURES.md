# RICH Feature Inventory

Current implementation surface as of August 12, 2026. `Implemented` means the flow uses persisted or
derived real data; final on-device pixel review is tracked separately.

## Implemented user features

### Home and navigation

- Safe-area-aware 首页 + center add + 预算/计划 navigation.
- Monthly calendar, record-day bands, today/selection states, and day filtering.
- Transactions grouped by date with daily and monthly expense/income totals.
- Category → subcategory paths and guided empty-state entry actions.

### Capture, detail, and editing

- Create expense or income with amount, date, account, typed category, optional subcategory, and
  note.
- Custom calculator keypad with decimal entry, backspace, addition, and subtraction.
- Inline subcategory selection and creation from the composer.
- Detail view with date, account, category path, amount, note, and category budget status.
- Polished edit UI for type, signed adjustment amount, date, category path, account, note, save,
  delete, and budget linkage.
- Balance adjustments change an account to a chosen target balance.

### Categories and starter taxonomy

- Category kinds: `expense`, `income`, and `both`; incompatible categories are filtered from entry
  and budget flows.
- Create, rename, type, icon-select, and guarded-delete main categories.
- Create, rename, and guarded-delete parent-scoped subcategories.
- Persisted two-tone custom icon catalog across entry, home, categories, budgets, and detail.
- Clean first run with one local cash account and student-friendly starter categories/subcategories;
  no fake transactions or balances.
- One-time starter marker prevents intentionally deleted defaults from returning every launch.

### Accounts and atomic transfers

- Cash, bank, credit, stored-value, and investment accounts.
- Derived balances, target-asset progress, create/edit, and guarded deletion.
- Transfers support source/destination, date, optional note, and keypad arithmetic.
- Both transfer rows commit in one SQLite transaction and roll back together; they remain outside
  income/expense totals.

### Hierarchical budgets and analytics

- Optional total budget per `YYYY-MM` period.
- Positive parent category envelopes plus positive child subcategory allocations.
- Effective parent is the larger of its entered amount and child sum, preventing double counting.
- Visible unallocated parent remainder and automatic parent increase when children exceed it.
- Actual category and child spend derived from expense transactions.
- Total/category/child progress, remaining or overrun state, and threshold colors.
- Six-month income/expense trends, category distribution, and subcategory drill-down.
- Transaction detail links to the applicable month's budget editor.

### Data ownership and recovery

- Local SQLite storage with no app account, backend, analytics, ads, or automatic sync.
- CSV v2 export with account/category/subcategory fields.
- Legacy Chinese CSV v1 export/import into a selected account.
- Lossless database backup and destructive-confirmation restore.
- Native document picker/share sheet plus in-app About and Privacy screens.

## Persisted data model

| Entity | Important fields and behavior |
| --- | --- |
| `accounts` | Unique name and account type |
| `categories` | Unique name, optional icon, `expense \| income \| both` kind |
| `subcategories` | Parent-scoped unique name and guarded deletion |
| `transactions` | Expense, income, or balance adjustment; integer cents; ISO date; account/category links |
| `budgets` | Unique month and optional total limit |
| `budget_categories` | Unique budget/parent pair and positive envelope |
| `budget_subcategories` | Unique budget/child pair and positive allocation |
| `app_meta` | Last-used account, target asset, and starter-taxonomy marker |

Foreign keys protect referenced rows, and triggers prevent assigning a transaction's subcategory to
the wrong parent category.

## Route inventory

| Route | Screen |
| --- | --- |
| `/(tabs)/index` | 首页 |
| `/(tabs)/charts` | 预算/计划 |
| `/transaction/new` | 记一笔 |
| `/transaction/[id]` | Transaction detail |
| `/transaction/edit/[id]` | Polished transaction editor |
| `/transaction/adjust` | 调整余额 |
| `/transaction/transfer` | 账户转账 |
| `/accounts` | 资产管理 |
| `/categories` | Typed category/subcategory management |
| `/categories/add` | Category/icon creator |
| `/budget/edit` | Hierarchical budget editor |
| `/trends` | 趋势图 |
| `/import-export` | 数据管理 |
| `/about`, `/privacy` | Product and privacy information |
| `/(tabs)/more` | 我的, reached from Home |

`/(tabs)/transactions` is intentionally hidden from the two-tab bar but is reachable through
**我的 → 全部账单**. It provides the complete dated ledger and links into transaction details.

## Current limitations

- No automatic cloud sync, recurring entries, reminders, receipt attachments, search, authentication,
  or multi-currency conversion.
- Transfer pairs do not yet have a shared persisted group ID for linked edit/delete.
- The native SQLite app targets iOS/Android; `mockups.html` is the browser preview.
- Automated logic/build checks pass, but final visual acceptance still requires an on-device route
  walkthrough and screenshots at target iPhone sizes.

See [Competitive Research 2026](COMPETITIVE_RESEARCH_2026.md) for the evidence behind future product
priorities and [Apple Release 2026](APPLE_RELEASE_2026.md) for release preparation.
