# Portfolio Entry

## Rich记账 — Offline Personal Finance App

**Type:** Native mobile app (iOS/Android)

**Role:** Solo product design and engineering

**Stack:** TypeScript, React Native, Expo SDK 54, Expo Router, SQLite, SVG, PapaParse

Rich记账 is a Chinese-language, offline-first bookkeeping app with a calendar-led home screen and
an amount-first entry flow. It combines fast daily capture with typed category/subcategory
organization, hierarchical monthly budgets, local analytics, account management, and explicit data
portability—without a backend, sign-in, analytics, or fake financial history.

## Selected implementation work

- Designed a strict TypeScript domain model and versioned SQLite migrations for accounts,
  transactions, typed categories, subcategories, parent budgets, and child budget allocations.
- Built a clean first-run bootstrap: one usable cash account plus student-friendly categories and
  subcategories, with no demo transactions or invented balances.
- Created an amount-first composer with a custom calculator keypad, inline subcategory selection,
  last-used account behavior, and local validation.
- Implemented hierarchical budgets where child limits allocate the parent envelope rather than
  double-counting it; the UI reports actual spend, overrun, and unallocated remainder.
- Made transfers atomic by committing matched source/destination balance adjustments in one SQLite
  transaction, keeping them out of income and expense analytics.
- Rebuilt transaction editing as a polished native flow covering type, signed adjustment amount,
  date, category path, account, note, and deletion.
- Added calendar grouping, category/subcategory analytics, six-month trends, target-asset progress,
  custom icon persistence, and guarded deletion rules.
- Added CSV v1/v2 exchange and lossless database backup/restore through native pickers and share
  sheets.
- Consolidated reusable headers, month controls, dividers, progress bars, illustration, and keypad
  components into a coherent mint/near-black visual system.

## Engineering qualities

- Local-first privacy architecture; no network service is required for core use.
- Integer-cent money storage, ISO local dates, foreign keys, uniqueness checks, and parent-child
  integrity triggers.
- Real spending is derived from transaction history rather than duplicated in budget records.
- Fresh-install starter content is idempotent and respects categories a user later deletes.
- Current automated verification: strict TypeScript, **37/37 unit tests**, and successful iOS and
  Android production exports as of August 12, 2026.

The implementation is functionally complete for the current native scope. Remaining release work is
on-device visual QA and screenshot comparison across target iPhone sizes.

## Project references

- [Product specification](docs/PRODUCT.md)
- [Current feature inventory](docs/FEATURES.md)
- [Apple release plan](docs/APPLE_RELEASE_2026.md)
- [2026 competitive research](docs/COMPETITIVE_RESEARCH_2026.md)

**Repository path:** `/`

**Suggested tags:** `mobile`, `react-native`, `expo`, `typescript`, `sqlite`, `personal-finance`,
`offline-first`, `ios`, `data-visualization`, `privacy`

Publication links, demo video, user feedback, and App Store outcome should be added after release.
