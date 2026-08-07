# RICH Feature Inventory

This is the current product surface traced from code. `Implemented` means the flow persists or
derives real data; it does not mean every screen has completed final pixel comparison.

## 1. Implemented user features

### Home and navigation

- Two visible tabs plus center add action: 首页, `+`, 预算/计划.
- Safe-area-aware bottom bar on notched/home-indicator devices.
- Home brand dropdown opens 资产管理; profile icon opens 我的.
- Month navigation reloads that month's transactions and totals.
- Calendar marks dates with records, joins consecutive dates into bands, outlines today with a dot,
  and uses a gray selection circle.
- Tapping a date filters the ledger to that day; tapping again or 查看全部 clears the filter.
- Transactions are grouped by date with daily expense/income totals.

### Transaction capture and maintenance

- Create expense or income with amount, date, account, category, optional subcategory, and note.
- Expense and income have separate built-in category catalogs.
- Main category selection expands subcategories directly below the selected row.
- Add a subcategory from the composer on iOS and Android.
- Custom amount keypad supports decimal entry, backspace, addition, subtraction, and confirmation.
- Transaction detail shows category icon, note/category, amount, and category budget status.
- Edit and delete existing transactions.
- Balance adjustment records change an account to a target balance.

### Categories and icons

- Create, rename, and guarded-delete main categories.
- Create, rename, and guarded-delete subcategories.
- Category deletion is blocked while related subcategories or transactions exist.
- 111 black/mint custom icons with a sectioned five-column picker.
- Custom icon IDs persist in SQLite and render in the composer, home ledger, category manager,
  budget screens, and transaction details.
- Built-in expense order follows the original RICH category grid; income has its own catalog.

### Accounts and transfers

- Account types: cash, bank, credit, stored value, investment.
- Create, edit, and guarded-delete accounts.
- Account balances are derived from transaction history.
- Target asset amount persists in `app_meta` and drives a visual completion meter.
- Adjust an account to a chosen balance through a balance-adjustment transaction.
- Transfer between different accounts with chosen date, optional note, amount arithmetic, and account selectors.
- Transfer is represented by matched negative/positive balance adjustments, so it does not affect income/expense totals.

### Budgets and analytics

- One optional total budget per `YYYY-MM` period.
- Per-expense-category monthly limits.
- Actual spend is computed from existing expense transactions; no manual spent value is stored.
- Budget summary shows total used, remaining/overrun, and threshold colors.
- Category rows show actual vs limit with progress bars.
- Transaction detail links to the budget editor for that transaction's month.
- Trend screen shows real monthly income/expense data and expense-category distribution.
- Tapping a category reveals real subcategory amounts and proportional bars.

### Data ownership and recovery

- SQLite local storage; no app account, backend, analytics, or automatic cloud sync.
- Full database-file export for lossless backup/migration.
- Full database-file restore with destructive confirmation.
- CSV v2 export with account/category/subcategory IDs and fields.
- Legacy CSV v1 export and import to a selected target account.
- System document picker and share sheet integration.
- In-app About and Privacy screens explain the local-first behavior.

## 2. Persisted data model

| Entity | Important fields/behavior |
|---|---|
| `accounts` | unique name, account type |
| `categories` | unique name, optional custom icon ID |
| `subcategories` | category-scoped unique name; restricted deletion |
| `transactions` | expense, income, or balance adjustment; integer cents; ISO date; account/category links |
| `budgets` | unique monthly period; optional total limit |
| `budget_categories` | unique budget/category pair; positive category limit |
| `app_meta` | target asset and last-used app metadata |

Money is stored as integer cents. Dates are local calendar dates in `YYYY-MM-DD`. Database triggers
prevent assigning a subcategory to the wrong parent category.

## 3. Route inventory

