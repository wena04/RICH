# Screenshot notes (original “RICH 记账”)

These notes summarize what is visibly present in the provided screenshots. They are intended to inform UX and information architecture decisions for this MVP (without copying proprietary assets).

## 01 — Home: month calendar + daily list (`01-home-calendar.png`)

Observed UI:

- Branding header and a profile icon (top-right).
- Month selector (“1月”) at top-left of the calendar area.
- Two top-level totals for the selected month:
  - **Total expense** (总支出)
  - **Total income** (总收入)
- Calendar grid:
  - Days are visually highlighted (likely days with activity).
  - A selected date is emphasized (circled “29”).
- Below the calendar:
  - A section header for the selected date (e.g., “1月24日”).
  - On the right of the date row: **daily totals** for expense and income (e.g., `-¥ 520.97`, `+¥ 0.00`).
  - A list of transactions for that date. Each row shows:
    - Icon (category-like)
    - Title/merchant-like label (e.g., “Shakeshack bill”)
    - A secondary label (subcategory or tag; e.g., “Friend”)
    - Amount aligned right (negative in this list)
- Bottom navigation:
  - “首页” (Home)
  - Center “+” action button
  - “预算/计划” (Budget/Plan)

UX implications:

- A **calendar-first home** is a strong pattern: month navigation + daily drill-down.
- Daily grouping includes **per-day expense/income totals**.

## 02 — Transaction edit: expense (`02-expense-edit.png`)

Observed UI:

- Title: “支出编辑” (Edit expense).
- Shows the transaction identity block:
  - Name/title (merchant-like)
  - Sub-label (e.g., “Friend”)
  - Amount shown at right (positive currency, presumably expense UI convention)
- A row: “所属预算/计划” (Belongs to budget/plan) with chevron.
- A large destructive button: “删除该笔支出” (Delete this expense).

UX implications:

- Edit screen includes at least delete (and likely edit fields on a prior/next step).
- Transaction can optionally link to a **budget/plan entity** (not part of our MVP plan).

## 03 — Add transaction: amount-first + category grid (`03-add-expense-amount-first.png`)

Observed UI:

- Segmented control: “支出” (Expense) / “收入” (Income).
- Date selector at top-right (e.g., “1月24日”).
- Large amount input at top (e.g., “¥14.05”) with cursor.
- Category grid of icons with labels (examples visible):
  - 餐饮 (Food), 衣服 (Clothing), 交通 (Transport), 网费话费 (Internet/Phone), 学习 (Study),
  - 日用 (Daily), 住房 (Housing), 医疗 (Medical), 发红包 (Red packet), 汽车/加油 (Car/Fuel),
  - 娱乐 (Entertainment), 请客送礼 (Gifts), 电器数码 (Electronics), 运动 (Sports), 理发 (Haircut),
  - plus rows like “Friend”, “Family”, “学校/工作” (School/Work), “恋爱” (Love) — which appear to be category-like.
- Bottom input bar shows:
  - Account selection (e.g., “Chase”) with chevron
  - Note field/icon (e.g., “Shakeshack bill”)
- Numeric keypad:
  - Digits, decimal, backspace
  - Plus/minus buttons at right
  - Confirm button “确定”

UX implications:

- Strong confirmation of **amount-first** entry with:
  - type toggle (expense/income)
  - date selector
  - large amount input
  - category grid selection
  - account + note entry in the same flow

## 04 — Asset management overview (`04-assets-accounts.png`)

Observed UI:

- Title: “资产管理” (Asset management).
- Goal line: “目标资产 ¥10000.00” with an edit icon.
- “已有总资产” (Total assets) with a big number.
- An illustration with a progress indicator (e.g., “81%”) suggesting progress toward goal.
- Accounts are grouped into sections, each with its own total and add button:
  - “资金账户” (Funding accounts) total and accounts like “现金”, “微信”, “余额宝”
  - “信用账户” (Credit accounts) total
  - “储值账户” (Stored value accounts) total, accounts like “Investment”, “Chase”, etc.
- A visible action: “账户转账” (Account transfer).

UX implications:

- Assets screen is effectively **accounts + goal visualization**.
- There is a dedicated **account transfer** feature (not currently in our MVP plan).

