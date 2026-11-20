# Progress

Living implementation, source-parity, and verification status for Rich记账.

**Last updated:** November 19, 2026

**Phase:** original Rich 1.1.0 budget/plan model complete; native-device QA and release prep next

**Latest pushed checkpoint:** `7527f0e` — icon separation, Android readiness, storage tests; trends/budget
breakdowns, linked transfers, and CSV v2 columns are local after it

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
- Budgets follow the original Rich model: named monthly/special envelopes that expenses are assigned
  to, plus savings plans that freeze part of a monthly budget. Spending is derived from transactions
  rather than stored twice.
- Transfers are matched negative/positive balance adjustments committed in one database
  transaction, so they do not affect income/expense analytics.
- CSV remains the normal user-facing exchange/import format, matching the existing workflow.
- Full database export/restore is an advanced lossless backup option. The iMazing package is not an
  in-app migration format.
- Real CSV exports, SQLite files, iMazing backups, IPA files, and screenshots containing private
  financial data are excluded from Git.

## Verification

Completed on November 19, 2026 (local workspace):

```text
TypeScript:              npx tsc --noEmit                         PASS
Unit + storage tests:    npm test                                 PASS (100/100, incl. 20 SQLite integration tests)
Category icon registry:  npm run icons:check                      PASS (123 vector glyphs)
Icon fidelity vs original rasters at 3x                            mean IoU 0.955, colour Δ 1.4/255
Native bundles:          npx expo export --platform ios,android   PASS (Hermes, both platforms)
Expo doctor:             18/18 checks (expo 54.0.37, expo-constants 18.0.14, expo-file-system 19.0.24)
Web walkthrough:         15 flows incl. reload persistence        PASS, no page errors
Trends + budget detail:  13 steps at 393×852 and 375×667          PASS, no page errors
Home after LedgerList refactor: pixel diff vs previous build      0.000% differing pixels
Linked transfer flow:    create → detail → edit amount → reload   PASS, no page errors
Budget sort flow:        handle drag, long-press drag, quick swipe ignored, ↑/↓, save, reload   PASS
Patch hygiene:           git diff --check                         PASS
Privacy staging scan:    no IPA/iMazing/CSV/DB files              PASS
```

## Original-parity pass — November 19, 2026

Owner review found screens that did not match the original. Re-measured every captured screen and
fixed add entry (subcategory tray on every category, 添加子类 page with icon, ring, spacing, keypad,
numerals), category management, Home + day sheet, transaction detail, 资产管理, and transfer. See
`design-qa.md` → "Original-parity pass". Migration v10 adds `subcategories.icon`.

Second pass (same day): whole-screen alignment against the captures (shifted by the original's
59pt safe area) fixed the tab bar, header heights and back-chevron position, Home header/calendar/
list geometry, day sheet, Budget tab, detail, 资产管理, add entry, and transfer; unselected
category art now dims to 50% like the original. All icon-font glyphs were replaced with original
`Assets.car` artwork (`RichChevron` for chevrons). See `design-qa.md` → "Icon and geometry pass".
Budget/plan creation screens remain designed rather than verified (no captures exist).

## Icons, Android readiness, and storage — November 19, 2026

- **Category icons separated into disc + glyph.** The 123 original category rasters (glyph baked onto
  a #F7F7F7 disc) were converted into vector glyphs with the disc removed exactly; screens now draw
  the disc, the selection ring (1.7pt, inside the disc — the original's interior is #F7F7F7, not
  white as earlier noted), and the 50% dimming. Visually identical to the originals at 3×, sharper
  when scaled, recolourable, and 420 KB instead of 880 KB. The retired hand-drawn SVG set and the
  original PNGs left the app; the picker now stores original icon names, and a user's chosen icon
  now wins over the name lookup (before, a subcategory named like a built-in showed the built-in art).
  Pipeline and layout: `docs/reference/rich-screens/icon-catalog.md`.
- **Files reorganized:** `assets/icons/categories/` (SVG masters) · `components/icons/` (component +
  generated art) · `src/domain/categoryIcons/` (catalog, resolution, legacy ids) · `scripts/icons/`
  (trace, generate, Assets.car extractor). Unused Expo template images were removed.
- **Android:** every screen used React Native's iOS-only `SafeAreaView` (Android content would sit
  under the status bar) — switched to `react-native-safe-area-context`. Modals now handle the Android
  back button; the day sheet draws under the status bar so it lines up with the header; the
  记一笔/账户转账 header tuck adapts to the status bar (Dynamic Island iPhones vs notch iPhones and
  Android); note fields and account sheets avoid the keyboard on both platforms (Android is
  edge-to-edge in SDK 54); the adaptive launcher icon was cropping "Rich" and now uses a safe-zone
  foreground. Both native bundles compile. Device QA on a real iPhone and Android phone is still
  needed (keyboard, safe areas, launcher icon).
