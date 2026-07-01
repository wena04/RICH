# Progress

Living status document for the RICH MVP.

## Current Status: Design-Fidelity Pass (in progress)

The MVP core features work end-to-end. Current effort is a **pixel-fidelity pass** to make
the app match the original RICH 记账 app screen-by-screen, using a **mockup-first workflow**
(see below) before porting each screen to real React Native code.

## Current Status: Feature-complete MVP (design polish remaining)

The MVP core features work end-to-end including budgets, transfers, and custom category icons.
Current effort is **design-fidelity polish** and **responsive scaling** across device sizes.

---

## Session summary (2026-07-01 merge)

Merged all three archive updates into this repo and completed the remaining feature chunks.

### Verified
- `npx tsc --noEmit` — passes
- `npm test` — 22/22 passing
- Manual walkthrough recommended: `npx expo start --clear`

### Merged from archives
- **111 category SVG icons** + `components/CategoryIcon.tsx` + `assets/icons/gallery.html`
- **New screens**: `app/trends.tsx`, `app/transaction/transfer.tsx`, `app/transaction/edit/[id].tsx`, `app/categories/add.tsx`
- **Budget page** rewrite (`app/(tabs)/charts.tsx`) — charts moved to trends sub-view
- **Accounts** — 目标资产 persisted in `app_meta`, 账户转账 button
- **Add transaction** — date picker, calculator numpad, 管理分类 tile, CategoryIcon grid
- **Detail** — read-only card + edit route split
- **DB migration v3** — `categories.icon` column
- **Docs** — `docs/FLOWS.md`, updated `mockups.html`, icon catalog reference
- Deleted dead `components/TabBar.tsx` (tab bar lives inline in `app/(tabs)/_layout.tsx`)

### Built this session (beyond archives)
- **Budget engine** (migration v4): `budgets` + `budget_categories` tables, `src/db/repo/budgets.ts`
- **Budget editor** (`app/budget/edit.tsx`) — per-category monthly limits + optional total
- **Budget page filled state** — progress bars, month navigation, 创建预算 / 设置分类预算
- **Transaction detail 所属预算/计划** — shows `¥spent / ¥limit` or 未设置; taps through to editor
- **Home day-tap filter** — tap a calendar day to filter list; "查看全部" pill to clear
- **Cross-platform 添加子类** — Modal replaces iOS-only `Alert.prompt`
- **`src/domain/categories.ts`** — shared `DEFAULT_CATEGORIES` constant

### Remaining
1. **Responsive design** — scale UI for all iPhone sizes (deferred; partial scaling on 15 Pro done)
2. **Icon polish** — optional: review `assets/icons/gallery.html` and fix rough icons
3. **Screen-fidelity pass** — compare each screen against `docs/mockups.html` on device
4. **Tag release** — manual walkthrough, then `v0.1.0-alpha`

---

## 🔴 SESSION HANDOFF (archive notes — superseded by merge above)

**Flow map**: `docs/FLOWS.md`. **Mockups**: `docs/mockups.html`.

### ✅ DECISIONS LOCKED
- **Budget model = category-based limits** — spent computed from transactions; no `transactions.budget_id`
- **Navigation** — 2 tabs (首页, 预算/计划) + center FAB; tab bar inline in `_layout.tsx`
- **Responsive** — deferred until design finalized

### ⛔ OLD REMAINING (now done)
- ~~Budget engine~~ ✅
- ~~Home calendar day-tap filter~~ ✅
- ~~添加子类 cross-platform~~ ✅

### 📋 OLD IMPLEMENTATION PLAN (completed)