## 05 — Budget/plan landing (empty state) (`05-budget-plan-empty.png`)

Observed UI:

- Title: “预算/计划” (Budget/Plan).
- Top tiles:
  - “计划清单” (Plan list)
  - “结余” (Balance/surplus) with an amount
  - “趋势图” (Trend chart) with a chart icon
- Empty state message: “您还未创建预算” (You haven’t created a budget yet).
- Example donut chart with labeled slices and percentages.
- CTA: “+ 创建预算” (Create budget).
- Bottom nav: Home + plus + Budget/Plan.

UX implications:

- The original app has a budgeting module with charts and “plan list”.
- Our MVP explicitly **does not include a budgeting engine**; treat this as out-of-scope inspiration only.

## 06 — Asset management (scroll state) (`06-assets-accounts-scroll.png`)

Observed UI:

- Same as 04; reinforces grouped accounts layout and per-group totals.

## 07 — Account balance update history (`07-account-balance-history.png`)

Observed UI:

- Title: “更新账户余额” (Update account balance).
- Account header (e.g., “现金”) and current balance.
- A button: “更新余额” (Update balance).
- Transaction list includes a special row:
  - “余额更新” (Balance update) with an amount and the account label.
- Date-group rows show per-date totals at right:
  - expense total and income total displayed as `-¥...` and `+¥...`

UX implications:

- Balance updates are represented as a first-class transaction type in history (matches our `balance_adjustment` intent).
- The UI emphasizes **per-day totals** in lists.

## 08 — Update balance keypad (`08-update-balance-keypad.png`)

Observed UI:

- Title: “更新余额” (Update balance) with “完成” (Done).
- Shows a large amount (target/current input).
- Helper text: “请修改更新后的账户余额” (Please modify the updated account balance).
- A pill indicator: “余额减少 ¥0” (Balance decreases ¥0) suggesting:
  - User inputs a **new balance**
  - The app computes the delta (increase/decrease)
- Numeric keypad for entry.

UX implications:

- Balance correction UX is **set-to-value** (enter new balance), not “enter delta”.
- Our data model can still store the resulting correction as a `balance_adjustment` delta.

## 09 — Set asset goal (`09-set-asset-goal.png`)

Observed UI:

- Title: “设置目标资产” (Set target assets).
- Large numeric input for goal.
- Shows current assets as a reference.
- Numeric keypad.

UX implications:

- Aligns with our MVP “asset goals are visualization-only”.

## 10 — Profile / “Mine” (`10-profile-export-reminder.png`)

Observed UI:

- Profile header (“我的”).
- Membership/upsell (“VIP”, “成为Rich会员”) — likely monetization.
- Sections for:
  - “计划” (Plan)
  - “预算” (Budget)
- Common features:
  - “资产里程碑” (Asset milestones)
  - “设置记账提醒” (Set bookkeeping reminders)
  - “导出数据” (Export data)
  - “帮助中心” (Help center)
  - “隐私协议” (Privacy policy)

UX implications:

- Export is surfaced as a first-class user action (matches MVP portability).
- Reminders/help/membership exist in the original app; our MVP does not include these (see gap analysis).

## 11 — Category customization list (`11-category-customize-list.png`)

Observed UI:

- Title: “自定义” (Customize).
- List of categories with:
  - Icon + name
  - Expand arrow (suggesting subcategories)
  - Ellipsis menu (edit actions)
- CTA: “+ 添加自定义” (Add custom)

UX implications:

- Categories are user-configurable (matches MVP).
- Expand arrow implies two-level hierarchy (category → subcategory), consistent with our model.

## 12 — Add custom category (`12-add-custom-category.png`)

Observed UI:

- Title: “添加自定义类目” (Add custom category).
- Text hint: name input with a max length (“不超过6个字符” = no more than 6 characters).
- Icon picker grid labeled “默认” (Default).
- A visible section “餐饮零食” (Food/snacks) shows a second tier of icon options (subcategory-like or category packs).

UX implications:

- Original app constrains category name length and provides icon selection.
- Our MVP allows user-configurable categories/subcategories, but does not mandate icons or name limits.

