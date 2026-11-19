# Progress

Living implementation, source-parity, and verification status for Rich记账.

**Last updated:** November 18, 2026

**Phase:** original Rich 1.1.0 interaction recovery, visual parity, and native-device QA

**Latest pushed checkpoint:** `cbe7696` — Match original RICH UI assets and interactions

## Current objective

Recreate the supplied Rich记账 1.1.0 app as faithfully as the available evidence allows: original
branding, icons, screen composition, empty states, category hierarchy, expandable interactions, and
budget/plan flows. Preserve the repo's offline-first and privacy-first behavior while replacing
approximations with assets and behavior verified from the packaged app, screenshots, and backup
schema.

This is not an attempt to recover or copy unavailable Swift source code. The App Store executable is
encrypted, so screenshots, runtime observation, asset catalogs, property lists, and the backup schema
are the reliable sources of truth.

## Supplied source material and boundaries

The off-repo transferable reference bundle `RICH-original-reference-bundle-2026-11-18.zip`
contains:

- `RichNote.app` — runnable macOS wrapper around the supplied iOS app.
- `Rich记账 1.1.0.ipa` — packaged original application and resources.
- `Rich记账.imazingapp` — private device backup used to understand schema and saved app state.
- `original-interaction-screenshots/` — captured original Home, add-entry, transaction, assets, and
  transfer states.

The `.ipa`/`.app` executable has `cryptid 1`; it does not expose the original Swift implementation or
view hierarchy. The iMazing backup is research evidence, not the normal migration/import format for
this replica. It can contain real financial records and account/session information and must stay
private.

## Completed original-app parity work

- Restored the supplied Rich app icon, title/start artwork, wordmark, mint/highlight palette, header
  controls, profile/menu controls, tab artwork, and asset-goal imagery.
- Matched the first-entry Home state to the supplied original screenshot:
  - calendar expanded on entry;
  - `MON` through `SUN` labels;
  - leading and trailing adjacent-month dates;
  - original current-day ring/dot treatment;
  - original `icon_emptybox` artwork;
  - exact `本月还没有收支记录` copy;
  - no invented first-entry CTA.
- Extracted 125 original category/UI PNG files from `Assets.car`.
- Converted `TallyTypeinfo.plist` into an 18-section, 134-item catalog covering 122 unique
  catalog-referenced icon names.
- Added the generated original-icon registry and name mapping used by the runtime category grid and
  full icon picker.
- Added semantic SVG fallbacks underneath original PNGs so interrupted image loading cannot leave
  blank category circles; the original PNG replaces the fallback after loading.
- Restored the original expense and income category order and complete four-row initial viewport.
- Implemented the original-style add-entry interactions:
  - expense/income switch;
  - amount calculator and confirm state;
  - account picker, note editing, and date picker;
  - selected-category ring;
  - original three-dot subcategory affordance;
  - inline expandable subcategory tray with original icons;
  - subcategory selection, collapse, and add-subcategory flow.
- Restored expandable parent/child rows in `自定义`, with subcategory edit/add behavior and the
  original black `+ 添加自定义` footer. Opening category management from entry preserves the current
  expense/income context.
- Replaced the reconstructed budget example donut with the original `icon_budget_progress` asset.
- Extracted and preserved the supplied month/special budget, creation, tips, help, plan, empty, and
  completion artwork under `assets/images/budget/` for the remaining budget/plan implementation.
- Verified Home, add expense, category management/picker, budget empty state, and asset management in
  the local production web export. The current visual-QA report ends with `final result: passed`.

## Existing functional product work

- A fresh install starts with no fake balances or demo transactions, one usable cash account, and an
  idempotent category/subcategory starter taxonomy.
- SQLite-backed accounts, transactions, category/subcategory management, transfer, adjustment,
  import/export, budgets, trend views, and full ledger navigation are implemented.
- New-transaction selection uses stable category IDs, so renamed or deleted categories are not
  silently recreated.
- Categories support typed `expense | income | both` visibility across migration, repositories,
  management, entry, editing, and budget filtering.
- Hierarchical budgets persist child allocations, derive real spending, preserve unallocated parent
  amounts, and avoid double counting.
- Paired account transfers are committed atomically with rollback if either side fails.
- Transaction editing supports type, signed adjustment amount, date, category path, account, note,
  save, and delete.

## Current architecture and trust boundaries

- SQLite is the source of truth; there is no backend, analytics, sign-in, or automatic cloud sync in
  the replica.
- Money uses integer cents; dates use local ISO calendar strings.
- Budgets currently use monthly parent envelopes with optional child allocations. Spending is
  derived from transactions rather than stored twice.
- Transfers are matched negative/positive balance adjustments committed in one database
  transaction, so they do not affect income/expense analytics.
- CSV remains the normal user-facing exchange/import format, matching the existing workflow.
- Full database export/restore is an advanced lossless backup option. The iMazing package is not an
  in-app migration format.