**Existing helpers to REUSE (don't reinvent):** `getDb()` (`src/db/db.ts`), `newId('prefix')`
(`src/utils/id.ts`), `getMeta/setMeta` (`src/db/repo/meta.ts`), `ensureCategory`
(`src/db/repo/categories.ts`), `getExpenseCategoryTotalsForMonth` (`src/features/charts/aggregations.ts`),
`currentMonth`/`addMonths`/`monthStartIso`/`nextMonth` (`src/utils/month.ts`), `centsToYuan`
(`src/utils/money.ts`), `CategoryIcon` (`components/CategoryIcon.tsx`). DB access pattern:
`const db = await getDb()` inside async fns (no context/hook). Timestamps: `new Date().toISOString()`.
Money = integer cents. Colors in `constants/Colors.ts` (PRIMARY_GREEN `#3ECDA5`, TEXT_PRIMARY `#1A1A1A`,
TEXT_SECONDARY `#666`, EXPENSE_RED `#FF6B6B`).

**Chunk 1 — DB layer**
- `src/db/migrations.ts`: append `{ version: 4, statements: [...] }`:
  ```sql
  CREATE TABLE budgets (id TEXT PRIMARY KEY, period TEXT NOT NULL UNIQUE,
    total_cents INTEGER, created_at TEXT, updated_at TEXT);
  CREATE TABLE budget_categories (id TEXT PRIMARY KEY,
    budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    limit_cents INTEGER NOT NULL, created_at TEXT, updated_at TEXT);
  CREATE UNIQUE INDEX idx_budget_categories ON budget_categories(budget_id, category_id);
  ```
- `src/domain/types.ts`: add `Budget {id, period, totalCents:number|null}`,
  `BudgetCategory {id, budgetId, categoryId, limitCents}`,
  `BudgetCategoryStatus {categoryId, categoryName, categoryIcon:string|null, limitCents, spentCents}`,
  `BudgetSummary {budget, totalLimitCents, totalSpentCents, categories:BudgetCategoryStatus[]}`.
- `src/db/repo/budgets.ts` (new): `getBudgetForPeriod`, `ensureBudgetForPeriod`, `setBudgetTotal`,
  `listBudgetCategories`, `upsertBudgetCategory` (INSERT … ON CONFLICT(budget_id,category_id) DO UPDATE),
  `deleteBudgetCategory`, `getBudgetSummary(db, period)` = merge limits (join `categories` for name/icon)
  with `getExpenseCategoryTotalsForMonth` for `spentCents`; `totalLimitCents = budget.totalCents ?? Σlimits`;
  returns null if no budget row.

**Chunk 2 — Budget editor + route**
- Extract `DEFAULT_CATEGORIES` from `app/transaction/new.tsx:46` → new `src/domain/categories.ts`
  (`export const DEFAULT_CATEGORIES`); import it back in `new.tsx` (no behavior change).
- `app/budget/edit.tsx` (new): param `period` (default `currentMonth()`); optional 本月总预算 input;
  list = union(DEFAULT_CATEGORIES, DB categories) each with a limit input prefilled from existing limits.
  保存: non-empty → `ensureCategory`→`upsertBudgetCategory`; empty → `deleteBudgetCategory`; then `router.back()`.
- `app/_layout.tsx`: register `<Stack.Screen name="budget/edit" options={{ headerShown:false }} />`.

**Chunk 3 — Budget page** (`app/(tabs)/charts.tsx`, rewrite body)
- Keep green header + summary card (wire 计划清单 amount = month total budget). Add month-nav row
  (prev/next via `addMonths`) driving `getBudgetSummary` in `useFocusEffect`.
- Filled state (≥1 limit): 本月总预算 card (总spent/总limit + progress bar + 已用% + 剩余) + 分类预算 rows
  (CategoryIcon, name, `¥spent / ¥limit`, bar color: green <80%, amber 80–100%, red >100%) +
  设置分类预算 → `/budget/edit?period=…`. Empty state: keep existing donut/legend; 创建预算 → `/budget/edit?period=…`.

**Chunk 4 — Detail 所属预算/计划** (`app/transaction/[id].tsx`)
- Also capture `categoryId` + `date`; `period = date.slice(0,7)`. Look up that category's limit+spent.
  Replace the `即将推出` alert: show `未设置` or `¥spent / ¥limit`; tap → `/budget/edit?period=…`. No schema change.

**Chunk 5 — Home day-filter** (`app/(tabs)/index.tsx`)
- Add `filterDate:string|null`. Day onPress: set `selectedDate` + toggle `filterDate` (tap same day clears).
  `visibleGroups = filterDate ? groups.filter(g=>g.date===filterDate) : groups`; render those. Show a
  `<date> · 查看全部` clear pill when active; per-day empty message when that day has no txns.

**Chunk 6 — Cross-platform 添加子类** (`app/transaction/new.tsx`)
- Replace `Alert.prompt` in `onAddSubcategory` with a `Modal`+`TextInput` mirroring the goal editor in
  `app/accounts.tsx` (overlay + white sheet + 取消/标题/保存). Add `showSubModal`/`subInput` state; the
  添加 tile opens it on ALL platforms; 保存 keeps existing `ensureCategory`→`ensureSubcategory` logic.

**Chunk 7 — Verify** (loop until clean)
- `npx tsc --noEmit` (primary gate) → fix all errors. `npm test` (tsx suite) stays green.
- Best-effort `npx expo export --platform ios` to catch import/bundling errors tsc misses.
- Manual walkthrough (you, on device): Home day-tap filter → +(add) → 添加子类 (Android too) →
  预算/计划 → 创建预算 → set limits → bars → transaction detail 所属预算/计划.
- Update this file (move done items); do NOT commit unless asked.

### Notes / gotchas for next session
- `app/categories.tsx` (route `/categories`) coexists with `app/categories/add.tsx`
  (`/categories/add`) — verify Expo Router doesn't warn about the file+folder combo; if it does,
  move `categories.tsx` → `categories/index.tsx`.
- `app/(tabs)/transactions.tsx` is a working list with **no UI entry point** (see FLOWS.md).
- To regenerate icon files after editing `icon-sprite.txt`: the node scripts used are in this
  session's history (parse `<symbol>` → write `assets/icons/categories/*.svg` + `gallery.html`;
  and `components/CategoryIcon.tsx` is generated from those svg files). (Icons = skip this round.)