- **Storage:** new integration tests run the real migrations and repositories on SQLite: fresh
  install, relaunch from the saved file, deleted categories stay deleted, schema invariants
  (100-char notes, ON DELETE RESTRICT), budgets/plans, an upgrade from a v7 database, and CSV
  round-trip. On device the database is `rich.db` under `Documents/SQLite/` on iOS and `files/SQLite/` on Android (expo-sqlite defaults):
  it survives relaunches and updates, is removed on uninstall, and is included in iCloud/iTunes and
  Android device backups unless that is changed. Starter subcategories now keep their designed order.
- **Budget emoji kept:** budgets and plans use emoji like the original; the brand guide now scopes
  the no-emoji rule to category surfaces.

## Trends and budget breakdowns — November 19, 2026

Owner request: show subcategories as well as categories in the charts and budgets, with hover.
No original capture of 趋势图 or a budget detail page exists (only the `icon_trend_chart`
empty-state art, now used), so both are designed rather than source-verified.

- **趋势图** (`app/trends.tsx`): one filter row (支出/收入 pills from 记一笔 + month stepper) scopes
  everything below. Six month columns: the selected month in the chart green, the rest gray;
  hovering (web, iPad pointer) or pressing and dragging moves a crosshair and updates the readout
  (total, the other type, 结余); tap/release selects the month; VoiceOver adjusts it. Below, the
  month's categories are ranked with whole-number shares that add up to 100; a category unfolds into
  its subcategories (share of the category, 未细分 for records without one), and every row opens
  the matching records. The pie and line chart were removed: ranked bars compare categories more
  exactly than pie slices and need one colour instead of one per category.
- **Budget detail** (`app/budget/detail.tsx`): tapping a budget now opens remaining/超支, progress,
  amount/spent/frozen/share, the assigned expenses by category → subcategory, and the records
  (monthly budgets step between their start month and this month; special budgets show all time).
  编辑 in the header opens the existing editor.
- **Records screen** (`app/records.tsx`) and `listTransactions` filters (type, dates, category,
  subcategory or 未细分, budget). Home's ledger rows moved into `components/rich/LedgerList.tsx`
  (pixel-identical) so every list matches.
- Chart colours were run through the dataviz palette validator against the white card: #2C9B7A
  passes 3:1; the lighter mint on subcategory meters doesn't, so those rows always print their
  share and amount.
- Still to check on devices: press-and-drag inside the scroll view on iOS and Android (verified on
  web with mouse drag), and VoiceOver/TalkBack on the adjustable chart.

## Linked transfers and CSV v2 — November 19, 2026

- Transfers now share `transactions.transfer_group_id` (migration v11, append-only). Opening either
  side shows one 账户转账 (from → to); editing reopens the transfer screen prefilled and rewrites
  both sides; deleting removes both. A trigger keeps a transfer side from becoming an expense or
  income. The migration links earlier transfers only when the pair is unambiguous (tested with
  clear, ambiguous, loose, and untimed pairs); anything else stays as separate adjustments.
- CSV v2 export appends `budget`, `budget_id`, and `transfer_group_id`. Savings plans remain in the
  database backup only.
- Expo patch updates applied (expo 54.0.37, expo-constants 18.0.14, expo-file-system 19.0.24);
  expo-doctor passes 18/18.

## Drag-to-reorder budgets — November 19, 2026

Sort mode now supports dragging as well as the ↑/↓ buttons: drag the ≡ handle, or long-press a
row and drag. Neighbours slide aside as the row passes their midpoint, scrolling pauses while a row
is held, and a quick swipe on a row does nothing (it needs the hold). Added
`react-native-gesture-handler` (~2.28.0, the SDK 54 version; included in Expo Go, a custom dev build
must be rebuilt). Found and avoided a gesture-handler web quirk where a first move of exactly 15pt
skipped the long-press wait. Device check still needed: drag inside the scroll view on iOS and
Android, and VoiceOver/TalkBack using the buttons.

## Original captures, deletes on web, redrawn icons — November 19, 2026

- **Home month:** the month pill opens the original 选择时间 wheel sheet (month + year); Home was
  previously stuck on the current month. Swipe the summary card up/down to fold the calendar.