| Route | Screen |
|---|---|
| `/(tabs)/index` | 首页 |
| `/(tabs)/charts` | 预算/计划 |
| `/transaction/new` | 记一笔 modal |
| `/transaction/[id]` | transaction detail |
| `/transaction/edit/[id]` | transaction edit form |
| `/transaction/adjust` | 调整余额 |
| `/transaction/transfer` | 账户转账 |
| `/accounts` | 资产管理 |
| `/categories` | 自定义/category management |
| `/categories/add` | 添加自定义类目/icon picker |
| `/budget/edit` | 设置分类预算 |
| `/trends` | 趋势图 |
| `/import-export` | 数据管理 |
| `/about` | 关于应用 |
| `/privacy` | 隐私政策 |
| `/(tabs)/more` | 我的, reached from the home profile icon |
| `/(tabs)/transactions` | legacy full transaction list; routable but intentionally hidden |

## 4. Known limitations and next product decisions

- No automatic cloud sync. Phone migration uses an exported database file and the system share/storage flow.
- The native app requires iOS/Android because `expo-sqlite` is the storage layer. `docs/mockups.html`
  remains the no-install browser preview.
- Custom categories are not currently typed as expense-only or income-only; a user-created category can
  appear in both composers. Built-in catalogs are correctly separated.
- Transfers are stored as two balance-adjustment rows and do not yet have a shared transfer ID for linked editing.
- Transaction edit still uses a conventional form rather than the high-fidelity amount-first composer.
- No recurring transactions, reminders, receipt attachments, search, multi-currency conversion, or authentication.
- No automated screenshot-diff suite yet; final visual acceptance still needs device screenshots at target sizes.

## 5. Competitive landscape and roadmap ideas

Researched against current bookkeeping/finance apps (YNAB, Monarch, Copilot Money, Rocket Money,
Cleo, Origin, and Chinese-market leaders 钱迹, 随手记, 小白记账, 抹米记账, 喵钱记账, 试试记账).
Ideas below are filtered for fit with RICH's actual architecture: local SQLite, no backend, no
accounts, no analytics. Anything that needs a server is called out explicitly.

### 5.1 Where RICH already differentiates

- **Fully local, no-cloud data model** is real and rare — most competitors (even privacy-marketed
  ones like Monarch/Copilot) sync to a server. RICH's "data never leaves the device" claim can be
  stated plainly instead of as fine print; `/about` and `/import-export` are the natural places to
  say it out loud rather than bury it in a privacy policy.
- **Square-corner, high-contrast visual identity** — Cash App, Robinhood, Revolut, Copilot, Monarch
  all default to rounded cards. RICH's near-zero-radius cards (`RICH_RADIUS.card = 3`) are a
  genuine market differentiator, not a gap to fix. This means legibility on dense numeric screens
  has to come from spacing/weight/color discipline (already the approach in `constants/Design.ts`),
  not from softening the geometry to match competitors.
- **"Three-nothings" positioning** (钱迹: 无广告/无开屏/无理财) maps directly onto RICH: no ads, no
  splash upsell, no investment product cross-sell. Worth stating on `/about` alongside the privacy
  claim above.

### 5.2 Near-term additions compatible with the local-only model

Ranked by leverage vs. implementation cost given the existing schema:

1. **Recurring transactions** — highest-requested gap in section 4. Needs one new table
   (`recurring_transactions`: cadence, next-due date, template transaction fields) and a due-check
   on app foreground/home mount that materializes rows into `transactions`. No network required.
2. **Search** — `transactions` already has note/category/account; a simple client-side filter over
   the existing query layer covers most value without new schema.
3. **Natural-language quick add** — 小白记账's "极速AI记账" pattern: parse free text like "午饭15元"
   into amount + category + date. This is regex/keyword parsing against the existing category
   names, not a network call — genuinely on-brand for a privacy-first app and a good first "AI"
   feature since it needs no model hosting.
4. **Reimbursement / refund / installment as first-class transaction semantics** — several
   Chinese apps (随手记, 钱迹) treat these as distinct from plain expense/income. RICH's schema
   already has a `note` field and category catalog; this could start as dedicated categories
   (already partially covered by 报销/退款 in `DEFAULT_INCOME_CATEGORIES`) before becoming a
   first-class linked transaction type.
