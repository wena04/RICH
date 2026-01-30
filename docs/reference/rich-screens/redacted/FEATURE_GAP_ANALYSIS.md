# Feature gap analysis (original screenshots vs our MVP plan)

This compares what is visible in the original “RICH 记账” screenshots with the MVP scope defined in this repo’s docs.

## Covered by our MVP plan (matches well)

- **Amount-first entry** with large amount input, numeric keypad, and confirmation action.
- **Expense vs income** selection (UI uses tabs; our plan uses `type` and an ordered flow).
- **Categories and optional subcategories**:
  - Visual evidence of expandable category rows (suggesting subcategory hierarchy).
  - Grid-based category selection during entry.
- **Accounts**:
  - Account picker during entry (e.g., “Chase”).
  - Multiple account types / groupings shown on the asset screen.
- **Balance corrections**:
  - “余额更新”/“更新余额” flows match our `balance_adjustment` requirement conceptually.
- **Asset goal / milestone visualization**:
  - “目标资产” input and progress indicator align with our “asset goals are visualization-only”.
- **Export**:
  - “导出数据” surfaced in profile aligns with our portability requirements.
- **Monthly trends & category distribution**:
  - Trend and donut/pie chart motifs appear in the budget/plan section and align with our visualization goals (even though the surrounding budgeting module is out-of-scope).

## Partially covered (we have the concept, but UX details differ)

### 1) Home as a calendar-first navigation

Observed:

- Month calendar with highlighted active days.
- Top-level monthly expense/income totals.
- Daily drill-down list with per-day totals.

Our docs:

- We mention “Home / Overview” with month totals and a month selector, but not a **calendar-centric** home.

Suggestion (still within MVP constraints):

- Consider adopting calendar-first navigation on Home, because it improves “find by day” workflows without adding new domain entities.

### 2) Balance correction entry model (set-to-value vs delta)

Observed:

- User appears to enter a **new account balance**, and the UI shows computed delta (“余额减少/增加”).

Our docs:

- `balance_adjustment` is modeled as a transaction type; we describe it as a correction delta.

Compatibility:

- Both can coexist: UX can be “enter new balance”, while storage persists an adjustment delta as `balance_adjustment`.

## Present in screenshots but NOT in our MVP plan (gaps / out-of-scope inspirations)

### 1) Budget / plan module

Observed:

- Dedicated tab “预算/计划” with:
  - plan list
  - “create budget” flow
  - budget donut chart and trend tile
- Transactions can “belong to budget/plan” (“所属预算/计划”).

Our MVP plan:

- Explicitly states **no budgeting engine** as an MVP non-goal.

Impact:

- This is a deliberate difference. If you later want parity, you’d need new entities (budgets/plans), transaction associations, and budget math.

### 2) Account transfer

Observed:

- “账户转账” (account transfer) action in asset management.

Our MVP plan:

- Not listed. Current transaction types are: expense/income/balance_adjustment.

Options:

- Keep out-of-scope for MVP, or represent transfers as paired transactions (one outflow + one inflow) in a future iteration. Either approach would require clear UX to avoid misclassification.

### 3) Reminders and help center

Observed:

- “设置记账提醒” (bookkeeping reminders)
- “帮助中心” (help center)
- “隐私协议” (privacy policy page)

Our MVP plan:

- Not included (and no backend/analytics remains correct).

Notes:

- A local-only reminder feature is feasible later without violating privacy constraints, but it is still additional scope.

### 4) Category icons and name length constraints

Observed:

- Icon selection for categories.
- Category name length hint (≤ 6 characters).

Our MVP plan:

- Does not specify icons or name-length limits.

Notes:

- Icons are a UI enhancement; they do not change the underlying category/subcategory model.

## “Are we missing anything critical?”

Based on these screenshots, the only potentially **workflow-critical** gap (not just “nice-to-have”) is **account transfer**, depending on your personal usage. Everything else either:

- is already covered by the MVP plan (transactions, categories, accounts, balance corrections, charts, export), or
- is a larger product area intentionally excluded (budgets/plans), or
- is a convenience feature (calendar-first home, reminders, icons).