- Real CSV exports, SQLite files, iMazing backups, IPA files, and screenshots containing private
  financial data are excluded from Git.

## Verification

Completed against the latest pushed workspace on November 18, 2026:

```text
TypeScript:              npx tsc --noEmit              PASS
Unit tests:              npm test                      PASS (58/58)
Generated SVG registry:  npm run icons:check           PASS (114 SVGs)
Original PNG extraction: file/catalog audit            PASS (125 files)
Original icon catalog:   plist/catalog audit           PASS (18 sections, 134 items, 122 unique)
Patch hygiene:           git diff --check              PASS
Visual QA:               design-qa.md                  PASS
Privacy staging scan:    no IPA/iMazing/CSV/DB files   PASS
```

## Remaining source-parity work

1. ~~Log into the runnable original app through WeChat to capture missing interactions.~~ Dropped
   (November 18, 2026): the owner no longer has access to the original backend/login. Remaining
   evidence is the reference bundle, screenshots, asset catalog, and backup schema; screens with no
   evidence are designed to match the existing replica screens and flagged as unverified in
   `design-qa.md`.
2. Replace the current category-limit budget editor/model with the original Rich budget/plan model.
   Evidence found: the add-expense screen has no budget picker; expenses are assigned afterwards via
   the 支出编辑 row 所属预算/计划. The app bundle has no readable screen text or layouts (encrypted
   executable, empty storyboards). Slices:
   - [x] **Slice 1 — data model** (migration v8): `budget_envelopes` (monthly/special, emoji, name,
     description, first-month amount, archive/order), `budget_envelope_amounts` history,
     `savings_plans` freezing a monthly budget toward a target, and `transactions.budget_envelope_id`.
     Pure logic + 14 unit tests; migration and triggers verified against SQLite. See
     `docs/TECHNICAL.md`.
   - [x] **Slice 2 — Budget tab and budget editor**: the tab now reads the v8 model (结余, 计划清单
     total, `我的预算` list with monthly/special badges, spend/frozen/remaining); new
     `app/budget/envelope.tsx` create/edit/delete screen; `app/budget/help.tsx` shows the eight
     original example pages. Verified in the web export; layouts are designed (not source-verified),
     see `design-qa.md`.
   - [x] **Slice 3 — 所属预算/计划 assignment**: the transaction detail row shows the assigned budget
     and opens `BudgetPickerSheet` (modeled on the original 选择支出账户 sheet with its 不选择账户
     row). The old category-limit editor, repo, allocation logic, and its tests were removed; the
     v4/v6 tables remain until slice 5. Verified in the web export: add expense → assign → Budget
     tab spend/remaining → unassign.
   - [ ] Slice 4 — 计划清单: plan list, create plan, freeze progress, completion artwork.
   - [ ] Slice 5 — archive and drag reorder (original used `JXMovableCellTableView`); then drop the
     v4/v6 budget tables.
3. Match and verify the compiled native launch/loading sequence, including load/read/write/success
   states and a recoverable startup-error state. The artwork is available, but the native transition
   still needs device capture and comparison.
4. Capture and compare every reachable route from `docs/FLOWS.md` on target iPhones, including
   small-screen keyboard, safe-area, modal, long-label, and empty/filled states.
5. Exercise fresh install, schema migration, CSV exchange, database restore, transfer rollback, and
   category-kind changes using real native SQLite behavior without committing any private data.
6. Complete App Store metadata, privacy answers, signing/build, TestFlight, and submission checks in
   [Apple Release 2026](APPLE_RELEASE_2026.md).

## Known limitations

- The original Swift source and view hierarchy are unavailable because the packaged executable is
  encrypted.
- The current budget implementation is useful and tested but is not yet the original Rich
  budget/plan model.
- The local web export is a convenient inspection surface; final iOS safe-area, status-bar,
  keyboard, launch, and SQLite behavior require native-device verification.
- No cloud sync, recurring entries, reminders, receipt attachments, search, authentication, or
  multi-currency conversion is currently implemented in the replica.
- Transfer rows are atomic but still lack a shared transfer-group ID for linked editing/deletion.

## References

- [Design QA](../design-qa.md) — screenshot comparisons, interaction checks, and current pass result.
- [First-entry and budget-flow audit](../audit/first-entry-budget-flow/report.md) — evidence-backed
  fidelity gaps and original budget-model findings.
- [Original screenshot index](reference/rich-screens/README.md) — private local reference inventory
  and design takeaways.
- [Product](PRODUCT.md) — current behavior and trust rules.
- [Features](FEATURES.md) — implemented surface and persisted model.
- [Flows](FLOWS.md) — route/action walkthrough checklist.
- [Components](COMPONENTS.md) — shared visual contracts.
- [Apple Release 2026](APPLE_RELEASE_2026.md) — current release requirements.

Do not commit real CSV exports, SQLite databases, IPA files, iMazing backups, login/session material,
or screenshots containing private financial data. Do not commit or push unless explicitly requested.