- **Budget creation** follows the original three-step wizard (type cards → name + emoji → green
  amount keypad); the old form is edit-only. Budget detail has a coral 删除该预算 bar, and deleting
  from the editor returns to the list.
- **Web preview dialogs:** React Native Web's `Alert.alert` is a no-op, so every confirmation
  (delete budget/record/transfer/category, restore) did nothing in the browser.
  `src/platform/webAlert.ts` maps alerts to `window.alert` / `window.confirm` on web only.
- **我的:** icons drawn at their original sizes, the mismatched filled clipboards replaced, and the
  duplicate 导出数据 / 导入数据 rows (same screen) merged into 导入与导出.
- **Category icons:** 15 rough originals redrawn as stroked SVG in the original style (see
  `docs/reference/rich-screens/icon-catalog.md`).
- **Add entry on every screen width:** the original scales the composer (amount line, grid,
  tray) with the screen width; ours now does too, keypad digits were reduced to the original
  size, and the account/note divider matches. Within about 1.5pt of the 393pt and 402pt captures.
- **Home on every screen width:** the header and calendar card scale the same way (text stays
  fixed); the wordmark was 3pt high. Within about 1pt of both captures.
- **Pixel pass on the new captures:** the 选择时间 sheet and the three budget-creation screens were
  measured from the owner's saved captures (402pt iPhone) and now match within about 1pt; see
  `design-qa.md`.
- Verified: 100 tests; browser flows walkthrough 15/15, trends 13/13, transfers 8/8, sorting 8/8,
  Home month 11/11, budget wizard + deletes 12/12, no page errors; iOS and Android bundles export.

## Width scaling on every screen — November 20, 2026

- The 402pt capture shows Home's day list scaling with the width too (rule margin 25.3pt, as
  `24.7 × 402/393`), so the original scales every screen. `src/utils/layoutScale.ts` +
  `components/rich/useScaledStyles.ts` now apply that rule to every screen: the day list, record
  detail and edit, 全部账单, 资产管理, transfer, balance adjustment, the budget tab, budget detail
  and editor, the plan screens, 已归档, help, records, 趋势图, 分类管理 and 添加自定义类目, 我的,
  数据管理, about, privacy and the budget wizard. Nav bars, keypads and the transfer header/note row
  stay fixed, as on the add screen. Widths computed in code (趋势图's chart, the emoji and icon
  grids) subtract the scaled insets, so nothing overflows on a Pro Max.
- Confirmed against two widths: Home, add entry, the day list. The rest follow the same rule
  without a second capture.
- **编辑支出 category row:** listed categories in raw database name order and could open with the
  record's own category out of view. It now uses the same order as 记一笔 and 分类管理 (one
  `sortCategoriesForDisplay` in `src/domain/categories.ts`) and opens scrolled to the record's
  category.
- **Extreme-value pass (375pt):** ¥9,999,999.99 records, 100-character notes, a 10-character
  budget at ¥99,999,999.99, a 30-character account name and a 6-character subcategory, through
  Home, record detail, the budget tab and detail, 趋势图, 资产管理 and 全部账单. Everything stays
  readable except 资产管理's total, which was cut to "-¥29999…" (React Native Web ignores
  `adjustsFontSizeToFit`, and native's 0.65 floor was too high for 13 characters). It now sizes
  itself to its column (`src/utils/fitText.ts`), unchanged for ordinary totals.
- Verified: 109 tests; browser flows 67/67 at 393pt, walkthrough and transfers at 375pt, trends at
  375 and 430pt; wizard screenshots identical at 402pt; every screen checked at 375 and 430pt; iOS
  and Android bundles export.

## Future idea needing user research: a personal AI assistant for logging

Idea (owner, November 19, 2026): let people pick an AI assistant of their choice and connect phone
workflows so a purchase can be logged with help — e.g. an iOS Shortcuts / Wallet transaction
automation or an Android notification or share intent hands the purchase to RICH, the assistant
drafts amount, category, subcategory, and note, and the person confirms.

Not built; it conflicts with current non-goals (no backend, no bank integrations, no ML
categorization in `docs/REQUIREMENTS.md`) and needs an explicit scope decision first. Questions to
research before deciding:

1. **Does it defeat the point of manual logging?** RICH's value is the deliberate moment of
   recording ("make money choices visible"). Test whether a draft-then-confirm flow keeps that
   awareness, or whether people stop looking. Compare a fully manual group, a confirm-a-draft group,
   and an auto-log group over a few weeks: logging consistency, recall of monthly spend, and whether
   budgets change behaviour.
