# Progress

Living status document for the RICH MVP.

## Current Status: Design-Fidelity Pass (in progress)

The MVP core features work end-to-end. Current effort is a **pixel-fidelity pass** to make
the app match the original RICH 记账 app screen-by-screen, using a **mockup-first workflow**
(see below) before porting each screen to real React Native code.

## Completed

### Documentation

- [x] Repository scaffolding
- [x] Requirements, product, technical docs
- [x] Privacy-safe `.gitignore`

### Core Features

- [x] SQLite schema + migrations
- [x] Transactions CRUD
- [x] Accounts CRUD
- [x] Categories/subcategories CRUD
- [x] Import/export (CSV v1, v2, database)
- [x] Charts (pie, trends, drill-down)
- [x] Demo seed data (37 sample transactions)

### UI Redesign

- [x] Mint green color scheme (#3ECDA5)
- [x] 3-tab navigation (Home, FAB, Charts)
- [x] Calendar-first home screen
- [x] Amount-first add transaction
- [x] Custom numpad (no system keyboard)
- [x] Category icon grid
- [x] Grouped accounts display
- [x] Expandable category list
- [x] Chinese UI labels
- [x] Custom `TabBar` component (replaces default Expo tabs)
- [x] UI scaling for larger screens (iPhone 15 Pro)
- [x] Calendar cell sizing fix (removed aspect ratio gap)

### Codebase Cleanup

- [x] Removed unused template files (`modal.tsx`, `EditScreenInfo.tsx`, etc.)
- [x] Removed unused `react-native-reanimated` (not needed for current features)
- [x] Created `babel.config.js` for proper Expo preset configuration
- [x] Fixed Expo SDK 54 peer dependency versions

## Recently Closed

- **Subcategory tagging at entry** (`app/transaction/new.tsx`): selecting a category now expands an inline subcategory zone directly under that category's row (grey panel with an up-caret pointing to the selected category, subcategories as icon tiles), matching the original RICH app. The chosen subcategory is saved (previously `subcategoryId` was hardcoded to `null`). Includes an "添加" tile for inline add on iOS. Replaces the earlier bottom-strip prototype.
- **Subcategories in charts**: the drill-down under the pie chart is now a share-based bar visualization (amount + %) instead of a plain list, plus a "点击分类查看子分类明细" hint.
- **Seed data now includes subcategories**: demo categories get realistic subcategories (e.g. 餐饮 → 早餐/午餐/晚餐/外卖/咖啡/聚餐) and sample transactions are tagged, so the drill-down has data on first run.
- Real account balances (sum of signed transactions, replaces 0.00 placeholders)
- Balance adjustment "set-to-value" flow (`app/transaction/adjust.tsx` reached via account edit modal)
- Dropped unused `asset_goals` table (migration v2) and removed the hardcoded "目标资产" header
- Smoke-test suite via `tsx --test` covering `money.ts` and `date.ts` (22 tests)

## Design-Fidelity Workflow

We design each screen **as a static mockup first, then code it**. This keeps iteration fast
(no build step) and gives a single visual source of truth to check the real app against.

1. **Mock up in `docs/mockups.html`** — a single, zero-install HTML file that renders every
   screen inside iPhone frames. Open it in any browser (`open docs/mockups.html`); no Node,
   no Expo. Screens are tagged `faithful to original` vs `PROPOSED` (not built yet).
2. **Refine against the originals** — the mockups were corrected screenshot-by-screenshot
   against 8 reference captures of the real RICH 记账 app.
3. **Port to code** — once a screen looks right, rebuild it in React Native and keep
   `mockups.html` as the design reference for future tweaks.

### Design corrections learned from the original screenshots

- **Navigation is 2 tabs + center FAB only**: 首页 and 预算/计划 (alarm-clock icon). Every
  other screen (记一笔, 账户转账, 资产管理, 交易详情, …) is a pushed screen with a back arrow and
  no tab bar. (Removed the earlier "我的/More" tab from the design.)
- **预算/计划 is a budget page, not charts.** Its summary card is two cells — left 计划清单,
  right stacked 结余 / 趋势图 — and the body is a budget empty-state (您还未创建预算 → 创建预算).
  The pie/trend charts are a secondary 趋势图 sub-view reached from the summary card.
- **Dividers**: date-group headers and the add/transfer amount line are **dashed**; card
  splits and account rows are **solid**; transaction rows have **no divider** (whitespace only).
- **Colors**: expense amounts are **black**, not red — green is reserved for income (`+`),
  coral for delete. Calendar entry days use a **lighter mint** (#B5EAD7).
- **Corners**: content cards are **near-sharp** (~4px); only buttons/pills/badges/circles stay rounded.
- **Calendar**: consecutive entry days render as **one continuous band** (not separate
  circles); today is an **outlined ring + dot**; selected past dates get a **gray circle**.
- **Two original features we were missing / had dropped**: **账户转账 (account transfer)** as a
  third record type, and **目标资产 (savings goal)** on 资产管理 (a gamified target the app had
  previously removed — to be re-added). Transactions also carry an **所属预算/计划** link.

### Ported to code so far

- **Home screen** (`app/(tabs)/index.tsx`) rebuilt to match the mockup: brand + dropdown +
  white avatar header; calendar card with light-green entry days, continuous consecutive
  band, today ring+dot, gray selected; and a date-grouped transaction list with dashed
  headers, stacked +/- totals, gray gap bands, and the tightened row sizing. Dashed lines are
  drawn manually (RN can't render a dashed bottom-border reliably). UI scaled up for larger
  screens (iPhone 15 Pro).
- **Custom TabBar** (`components/TabBar.tsx`) — 3-element bottom navigation (首页, center FAB,
  预算/计划) with proper sizing, press handlers, and active-state highlighting. Replaces
  the default Expo Router tab bar.
- **Add Transaction** (`app/transaction/new.tsx`) — amount-first flow with custom numeric
  keypad and inline subcategory selector. Subcategory zone expands under selected category.

## Goals

- **Match the original** RICH 记账 app screen-for-screen (layout, spacing, dividers, colors, icons).
- **Mockup-first**: every screen verified in `docs/mockups.html` before/while coding it.
- **Close the feature gaps** the screenshots revealed: account transfer, savings goal (目标资产),
  budgets (预算/计划) with the 所属预算/计划 transaction link, and the full ~20-category set.
- Keep everything **offline-first and local-only** (no backend/cloud/analytics).

## Next Up

### Immediate (Design Fidelity)

- [ ] Port **Add Transaction** screen details (inline subcategory expansion styling, note input)
- [ ] Port **Charts/预算** screen to match mockup layout (summary card, empty budget state)
- [ ] Port **Accounts** and **Categories** management screens
- [ ] Add month navigation on home calendar (currently shows current month only)

### Core Features

- [ ] **账户转账** (account transfer) — third transaction type
- [ ] **目标资产** (savings goal) — gamified target on asset management
- [ ] **预算/计划** (budgets) — budget creation and 所属预算/计划 transaction link

### Polish (Deferred)

- [ ] Responsive design — use `Dimensions` API or scaling utilities for all screen sizes
- [ ] Manual walkthrough and tag `v0.1.0-alpha`

## Key Decisions

| Decision      | Choice                                            |
| ------------- | ------------------------------------------------- |
| Storage       | Local SQLite only                                 |
| UI Language   | Chinese labels (matching original)                |
| Navigation    | 2 tabs (首页, 预算/计划) + center FAB              |
| Design process| Mockup-first in `docs/mockups.html`, then code    |
| Amount entry  | Custom numpad, not keyboard                       |
| Categories    | Icon grid, not text input                         |
| Expense color | Black (green only for income), per original       |
| Dividers      | Dashed on date/amount, solid on cards             |
| CSV format    | v1 = legacy Chinese, v2 = extended                |
| Responsive    | Deferred until design finalized; will use scaling |
| Tab bar       | Custom component, not default Expo Router tabs    |
