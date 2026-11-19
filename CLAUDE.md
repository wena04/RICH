# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Rich记账 — a Chinese-language, offline-first personal finance app for iOS (React Native + Expo SDK 54, Expo Router, expo-sqlite, strict TypeScript). The current phase is recreating the owner's original Rich记账 1.1.0 app (whose source was lost) from packaged assets, screenshots, and backup-schema evidence. Status, remaining parity work, and verification state live in `docs/PROGRESS.md` — read it at the start of a work session and keep it updated.

## Where to find things

| Need | Look in |
| --- | --- |
| Current status, remaining work, verification results | `docs/PROGRESS.md` |
| Goals and acceptance criteria / scope | `docs/REQUIREMENTS.md` (out-of-scope ideas get documented, not built) |
| UX rules and screen behavior | `docs/PRODUCT.md` |
| Implemented surface, persisted model, routes | `docs/FEATURES.md` |
| Route-by-route walkthrough checklist | `docs/FLOWS.md` |
| Schema, data flow, CSV/DB export formats | `docs/TECHNICAL.md` |
| Shared component visual contracts | `docs/COMPONENTS.md` |
| Name, voice, logo, color, type rules | `docs/BRAND_GUIDE.md` |
| App Store release checklist | `docs/APPLE_RELEASE_2026.md` |
| Fidelity gaps + original budget/plan model findings | `audit/first-entry-budget-flow/report.md` |
| Screenshot-vs-implementation QA | `design-qa.md`, `design-qa-assets/` |
| Original icon catalog and screenshot notes | `docs/reference/rich-screens/` |
| Original budget/plan artwork (help, tips, empty, completion) | `assets/images/budget/` |
| Original category/UI PNGs | `assets/images/category-original/` |
| Original app bundle, IPA, iMazing backup, 13 interaction screenshots | `~/Desktop/RICH-reference/RICH-original-reference-bundle/` (off-repo, private) |
| Swift Student Challenge companion playground | `swift-student-challenge/` (separate from the Expo app) |

## Commands

```bash
npm install
npm run start            # Expo dev server
npm run ios / android    # native dev build
npm run web              # quick laptop preview (web SQLite is Expo alpha — not for final QA)
npx tsc --noEmit         # strict type check
npm test                 # all unit tests (node --import tsx --test src/__tests__/*.test.ts)
node --import tsx --test src/__tests__/money.test.ts   # single test file
npm run icons:generate   # regenerate SVG category icon registry after editing an icon
npm run icons:check      # verify icon registry/gallery matches sources
```

## Architecture

Local-first: SQLite is the only source of truth. No backend, sign-in, analytics, or cloud sync — do not add any. Full details in `docs/TECHNICAL.md`.

- `app/` — Expo Router screens. Tabs in `app/(tabs)/`, entry/edit flows in `app/transaction/`, budget editor in `app/budget/`.
- `src/db/` — schema and data layer:
  - `migrations.ts` — versioned list of SQL migrations. Schema changes are made by **appending a new migration version**, never editing old ones. Invariants (typed transactions, note ≤ 100 chars, FK `ON DELETE RESTRICT`) are enforced with SQL CHECKs and triggers.
  - `repo/` — repositories (accounts, transactions, categories, budgets, meta). UI goes through repos, not raw SQL.
  - `starter.ts` / `seed.ts` — idempotent first-run bootstrap: one cash account plus starter categories; must never recreate categories the user deleted, and never create demo transactions or fake balances.
- `src/domain/` — typed finance model. Categories have a kind `expense | income | both` that filters every surface (entry, management, budgets). `originalCategoryCatalog.json` is the catalog converted from the original app's `TallyTypeinfo.plist`.
- `src/features/` — budgets, charts aggregations, CSV v1/v2 and whole-DB import/export.
  - **Budgets follow the original Rich model** (migration v8): named monthly/special envelopes that expenses are explicitly assigned to (`transactions.budget_envelope_id`, set from the detail row 所属预算/计划), plus savings plans that freeze a monthly budget toward a target. Logic in `budgets/envelopes.ts`, SQL in `src/db/repo/envelopes.ts`. The legacy v4/v6 category-limit tables were dropped in migration v9. Model details and archive/order rules are in `docs/TECHNICAL.md`.
  - Spend is always derived from transactions, never stored twice.
- `components/rich/` — the RICH visual system (headers, month stepper, numpad, progress bars). `*.generated.ts` icon registries are produced by `scripts/generate-*-icons.mjs`; edit the SVG/PNG sources and regenerate, don't hand-edit.

Key invariants spread across files:

- Money is integer cents; dates are local `YYYY-MM-DD` strings (`src/utils/money.ts`, `date.ts`).
- `balance_adjustment` transactions have no category and are excluded from income/expense analytics.
- Transfers are a matched negative/positive adjustment pair committed in one SQLite transaction.
- Transaction entry/edit references categories by stable ID, not name.

## Privacy and data-safety rules

- Never commit real finance data: CSV exports, SQLite files, IPA/iMazing backups, or screenshots with personal records. `.gitignore` enforces much of this; `data/sample.csv` is the only allowed fixture.
- The original-app reference bundle (IPA, `RichNote.app`, iMazing backup, original screenshots) lives **outside the repo** at `~/Desktop/RICH-reference/` — keep it out of git. The iMazing backup contains real financial and session data.
- Tests use synthetic data only.

## Conventions

- Keep domain logic out of UI components; validate imports at the boundary (`src/features/importExport/`).
- `RICH Items/RICH-main/` is an old snapshot of the repo kept for reference; don't treat it as live code.
- Original-app screenshots were purged from git history on 2026-11-18 because they showed real balances and notes. Keep them in `~/Desktop/RICH-reference/` (including `removed-from-git/`) and never re-add them. `docs/mockups.html` uses synthetic sample values only.
- Do not commit or push unless explicitly asked.