- Nothing is committed. `git status` shows all the modified/new files.

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
  Now also: full **20-category grid** (original order/icons), **dashed rule** under the amount,
  and **"…" subcategory badges** on categories that have subcategories.
- **Accounts / 资产管理** (`app/accounts.tsx`) — re-added the **目标资产 goal hero** (dark
  monument + 100% badge + editable target, local-only for now), **white card containers** with
  header dividers, removed the "暂无账户" placeholder, and added the **账户转账 button**.
- **预算/计划 tab** (`app/(tabs)/charts.tsx`) — converted from a charts screen into the
  **budget page**: 2-cell summary card (计划清单 | 结余 / 趋势图 with mini donut) + budget
  empty-state (您还未创建预算 + donut + 创建预算). The pie/trend/drill-down charts moved to a
  new **趋势图 sub-view** (`app/trends.tsx`), opened from the summary card's 趋势图 row.
- **Transaction Detail** (`app/transaction/[id].tsx`) — rebuilt as a read-only **detail card**
  (icon + note/category + black amount + chevron, 所属预算/计划 row, green background,
  full-width coral delete). The previous edit form was preserved and moved to a separate
  **edit route** (`app/transaction/edit/[id].tsx`), reached by tapping the card row.
- **Routing** (`app/_layout.tsx`) — registered `trends`, `transaction/[id]` (own header), and
  `transaction/edit/[id]`.

### Placeholders (UI present, feature not yet built)

- **创建预算**, **账户转账**, and **所属预算/计划** currently show a "coming soon" alert.
- **目标资产** goal is **local-only** (resets on reload) — needs persistence (e.g. `meta` table).

## Goals

- **Match the original** RICH 记账 app screen-for-screen (layout, spacing, dividers, colors, icons).
- **Mockup-first**: every screen verified in `docs/mockups.html` before/while coding it.
- **Close the feature gaps** the screenshots revealed: account transfer, savings goal (目标资产),
  budgets (预算/计划) with the 所属预算/计划 transaction link, and the full ~20-category set.
- Keep everything **offline-first and local-only** (no backend/cloud/analytics).

## Next Up

### Immediate (Design Fidelity)

- [x] Port **Add Transaction** details (20-category grid, dashed amount rule, "…" badges)
- [x] Port **Charts/预算** screen (budget page + 趋势图 sub-view)
- [x] Port **Accounts** screen (goal hero, white cards, transfer button)
- [x] Port **Transaction Detail** (detail card + separate edit route)
- [ ] Verify on device: `npx tsc --noEmit` + `npm run start`, compare each screen to `docs/mockups.html`
- [ ] Port **Categories** management screen (no original screenshot yet)
- [ ] Add month navigation on home calendar (currently shows current month only)

### Core Features

- [ ] **账户转账** (account transfer) — third transaction type (button wired, screen not built)
- [ ] **目标资产** (savings goal) — persist the target (currently local-only)
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
