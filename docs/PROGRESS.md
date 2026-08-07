# Progress

Living implementation and design-fidelity status for RICH.

## Current status

The main offline app flows are implemented end to end. The current phase is a screen-by-screen
visual fidelity pass plus shared-component consolidation. The original screenshots are stored in
`RICH Items/`; the no-install reference is `docs/mockups.html`.

Last updated: 2026-07-22.

## Completed in the current pass

### Functional gaps closed

- Added migration v4 and a real monthly/category budget repository.
- Added budget editor, filled budget state, threshold progress bars, and transaction-detail linkage.
- Added real home calendar day filtering and clear-filter behavior.
- Added cross-platform subcategory creation from the transaction composer.
- Added previous/next month loading on Home and analytics.
- Added date selection and real `+/-` arithmetic to account transfers.
- Added separate built-in income categories and reset category state when switching transaction type.
- Persisted and reused custom category icon IDs across Home, category management, budgets, and details.
- Added About and Privacy destinations; removed visible no-op rows.
- Reworked data management into a Chinese backup/restore workflow centered on full database backup.

### Layout and fidelity fixes

- Registered every custom-header route with `headerShown: false`, removing accidental double headers
  and the resulting vertical overflow on 记一笔 and other pushed screens.
- Made the tab bar safe-area aware and restored two visible tabs plus a lightweight center `+`.
- Restored the original two-tone tab treatment: near-black active icon/label with a mint detail,
  gray inactive state, and the clock-style 预算/计划 icon.
- Made the Home calendar card square, removed its unintended shadow, and let calendar bands reach the
  card edges across week boundaries.
- Matched the empty 预算/计划 frame: square 146 px summary matrix, green header depth, white body,
  leader-line donut labels, and rectangular create button.
- Matched transaction detail card/delete framing and account-group square corners.
- Added a proportionally sized asset-goal illustration and vertical completion meter.
- Matched category management/icon-picker framing: circular icon fields, original category ordering,
  five-column catalog, dashed section rules, and centered black add action.
- Reworked both browser-mockup states for 预算/计划 around one persistent frame: green title field,
  square summary matrix, white scrolling body, and the standard bottom navigation.
- Replaced the filled budget mockup's generic floating cards and FontAwesome category glyphs with a
  compact square-edged total band, solid-divided category list, and the RICH two-tone icon set.
- Defined the budget state palette: mint below 80%, amber at 80-100%, and coral only above 100%.

### Reusable implementation

Created `constants/Design.ts` and `components/rich/`:

- `ScreenHeader`
- `MonthStepper`
- `DashedDivider`
- `ProgressBar`
- `MoneyNumpad`
- `AssetGoalIllustration`

Existing shared parts retained:

- `CategoryIcon` with 111 custom black/mint icons
- `DatePickerModal`
- `PieChart` and `LineChart`

The same `MoneyNumpad` now drives new transaction, transfer, and balance adjustment. The same header,
month control, progress bar, and dashed divider are used wherever their visual contract applies.

## Documentation completed

- `docs/COMPONENTS.md`: visual tokens, dimensions, component APIs, composition patterns, screen map,
  budget empty/configured contracts, and acceptance checklist.
- `docs/FLOWS.md`: current route registry and every reachable action/persistence flow.
- `docs/FEATURES.md`: complete implemented feature inventory, data model, routes, and limitations.
- `docs/reference/rich-screens/`: screenshot/icon analysis artifacts.
- `RICH Items/`: archived original screenshots and earlier source snapshot for local reference.

## Verification

Completed before this document update:

```text
TypeScript: ./node_modules/.bin/tsc --noEmit       PASS
Unit tests: npm test                               PASS (24 tests)
iOS bundle: expo export --platform ios             PASS (1,173 modules, 3.18 MB)
Expo dependencies: expo install --check            PASS (SDK 54 local version map)
```

## Current architecture decisions

- Budget model is category-based monthly limits. Spending is derived from transactions; there is no
  `transactions.budget_id`.
- Money is integer cents; dates are local ISO calendar strings.
- Transfer is currently a matched pair of balance adjustments so it does not affect income/expense.
- Data is local-first SQLite. Device-to-device movement uses full database export/restore.
- Native runtime targets iOS/Android. `docs/mockups.html` is the browser-only preview.
- Content cards are square/near-square; only true controls, pills, sheets, and circles are rounded.
- Visible navigation remains 首页 + center add + 预算/计划.

## Next work, in order

1. Review `3b` and `3c` in `docs/mockups.html` and approve or adjust the remaining budget details:
   brand-mint hue, summary density, warning colors, and configured category-row density.
2. Port the approved 预算/计划 mockup details into `app/(tabs)/charts.tsx`, the shared color tokens,
   and the native two-tone tab icons.
3. Run the updated unit suite, TypeScript, and iOS production export; fix anything found.
4. Start Expo and perform a target-device walkthrough of every route in `docs/FLOWS.md`.
5. Capture current Home, 记一笔, 预算/计划, 趋势图, 资产管理, 自定义, and detail screens at the
   same viewport as the references and record pixel-level deltas.
6. Bring the generic transaction edit form up to the same amount-first visual language.
7. Decide whether custom categories need an explicit `expense | income | both` schema field.
8. Add a transfer group ID and atomic paired-transfer repository if linked edit/delete is required.
9. Add automated screenshot regression coverage after the target screens are visually approved.

## Known limitations

- No cloud sync, recurring entries, reminders, receipt attachment, search, or multi-currency conversion.
- Custom categories currently appear in both expense and income composers.
- Transfer rows are paired by convention, not by a persisted transfer ID.
- The browser cannot run the native SQLite app; use the HTML mockup for no-install preview.
- Final visual acceptance still requires device screenshots after this component pass.

## Working rules for the next session

- Read `docs/COMPONENTS.md`, `docs/FLOWS.md`, and this file before editing.
- Compare against `RICH Items/` rather than guessing dimensions.
- Reuse `components/rich/` before introducing local versions of a header, keypad, divider, month picker,
  or progress bar.
- Do not regenerate or replace the 111 category icons unless a specific icon is identified as wrong.
- Do not commit exported financial data, SQLite files, or user backups.
- Do not commit or push unless explicitly requested.
