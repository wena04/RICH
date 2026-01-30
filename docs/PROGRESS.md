# MVP progress

This file is a **living progress log** intended to help both humans and coding assistants understand the current implementation state.

## Current milestone

- **M0 — Expo app scaffold (in progress)**

## Completed

- Documentation + repository scaffolding (requirements, product, architecture, data model, export formats)
- Privacy-safe `.gitignore` protections
- CSV v1 legacy format aligned to `record.csv` structure (Chinese headers)
- Expo + TypeScript scaffold with Expo Router route skeleton
- SQLite schema + migrations (local-only)
- Transactions MVP: list + add/edit/delete + last-used account default
- Accounts CRUD (create/edit/delete with safety checks)
- Categories/subcategories CRUD (create/edit/delete with safety checks)
- Import/Export: CSV v1 import/export, CSV v2 export, database file export/import
- Charts: expense category pie, monthly expense/income trends, subcategory drill-down (local SQLite aggregations)

## In progress

- (none)

## Next up

- Polish: calendar-first Home, transaction entry UX (amount-first keypad), and balance “set-to-value” adjustment flow

## Decisions / notes

- **Offline-first**: local SQLite only; no backend, no sync, no analytics.
- **CSV compatibility**:
  - v1 is legacy (5 columns, Chinese headers, no account/subcategory, supports expense/income only).
  - v2 is optional extended export for better round-trip and includes account/subcategory/IDs.
- **Privacy**: never commit real finance exports/backups; keep sample/demo data synthetic only.

