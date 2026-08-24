# Progress

Living implementation and verification status for Rich记账.

**Last updated:** August 24, 2026

**Phase:** native release hardening and on-device visual QA

## Current status

The current offline-first scope is implemented end to end. A fresh install now presents a clean
ledger—no fake balances or demo transactions—plus one usable cash account and an idempotent,
student-friendly category/subcategory starter taxonomy.

Recent work moved the app beyond the earlier MVP model:

- Adopted the approved Rich wordmark/app icon and documented the mint/ink brand system.
- Completed responsive visual passes for Home, budgets, trends, accounts, category/icon management,
  the complete ledger, and transaction create/detail/edit/transfer/adjustment flows.
- Surfaced **我的 → 全部账单**, replacing the hidden English legacy list with a Chinese-first dated
  ledger and transaction-detail links.
- Changed new-transaction category selection from mutable names to stable database IDs, preventing
  renamed or deleted categories from being silently recreated.
- Made unbudgeted-child and unclassified spending visible inside the parent budget envelope.
- Added typed `expense | income | both` categories across migration, repositories, management,
  entry, editing, and budget filtering.
- Added starter child categories for food, transport, learning, housing, entertainment,
  subscriptions, health, and travel without generating financial history.
- Added hierarchical parent/child budgets with persisted child allocations, derived real spending,
  effective parent limits, and visible unallocated remainder without double counting.
- Made paired account transfers atomic with SQLite rollback on either-side failure.
- Rebuilt transaction editing in the current visual language with type, signed adjustment amount,
  date picker, typed category path, account, note, save, and delete.
- Improved Home and budget empty states, transaction metadata, category filtering, accessibility
  state, responsive trend width, app icon/configuration, and native release metadata.
- Added focused hierarchical-budget tests and changed the test command to avoid the prior `tsx` IPC
  restriction.

## Current architecture

- SQLite is the source of truth; no backend, analytics, sign-in, or automatic sync.
- Money uses integer cents; dates are local ISO calendar strings.
- Budgets are monthly parent envelopes with optional child allocations. Spending is derived from
  transactions, not stored twice.
- Transfers are matched negative/positive balance adjustments committed in one transaction, so they
  do not affect income/expense analytics.
- Full database export/restore is the lossless device-migration path.
- Native runtime targets iOS/Android; `npm run web` provides a convenient Expo SQLite alpha preview.

## Verification

Completed against the current workspace on August 24, 2026:

```text
TypeScript:       npx tsc --noEmit                         PASS
Unit tests:       npm test                                 PASS (43/43)
Category icons:   npm run icons:check                      PASS (114 SVGs)
Expo config:      npx expo config --type public            PASS
Patch hygiene:    git diff --check                         PASS
```

## Remaining release work

1. Run every reachable route from `docs/FLOWS.md` on target iPhones, including small-screen keyboard,
   safe-area, modal, long-label, and empty/filled states.
2. Capture Home, 记一笔, transaction detail/edit, 预算/计划, 趋势图, 资产管理, 自定义, transfer,
   and data-management screenshots at reference sizes; record and fix material visual deltas.
3. Exercise fresh install, migration, CSV exchange, database restore, atomic transfer rollback, and
   category-kind changes with real native SQLite data.
4. Complete the App Store metadata, privacy answers, signing/build, TestFlight, and submission checks
   in [Apple Release 2026](APPLE_RELEASE_2026.md).

## Known limitations

- No cloud sync, recurring entries, reminders, receipt attachments, search, authentication, or
  multi-currency conversion.
- Transfer rows are atomic but still lack a shared transfer-group ID for linked editing/deletion.
- The native SQLite app is not a supported web build.
- Automated screenshot regression should follow approval of the on-device reference captures.

## References

- [Product](PRODUCT.md) — current behavior and trust rules
- [Features](FEATURES.md) — implemented surface and persisted model
- [Flows](FLOWS.md) — route/action walkthrough checklist
- [Components](COMPONENTS.md) — shared visual contracts
- [Apple Release 2026](APPLE_RELEASE_2026.md) — current release requirements
- [Competitive Research 2026](COMPETITIVE_RESEARCH_2026.md) — market evidence and product direction

Do not commit real CSV exports, SQLite databases, or user backup files. Do not commit or push unless
explicitly requested.
