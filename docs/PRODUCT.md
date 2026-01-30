# Product (MVP UX)

This document describes the MVP user experience for a single-user, offline-first iPhone app inspired by "RICH 记账".

## Design System

The app uses a **mint green color scheme** matching the original RICH app:

- Primary color: `#3ECDA5` (mint green)
- Background: Green headers with white content cards
- Navigation: 3-element bottom bar (Home, center FAB, Charts)

## Principles

- **Amount-first**: Quick entry via custom numpad → category grid → account → note → confirm.
- **Calendar-first home**: Month calendar view with daily transaction drill-down.
- **Local-first**: All data lives in local SQLite. No accounts, no backend, no sync, no analytics.
- **Private by default**: The app never transmits finance data off-device.
- **Configurable organization**: Categories/subcategories and accounts are user-configurable.

## Demo Data

On first launch, the app seeds 37 sample transactions so users can explore immediately:

- **Accounts**: 现金, Chase, 微信
- **Categories**: 餐饮, 交通, 购物, 娱乐, 日用, 医疗, 工资, 兼职
- **Transactions**: Mix of expenses and income over the past 30 days

## Navigation

The app uses a **3-element bottom navigation bar**:

1. **首页 (Home)** - Calendar icon, leads to home/calendar screen
2. **+ (Add)** - Large floating action button (FAB), opens add transaction screen
3. **预算/计划 (Charts)** - Pie chart icon, leads to charts/budget screen

Additional screens (Accounts, Categories, Settings) are accessed via the profile icon on the home screen.

## Screens & flows

### 1) Home / Overview (Calendar-first)

Purpose: Month overview with calendar and daily transaction list.

Layout (top to bottom):

- **Green header**: "Rich记账" branding + profile icon
- **Calendar card** (white, rounded):
  - Month selector (< 1月 >)
  - Month totals: 总支出 (expense) and 总收入 (income)
  - 7-column calendar grid (MON-SUN)
  - Days with transactions are highlighted
  - Selected day is circled
- **Daily section** (white, bottom sheet style):
  - Date header with daily expense/income totals
  - Transaction list for selected date
  - Tap transaction to edit

### 2) Add Transaction (Amount-first with numpad)

Purpose: Create a transaction quickly using touch-first UI.

Layout (top to bottom):

- **Header**: Back arrow, 支出/收入 toggle, date selector
- **Amount display**: Large "¥0" with cursor indicator
- **Category grid**: Scrollable icon grid (餐饮, 衣服, 交通, etc.)
- **Bottom bar**: Account selector (icon + name) | Note input field
- **Custom numpad**:
  - 3×4 digit grid (1-9, 0, decimal)
  - Backspace and +/- operators on right
  - "确定" (confirm) button spanning bottom-right

Behavior:

- Tap category icon to select (highlight with green border)
- Type amount using custom numpad (no system keyboard)
- Tap "确定" to save (disabled until category selected and amount > 0)

### 3) Transaction detail / edit

Purpose: View and modify an existing transaction.

- Full-screen view showing all transaction fields
- Edit mode allows changing amount, date, category, account, note
- Red "删除该笔支出" delete button at bottom

### 4) Charts / Budget (预算/计划)

Purpose: Visualize spending patterns.

Layout:

- **Green header**: "预算/计划" title
- **Summary cards**: 计划清单, 结余 (balance), 趋势图 icons
- **Content area** (white, rounded top):
  - Month selector
  - **Category pie chart**: Donut with legend showing category breakdown
  - **Monthly trends**: Line chart showing expense vs income over 6 months
  - **Subcategory drill-down**: Tap category to see subcategory breakdown

### 5) Categories management (自定义)

Purpose: Configure category taxonomy.

Layout:

- **Header**: Back arrow, "自定义" title
- **Category list**: Each row shows:
  - Expand arrow (▶/▼)
  - Category icon (green background)
  - Category name
  - Menu button (⋯)
- **Expandable subcategories**: Indented list when category expanded
- **Bottom button**: "+ 添加自定义" (black, full-width)

Modals:

- Add category: Name input (max 6 characters)
- Edit category: Name input + delete button

### 6) Accounts management (资产管理)

Purpose: Manage where money lives.

Layout:

- **Green header**: "资产管理" title
- **Asset summary**: Illustration + 目标资产 + 已有总资产
- **Account groups** (3 sections):
  - 资金账户 (cash/bank)
  - 信用账户 (credit)
  - 储值账户 (stored value/investment)
- Each group shows: Total + "+ 添加" button + account list
- Each account row: Icon + name + balance + chevron

Modals:

- Add account: Name + type selector (icon grid)
- Edit account: Name + type + delete button

### 7) Profile / Settings (我的)

Purpose: Access settings and data management.

Layout:

- **Green header**: "我的" title
- **Menu sections**:
  - 设置: 账户管理, 分类管理
  - 数据: 导出数据, 导入数据
  - 关于: 关于应用, 隐私政策
- **App info**: Version and privacy statement

### 8) Import / Export

Purpose: User-controlled data portability.

- Export options:
  - CSV v1 (legacy format, Chinese headers)
  - CSV v2 (extended format)
  - Database file export
- Import options:
  - CSV import (with account selection)
  - Database file import
- Privacy warnings for sensitive data

## Validation rules

- Amount: Required, must be valid positive number
- Date: Required, YYYY-MM-DD format
- Category: Required for expense/income
- Account: Required, defaults to last-used
- Note: Optional, max 100 characters