2. **Which moments need help?** Where does manual logging actually fail — forgetting cash, batches
   after a trip, split bills, subscriptions? Help may be most useful for catch-up and review rather
   than every purchase.
3. **Privacy and local-first.** Purchase data is sensitive. Options to compare: on-device models
   (Apple's on-device foundation model, Gemini Nano on Android) that keep data on the phone; a
   bring-your-own-key provider the person chooses, with exactly what is sent shown first; or no AI
   at all, only Shortcuts/intent hooks that pre-fill the add screen. Any network option must be opt-in
   and must not become a RICH backend.
4. **Platform reality.** What iOS Shortcuts/Wallet automations and Android intents can deliver
   (merchant, amount, time) without bank connections; the App Store and Play policies for both.
5. **Trust and correction.** How a person sees and fixes a wrong draft; nothing is saved without a
   confirm.

A low-risk first step, if research supports it: a "pre-fill the add screen" deep link (amount,
note, date) callable from Shortcuts or an Android share, with no AI involved — the person still
chooses the category and taps 确定.

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
   - [x] **Slice 4 — 计划清单**: the 计划清单 card opens `app/budget/plans.tsx` (original example card
     layout, `plan_clock`/`plan_clock_finish` status icons extracted from `Assets.car`, `icon_no_plan`
     empty state); `app/budget/plan.tsx` creates a plan (target, monthly budget to freeze, monthly
     amount, finish-month preview) and shows progress, completion (`icon_plan_finish`), and 结束计划.
     Target/monthly/source are fixed once started. Verified in the web export with a controlled
     clock: 0/10 → 4/10 (¥2000) → 已攒够 → 完成计划, with the source budget's freeze released.
   - [x] **Slice 5 — archive, reorder, cleanup**: archive/restore budgets (blocked while a plan
     freezes them) and ended plans; `app/budget/archived.tsx` lists both with 恢复. Budget sort mode
     uses the original `icon_list_sort` with up/down controls (drag-to-reorder was added later the
     same month, see "Drag-to-reorder budgets"). Migration v9 drops
     the v4/v6 tables; a populated v7 database was upgraded through v9 with integrity and
     foreign-key checks passing. All earlier browser flows re-run without errors.

   The original budget/plan model is now complete. Remaining unknowns, documented rather than
   guessed: original `plan_item` checklist entries and `accumulate_plan` (empty in the backup), and
   assigning an expense to a plan rather than a budget.
3. Match and verify the compiled native launch/loading sequence. **Done (November 19, 2026):** a
   recoverable startup-error screen (`components/rich/StartupError.tsx`, launch artwork + 重新打开)
   replaces the stuck splash when the database cannot open; failed opens/initialization are no
   longer cached, so retry re-runs them (on web, retry reloads the page because expo-sqlite's worker
   keeps a failed WebAssembly module). Home and add-entry now show loading and read-failure states
   instead of looking empty. Verified in the web export by blocking SQLite's WebAssembly. Still
   needs device capture: the native splash → app transition.
4. Capture and compare every reachable route from `docs/FLOWS.md` on target iPhones, including
   small-screen keyboard, safe-area, modal, long-label, and empty/filled states.
5. Exercise fresh install, schema migration, CSV exchange, database restore, transfer rollback, and
   category-kind changes using real native SQLite behavior without committing any private data.
6. ~~Complete App Store metadata, privacy answers, signing/build, TestFlight, and submission checks in
   [Apple Release 2026](APPLE_RELEASE_2026.md).~~ On hold (owner, November 19, 2026): the app may be
   published through another company or entered in the Swift Student Challenge, so release prep
   waits for that decision. Already in place regardless of publisher: `ios.privacyManifests` in
   `app.json` (no tracking, no collected data, React Native's UserDefaults/FileTimestamp/
   SystemBootTime reasons; verified in a throwaway `expo prebuild`). Facts for that decision: the
   original 1.1.0 was published as `com.duitang.richman` (build 58); this replica uses
   `com.richapp.finance`, and its artwork comes from the original bundle.

## Known limitations

- The original Swift source and view hierarchy are unavailable because the packaged executable is
  encrypted.
- The local web export is a convenient inspection surface; final iOS and Android safe-area,
  status-bar, keyboard, launcher-icon, and SQLite behavior require native-device verification.
- No cloud sync, recurring entries, reminders, receipt attachments, search, authentication, or
  multi-currency conversion is currently implemented in the replica.
- CSV v1 does not carry budget assignments; CSV v2 carries assignments and transfer links but not
  savings plans. The full database backup carries everything.

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
