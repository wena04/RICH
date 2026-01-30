# RICH (MVP) — personal finance iOS app (offline-first)

This is a **documentation + scaffolding** repository for a personal finance iOS app (MVP) inspired by “RICH 记账”.

## What this app is

- **Single-user** bookkeeping app for iPhone
- **Offline-first**: all data stored locally
- Tech direction: **React Native + Expo + SQLite**
- **No backend**, **no cloud sync**, **no analytics**

## Key features (MVP)

- **Transactions**
  - Types: `expense`, `income`, `balance_adjustment`
  - **Amount-first entry**
  - Required: amount, date, category (except balance adjustments), account
  - Optional: subcategory (scoped to category), note (≤ 100 chars)
  - Each transaction belongs to exactly one account
  - Default account is the last-used account
- **Categories**
  - Category → Subcategory (subcategory optional; scoped to category)
  - User-configurable categories and subcategories
- **Accounts & assets**
  - Multiple accounts (cash, bank, credit, stored value, investment)
  - Balance updates are **state corrections** (not normal income/expense)
  - Asset goals are visualization-only
- **Visualization**
  - Category pie chart
  - Monthly expense/income trends
  - Subcategory drill-down
- **Privacy & portability**
  - Local SQLite storage only
  - CSV export (v1 compatible) and optional extended CSV export (v2)
  - Export/import database file for migration and backup

## Privacy-first statement

This app is designed to keep your data **private by default**:

- No backend servers
- No cloud sync
- No analytics or tracking

Data stays on your device unless you explicitly export it.

## MVP scope

The MVP scope and “done” criteria are documented in:

- `docs/REQUIREMENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/EXPORT_FORMAT.md`
- `docs/PROGRESS.md` (implementation tracker)

## Sample data (safe)

This repo includes **fake** sample data for testing and demos:

- `data/sample.csv` (matches CSV v1 exactly)

### How to import sample data (once the app import screen exists)

- On your iPhone, copy `data/sample.csv` to Files (or AirDrop it to the device).
- In the app, open **Import/Export → Import CSV (v1)**.
- Select `sample.csv` and complete the import.

## Backups & phone migration

This MVP supports **manual** portability (user-controlled):

- **CSV export**:
  - v1 (compatible)
  - optional v2 (extended, more stable round-trips)
- **Database file export/import**:
  - full-fidelity backup and fast phone migration

Recommended migration flow:

- On old phone: export database file (or CSV v1/v2).
- Transfer securely to new phone.
- On new phone: import database file (or CSV).

Important: exports are sensitive. Store them securely (prefer encrypted storage).

## Critical: never commit personal finance data

Your real exports/backups must **NOT** be committed to git.

- Keep real CSV exports and database backups local-only.
- This repo’s `.gitignore` is configured to ignore:
  - all CSV files except `data/sample.csv`
  - SQLite databases and WAL/SHM files
  - common export/backup outputs

