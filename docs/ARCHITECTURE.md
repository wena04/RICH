# Architecture (MVP)

## Overview

This app is a **single-user, offline-first** personal finance tracker for iPhone. The MVP architecture is intentionally simple:

- **React Native + Expo** for the UI and app runtime
- **SQLite** for durable local storage
- **No backend**: no accounts, no cloud sync, no analytics

The design goal is to make the app fast, reliable, and privacy-preserving by default.

## Why local-first

Local-first is chosen because:

- **Reliability**: Users can add and review transactions without network access.
- **Performance**: SQLite queries and local aggregations are fast for MVP-scale datasets.
- **Privacy**: Avoiding servers and tracking reduces data exposure and compliance burden.
- **Simplicity**: A single-user app does not require multi-tenant infrastructure.

## SQLite’s role

SQLite is the system of record for:

- Transactions (expense / income / balance_adjustment)
- Categories and subcategories
- Accounts and derived balances
- Asset goals (visualization-only)

SQLite also supports:

- Efficient filtered queries (by date range, account, category)
- Aggregations for charts (group by category/month)
- Consistent constraints and invariants (enforced in code and optionally with DB constraints)

## Data flow

### Input → storage

1. User enters a transaction using the **amount-first** form.
2. The app validates required fields and type-specific rules.
3. The transaction is written to SQLite with normalized references (account/category/subcategory IDs).

### Storage → aggregation → charts

1. For a selected time range (e.g., current month), the app queries transactions.
2. The app produces aggregations:
   - **Category totals** (pie chart)
   - **Monthly totals** for expense/income trends
   - **Subcategory totals** for drill-down
3. Charts render from aggregation outputs.

Important rule:

- `balance_adjustment` transactions are **excluded** from expense/income charts and trends. They exist to correct account state, not to represent cashflow categories.

## Why no backend

The MVP explicitly avoids a backend to:

- Keep the app **private-by-default** (no data leaves the device)
- Reduce complexity (authentication, sync conflicts, security hardening)
- Avoid operational overhead (hosting, monitoring, costs)
- Match the intended use (single user, personal device)

## Portability and backup architecture

Portability is achieved with explicit user-driven export/import:

- **CSV export/import** (v1 required; v2 optional) for data portability
- **Database file export/import** for full-fidelity backup and migration

These features are designed as **manual** operations:

- The app never uploads data automatically.
- The user chooses where to store exported files and is responsible for handling them securely.