5. **Net worth / trend dashboard** — `/trends` already aggregates monthly income/expense and
   category distribution (`src/features/charts/aggregations.ts`); extending it to plot account
   balances over time (assets already derived per-account) is additive, not a new subsystem.
6. **Home-screen widget for quick entry** — repeatedly the single biggest retention lever cited
   across Chinese bookkeeping apps (抹米记账, 小小账本, 喵钱记账). Requires an Expo/React Native
   widget extension (e.g. `expo-apple-targets` style native module) — bigger lift than the above,
   but high leverage since daily-entry friction is the main churn driver for this category of app.
7. **Multiple ledgers (账本)** — separate transaction contexts (e.g. personal vs. shared vs. side
   project), a distinctly Chinese-market pattern (小白记账/钱迹). Would need a `ledger_id` column
   threaded through `transactions`, `budgets`, and `accounts` — a real schema migration, not a
   cosmetic add.

### 5.3 AI integration ideas — and the trust rule to apply to all of them

Cross-cutting rule from the research: privacy-focused users are more automation-skeptical than
average, so every AI feature should (a) show why a suggestion was made, (b) require a confirm step
before it changes data, and (c) always allow manual override. Never auto-commit an AI guess to
`transactions` silently.

- **Auto-categorization that learns from corrections** (Copilot Money pattern) — feasible fully
  on-device: track category corrections per note-keyword and bias future suggestions, no model
  hosting needed.
- **Natural-language entry** — see 5.2 item 3; the lowest-cost real "AI" feature to ship first.
- **Receipt / payment-screenshot OCR** (钱迹, 随手记) — Apple's on-device Vision framework can do
  this without a network call, consistent with the local-only architecture; bigger lift than NL
  entry but still no backend required.
- **Gentle anomaly detection** ("unusually high 餐饮 this week") — computable from existing
  monthly aggregations, no ML needed for a first version, just threshold comparison against
  historical averages already reachable from `getMonthlyTotals`.
- **Conversational data queries** ("how much did I spend on 交通 last month?") — would need an
  on-device or bundled small model to parse intent; flag as the largest-effort item in this list
  and the first one that might justify pulling in Apple's on-device Foundation Models framework
  (iOS 18+) rather than a hand-rolled parser.
- Explicitly **not recommended**: predictive cash-flow forecasting. Research flagged this as
  unreliable for irregular income/cash spending even at YNAB/Monarch scale, and RICH has no income
  regularity signal to anchor a forecast on.

### 5.4 Ideas that need a backend (out of scope unless RICH's architecture changes)

Family/shared accounts (Monarch's model), true multi-device sync, and SMS/notification-listener
auto-capture (试试记账 — technically on-device on Android, but iOS does not expose the equivalent
API) all require infrastructure or platform access RICH does not currently have. Listed here so
they aren't silently forgotten, not because they're recommended next steps.

### 5.5 UI/UX benchmarking notes

- Primary money figures should stay visually dominant on every screen; this is already the pattern
  in `MoneyNumpad` and the transaction detail card and should be the bar for any new screen.
- Keep RICH's mint (`PRIMARY_GREEN`) and the income-only green (`INCOME_GREEN`) visually distinct —
  competitor research flagged brand-green vs. positive/income-green collision as a common mistake
  worth avoiding deliberately (RICH already has separate tokens for this; keep them separate in use
  too, not just in `Colors.ts`).
- Empty states (budget empty state, `/trends` with no data) are a trust-building opportunity, not
  a dead end — the existing 您还未创建预算 empty state with the illustrated donut is the right
  pattern to replicate for any other future empty state rather than a bare "no data" message.
- Onboarding is high-leverage industry-wide (~26% day-one return rate cited across sources) but
  RICH currently has no first-run flow at all — worth scoping a minimal one-question-per-screen
  setup (starting account + target asset) before adding more feature surface.
