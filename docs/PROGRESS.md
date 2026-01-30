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

## Next Up

- Polish: error handling, loading states, edge cases
- Balance adjustment "set-to-value" flow
- Transaction save/persistence
- Testing and bug fixes
- Commit to GitHub as v0.1.0-alpha

## Key Decisions

| Decision     | Choice                             |
| ------------ | ---------------------------------- |
| Storage      | Local SQLite only                  |
| UI Language  | Chinese labels (matching original) |
| Navigation   | 3 tabs instead of 4                |
| Amount entry | Custom numpad, not keyboard        |
| Categories   | Icon grid, not text input          |
| CSV format   | v1 = legacy Chinese, v2 = extended |
