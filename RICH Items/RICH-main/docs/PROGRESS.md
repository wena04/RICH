# Progress

Living status document for the RICH MVP.

## Current Status: MVP Draft Complete ✓

The app matches the original RICH 记账 visual design with working core features.

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

## Recently Closed

- **Subcategory tagging at entry** (`app/transaction/new.tsx`): selecting a category now reveals a horizontal tray of its subcategories; the chosen subcategory is saved (previously `subcategoryId` was hardcoded to `null`). Includes inline "+ 子类" add on iOS.
- **Subcategories in charts**: the drill-down under the pie chart is now a share-based bar visualization (amount + %) instead of a plain list, plus a "点击分类查看子分类明细" hint.
- **Seed data now includes subcategories**: demo categories get realistic subcategories (e.g. 餐饮 → 早餐/午餐/晚餐/外卖/咖啡/聚餐) and sample transactions are tagged, so the drill-down has data on first run.
- Real account balances (sum of signed transactions, replaces 0.00 placeholders)
- Balance adjustment "set-to-value" flow (`app/transaction/adjust.tsx` reached via account edit modal)
- Dropped unused `asset_goals` table (migration v2) and removed the hardcoded "目标资产" header
- Smoke-test suite via `tsx --test` covering `money.ts` and `date.ts` (22 tests)

## Next Up

- Manual simulator walkthrough: `npm run ios`, exercise add → adjust balance → charts → CSV round-trip
- Tag v0.1.0-alpha after the walkthrough passes

## Key Decisions

| Decision     | Choice                             |
| ------------ | ---------------------------------- |
| Storage      | Local SQLite only                  |
| UI Language  | Chinese labels (matching original) |
| Navigation   | 3 tabs instead of 4                |
| Amount entry | Custom numpad, not keyboard        |
| Categories   | Icon grid, not text input          |
| CSV format   | v1 = legacy Chinese, v2 = extended |
